# pip3 install transformers
# python3 deepseek_tokenizer.py
from math import ceil
from pathlib import Path

import transformers

chat_tokenizer_dir = Path(__file__).resolve().parent

tokenizer = transformers.AutoTokenizer.from_pretrained(
    chat_tokenizer_dir, trust_remote_code=True
)


def get_input_token(text: str) -> int:
    # The bundled tokenizer drops some Unicode text entirely (for example,
    # "你好" encodes to []). Keep a conservative byte-based estimate so
    # context selection never treats such text as free.
    return max(len(tokenizer.encode(text)), ceil(len(text.encode("utf-8")) / 2))
