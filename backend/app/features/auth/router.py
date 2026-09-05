from app.db.session import get_db
from app.features.auth.schemas import (
    EmailLoginRequest,
    RegisterRequest,
    SendVerifyCodeRequest,
    UsernameLoginRequest,
)
from app.features.auth.service import (
    email_login_user,
    logout_user,
    register_user,
    send_verify_code,
    username_login_user,
)
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/verify_code")
async def verify_code(request: SendVerifyCodeRequest):
    return await send_verify_code(request)


@auth_router.post("/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register_user(request, db)


@auth_router.post("/login/email")
async def email_login(request: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    return await email_login_user(request, db)


@auth_router.post("/login/username")
async def username_login(
    request: UsernameLoginRequest, db: AsyncSession = Depends(get_db)
):
    return await username_login_user(request, db)


@auth_router.post("/logout")
async def logout(user_id: str, db: AsyncSession = Depends(get_db)):
    return await logout_user(user_id=user_id, db=db)
