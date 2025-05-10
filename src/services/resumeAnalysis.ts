import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import { Request, Response } from 'express';

const STORAGE_BUCKET_NAME: string = "resumes";

class LLMConfig {
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
Relevance to Role: Determine how well the candidate’s profile aligns with the job description. This includes experience, skills, and any extras that would add value to the role.
Overall Impression: Use a holistic view of the application to gauge suitability, motivation, and overall potential for success in the role. Combine your evaluation from all other categories here..`;

        static user: string = `
Analyze this resume against the provided job description based on the criteria specified in the system prompt.

After analyzing, provide a JSON object with the following structure:
{
    "Skills": "XX%",
    "Education": "XX%",
    "Relevance": "XX%",
    "Overall": "XX%"
}
where "XX%" is the percentage match for each category.

Job Description:
{{jobDescription}}

Resume Text:
{{resumeText}}
`;
    };
}

async function extract_text_from_pdf(pdf_bytes: Buffer): Promise<string> {
    const pdf = await pdfParse(pdf_bytes);
    return pdf.text || "";
}

async function analyze_resume_with_openai(resume_text: string, job_description: string, api_key: string): Promise<{ Skills: string; Education: string; Relevance: string; Overall: string }> {
    const user_prompt: string = LLMConfig.Prompts.user.replace("{{jobDescription}}", job_description).replace("{{resumeText}}", resume_text);
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
    return JSON.parse(content);
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
        const data: { record: { id: string; resume_url: string; job_description: string } } = request.body;
        const new_record = data.record;
        const application_id: string = new_record.id;
        const resume_path: string = new_record.resume_url;
        const job_description: string = new_record.job_description;

        // Get environment variables
        const supabase_url: string = process.env['https://zpfssnryuokejdiykwqe.supabase.co']!;
        const supabase_key: string = process.env['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZnNzbnJ5dW9rZWpkaXlrd3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTU1NDQsImV4cCI6MjA2MjIzMTU0NH0.3XEmvP2NiByLtEqGbkq8q5s-caOMC8WIE38nR-mNCrM']!;
        const openai_api_key: string = process.env['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']!;

        // Initialize Supabase client
        const supabase: SupabaseClient = createClient(supabase_url, supabase_key);

        // Download resume from Supabase Storage
        const { data: pdf_bytes } = await supabase.storage.from(STORAGE_BUCKET_NAME).download(resume_path);

        // Extract text from the resume PDF
        const resume_text: string = await extract_text_from_pdf(pdf_bytes as Buffer);

        // Analyze resume using OpenAI
        const analysis_result = await analyze_resume_with_openai(resume_text, job_description, openai_api_key);

        // Update the record in Supabase
        await supabase.from("job_applications").update({
            Skills: analysis_result.Skills,
            Education: analysis_result.Education,
            Relevance: analysis_result.Relevance,
            Overall: analysis_result.Overall
        }).eq("id", application_id);

        response.status(200).send("Success");
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        response.status(500).send("Error");
    }
}
