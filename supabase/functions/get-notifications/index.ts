import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { default as Novu } from "https://esm.sh/@novu/node@0.19.0";

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
    const novuApiKey = Deno.env.get("NOVU_API_KEY");
    if (!novuApiKey) {
      throw new Error("NOVU_API_KEY environment variable is not set");
    }

    // Initialize Novu with the API key
    const novu = new Novu(novuApiKey);

    // Parse request body
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log("Fetching notifications for user:", userId);
    
    try {
      // Get subscriber's notifications from Novu
      const result = await novu.subscribers.getNotificationsFeed(userId, {
        page: 0,
        limit: 10,
      });

      if (!result?.data) {
        throw new Error("Failed to fetch notifications from Novu");
      }

      return new Response(JSON.stringify({ 
        notifications: result.data.data || [],
        totalCount: result.data.totalCount || 0,
        pageSize: result.data.pageSize || 10,
        page: result.data.page || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      const novuError = err as NovuError;
      console.error("Novu API Error:", novuError);
      throw new Error(`Novu API Error: ${novuError.message || 'Unknown error'}`);
    }
  } catch (err) {
    const error = err as Error;
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      novuKeyExists: !!Deno.env.get("NOVU_API_KEY"),
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
