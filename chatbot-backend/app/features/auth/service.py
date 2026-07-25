from app.core.exceptions import AppException
from app.core.security import hash_password
from app.features.auth.repository import AuthRepository
from app.features.auth.schemas import RegisterRequest, RegisterResponse


class AuthException(AppException):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, status_code)


async def send_code() -> int:
    return 1


async def register_user(request: RegisterRequest, db) -> RegisterResponse:
    try:
        repository = AuthRepository(db)
        username = request.username
        email = str(request.email)
        password_hash = hash_password(request.password)
        verify_code = await send_code()

        if repository.get_user_by_email(request.email):
            raise AuthException("邮箱已被注册")

        if repository.get_user_by_username(request.username):
            raise AuthException("用户名已被占用")

        if request.verify_code != str(verify_code):
            raise AuthException("验证码不正确")

        user = repository.create_user(
            email=email,
            username=username,
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


# async def login_user(request:LoginRequest) -> LoginResponse:
