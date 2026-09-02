from app.db.base import Base
from app.db.session import engine

# Import all models so they are registered in Base.metadata.
from app.features.auth import models as auth_models
from app.features.chat import models as chat_models


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")
