# main.py
import os
import PyPDF2
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import LangChain components
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
# LLMChain is no longer needed

# Load environment variables
load_dotenv()

# --- FastAPI App Initialization ---
app = FastAPI()

# Configure CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LangChain Setup with Google Gemini ---
try:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
except Exception as e:
    print(f"Error initializing LLM: {e}")
    llm = None

# --- Helper Function to Extract Text from PDF ---
def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_stream = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "AI Career Assistant Backend is running."}

@app.post("/api/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    if not llm:
        raise HTTPException(status_code=500, detail="LLM not initialized. Check API key and dependencies.")

    if resume.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    resume_content_bytes = await resume.read()
    resume_text = extract_text_from_pdf(resume_content_bytes)

    if not resume_text:
        raise HTTPException(status_code=500, detail="Could not read text from the PDF.")

    # --- The AI Analysis Prompt ---
    analysis_prompt_template = ChatPromptTemplate.from_template(
        """
        You are an expert career coach and resume reviewer. Your task is to analyze the provided resume against the given job description and provide actionable feedback.

        Analyze the following sections:
        1.  **Keyword Match:** Compare the resume text with the job description. List the key skills and technologies from the job description that are MISSING from the resume.
        2.  **Impactful Language:** Review the bullet points in the resume. Suggest 2-3 improvements to make them more action-oriented and results-driven. Use the STAR (Situation, Task, Action, Result) method as a reference.
        3.  **Overall Summary:** Provide a brief, overall summary of the candidate's fit for the role based on the resume and job description. Give a final recommendation on whether to apply or what to improve first.

        **Resume Text:**
        ---
        {resume_text}
        ---

        **Job Description:**
        ---
        {job_description}
        ---

        Provide your analysis in a clear, well-structured format.
        """
    )

    # --- UPDATED: Create the chain using the modern pipe syntax ---
    analysis_chain = analysis_prompt_template | llm
    
    try:
        # --- UPDATED: Invoke the chain and get the response content ---
        result = analysis_chain.invoke({
            "resume_text": resume_text,
            "job_description": job_description
        })
        return {"analysis": result.content}
    except Exception as e:
        print(f"Error during LLM invocation: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while analyzing the resume: {e}")

