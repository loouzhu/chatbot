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
    ALIBABA_CLOUD_ACCESS_KEY_ID: str
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: str
    ALIYUN_DM_ACCOUNT: str
    ALIYUN_DM_ENDPOINT: str
    REDIS_HOST: str
    REDIS_PORT: int
    frontend_origin: str


def get_settings() -> Settings:
    return Settings(
        DEEPSEEK_API_KEY=os.getenv("DEEPSEEK_API_KEY", "").strip(),
        DEEPSEEK_API_URL=(
            os.getenv("DEEPSEEK_API_URL") or os.getenv("DEEPSEEK_BASE_URL", "")
        ).strip(),
        DEEPSEEK_MODEL=os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip(),
        DATABASE_URL=os.getenv("DATABASE_URL", "").strip(),
        ALIBABA_CLOUD_ACCESS_KEY_ID=os.getenv(
            "ALIBABA_CLOUD_ACCESS_KEY_ID", ""
        ).strip(),
        ALIBABA_CLOUD_ACCESS_KEY_SECRET=os.getenv(
            "ALIBABA_CLOUD_ACCESS_KEY_SECRET", ""
        ).strip(),
        ALIYUN_DM_ACCOUNT=os.getenv("ALIYUN_DM_ACCOUNT", "").strip(),
        ALIYUN_DM_ENDPOINT=os.getenv("ALIYUN_DM_ENDPOINT", "").strip(),
        REDIS_HOST=os.getenv("REDIS_HOST", "localhost").strip(),
        REDIS_PORT=int(os.getenv("REDIS_PORT", 6379)),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip(),
    )


settings = get_settings()
