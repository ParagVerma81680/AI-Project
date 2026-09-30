"""
Comparison router.

Endpoints:
  POST /api/comparison/run     — run question through all 4 AI paradigms
  GET  /api/comparison/paradigms  — return static paradigm metadata (no AI)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session      import get_db
from app.schemas.comparison    import ComparisonRequest, ComparisonResponse
from app.services              import comparison_service
from app.services.comparison_service import PARADIGM_META

router = APIRouter()


@router.post(
    "/run",
    response_model=ComparisonResponse,
    summary="Run AI paradigm comparison",
    description=(
        "Sends the same question through four different AI paradigms — "
        "Rule-Based, Zero-Shot LLM, RAG, and Multi-Agent — and compares "
        "their answers, speed, and sources. Also generates an AI verdict "
        "on which performed best. Makes up to 6 Claude API calls total."
    ),
)
def run_comparison(request: ComparisonRequest, db: Session = Depends(get_db)):
    return comparison_service.run_comparison(db, request)


@router.get(
    "/paradigms",
    summary="List AI paradigms",
    description="Returns metadata about each AI paradigm — no AI call required.",
)
def list_paradigms():
    return [
        {"id": key, **meta}
        for key, meta in PARADIGM_META.items()
    ]
