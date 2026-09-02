from app.core.config import settings
from app.features.chat.llm.base import LLMProvider


class DeepSeekError(Exception):
    pass


class DeepSeekProvider(LLMProvider):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        api_url: str | None = None,
        error_cls: type[Exception] | None = None,
    ):
        super().__init__(
            api_key=api_key or settings.DEEPSEEK_API_KEY,
            model=model or settings.DEEPSEEK_MODEL,
            api_url=api_url or settings.DEEPSEEK_API_URL,
            error_cls=error_cls or DeepSeekError,
        )
