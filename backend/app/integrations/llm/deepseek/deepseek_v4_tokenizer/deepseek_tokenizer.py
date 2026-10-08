# pip3 install transformers
# python3 deepseek_tokenizer.py
from pathlib import Path

import transformers

chat_tokenizer_dir = Path(__file__).resolve().parent

tokenizer = transformers.AutoTokenizer.from_pretrained(
    chat_tokenizer_dir, trust_remote_code=True
)

result = tokenizer.encode("Hello!")
print(result)
