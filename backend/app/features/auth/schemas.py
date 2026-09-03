from enum import Enum

from app.core.exceptions import ValidationException
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6, max_length=64)
    confirm_password: str = Field(..., min_length=6, max_length=64)
    verify_code: str = Field(..., min_length=6, max_length=6)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3 or len(v) > 20:
            raise ValidationException("用户名长度应为3-20个字符")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6 or len(v) > 64:
            raise ValidationException("密码长度应为6-64个字符")
        return v

    # 跨字段验证使用model_validator
    @model_validator(mode="after")
    def validate_confirm_password(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValidationException("两次输入的密码不一致")
        return self

    model_config = {"validate_assignment": True}


class RegisterResponse(BaseModel):
    message: str
    code: str = "SUCCESS"


class EmailLoginRequest(BaseModel):
    email: EmailStr
    verify_code: str = Field(..., min_length=6, max_length=6)


class EmailLoginResponse(BaseModel):
    message: str
    code: str = "SUCCESS"


class UsernameLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6, max_length=64)


class UsernameLoginResponse(BaseModel):
    message: str
    code: str = "SUCCESS"


class Purpose(str, Enum):
    REGISTER = "register"
    LOGIN = "login"


class SendVerifyCodeRequest(BaseModel):
    email: EmailStr
    username: str
    code: str
    purpose: Purpose


class SendVerifyCodeResponse(BaseModel):
    message: str
    code: str = "SUCCESS"
