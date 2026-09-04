from app.core.exceptions import AppException
from app.db.session import get_db
from app.features.auth.schemas import (
    EmailLoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    SendVerifyCodeRequest,
    SendVerifyCodeResponse,
    UsernameLoginRequest,
)
from app.features.auth.service import (
    email_login_user,
    register_user,
    send_verify_code,
    username_login_user,
)
from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/verify_code", response_model=SendVerifyCodeResponse)
async def verify_code(
    request: SendVerifyCodeRequest,
) -> Response | SendVerifyCodeResponse:
    try:
        return await send_verify_code(request)
    except AppException as exc:
        return JSONResponse(
            status_code=400,
            content={"message": exc.message, "code": exc.code},
        )


@auth_router.post(
    "/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse
)
async def register(
    request: RegisterRequest, db: Session = Depends(get_db)
) -> Response | RegisterResponse:
    try:
        return await register_user(request, db)
    except AppException as exc:
        return JSONResponse(
            status_code=400,
            content={"message": exc.message, "code": exc.code},
        )


@auth_router.post("/login/email", response_model=LoginResponse)
async def email_login(
    request: EmailLoginRequest, db: Session = Depends(get_db)
) -> Response | LoginResponse:
    try:
        return await email_login_user(request, db)
    except AppException as exc:
        return JSONResponse(
            status_code=400,
            content={"message": exc.message, "code": exc.code},
        )


@auth_router.post(
    "/login/username",
    response_model=LoginResponse,
)
async def username_login(
    request: UsernameLoginRequest, db: Session = Depends(get_db)
) -> Response | LoginResponse:
    try:
        return await username_login_user(request, db)
    except AppException as exc:
        return JSONResponse(
            status_code=400,
            content={"message": exc.message, "code": exc.code},
        )
