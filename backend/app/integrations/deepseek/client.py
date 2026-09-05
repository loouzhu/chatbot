import httpx
from app.core.config import settings


class DeepSeekError(Exception):
    pass


# 作用是负责与DeepSeek通信
class DeepSeekClient:
    pass
