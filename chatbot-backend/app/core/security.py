from passlib.context import CryptContext


# 密码加密
def hash_code(code: str) -> str:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(code)
