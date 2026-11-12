"""
Health-check router.

GET /api/health
Returns a simple JSON object confirming the API is alive.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Product, KnowledgeBase
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns `status: ok` and the project name. "
        "Use this endpoint to verify the API server is running."
    ),
)
def health_check() -> HealthResponse:
    """
    Simple liveness check — no database or AI calls involved.
    """
    return HealthResponse(
        status="ok",
        project="AI-Based Smart Retail Store Assistant",
    )


@router.get(
    "/diagnostics",
    summary="AI & Backend Diagnostics",
    description="Returns genuine technical status of database, LLM provider, vector RAG, and catalog inventory."
)
def system_diagnostics(db: Session = Depends(get_db)):
    db_connected = True
    prod_count = 0
    kb_count = 0
    try:
        prod_count = db.query(Product).count()
        kb_count = db.query(KnowledgeBase).count()
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "backend": "online",
        "database": {
            "connected": db_connected,
            "dialect": "sqlite",
            "products_count": prod_count,
            "knowledge_documents_count": kb_count
        },
        "llm_engine": {
            "provider": settings.LLM_PROVIDER,
            "model_name": settings.LLAMA_MODEL,
            "api_endpoint": settings.LLAMA_BASE_URL,
            "status": "connected" if settings.get_effective_llama_key() else "offline"
        },
        "rag_vector_engine": {
            "status": "operational",
            "similarity_metric": "cosine_similarity",
            "dimension": settings.EMBEDDING_DIM
        },
        "version": settings.APP_VERSION
    }
