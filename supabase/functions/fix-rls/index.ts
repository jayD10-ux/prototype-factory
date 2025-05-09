
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

    // Step 1: Drop all existing prototype policies
    console.log("Step 1: Dropping existing prototype policies");
    await supabase.rpc('execute_sql_wrapper', {
      sql_statement: `
        DROP POLICY IF EXISTS "Users can view their own prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can view shared prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can update their own prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can insert prototypes" ON public.prototypes;
        DROP POLICY IF EXISTS "Users can delete their own prototypes" ON public.prototypes;
      `
    });
    
    // Step 2: Drop the existing is_prototype_shared function if it exists
    console.log("Step 2: Dropping existing is_prototype_shared function");
    await supabase.rpc('execute_sql_wrapper', {
      sql_statement: `
        DROP FUNCTION IF EXISTS public.is_prototype_shared(uuid);
      `
    });

    // Step 3: Create a simple SQL function to check if prototype is shared
    console.log("Step 3: Creating simple is_prototype_shared function");
    await supabase.rpc('execute_sql_wrapper', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION public.is_prototype_shared(prototype_uuid uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM public.prototype_shares
            WHERE prototype_id = prototype_uuid AND is_public = true
          );
        $$;
      `
    });

    // Step 4: Create simple policies without complex logic
    console.log("Step 4: Creating new prototype policies");
    await supabase.rpc('execute_sql_wrapper', {
      sql_statement: `
        -- Enable RLS on prototypes table
        ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;

        -- Simple policy for viewing own prototypes
        CREATE POLICY "Users can view own prototypes" 
        ON public.prototypes
        FOR SELECT 
        USING (created_by = auth.uid());

        -- Simple policy for viewing shared prototypes
        CREATE POLICY "Users can view shared prototypes" 
        ON public.prototypes
        FOR SELECT 
        USING (is_prototype_shared(id));

        -- Simple policy for updating own prototypes
        CREATE POLICY "Users can update own prototypes" 
        ON public.prototypes
        FOR UPDATE
        USING (created_by = auth.uid());

        -- Simple policy for inserting prototypes
        CREATE POLICY "Users can insert prototypes" 
        ON public.prototypes
        FOR INSERT
        WITH CHECK (created_by = auth.uid());

        -- Simple policy for deleting own prototypes
        CREATE POLICY "Users can delete own prototypes" 
        ON public.prototypes
        FOR DELETE
        USING (created_by = auth.uid());
      `
    });

    // Step 5: Create simple policies for prototype_shares
    console.log("Step 5: Setting up RLS policies for prototype_shares table");
    await supabase.rpc('execute_sql_wrapper', {
      sql_statement: `
        -- Enable RLS on prototype_shares
        ALTER TABLE IF EXISTS public.prototype_shares ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can create shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can update their own shares" ON public.prototype_shares;
        DROP POLICY IF EXISTS "Users can delete their own shares" ON public.prototype_shares;

        -- Simple policies
        CREATE POLICY "Users can view shares" 
        ON public.prototype_shares
        FOR SELECT 
        USING ((shared_by = auth.uid()) OR is_public = true);

        CREATE POLICY "Users can create shares" 
        ON public.prototype_shares
        FOR INSERT
        WITH CHECK (shared_by = auth.uid());

        CREATE POLICY "Users can update shares" 
        ON public.prototype_shares
        FOR UPDATE
        USING (shared_by = auth.uid());

        CREATE POLICY "Users can delete shares" 
        ON public.prototype_shares
        FOR DELETE
        USING (shared_by = auth.uid());
      `
    });

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
