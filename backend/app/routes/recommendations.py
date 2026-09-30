"""
Recommendations router.

Endpoints:
  POST /api/recommendations   — AI-powered product recommendations
  GET  /api/recommendations/categories  — list categories for the frontend filter UI
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session        import get_db
from app.schemas.recommendation  import RecommendationRequest, RecommendationResponse
from app.services                import recommendation_service
from app.models.category         import Category

router = APIRouter()


@router.post(
    "/",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get AI product recommendations",
    description=(
        "Describe what you are looking for in plain language and optionally set a budget. "
        "Claude analyses the store inventory and recommends the best matching products "
        "with personalised explanations. Only products actually in stock are recommended."
    ),
)
def recommend_products(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
):
    return recommendation_service.get_recommendations(db, request)


@router.get(
    "/categories",
    summary="List product categories",
    description="Returns all product categories — used by the frontend recommendation form.",
)
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.id).all()
    return [{"id": c.id, "name": c.name} for c in cats]
