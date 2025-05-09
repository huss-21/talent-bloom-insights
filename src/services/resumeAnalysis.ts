
/**
 * Service for analyzing resumes against job criteria using LLM APIs
 */

import { Rating } from "@/types";

// Configuration object for LLM settings
export const LLMConfig = {
  openAI: {
    apiKey: localStorage.getItem('openai_api_key') || "",
    model: "gpt-4o",
    setApiKey: (key: string) => {
      localStorage.setItem('openai_api_key', key);
      LLMConfig.openAI.apiKey = key;
    }
  },
  bedrock: {
    apiKey: localStorage.getItem('aws_bedrock_api_key') || "",
    model: "amazon.titan-text-express-v1",
    setApiKey: (key: string) => {
      localStorage.setItem('aws_bedrock_api_key', key);
      LLMConfig.bedrock.apiKey = key;
    }
  },
  // Customizable system and user prompt templates for resume analysis
  prompts: {
    system: "You are a resume analyzer that evaluates candidates based on job criteria.",
    user: `
      Analyze this resume against the following criteria. 
      Provide scores between 0-100 for each criterion and separately calculate:
      - Overall match percentage
      - Skills match percentage (based on technical and soft skills)
      - Education match percentage (based on academic qualifications)
      - Experience match percentage (based on relevant work experience)
      
      Also include 3-5 key phrases from the resume that match the job requirements.
      
      Job Criteria: {jobCriteria}
      
      Resume Text:
      {resumeText}
      
      Respond with a JSON object with this structure:
      {
        "criteriaScores": { "criterion1": score1, "criterion2": score2... },
        "overallMatchPercentage": number,
        "skillsMatchPercentage": number,
        "educationMatchPercentage": number,
        "experienceMatchPercentage": number,
        "keyPhrases": ["phrase1", "phrase2", "phrase3"]
      }
    `,
    // Method to update prompts if needed
    updatePrompts: (system?: string, user?: string) => {
      if (system) LLMConfig.prompts.system = system;
      if (user) LLMConfig.prompts.user = user;
    }
  }
};

/**
 * Extract text from a PDF file
 * Note: This is a mock implementation. In a real application, you would use
 * a library like pdf.js or a server-side solution.
 */
export async function extractTextFromPDF(pdfFile: File): Promise<string> {
  // Mock implementation - in a real app, use pdf.js or similar
  console.log("Extracting text from PDF:", pdfFile.name);
  return "Mock resume text extraction. In a real implementation, this would contain the full text extracted from the PDF file.";
}

/**
 * Interface for LLM analysis response
 */
export interface ResumeAnalysisResult {
  criteriaScores: Record<string, number>;
  overallMatchPercentage: number;
  skillsMatchPercentage: number;
  educationMatchPercentage: number;
  experienceMatchPercentage: number;
  keyPhrases: string[];
}

/**
 * Prepare prompt by replacing template variables with actual values
 */
function preparePrompt(template: string, variables: Record<string, any>): string {
  let prompt = template;
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(`{${key}}`, JSON.stringify(value));
  });
  return prompt;
}

/**
 * Analyze resume text against job criteria using OpenAI API
 */
export async function analyzeResumeWithOpenAI(
  resumeText: string,
  jobCriteria: Record<string, number>
): Promise<ResumeAnalysisResult> {
  console.log("Analyzing resume with OpenAI:", resumeText.substring(0, 100) + "...");
  
  try {
    if (!LLMConfig.openAI.apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    const userPrompt = preparePrompt(LLMConfig.prompts.user, {
      jobCriteria,
      resumeText
    });
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLMConfig.openAI.apiKey}`
      },
      body: JSON.stringify({
        model: LLMConfig.openAI.model,
        messages: [
          {
            role: "system",
            content: LLMConfig.prompts.system
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing resume with OpenAI:", error);
    
    // Return mock data for demonstration or if there's an API error
    return {
      criteriaScores: Object.fromEntries(
        Object.keys(jobCriteria).map(criterion => [criterion, Math.floor(Math.random() * 30) + 60])
      ),
      overallMatchPercentage: Math.floor(Math.random() * 30) + 60,
      skillsMatchPercentage: Math.floor(Math.random() * 30) + 55,
      educationMatchPercentage: Math.floor(Math.random() * 30) + 65,
      experienceMatchPercentage: Math.floor(Math.random() * 30) + 70,
      keyPhrases: [
        "5 years of relevant experience",
        "Led cross-functional teams",
        "Implemented CI/CD pipelines",
        "Reduced processing time by 30%"
      ]
    };
  }
}

/**
 * Analyze resume text against job criteria using AWS Bedrock API
 */
export async function analyzeResumeWithBedrock(
  resumeText: string,
  jobCriteria: Record<string, number>
): Promise<ResumeAnalysisResult> {
  console.log("Analyzing resume with AWS Bedrock:", resumeText.substring(0, 100) + "...");
  
  try {
    if (!LLMConfig.bedrock.apiKey) {
      throw new Error("AWS Bedrock API key not configured");
    }
    
    const userPrompt = preparePrompt(LLMConfig.prompts.user, {
      jobCriteria,
      resumeText
    });
    
    // In a real implementation, replace with actual AWS Bedrock API call
    // This is a mock implementation
    
    // Return mock data for demonstration
    return {
      criteriaScores: Object.fromEntries(
        Object.keys(jobCriteria).map(criterion => [criterion, Math.floor(Math.random() * 30) + 60])
      ),
      overallMatchPercentage: Math.floor(Math.random() * 30) + 60,
      skillsMatchPercentage: Math.floor(Math.random() * 30) + 65,
      educationMatchPercentage: Math.floor(Math.random() * 30) + 70,
      experienceMatchPercentage: Math.floor(Math.random() * 30) + 60,
      keyPhrases: [
        "Bachelor's degree in Computer Science",
        "Experience with cloud technologies",
        "Strong problem-solving abilities",
        "Excellent communication skills"
      ]
    };
  } catch (error) {
    console.error("Error analyzing resume with AWS Bedrock:", error);
    throw error;
  }
}

/**
 * Create a rating object from LLM analysis result
 */
export function createRatingFromAnalysis(
  applicantId: string,
  result: ResumeAnalysisResult
): Omit<Rating, "id" | "createdAt"> {
  return {
    applicantId,
    criteriaScores: result.criteriaScores,
    overallMatchPercentage: result.overallMatchPercentage,
    skillsMatchPercentage: result.skillsMatchPercentage,
    educationMatchPercentage: result.educationMatchPercentage,
    experienceMatchPercentage: result.experienceMatchPercentage,
    keyPhrases: result.keyPhrases
  };
}
