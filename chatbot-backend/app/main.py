import json
import os
import urllib.error
import urllib.request

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Configuration ---
load_dotenv()  # Load environment variables from .env file

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_BASE_URL")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY.startswith("your_"):
    raise EnvironmentError("DEEPSEEK_API_KEY environment variable is not set. Please add your key to chatbot-backend/.env")


def generate_ai_response(message: str) -> str:
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [{"role": "user", "content": message}],
        "temperature": 0.7,
    }

    request = urllib.request.Request(
        DEEPSEEK_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"DeepSeek API error: {exc.code} {detail}") from exc
    except Exception as exc:
        raise RuntimeError(f"Failed to call DeepSeek API: {exc}") from exc

    try:
        return body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected DeepSeek API response: {body}") from exc


# --- FastAPI App ---
app = FastAPI(title="AI Chatbot API", description="API for interacting with a DeepSeek chatbot.", version="1.0.0")

# --- API Endpoints ---
@app.get("/", tags=["Health"])
async def health_check():
    """
    Endpoint to check the API's health status.
    """
    return {"status": "ok"}

@app.post("/chat", tags=["Chat"])
async def chat(chat_input: ChatInput):
    """
    Endpoint for chatting with the AI model.
    """
    try:
        response_text = generate_ai_response(chat_input.user_message)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")



# --- CORS Configuration ---
origins = [
    "http://localhost:5173",  # Development frontend
    # Add your deployed frontend URL here (e.g., "https://your-deployed-app.com")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],  # Only allow necessary methods
    allow_headers=["*"],
)

# --- Data Models ---
class ChatInput(BaseModel):
    user_message: str

