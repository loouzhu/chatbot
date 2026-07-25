from app.core.expectionos import ValidationException
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6, max_length=64)
    confirm_password: str = Field(..., min_length=6, max_length=64)
    email_code: str

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

    @model_validator(mode="after")
    def validate_confirm_password(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValidationException("两次输入的密码不一致")
        return self

    model_config = {"validate_assignment": True}


class RegisterResponse(BaseModel):
    id: int
    email: str
    username: str
    message: str
