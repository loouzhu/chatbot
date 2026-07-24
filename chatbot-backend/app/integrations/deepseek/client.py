import httpx
from app.core.config import settings


class DeepSeekError(Exception):
    pass


# 作用是负责与DeepSeek通信
class DeepSeekClient:
    async def ask(
        self,
        message: str,
    ) -> str:
        if not settings.DEEPSEEK_API_KEY:
            raise DeepSeekError("缺少APIKey")
        payload = {
            "model": settings.DEEPSEEK_MODEL,
            "message": [{"role": "user", "content": message}],
            "temperature": 0.7,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer{settings.DEEPSEEK_API_KEY}",
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    settings.DEEPSEEK_API_URL,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                body = response.json()
                # as exc 用于获取异常对象
        except httpx.HTTPStatusError as exc:
            raise DeepSeekError(
                f"DeepSeek请求失败，错误码：{exc.response.status_code}"
            ) from exc
            # from exc 用于保留异常上下文形成异常链
        except httpx.RequestError as exc:
            raise DeepSeekError("连接DeepSeek失败") from exc
        try:
            return body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise DeepSeekError("DeepSeek回复失败") from exc
