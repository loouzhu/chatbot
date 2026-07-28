from app.core.exceptions import ValidationException
from app.integrations.deepseek.client import DeepSeekClient


class ChatService:
    def __init__(self, deepseek_client: DeepSeekClient):
        self.deepseek_client = deepseek_client


async def send_message(user_message: str) -> str:
    message = user_message.strip()
    deepseek_client = DeepSeekClient()
    if not message:
        raise ValidationException("发送内容不能为空")
    return await deepseek_client.ask(message)
