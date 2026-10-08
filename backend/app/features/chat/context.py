from app.features.chat.model import Message
from app.integrations.llm.base import LLMMessage


def valid_context(messages: list[Message], start: int = 0) -> list[LLMMessage]:
    return [
        LLMMessage(role=message.role, content=message.content)
        for message in messages[start:]
        if message.status == "completed"
    ]
