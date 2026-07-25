import os
from dataclasses import dataclass

from dotenv import load_dotenv

# 该文件用于读取和校验环境变量
load_dotenv()  # Load environment variables from .env file


@dataclass(frozen=True)
class Settings:
    DEEPSEEK_API_KEY: str
    DEEPSEEK_API_URL: str
    DEEPSEEK_MODEL: str
    DATABASE_URL: str
    frontend_origin: str


def get_settings() -> Settings:
    return Settings(
        DEEPSEEK_API_KEY=os.getenv("DEEPSEEK_API_KEY", "").strip(),
        DEEPSEEK_API_URL=os.getenv("DEEPSEEK_API_URL", "").strip(),
        DEEPSEEK_MODEL=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        DATABASE_URL=os.getenv("DATABASE_URL", "").strip(),
        frontend_origin=os.getenv(
            "FRONTEND_ORIGIN",
            "http://localhost:5173",
        ),
    )


settings = get_settings()
