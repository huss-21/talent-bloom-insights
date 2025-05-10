import os
import json
import requests
from supabase import create_client, Client
import pdfplumber
import io

# NEW: Import asyncio and async Supabase client for Realtime
import asyncio
from supabase import AsyncClient, create_async_client

# NEW: Import dotenv to load environment variables
from dotenv import load_dotenv
load_dotenv()

STORAGE_BUCKET_NAME = "resumes"

class LLMConfig:
    class Prompts:
        system = """You are an expert talent acquisition leader that evaluates candidates by comparing their resumes to the job description 
Based on the following criteria:

Education: Assess the relevance and level of academic qualifications (e.g., diploma, bachelor's, master's, PhD) to the job. Also consider the reputation of the institution and the field of study. For general roles, fields like Business, Communication, Finance, or relevant disciplines are considered.
Work Experience: Evaluate the number of years of professional experience, relevance to the position, diversity of roles held, and career progression. Look for consistency, growth in responsibilities, and relevance to the open position.
Technical Skills: Review the tools, platforms, or software the candidate is proficient in (e.g., Excel, ERP systems, CRM platforms, project management tools). Skills should align with job expectations and demonstrate practical proficiency.
Soft Skills: Identify qualities such as communication, teamwork, leadership, adaptability, conflict resolution, and time management. These can often be inferred from job roles, references, or achievements.
Certifications: Check for any professional certifications that support the job function (e.g., PMP for project managers, CPA for accountants, HR certificates for HR roles). Certifications reflect a commitment to development and industry standards.
Language Proficiency: Consider both written and spoken proficiency in relevant languages. This is particularly important for client-facing, administrative, or regional roles.
Achievements & Awards: Look for quantifiable achievements (e.g., sales targets exceeded, process improvements implemented, employee of the month awards) and recognitions that indicate exceptional performance.
Relevance to Role: Determine how well the candidate’s profile aligns with the job description. This includes experience, skills, and any extras that would add value to the role.
Overall Impression: Use a holistic view of the application to gauge suitability, motivation, and overall potential for success in the role. Combine your evaluation from all other categories here.."""
        user = """
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
"""

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def analyze_resume_with_openai(resume_text: str, job_description: str, api_key: str) -> dict:
    user_prompt = LLMConfig.Prompts.user.replace("{{jobDescription}}", job_description).replace("{{resumeText}}", resume_text)
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        json={
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": LLMConfig.Prompts.system},
                {"role": "user", "content": user_prompt}
            ]
        }
    )
    response.raise_for_status()
    result = response.json()
    content = result["choices"][0]["message"]["content"]
    return json.loads(content)

def process_job_application(request):
    # Verify webhook secret (optional security)
    expected_secret = os.environ.get('WEBHOOK_SECRET')
    auth_header = request.headers.get('Authorization')
    if expected_secret and (not auth_header or auth_header != f"Bearer {expected_secret}"):
        return "Unauthorized", 401

    try:
        # Parse webhook payload
        data = request.get_json()
        new_record = data['record']
        application_id = new_record['id']
        resume_path = new_record['resume_url']
        job_description = new_record['job_description']

        # Get environment variables
        supabase_url = os.environ['https://zpfssnryuokejdiykwqe.supabase.co']
        supabase_key = os.environ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZnNzbnJ5dW9rZWpkaXlrd3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTU1NDQsImV4cCI6MjA2MjIzMTU0NH0.3XEmvP2NiByLtEqGbkq8q5s-caOMC8WIE38nR-mNCrM']
        openai_api_key = os.environ['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']

        # Initialize Supabase client
        supabase = create_client(supabase_url, supabase_key)

        # Download resume from Supabase Storage
        pdf_bytes = supabase.storage.from_(STORAGE_BUCKET_NAME).download(resume_path)

        # Extract text from the resume PDF
        resume_text = extract_text_from_pdf(pdf_bytes)

        # Analyze resume using OpenAI
        analysis_result = analyze_resume_with_openai(resume_text, job_description, openai_api_key)

        # Update the record in Supabase
        supabase.table("job_applications").update({
            "Skills": analysis_result["Skills"],
            "Education": analysis_result["Education"],
            "Relevance": analysis_result["Relevance"],
            "Overall": analysis_result["Overall"]
        }).eq("id", application_id).execute()

        return "Success", 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return "Error", 500

# NEW: Async function to process new application from Realtime event
async def process_new_application(supabase: AsyncClient, new_record):
    try:
        application_id = new_record['id']
        resume_path = new_record['resume_url']
        job_description = new_record['job_description']
        openai_api_key = os.environ['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']

        # Download resume from Supabase Storage (async)
        response = await supabase.storage.from_(STORAGE_BUCKET_NAME).download(resume_path)
        pdf_bytes = response

        # Extract text from the resume PDF (synchronous, as it doesn't need to be async)
        resume_text = extract_text_from_pdf(pdf_bytes)

        # Analyze resume using OpenAI (synchronous, as it uses requests)
        analysis_result = analyze_resume_with_openai(resume_text, job_description, openai_api_key)

        # Update the record in Supabase (async)
        await supabase.table("job_applications").update({
            "Skills": analysis_result["Skills"],
            "Education": analysis_result["Education"],
            "Relevance": analysis_result["Relevance"],
            "Overall": analysis_result["Overall"]
        }).eq("id", application_id).execute()

    except Exception as e:
        print(f"Error processing application {new_record['id']}: {str(e)}")

# NEW: Async function to set up Realtime subscription
async def setup_realtime_subscription():
    try:
        # Use the same environment variable keys as the original script
        supabase_url = os.environ['https://zpfssnryuokejdiykwqe.supabase.co']
        supabase_key = os.environ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZnNzbnJ5dW9rZWpkaXlrd3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTU1NDQsImV4cCI6MjA2MjIzMTU0NH0.3XEmvP2NiByLtEqGbkq8q5s-caOMC8WIE38nR-mNCrM']
    except KeyError as e:
        print(f"Environment variable missing: {e}. Please set the required environment variables.")
        print("Required variables:")
        print("- https://zpfssnryuokejdiykwqe.supabase.co")
        print("- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZnNzbnJ5dW9rZWpkaXlrd3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTU1NDQsImV4cCI6MjA2MjIzMTU0NH0.3XEmvP2NiByLtEqGbkq8")