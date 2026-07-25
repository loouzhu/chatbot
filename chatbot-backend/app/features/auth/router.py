from app.db.session import get_db
from app.features.auth.schemas import (
    RegisterRequest,
    RegisterResponse,
    SendEmailRequest,
)
from app.features.auth.service import register_user, send_verify_code
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/verify_code")
async def verify_code(request: SendEmailRequest):
    await send_verify_code(request)


@auth_router.post(
    "/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse
)
async def register(
    request: RegisterRequest, db: Session = Depends(get_db)
) -> RegisterResponse:
    return await register_user(request, db)
