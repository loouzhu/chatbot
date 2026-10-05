from app.core.config import settings
from sqlalchemy import text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import create_async_engine


def _async_database_url(database_url: URL) -> URL:
    if database_url.drivername == "mysql+pymysql":
        return database_url.set(drivername="mysql+aiomysql")
    if database_url.drivername == "postgresql":
        return database_url.set(drivername="postgresql+asyncpg")
    return database_url


async def create_database_if_missing() -> None:
    database_url = _async_database_url(make_url(settings.DATABASE_URL))
    database_name = database_url.database
    if not database_name:
        raise ValueError("DATABASE_URL must include a database name")

    # SQLAlchemy's URL.set() ignores None; an empty database path connects
    # to the MySQL server without selecting the not-yet-created database.
    server_url = database_url.set(database="")
    server_engine = create_async_engine(server_url, isolation_level="AUTOCOMMIT")
    try:
        async with server_engine.connect() as connection:
            if database_url.drivername.startswith("mysql+"):
                await connection.execute(
                    text(
                        "CREATE DATABASE IF NOT EXISTS "
                        f"`{database_name}` CHARACTER SET utf8mb4 "
                        "COLLATE utf8mb4_unicode_ci"
                    )
                )
            elif database_url.drivername.startswith("postgresql+"):
                await connection.execute(text(f'CREATE DATABASE "{database_name}"'))
    finally:
        await server_engine.dispose()


async def init_db() -> None:
    """Create the database; Alembic is responsible for creating its tables."""
    await create_database_if_missing()


if __name__ == "__main__":
    import asyncio

    asyncio.run(init_db())
    print("Database created successfully. Run `alembic upgrade head` for tables.")
