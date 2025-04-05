
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

    // First, drop existing policies for prototypes table
    try {
      await supabase
        .from('prototypes')
        .select('id')
        .limit(1)
        .then(() => {
          console.log("Successfully connected to prototypes table");
        });

      // Drop existing policies directly with SQL
      const { error: dropError } = await supabase.rpc('execute_sql_wrapper', {
        sql_statement: `
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

      if (dropError) {
        console.log("Warning when dropping policies:", dropError);
        // Continue even if this fails
      }
    } catch (dropError) {
      console.log("Error connecting to prototypes or dropping policies:", dropError);
      // Continue execution even if this fails
    }

    // Create execute_sql_wrapper function if it doesn't exist
    try {
      const { error: createWrapperError } = await supabase.rpc('execute_sql_wrapper', {
        sql_statement: `
          -- Create the wrapper function if it doesn't exist
          CREATE OR REPLACE FUNCTION public.execute_sql_wrapper(sql_statement text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_statement;
          END;
          $$;
        `
      });

      if (createWrapperError) {
        // If the function doesn't exist yet, create it directly
        const { error: createDirectError } = await supabase.sql(`
          CREATE OR REPLACE FUNCTION public.execute_sql_wrapper(sql_statement text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_statement;
          END;
          $$;
        `);
        
        if (createDirectError) {
          throw new Error(`Failed to create wrapper function: ${createDirectError.message}`);
        }
      }
    } catch (error) {
      console.log("Error creating wrapper function:", error);
      // We need to handle this failure as it's critical
      throw new Error(`Failed to create wrapper function: ${error.message}`);
    }

    // Create new simplified policies
    try {
      const { error: policiesError } = await supabase.rpc('execute_sql_wrapper', {
        sql_statement: `
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
        throw new Error(`Failed to create prototype policies: ${policiesError.message}`);
      }
    } catch (createError) {
      console.error("Error creating prototype policies:", createError);
      throw createError;
    }

    console.log("Prototype policies created successfully");

    // Fix prototype_shares RLS
    try {
      const { error: sharesPoliciesError } = await supabase.rpc('execute_sql_wrapper', {
        sql_statement: `
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
