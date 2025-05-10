
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

// Constants
const STORAGE_BUCKET_NAME = "resumes";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// System and user prompts
const LLMConfig = {
  Prompts: {
    system: `You are an expert talent acquisition leader that evaluates candidates by comparing their resumes to the job description 
Based on the following criteria:

Education: Assess the relevance and level of academic qualifications (e.g., diploma, bachelor's, master's, PhD) to the job. Also consider the reputation of the institution and the field of study. For general roles, fields like Business, Communication, Finance, or relevant disciplines are considered.
Work Experience: Evaluate the number of years of professional experience, relevance to the position, diversity of roles held, and career progression. Look for consistency, growth in responsibilities, and relevance to the open position.
Technical Skills: Review the tools, platforms, or software the candidate is proficient in (e.g., Excel, ERP systems, CRM platforms, project management tools). Skills should align with job expectations and demonstrate practical proficiency.
Soft Skills: Identify qualities such as communication, teamwork, leadership, adaptability, conflict resolution, and time management. These can often be inferred from job roles, references, or achievements.
Certifications: Check for any professional certifications that support the job function (e.g., PMP for project managers, CPA for accountants, HR certificates for HR roles). Certifications reflect a commitment to development and industry standards.
Language Proficiency: Consider both written and spoken proficiency in relevant languages. This is particularly important for client-facing, administrative, or regional roles.
Achievements & Awards: Look for quantifiable achievements (e.g., sales targets exceeded, process improvements implemented, employee of the month awards) and recognitions that indicate exceptional performance.
Relevance to Role: Determine how well the candidate's profile aligns with the job description. This includes experience, skills, and any extras that would add value to the role.
Overall Impression: Use a holistic view of the application to gauge suitability, motivation, and overall potential for success in the role. Combine your evaluation from all other categories here.`,
    user: `
Analyze this resume against the provided job description based on the criteria specified in the system prompt.

After analyzing, provide a JSON object with the following structure:
{
    "Skills": XX,
    "Education": XX,
    "Relevance": XX,
    "Overall": XX
}
where XX is the percentage match for each category (an integer between 0 and 100).

Job Description:
{{jobDescription}}

Resume Text:
{{resumeText}}
`
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract text from PDF (simplified, as Deno doesn't have direct PDF parsing)
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  // In a real implementation, we would use PDF.js or similar library to extract text
  // For now, we'll return a placeholder message indicating text extraction
  console.log("PDF bytes received for processing:", pdfBytes.length, "bytes");
  
  // For real implementation, you would need to use a PDF parsing library or an external service
  return `PDF content extracted from ${pdfBytes.length} bytes`;
}

// Analyze resume using OpenAI
async function analyzeResumeWithOpenAI(resumeText: string, jobDescription: string): Promise<Record<string, number>> {
  try {
    console.log("Analyzing resume with OpenAI...");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    
    const userPrompt = LLMConfig.Prompts.user
      .replace("{{jobDescription}}", jobDescription)
      .replace("{{resumeText}}", resumeText);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: LLMConfig.Prompts.system },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log("OpenAI response received:", result.choices[0].message.content);
    
    // Parse the result to extract the analysis
    const content = result.choices[0].message.content;
    
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1].split("```")[0].trim();
    }
    
    const analysis = JSON.parse(jsonStr);
    
    // Convert percentage strings to numbers if needed
    const numericAnalysis: Record<string, number> = {};
    for (const [key, value] of Object.entries(analysis)) {
      if (typeof value === 'string' && value.includes('%')) {
        numericAnalysis[key] = parseInt(value.replace('%', ''), 10);
      } else if (typeof value === 'number') {
        numericAnalysis[key] = value;
      } else {
        numericAnalysis[key] = 0;
      }
    }
    
    return numericAnalysis;
  } catch (error) {
    console.error("Error analyzing resume with OpenAI:", error);
    throw error;
  }
}

// Process a new job application
async function processJobApplication(record: any, supabase: any): Promise<void> {
  try {
    const applicationId = record.id;
    const resumePath = record.resume_file_path;
    const jobDescription = record.job_description || "No job description provided";
    
    console.log(`Processing application ID: ${applicationId}`);
    console.log(`Resume path: ${resumePath}`);
    
    if (!resumePath) {
      throw new Error("Resume path not found in record");
    }
    
    // Download resume from Supabase Storage
    const { data: pdfData, error: pdfError } = await supabase
      .storage
      .from(STORAGE_BUCKET_NAME)
      .download(resumePath);
    
    if (pdfError || !pdfData) {
      throw new Error(`Error downloading resume: ${pdfError?.message || "No data returned"}`);
    }
    
    // Extract text from the resume PDF
    const resumeText = await extractTextFromPDF(pdfData);
    
    // Analyze resume using OpenAI
    const analysisResult = await analyzeResumeWithOpenAI(resumeText, jobDescription);
    
    console.log("Analysis result:", analysisResult);
    
    // Update the record in Supabase
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        Skills: analysisResult.Skills,
        Education: analysisResult.Education,
        Relevance: analysisResult.Relevance,
        Overall: analysisResult.Overall,
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId);
      
    if (updateError) {
      throw new Error(`Error updating application: ${updateError.message}`);
    }
    
    console.log(`Successfully updated application ID: ${applicationId} with analysis results`);
    
  } catch (error) {
    console.error("Error processing job application:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
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
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Process the job application
    await processJobApplication(record, supabase);
    
    return new Response(
      JSON.stringify({ message: "Job application processed successfully" }),
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
