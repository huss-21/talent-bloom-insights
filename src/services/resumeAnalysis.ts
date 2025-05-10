
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import { Request, Response } from 'express';

const STORAGE_BUCKET_NAME: string = "resumes";

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

async function extract_text_from_pdf(pdf_bytes: ArrayBuffer): Promise<string> {
    const pdf = await pdfParse(Buffer.from(pdf_bytes));
    return pdf.text || "";
}

async function analyze_resume_with_openai(resume_text: string, job_description: string, api_key: string): Promise<{ Skills: number; Education: number; Relevance: number; Overall: number }> {
    const user_prompt: string = LLMConfig.Prompts.user.replace("{{jobDescription}}", job_description).replace("{{resumeText}}", resume_text);
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: LLMConfig.Prompts.system },
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

export async function process_job_application(request: Request, response: Response): Promise<void> {
    // Verify webhook secret (optional security)
    const expected_secret: string | undefined = process.env['WEBHOOK_SECRET'];
    const auth_header: string | undefined = request.headers['authorization'];
    if (expected_secret && (!auth_header || auth_header !== `Bearer ${expected_secret}`)) {
        response.status(401).send("Unauthorized");
        return;
    }

    try {
        // Parse webhook payload
        const data = request.body;
        const record = data.record;
        const application_id: string = record.id;
        const resume_path: string = record.resume_file_path;
        const job_description: string = record.job_description;

        console.log(`Processing application ID: ${application_id}, Resume path: ${resume_path}`);
        
        if (!resume_path || !job_description) {
            throw new Error("Missing required fields: resume_path or job_description");
        }

        // Get environment variables
        const supabase_url: string = process.env['SUPABASE_URL'] || "https://zpfssnryuokejdiykwqe.supabase.co";
        const supabase_key: string = process.env['SUPABASE_SERVICE_ROLE_KEY'] || "";
        const openai_api_key: string = process.env['OPENAI_API_KEY'] || "";
        
        if (!supabase_key || !openai_api_key) {
            throw new Error("Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY");
        }

        // Initialize Supabase client
        const supabase: SupabaseClient = createClient(supabase_url, supabase_key);

        // Download resume from Supabase Storage
        console.log(`Downloading resume from ${STORAGE_BUCKET_NAME}/${resume_path}`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(STORAGE_BUCKET_NAME)
            .download(resume_path);

        if (downloadError || !fileData) {
            throw new Error(`Error downloading resume: ${downloadError?.message || "No data returned"}`);
        }
        
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer();
        
        // Extract text from the resume PDF
        const resume_text: string = await extract_text_from_pdf(arrayBuffer);
        console.log(`Extracted text from resume (length: ${resume_text.length})`);

        // Analyze resume using OpenAI
        const analysis_result = await analyze_resume_with_openai(resume_text, job_description, openai_api_key);
        console.log("Analysis result:", analysis_result);

        // Return the result back to the webhook
        response.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            analysis_result: analysis_result
        });
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        response.status(500).json({
            success: false,
            error: e.message
        });
    }
}
