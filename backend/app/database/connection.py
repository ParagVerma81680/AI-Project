from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

def init_db() -> None:
    """Initializes tables and extensions (e.g. pgvector on PostgreSQL)."""
    # Try enabling pgvector if on PostgreSQL
    if "postgresql" in settings.DATABASE_URL.lower():
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("PostgreSQL pgvector extension verified/enabled.")
        except Exception as e:
            logger.warning(f"Note: pgvector extension check: {e}")

    # Import all models to register with Base.metadata
    import app.database.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified and created.")

    # Run initial seed if needed
    from app.database.seed import seed_initial_data
    seed_initial_data()

def get_db() -> Generator[Session, None, None]:
    """FastAPI session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
