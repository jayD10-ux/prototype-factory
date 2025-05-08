
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

    // First, check if the execute_sql_wrapper function exists
    try {
      const { error: checkWrapperError } = await supabase.rpc('execute_sql_wrapper', {
        sql_statement: `SELECT 1;`
      });

      if (checkWrapperError) {
        // Create the function if it doesn't exist
        const { error: createFunctionError } = await supabase.rpc('update_prototype_policies', {
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
        
        if (createFunctionError) {
          throw new Error(`Failed to create wrapper function: ${createFunctionError.message}`);
        }
      }
    } catch (error) {
      console.log("Creating wrapper function:", error);
      
      // Create the function directly using another existing function
      const { error: createDirectError } = await supabase.rpc('update_prototype_policies', {
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
      
      if (createDirectError) {
        throw new Error(`Failed to create wrapper function: ${createDirectError.message}`);
      }
    }

    // Create security definer function to check if a prototype is shared
    // Fix: Using a more efficient security definer function that avoids recursion
    try {
      const { error: createHelperFunctionError } = await supabase.rpc('update_prototype_policies', {
        sql: `
          -- Create helper function to check if prototype is shared
          CREATE OR REPLACE FUNCTION public.is_prototype_shared(prototype_id uuid)
          RETURNS boolean
          LANGUAGE sql
          SECURITY DEFINER
          STABLE
          AS $$
            -- Direct query to prototype_shares without referencing prototypes table
            SELECT EXISTS (
              SELECT 1 FROM public.prototype_shares
              WHERE prototype_shares.prototype_id = prototype_id 
              AND prototype_shares.is_public = true
            );
          $$;
        `
      });

      if (createHelperFunctionError) {
        throw new Error(`Failed to create helper function: ${createHelperFunctionError.message}`);
      }
    } catch (error) {
      console.error("Error creating helper function:", error);
      throw error;
    }

    // Update policies for prototypes table using the helper function
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

          -- Fixed policy for viewing shared prototypes using the security definer function
          CREATE POLICY "Users can view shared prototypes" 
          ON public.prototypes
          FOR SELECT 
          USING (public.is_prototype_shared(id));

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
        throw new Error(`Failed to create prototype policies: ${policiesError.message}`);
      }
    } catch (createError) {
      console.error("Error creating prototype policies:", createError);
      throw createError;
    }

    console.log("Prototype policies created successfully");

    // Also fix prototype_shares RLS with simpler policies
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
        throw new Error(`Failed to update share policies: ${sharesPoliciesError.message}`);
      }
    } catch (sharesError) {
      console.error("Error creating share policies:", sharesError);
      throw sharesError;
    }

    console.log("Share policies created successfully");

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
