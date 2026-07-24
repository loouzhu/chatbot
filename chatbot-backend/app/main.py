from fastapi import FastAPI

# --- FastAPI App ---
app = FastAPI(
    title="AI Chatbot API",
    description="API for interacting with a DeepSeek chatbot.",
    version="1.0.0",
)


# --- API Endpoints ---
@app.get("/", tags=["Health"])
async def health_check():
    """
    Endpoint to check the API's health status.
    """
    return {"status": "ok"}
