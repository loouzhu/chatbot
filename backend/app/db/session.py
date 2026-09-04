from collections.abc import AsyncGenerator

from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=True,  # 调试时可以开启SQL日志
    pool_pre_ping=True,  # 连接池健康检查
)

# 2. 创建异步session工厂
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # 提交后不过期对象
    autoflush=False,
)


# 3. 异步依赖注入
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
