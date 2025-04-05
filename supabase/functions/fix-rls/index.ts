
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

    // Drop existing RLS policies that might be causing issues - using async/await pattern instead of .catch()
    try {
      await supabase.rpc('execute_sql', {
        sql_query: `
          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view their own prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can view shared prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can update their own prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can insert prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can delete their own prototypes" ON public.prototypes;
          
          -- Make sure RLS is enabled
          ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;
        `
      });
    } catch (dropError) {
      console.log("Error dropping policies:", dropError);
      // Continue execution even if this fails
    }

    // Create new simplified policies directly
    try {
      const { error: policiesError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Simple policy for viewing own prototypes based on clerk_id
          CREATE POLICY "Users can view their own prototypes" 
          ON public.prototypes
          FOR SELECT 
          USING (
            clerk_id = get_clerk_user_id()
          );

          -- Simple policy for viewing shared prototypes (public ones)
          CREATE POLICY "Users can view shared prototypes" 
          ON public.prototypes
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM prototype_shares
              WHERE prototype_shares.prototype_id = prototypes.id 
              AND prototype_shares.is_public = true
            )
          );

          -- Simple policy for updating own prototypes
          CREATE POLICY "Users can update their own prototypes" 
          ON public.prototypes
          FOR UPDATE
          USING (
            clerk_id = get_clerk_user_id()
          );

          -- Simple policy for inserting own prototypes
          CREATE POLICY "Users can insert prototypes" 
          ON public.prototypes
          FOR INSERT
          WITH CHECK (
            clerk_id = get_clerk_user_id()
          );

          -- Simple policy for deleting own prototypes
          CREATE POLICY "Users can delete their own prototypes" 
          ON public.prototypes
          FOR DELETE
          USING (
            clerk_id = get_clerk_user_id()
          );
        `
      });

      if (policiesError) {
        throw new Error(`Failed to create policies: ${policiesError.message}`);
      }
    } catch (createError) {
      console.error("Error creating prototype policies:", createError);
      throw createError;
    }

    console.log("Prototype policies created successfully");

    // Fix prototype_shares RLS if needed
    try {
      const { error: sharesPoliciesError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Make sure RLS is enabled
          ALTER TABLE IF EXISTS public.prototype_shares ENABLE ROW LEVEL SECURITY;

          -- Drop existing possibly problematic policies
          DROP POLICY IF EXISTS "Users can view their own shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can create shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can update their own shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can delete their own shares" ON public.prototype_shares;

          -- Simpler policies using clerk_id
          CREATE POLICY "Users can view their own shares" 
          ON public.prototype_shares
          FOR SELECT 
          USING (
            shared_by = get_clerk_user_id()
            OR is_public = true
          );

          CREATE POLICY "Users can create shares" 
          ON public.prototype_shares
          FOR INSERT
          WITH CHECK (
            shared_by = get_clerk_user_id()
          );

          CREATE POLICY "Users can update their own shares" 
          ON public.prototype_shares
          FOR UPDATE
          USING (
            shared_by = get_clerk_user_id()
          );

          CREATE POLICY "Users can delete their own shares" 
          ON public.prototype_shares
          FOR DELETE
          USING (
            shared_by = get_clerk_user_id()
          );
        `
      });

      if (sharesPoliciesError) {
        throw new Error(`Failed to update share policies: ${sharesPoliciesError.message}`);
      }
    } catch (sharesError) {
      console.error("Error creating share policies:", sharesError);
      throw sharesError;
    }

    console.log("Share policies created successfully");

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
