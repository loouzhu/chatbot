from app.features.chat.constant import MessageType
from app.features.chat.model import Message
from app.features.chat.schema import ContextInfo
from app.integrations.llm.base import LLMMessage
from app.integrations.llm.deepseek.deepseek_v4_tokenizer.deepseek_tokenizer import (
    get_input_token,
)


def valid_context(messages: list[Message], start: int = 0) -> list[LLMMessage]:
    return [
        LLMMessage(role=message.role, content=message.content)
        for message in messages[start:]
        if message.status == MessageType.COMPLETED
    ]


# 基于context window的上下文控制
def valid_context_with_window(
    messages: list[Message],
    contextWindow: int,
) -> ContextInfo:
    # 此方法在用户有新输入时调用，messages包含用户最新输入
    used_token = 0
    included_message = []
    for message in messages:
        if message.status != MessageType.COMPLETED:
            continue
        curr_message_token = get_input_token(message.content)
        if used_token + curr_message_token > contextWindow:
            break
        used_token += curr_message_token
        included_message.append(LLMMessage(role=message.role, content=message.content))
    rest_token = contextWindow - used_token
    included_message.reverse()
    return ContextInfo(
        messages=included_message,
        used_token=used_token,
        rest_token=rest_token,
    )
