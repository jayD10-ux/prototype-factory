
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
    console.log("Starting fix-rls function execution");
    
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Supabase client created");

    // First, create a more robust version of the execute_sql_wrapper function
    console.log("Step 1: Creating SQL wrapper function");
    try {
      const { error: wrapperError } = await supabase.rpc('update_prototype_policies', {
        sql: `
        CREATE OR REPLACE FUNCTION public.execute_sql_wrapper(sql_statement text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_statement;
        END;
        $$;
      `});
      
      if (wrapperError) {
        console.error("Error creating wrapper function:", wrapperError);
        throw wrapperError;
      }
      console.log("SQL wrapper function created successfully");
    } catch (error) {
      console.error("Failed to create SQL wrapper:", error);
      throw error;
    }

    // Fix the is_prototype_shared function to be more explicit and avoid recursion
    console.log("Step 2: Creating improved is_prototype_shared function");
    try {
      const { error: helperFunctionError } = await supabase.rpc('update_prototype_policies', {
        sql: `
          -- Drop existing function to ensure clean replacement
          DROP FUNCTION IF EXISTS public.is_prototype_shared(uuid);
          
          -- Create a more explicit version that avoids recursion
          CREATE OR REPLACE FUNCTION public.is_prototype_shared(_input_prototype_id uuid)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          STABLE
          AS $$
          DECLARE
            _is_shared boolean;
          BEGIN
            -- Use explicit aliasing and parameter names that don't match column names
            SELECT EXISTS (
              SELECT 1 FROM public.prototype_shares AS ps
              WHERE ps.prototype_id = _input_prototype_id 
              AND ps.is_public = true
            ) INTO _is_shared;
            
            RETURN _is_shared;
          END;
          $$;
        `
      });

      if (helperFunctionError) {
        console.error("Error creating helper function:", helperFunctionError);
        throw new Error(`Failed to create helper function: ${helperFunctionError.message}`);
      }
      console.log("Helper function created successfully");
    } catch (error) {
      console.error("Failed to create helper function:", error);
      throw error;
    }

    // Update policies for prototypes table using the improved helper function
    console.log("Step 3: Setting up RLS policies for prototypes table");
    try {
      const { error: policiesError } = await supabase.rpc('update_prototype_policies', {
        sql: `
          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view their own prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can view shared prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can update their own prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can insert prototypes" ON public.prototypes;
          DROP POLICY IF EXISTS "Users can delete their own prototypes" ON public.prototypes;
          
          -- Make sure RLS is enabled
          ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;

          -- Simple policy for viewing own prototypes
          CREATE POLICY "Users can view their own prototypes" 
          ON public.prototypes
          FOR SELECT 
          USING (created_by = auth.uid());

          -- Fixed policy for viewing shared prototypes using the improved function
          CREATE POLICY "Users can view shared prototypes" 
          ON public.prototypes
          FOR SELECT 
          USING (public.is_prototype_shared(_input_prototype_id := id));

          -- Simple policy for updating own prototypes
          CREATE POLICY "Users can update their own prototypes" 
          ON public.prototypes
          FOR UPDATE
          USING (created_by = auth.uid());

          -- Simple policy for inserting own prototypes
          CREATE POLICY "Users can insert prototypes" 
          ON public.prototypes
          FOR INSERT
          WITH CHECK (created_by = auth.uid());

          -- Simple policy for deleting own prototypes
          CREATE POLICY "Users can delete their own prototypes" 
          ON public.prototypes
          FOR DELETE
          USING (created_by = auth.uid());
        `
      });

      if (policiesError) {
        console.error("Error creating prototype policies:", policiesError);
        throw new Error(`Failed to create prototype policies: ${policiesError.message}`);
      }
      console.log("Prototype policies created successfully");
    } catch (createError) {
      console.error("Error creating prototype policies:", createError);
      throw createError;
    }

    // Fix prototype_shares RLS with simpler policies
    console.log("Step 4: Setting up RLS policies for prototype_shares table");
    try {
      const { error: sharesPoliciesError } = await supabase.rpc('update_share_policies', {
        sql: `
          -- Make sure RLS is enabled
          ALTER TABLE IF EXISTS public.prototype_shares ENABLE ROW LEVEL SECURITY;

          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view their own shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can create shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can update their own shares" ON public.prototype_shares;
          DROP POLICY IF EXISTS "Users can delete their own shares" ON public.prototype_shares;

          -- Simple policies using auth.uid()
          CREATE POLICY "Users can view their own shares" 
          ON public.prototype_shares
          FOR SELECT 
          USING (shared_by = auth.uid() OR is_public = true);

          CREATE POLICY "Users can create shares" 
          ON public.prototype_shares
          FOR INSERT
          WITH CHECK (shared_by = auth.uid());

          CREATE POLICY "Users can update their own shares" 
          ON public.prototype_shares
          FOR UPDATE
          USING (shared_by = auth.uid());

          CREATE POLICY "Users can delete their own shares" 
          ON public.prototype_shares
          FOR DELETE
          USING (shared_by = auth.uid());
        `
      });

      if (sharesPoliciesError) {
        console.error("Error updating share policies:", sharesPoliciesError);
        throw new Error(`Failed to update share policies: ${sharesPoliciesError.message}`);
      }
      console.log("Share policies created successfully");
    } catch (sharesError) {
      console.error("Error creating share policies:", sharesError);
      throw sharesError;
    }

    // Return success response
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
        stack: error.stack,
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
