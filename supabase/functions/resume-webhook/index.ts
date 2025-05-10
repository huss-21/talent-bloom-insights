
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Environment variables - these need to be set in your Supabase dashboard
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
    
    console.log(`Record ID: ${record.id}, Resume path: ${record.resume_file_path}, Job description length: ${record.job_description?.length || 0}`);
    
    // Forward the data to your Python service
    console.log("Forwarding to Python service:", PYTHON_SERVICE_URL);
    const response = await fetch(PYTHON_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        record: {
          id: record.id,
          resume_file_path: record.resume_file_path,
          job_description: record.job_description
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python service error: ${response.status} ${errorText}`);
    }
    
    const pythonResponse = await response.json();
    console.log("Python service response:", pythonResponse);
    
    // Check if Python service returned analysis results
    if (pythonResponse.analysis_result) {
      const analysis = pythonResponse.analysis_result;
      console.log("Received analysis from Python service:", analysis);
      
      // Extract percentage values
      const skillsValue = typeof analysis.Skills === 'number' ? 
        analysis.Skills : 
        parseInt(String(analysis.Skills).replace('%', ''), 10);
      
      const educationValue = typeof analysis.Education === 'number' ? 
        analysis.Education : 
        parseInt(String(analysis.Education).replace('%', ''), 10);
      
      const relevanceValue = typeof analysis.Relevance === 'number' ? 
        analysis.Relevance : 
        parseInt(String(analysis.Relevance).replace('%', ''), 10);
      
      const overallValue = typeof analysis.Overall === 'number' ? 
        analysis.Overall : 
        parseInt(String(analysis.Overall).replace('%', ''), 10);
      
      // Update the job application with analysis results
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({
          Skills: skillsValue,
          Education: educationValue,
          Relevance: relevanceValue,
          Overall: overallValue,
          updated_at: new Date().toISOString()
        })
        .eq("id", record.id);
      
      if (updateError) {
        console.error("Error updating job application:", updateError);
        throw new Error(`Failed to update job application: ${updateError.message}`);
      }
      
      console.log("Successfully updated job application with analysis results");
    } else {
      console.log("No analysis results received from Python service");
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Job application forwarded to Python service", 
        result: pythonResponse 
      }),
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
