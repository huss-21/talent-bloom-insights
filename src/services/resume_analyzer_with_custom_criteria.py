
import os
import json
import requests
from supabase import create_client
import pdfplumber
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Constants
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
Relevance to Role: Determine how well the candidate's profile aligns with the job description. This includes experience, skills, and any extras that would add value to the role.
Overall Impression: Use a holistic view of the application to gauge suitability, motivation, and overall potential for success in the role. Combine your evaluation from all other categories here."""
        user = """
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
"""

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def analyze_resume_with_openai(resume_text: str, job_description: str, api_key: str) -> dict:
    user_prompt = LLMConfig.Prompts.user.replace("{{jobDescription}}", job_description).replace("{{resumeText}}", resume_text)
    
    try:
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
        print(f"OpenAI response: {content}")
        
        # Parse the JSON response
        parsed_result = json.loads(content)
        
        # Ensure we have numeric values (remove any % signs and convert to integers)
        return {
            "Skills": int(str(parsed_result["Skills"]).replace("%", "")),
            "Education": int(str(parsed_result["Education"]).replace("%", "")),
            "Relevance": int(str(parsed_result["Relevance"]).replace("%", "")),
            "Overall": int(str(parsed_result["Overall"]).replace("%", ""))
        }
    except Exception as e:
        print(f"Error in OpenAI analysis: {str(e)}")
        raise e

def process_job_application(request):
    # Verify webhook secret (optional security)
    expected_secret = os.environ.get('WEBHOOK_SECRET')
    auth_header = request.headers.get('Authorization')
    if expected_secret and (not auth_header or auth_header != f"Bearer {expected_secret}"):
        return {"error": "Unauthorized"}, 401

    try:
        # Parse webhook payload
        data = request.get_json()
        record = data['record']
        application_id = record['id']
        resume_path = record['resume_file_path']
        job_description = record['job_description']
        
        print(f"Processing application ID: {application_id}, Resume path: {resume_path}")
        
        if not resume_path or not job_description:
            raise Exception("Missing required fields: resume_path or job_description")

        # Get environment variables
        supabase_url = os.environ.get('SUPABASE_URL', 'https://zpfssnryuokejdiykwqe.supabase.co')
        supabase_key = os.environ.get('SUPABASE_KEY')
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        
        if not supabase_key or not openai_api_key:
            raise Exception("Missing required environment variables: SUPABASE_KEY or OPENAI_API_KEY")

        # Initialize Supabase client
        supabase = create_client(supabase_url, supabase_key)

        # Download resume from Supabase Storage
        print(f"Downloading resume from {STORAGE_BUCKET_NAME}/{resume_path}")
        response = supabase.storage.from_(STORAGE_BUCKET_NAME).download(resume_path)
        
        if not response:
            raise Exception("Error downloading resume: No data returned")
        
        # Extract text from the resume PDF
        resume_text = extract_text_from_pdf(response)
        print(f"Extracted text from resume (length: {len(resume_text)})")

        # Analyze resume using OpenAI
        analysis_result = analyze_resume_with_openai(resume_text, job_description, openai_api_key)
        print(f"Analysis result: {analysis_result}")

        # Update the record in Supabase with the analysis results
        update_result = supabase.table("job_applications").update({
            "Skills": analysis_result["Skills"],
            "Education": analysis_result["Education"],
            "Relevance": analysis_result["Relevance"],
            "Overall": analysis_result["Overall"],
            "updated_at": supabase.table("job_applications").rpc("now").execute().data[0]
        }).eq("id", application_id).execute()
        
        print(f"Update result: {update_result}")

        return {
            "success": True,
            "message": "Resume analyzed successfully",
            "analysis_result": analysis_result
        }, 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }, 500

# Set up a Flask server to listen for webhook events when run directly
if __name__ == "__main__":
    from flask import Flask, request, jsonify
    
    app = Flask(__name__)
    
    @app.route('/process-application', methods=['POST'])
    def webhook_handler():
        result, status_code = process_job_application(request)
        return jsonify(result), status_code
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
