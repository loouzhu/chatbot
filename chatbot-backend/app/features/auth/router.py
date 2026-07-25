from app.features.auth.schemas import RegisterRequest, RegisterResponse
from app.features.auth.service import register_user
from fastapi import APIRouter, status

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post(
    "/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse
)
async def register(request: RegisterRequest) -> RegisterResponse:
    return await register_user(request)
