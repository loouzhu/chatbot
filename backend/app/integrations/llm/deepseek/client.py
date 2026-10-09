from app.core.config import settings
from app.integrations.llm.base import LLMException, LLMProvider


class DeepSeekProvider(LLMProvider):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        api_url: str | None = None,
        error_cls: type[LLMException] | None = None,
        context_window: int | None = None,
        max_output_len: int | None = None,
    ):
        super().__init__(
            api_key=api_key or settings.DEEPSEEK_API_KEY,
            model=model or settings.DEEPSEEK_MODEL,
            api_url=api_url or settings.DEEPSEEK_API_URL,
            error_cls=error_cls or LLMException,
            context_window=context_window or settings.DEEPSEEK_CONTEXT_WINDOW,
            max_output_len=max_output_len or settings.DEEPSEEK_MAX_OUTPUT_LEN,
        )
