from asyncio.log import logger
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import AppException
from app.db.init_db import init_db
from app.features.auth.router import auth_router
from app.features.chat.router import chat_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


# --- FastAPI App ---
@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Chatbot API",
        description="API for interacting with a DeepSeek chatbot.",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exception: AppException):
        logger.error(f"AppException: {exception.message}", exc_info=True)
        return JSONResponse(
            status_code=exception.status_code,
            content={
                "message": exception.message,
                "code": exception.code,
                "status_code": exception.status_code,
            },
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
