from app.core.config import settings
from app.features.auth.router import auth_router
from app.features.chat.router import chat_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# --- FastAPI App ---
def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Chatbot API",
        description="API for interacting with a DeepSeek chatbot.",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["Health"])
    async def health_check() -> dict[str, str]:
        """
        Endpoint to check the API's health status.
        """
        return {"status": "ok"}

    app.include_router(chat_router)
    app.include_router(auth_router)
    return app


app = create_app()
