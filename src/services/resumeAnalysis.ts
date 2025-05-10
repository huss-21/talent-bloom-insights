
// LLM Configuration for resume analysis
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Export LLMSettings (previously LLMConfig) to avoid naming conflict with the component
export const LLMSettings = {
  // Class for prompt templates
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
where XX is the percentage match for each category (an integer between 0 and 100, no % sign).

Job Description:
{{jobDescription}}

Resume Text:
{{resumeText}}
`,
    
    updatePrompts: (system: string, user: string) => {
      LLMSettings.prompts.system = system;
      LLMSettings.prompts.user = user;
    }
  },
  
  // OpenAI API configuration
  openAI: {
    apiKey: '',
    setApiKey: (key: string) => {
      LLMSettings.openAI.apiKey = key;
    }
  },
  
  // AWS Bedrock API configuration
  bedrock: {
    apiKey: '',
    setApiKey: (key: string) => {
      LLMSettings.bedrock.apiKey = key;
    }
  },
  
  // Prompts management
  prompts: {
    system: '',
    user: '',
    updatePrompts: (system: string, user: string) => {
      LLMSettings.prompts.system = system;
      LLMSettings.prompts.user = user;
    }
  }
};

// Initialize prompts with default values
LLMSettings.prompts.system = LLMSettings.Prompts.system;
LLMSettings.prompts.user = LLMSettings.Prompts.user;

/**
 * This function uploads a resume file to Supabase storage and creates a job application record.
 * The webhook will then trigger the resume analysis process.
 */
export async function analyzeResume(resumeFile: File, jobDescription: string, userId: string, jobId: string, fullName: string, email: string): Promise<any> {
  try {
    console.log("Resume analysis requested for:", resumeFile.name);
    
    // 1. Upload the file to Supabase Storage
    const filePath = `${userId}/${crypto.randomUUID()}.pdf`;
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('resumes')
      .upload(filePath, resumeFile);
    
    if (uploadError) {
      throw uploadError;
    }
    
    console.log("File uploaded successfully:", filePath);
    
    // 2. Get the public URL of the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(filePath);
    
    // 3. Create a job application record to trigger the webhook
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        job_id: jobId,
        full_name: fullName,
        email: email,
        resume_file_path: filePath,
        resume_file_name: resumeFile.name,
        resume_url: publicUrl,
        job_description: jobDescription
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log("Job application created to trigger analysis:", data.id);
    
    return {
      message: "Resume submitted for analysis",
      status: "processing",
      applicationId: data.id
    };
    
  } catch (error) {
    console.error("Error in analyzeResume:", error);
    throw error;
  }
}

/**
 * Check the status of a resume analysis by looking up the job application
 * and checking if the Skills, Education, Relevance, and Overall fields are populated.
 */
export async function checkResumeAnalysisStatus(applicationId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('Skills, Education, Relevance, Overall, updated_at')
      .eq('id', applicationId)
      .single();
    
    if (error) {
      throw error;
    }
    
    const isComplete = data.Skills !== null && 
                       data.Education !== null && 
                       data.Relevance !== null && 
                       data.Overall !== null;
    
    return {
      status: isComplete ? "complete" : "processing",
      results: isComplete ? {
        Skills: data.Skills,
        Education: data.Education,
        Relevance: data.Relevance,
        Overall: data.Overall
      } : null,
      lastUpdated: data.updated_at
    };
  } catch (error) {
    console.error("Error checking analysis status:", error);
    throw error;
  }
}
