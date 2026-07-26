from app.core.exceptions import AppException
from app.db.session import get_db
from app.features.auth.schemas import (
    RegisterRequest,
    RegisterResponse,
    SendVerifyCodeRequest,
    SendVerifyCodeResponse,
)
from app.features.auth.service import register_user, send_verify_code
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/verify_code", response_model=SendVerifyCodeResponse)
async def verify_code(request: SendVerifyCodeRequest):
    try:
        return await send_verify_code(request)
    except AppException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.message, "code": exc.code},
        )


@auth_router.post(
    "/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse
)
async def register(
    request: RegisterRequest, db: Session = Depends(get_db)
) -> RegisterResponse:
    try:
        return await register_user(request, db)
    except AppException as exc:
        raise JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.message, "code": exc.code},
        ) from exc
