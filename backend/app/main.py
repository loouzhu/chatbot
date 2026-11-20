import logging
from collections.abc import Mapping

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.core.config import settings
from app.core.exceptions import AppException
from app.features.auth.router import auth_router
from app.features.chat.router import chat_router

logger = logging.getLogger(__name__)


def error_response(
    error: AppException, headers: Mapping[str, str] | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        headers=headers,
        content={
            "message": error.message,
            "code": error.code,
            "status_code": error.status_code,
        },
    )


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Chatbot API",
        description="API for interacting with a chatbot.",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exception: AppException):
        if exception.status_code >= 500:
            logger.error("AppException: %s", exception.message, exc_info=True)
            return error_response(AppException("服务器内部错误", "INTERNAL_ERROR", 500))
        return error_response(exception)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exception: HTTPException):
        if exception.status_code >= 500:
            message = "服务器内部错误"
        elif isinstance(exception.detail, str):
            message = exception.detail
        else:
            message = "请求失败"
        return error_response(
            AppException(message, "HTTP_ERROR", exception.status_code),
            headers=exception.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, _exception: RequestValidationError
    ):
        return error_response(AppException("请求参数不正确", "VALIDATION_ERROR", 422))

    @app.exception_handler(Exception)
    async def unexpected_exception_handler(_request: Request, exception: Exception):
        logger.exception("Unhandled request error: %s", exception)
        return error_response(AppException("服务器内部错误", "INTERNAL_ERROR", 500))

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
