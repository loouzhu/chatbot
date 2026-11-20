from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.features.auth.dependence import get_current_user
from app.features.auth.model import User
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

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/verification-code")
async def verify_code(request: SendVerifyCodeRequest):
    return await send_verify_code(request)


@auth_router.post("/user")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register_user(request, db)


@auth_router.post("/session")
async def create_session(
    request: EmailLoginRequest | UsernameLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    if isinstance(request, EmailLoginRequest):
        return await email_login_user(request, db)
    return await username_login_user(request, db)


@auth_router.delete("/session")
async def logout(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await logout_user(user=user, db=db)
