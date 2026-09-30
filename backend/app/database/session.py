"""
Database session management using SQLAlchemy.

SessionLocal  — factory that creates a new session per request
Base          — declarative base for all ORM models
init_db()     — called at startup to create tables
get_db()      — FastAPI dependency that yields a session and closes it
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator

from app.config import settings

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# connect_args={"check_same_thread": False} is required for SQLite only.
# Remove it if you switch to PostgreSQL / MySQL.
# ---------------------------------------------------------------------------

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,          # logs every SQL statement when DEBUG=True
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ---------------------------------------------------------------------------
# Declarative base — all ORM models must inherit from this
# ---------------------------------------------------------------------------

Base = declarative_base()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def init_db() -> None:
    """
    Create all tables that are registered on Base.metadata.
    Models must be imported before create_all() is called.
    """
    # Importing models registers them with Base.metadata
    import app.models  # noqa: F401  (triggers __init__.py which imports all models)

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.

    Usage in a route:
        from app.database.session import get_db
        from sqlalchemy.orm import Session

        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
