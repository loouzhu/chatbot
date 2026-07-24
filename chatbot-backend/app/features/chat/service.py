from app.integrations.deepseek.client import DeepSeekClient


class ChatService:
    def __init__(self, deepseek_client: DeepSeekClient):
        self.deepseek_client = deepseek_client

    async def send_message(self, user_message: str) -> str:
        message = user_message.strip()
        if not message:
            raise ValueError("发送内容不能为空")
        return await self.deepseek_client.generate_response(message)
