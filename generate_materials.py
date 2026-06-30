import os
import sys
import json
import subprocess
import urllib.request
import pypdf

# Load .env
key = ""
with open(".env", "r") as f:
    for line in f:
        if "GEMINI_API_KEY" in line:
            key = line.split("=")[1].strip()

if not key:
    print("No GEMINI_API_KEY found")
    sys.exit(1)

# Read PDF
reader = pypdf.PdfReader("frontend/testsprite_tests/tmp/prd_files/Assignment_I.pdf")
pdf_text = ""
for page in reader.pages:
    text = page.extract_text()
    if text:
        pdf_text += text + "\n"

# We want 10 flashcards and 10 MCQs
prompt = f"""
You are an expert academic tutor. Analyze the following Engineering Mathematics-II assignment problems on Ordinary Differential Equations (ODE) and generate study materials.

DOCUMENT CONTENT:
{pdf_text[:15000]}

Generate exactly:
1. 10 flashcards. Each flashcard must have:
   - "question": a conceptual question
   - "answer": the explanation/answer
   - "difficulty": "easy", "medium", or "hard"
2. 10 multiple choice questions. Each question must have:
   - "question": the question text
   - "options": a list of exactly 4 strings for choices
   - "correct_answer": the correct choice text (must exactly match one of the options)
   - "explanation": detailed explanation of why the answer is correct

Output the result strictly as a valid JSON object with the keys "flashcards" and "exam_questions". Do not wrap the JSON in markdown code blocks.
"""

# Call Gemini API directly via REST
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
headers = {"Content-Type": "application/json"}
body = {
    "contents": [
        {
            "parts": [
                {"text": prompt}
            ]
        }
    ],
    "generationConfig": {
        "responseMimeType": "application/json"
    }
}

req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        response_data = json.loads(res.read().decode("utf-8"))
        result_text = response_data["candidates"][0]["content"]["parts"][0]["text"].strip()
except Exception as e:
    print(f"Error calling Gemini REST API: {e}")
    # Try fallback model gemini-2.5-flash
    print("Trying gemini-2.5-flash...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as res:
        response_data = json.loads(res.read().decode("utf-8"))
        result_text = response_data["candidates"][0]["content"]["parts"][0]["text"].strip()

data = json.loads(result_text)

paper_id = "b26905f0-3f39-4958-82d9-090644a1ea5d" # Assignment_I paper ID

for fc in data["flashcards"]:
    payload = {
        "paper_id": paper_id,
        "question": fc["question"],
        "answer": fc["answer"],
        "difficulty": fc["difficulty"]
    }
    cmd = ["uv", "tool", "run", "--from", "lemma-terminal", "lemma", "record", "create", "flashcards", "-d", json.dumps(payload)]
    print(f"Creating flashcard: {fc['question'][:50]}...")
    subprocess.run(cmd, shell=True, env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})

for eq in data["exam_questions"]:
    payload = {
        "paper_id": paper_id,
        "question": eq["question"],
        "options": json.dumps(eq["options"]),
        "correct_answer": eq["correct_answer"],
        "explanation": eq["explanation"]
    }
    cmd = ["uv", "tool", "run", "--from", "lemma-terminal", "lemma", "record", "create", "exam_questions", "-d", json.dumps(payload)]
    print(f"Creating exam question: {eq['question'][:50]}...")
    subprocess.run(cmd, shell=True, env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})

print("Done populating study materials!")
