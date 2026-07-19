from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings, is_supabase_transaction_pooler

settings = get_settings()

_engine_kwargs: dict = {
    "pool_pre_ping": True,
    "pool_size": 5,
    "max_overflow": 10,
}

# Transaction pooler (port 6543) does not support prepared statements well.
if is_supabase_transaction_pooler(settings.database_url):
    _engine_kwargs["pool_size"] = 3
    _engine_kwargs["max_overflow"] = 0
    _engine_kwargs["connect_args"] = {
        "prepare_threshold": None,
    }

engine = create_engine(settings.database_url, **_engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
