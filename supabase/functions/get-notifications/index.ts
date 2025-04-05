
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Novu } from "https://esm.sh/@novu/node@0.19.0";

interface NovuError {
  message?: string;
  status?: number;
  [key: string]: any;
}

// Set up CORS headers for the API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {
    // Since we're disabling notifications, just return an empty array
    return new Response(JSON.stringify({ 
      notifications: [],
      totalCount: 0,
      pageSize: 10,
      page: 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
    
    console.error("Error in get-notifications function:", errorDetails);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
