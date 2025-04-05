
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Running fix-rls function");

    // First, drop existing potentially problematic function
    const { error: dropFunctionError } = await supabase.rpc('execute_sql', {
      sql_query: `
        DROP FUNCTION IF EXISTS public.user_has_prototype_access(uuid);
      `
    });

    if (dropFunctionError) {
      console.error("Error dropping function:", dropFunctionError);
    }

    // Create new security definer function with fixed implementation
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION public.user_has_prototype_access(prototype_id uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        STABLE
        AS $$
        DECLARE
          _clerk_id text;
          _prototype_owner boolean;
          _has_share boolean;
        BEGIN
          -- Get the current user's clerk_id
          _clerk_id := nullif(current_setting('request.jwt.claim.sub', true), '')::text;
          
          -- Check if user is the prototype owner (direct check, no recursion)
          SELECT EXISTS (
            SELECT 1 FROM prototypes 
            WHERE id = prototype_id AND clerk_id = _clerk_id
          ) INTO _prototype_owner;
          
          IF _prototype_owner THEN
            RETURN true;
          END IF;
          
          -- Check if the prototype is shared with the user or is public
          -- Simplified to avoid potential recursion
          SELECT EXISTS (
            SELECT 1 FROM prototype_shares
            WHERE prototype_id = prototype_id 
            AND (shared_by = _clerk_id OR is_public = true)
          ) INTO _has_share;
          
          RETURN _has_share;
        END;
        $$;
      `
    });

    if (functionError) {
      throw new Error(`Failed to create function: ${functionError.message}`);
    }

    console.log("Security definer function created");

    // Drop existing policies
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql_query: `
        DROP POLICY IF EXISTS "Users can view their own prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can view shared prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can update their own prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can insert their own prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can delete their own prototypes" ON public.prototypes;
      `
    });

    if (dropError) {
      throw new Error(`Failed to drop policies: ${dropError.message}`);
    }

    console.log("Old policies dropped");

    // Create new policies with simpler conditions to avoid recursion
    const { error: createPoliciesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Simple policy for viewing own prototypes
        CREATE POLICY "Users can view their own prototypes" 
        ON public.prototypes
        FOR SELECT 
        USING (
          clerk_id = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );

        -- Simple policy for viewing shared prototypes
        CREATE POLICY "Users can view shared prototypes" 
        ON public.prototypes
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM prototype_shares
            WHERE prototype_id = prototypes.id AND is_public = true
          )
        );

        -- Simple policy for updating own prototypes
        CREATE POLICY "Users can update their own prototypes" 
        ON public.prototypes
        FOR UPDATE
        USING (
          clerk_id = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );

        -- Simple policy for inserting own prototypes
        CREATE POLICY "Users can insert prototypes" 
        ON public.prototypes
        FOR INSERT
        WITH CHECK (
          clerk_id = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );

        -- Simple policy for deleting own prototypes
        CREATE POLICY "Users can delete their own prototypes" 
        ON public.prototypes
        FOR DELETE
        USING (
          clerk_id = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );
      `
    });

    if (createPoliciesError) {
      throw new Error(`Failed to create policies: ${createPoliciesError.message}`);
    }

    console.log("New policies created");

    // Fix prototype_shares RLS if needed
    const { error: sharesPoliciesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.prototype_shares ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view their own shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can create shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can update their own shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can delete their own shares" ON public.prototype_shares;

        -- Simpler policies to avoid recursion
        CREATE POLICY "Users can view their own shares" 
        ON public.prototype_shares
        FOR SELECT 
        USING (
          shared_by = nullif(current_setting('request.jwt.claim.sub', true), '')::text
          OR is_public = true
        );

        CREATE POLICY "Users can create shares" 
        ON public.prototype_shares
        FOR INSERT
        WITH CHECK (
          shared_by = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );

        CREATE POLICY "Users can update their own shares" 
        ON public.prototype_shares
        FOR UPDATE
        USING (
          shared_by = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );

        CREATE POLICY "Users can delete their own shares" 
        ON public.prototype_shares
        FOR DELETE
        USING (
          shared_by = nullif(current_setting('request.jwt.claim.sub', true), '')::text
        );
      `
    });

    if (sharesPoliciesError) {
      throw new Error(`Failed to update share policies: ${sharesPoliciesError.message}`);
    }

    console.log("RLS policies fixed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "RLS policies fixed successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in fix-rls function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
