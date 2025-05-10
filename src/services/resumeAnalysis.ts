
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
{jobDescription}

Resume Text:
{resumeText}
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
    
    // The Python service returns a different format, so we need to adapt
    const resultContent = JSON.parse(result.choices[0].message.content);
    
    // In case the Python service returns percentage strings with % sign
    const parsePercentage = (value: string | number): number => {
      if (typeof value === 'string') {
        return parseInt(value.replace('%', ''), 10);
      }
      return value as number;
    };
    
    // Convert to our frontend expected format
    return {
      criteriaScores: {
        "Skills": parsePercentage(resultContent.Skills),
        "Education": parsePercentage(resultContent.Education),
        "Relevance": parsePercentage(resultContent.Relevance),
      },
      overallMatchPercentage: parsePercentage(resultContent.Overall),
      skillsMatchPercentage: parsePercentage(resultContent.Skills),
      educationMatchPercentage: parsePercentage(resultContent.Education),
      experienceMatchPercentage: parsePercentage(resultContent.Relevance),
      keyPhrases: resultContent.keyPhrases || [
        "No key phrases provided by the analysis service"
      ]
    };
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
      experienceMatchPercentage: Math.floor(Math.random() * 30) + 75,
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
    applicantId: applicantId,
    criteriaScores: result.criteriaScores,
    overallMatchPercentage: result.overallMatchPercentage,
    skillsMatchPercentage: result.skillsMatchPercentage,
    educationMatchPercentage: result.educationMatchPercentage,
    experienceMatchPercentage: result.experienceMatchPercentage,
    keyPhrases: result.keyPhrases
  };
}
