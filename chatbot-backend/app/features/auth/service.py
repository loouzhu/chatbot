from app.core.expectionos import AppException
from app.db.session import SessionLocal
from app.features.auth.repository import AuthRepository
from app.features.auth.schemas import RegisterRequest, RegisterResponse
from passlib.context import CryptContext


class authException(AppException):
    pass


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def register_user(request: RegisterRequest) -> RegisterResponse:
    db = SessionLocal()
    try:
        repository = AuthRepository(db)

        if repository.get_user_by_email(request.email):
            raise authException("邮箱已被注册")

        if repository.get_user_by_username(request.username):
            raise authException("用户名已被占用")

        password_hash = pwd_context.hash(request.password)
        user = repository.create_user(
            email=str(request.email),
            username=request.username,
            password_hash=password_hash,
        )

        return RegisterResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            message="注册成功",
        )
    finally:
        db.close()
