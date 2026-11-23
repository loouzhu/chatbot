from fastapi import APIRouter

rag_router = APIRouter(prefix="/rag", tags=["Rag"])


@rag_router.post("", response_model=None)
async def upload_file(address: str): ...


@rag_router.post("", response_model=None)
async def modify_file(address: str): ...


@rag_router.delete("", response_model=None)
async def delete_file(): ...
