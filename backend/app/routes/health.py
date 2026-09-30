"""
Health-check router.

GET /api/health
Returns a simple JSON object confirming the API is alive.
"""

from fastapi import APIRouter
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
