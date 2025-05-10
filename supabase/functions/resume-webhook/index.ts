
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const PYTHON_SERVICE_URL = Deno.env.get("PYTHON_SERVICE_URL") || "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received webhook payload:", JSON.stringify(body).substring(0, 200) + "...");
    
    // Verify this is for job_applications table
    if (body.table !== "job_applications") {
      return new Response(
        JSON.stringify({ message: "This webhook is only for job_applications table" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if this is an insert operation
    if (body.type !== "INSERT") {
      return new Response(
        JSON.stringify({ message: "This webhook only processes INSERT operations" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the new record
    const record = body.record;
    
    // Initialize Supabase client
    const supabaseUrl = "https://zpfssnryuokejdiykwqe.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseKey) {
      throw new Error("Supabase service role key not configured");
    }
    
    if (!PYTHON_SERVICE_URL) {
      throw new Error("Python service URL not configured");
    }
    
    // Forward the data to your Python service
    console.log("Forwarding to Python service:", PYTHON_SERVICE_URL);
    const response = await fetch(PYTHON_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        record: record,
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey // Be careful with this in production!
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python service error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Python service response:", result);
    
    return new Response(
      JSON.stringify({ message: "Job application forwarded to Python service", result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
