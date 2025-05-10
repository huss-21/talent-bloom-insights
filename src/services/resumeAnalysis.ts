
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';

const STORAGE_BUCKET_NAME: string = "resumes";

// LLM Configuration class - exported for use in LLMConfig.tsx
export class LLMConfig {
    static Prompts = class {
        static system: string = `You are an expert talent acquisition leader that evaluates candidates by comparing their resumes to the job description 
Based on the following criteria:

Education: Assess the relevance and level of academic qualifications (e.g., diploma, bachelor's, master's, PhD) to the job. Also consider the reputation of the institution and the field of study. For general roles, fields like Business, Communication, Finance, or relevant disciplines are considered.
Work Experience: Evaluate the number of years of professional experience, relevance to the position, diversity of roles held, and career progression. Look for consistency, growth in responsibilities, and relevance to the open position.
Technical Skills: Review the tools, platforms, or software the candidate is proficient in (e.g., Excel, ERP systems, CRM platforms, project management tools). Skills should align with job expectations and demonstrate practical proficiency.
Soft Skills: Identify qualities such as communication, teamwork, leadership, adaptability, conflict resolution, and time management. These can often be inferred from job roles, references, or achievements.
Certifications: Check for any professional certifications that support the job function (e.g., PMP for project managers, CPA for accountants, HR certificates for HR roles). Certifications reflect a commitment to development and industry standards.
Language Proficiency: Consider both written and spoken proficiency in relevant languages. This is particularly important for client-facing, administrative, or regional roles.
Achievements & Awards: Look for quantifiable achievements (e.g., sales targets exceeded, process improvements implemented, employee of the month awards) and recognitions that indicate exceptional performance.
Relevance to Role: Determine how well the candidate's profile aligns with the job description. This includes experience, skills, and any extras that would add value to the role.
Overall Impression: Use a holistic view of the application to gauge suitability, motivation, and overall potential for success in the role. Combine your evaluation from all other categories here.`;

        static user: string = `
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
`;
    };

    // Add static properties for API keys
    static openAI = {
        apiKey: '',
        setApiKey: (key: string) => { LLMConfig.openAI.apiKey = key; }
    };

    static bedrock = {
        apiKey: '',
        setApiKey: (key: string) => { LLMConfig.bedrock.apiKey = key; }
    };

    // Add static properties for prompt manipulation
    static prompts = {
        system: LLMConfig.Prompts.system,
        user: LLMConfig.Prompts.user,
        updatePrompts: (system: string, user: string) => {
            LLMConfig.prompts.system = system;
            LLMConfig.prompts.user = user;
        }
    };
}

// Export the LLMConfig for use in the admin UI
export const LLMSettings = LLMConfig;

// Simplified type definitions for browser compatibility
type Request = {
    headers: Record<string, string | undefined>;
    body: any;
};

type Response = {
    status: (code: number) => {
        send: (message: string) => void;
        json: (data: any) => void;
    };
};

async function analyze_resume_with_openai(resume_text: string, job_description: string, api_key: string): Promise<{ Skills: number; Education: number; Relevance: number; Overall: number }> {
    const user_prompt: string = LLMConfig.prompts.user.replace("{{jobDescription}}", job_description).replace("{{resumeText}}", resume_text);
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: LLMConfig.prompts.system },
                    { role: "user", content: user_prompt }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${api_key}`
                }
            }
        );
        
        const content: string = response.data.choices[0].message.content;
        console.log("OpenAI response:", content);
        
        const result = JSON.parse(content);
        
        // Ensure we have numeric values
        return {
            Skills: typeof result.Skills === 'number' ? result.Skills : parseInt(result.Skills),
            Education: typeof result.Education === 'number' ? result.Education : parseInt(result.Education),
            Relevance: typeof result.Relevance === 'number' ? result.Relevance : parseInt(result.Relevance),
            Overall: typeof result.Overall === 'number' ? result.Overall : parseInt(result.Overall)
        };
    } catch (error) {
        console.error("Error in OpenAI analysis:", error);
        throw error;
    }
}

// Note: This function will only be used server-side in a Supabase Edge Function
export async function process_job_application(request: Request, response: Response): Promise<void> {
    // Implementation will be moved to Supabase Edge Function
    console.log("This function is intended for server-side use in Supabase Edge Functions");
    response.status(501).json({ error: "Not implemented in browser" });
}
