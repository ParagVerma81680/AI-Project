"""
Pydantic schemas for the AI Recommendations resource.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RecommendationRequest(BaseModel):
    """
    Request body for POST /api/recommendations.
    The customer describes what they want — Claude picks products for them.
    """
    preferences: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="What the customer is looking for, dietary needs, occasion, etc.",
        examples=["I want healthy snacks for my kids' school lunchbox under Rs. 100"],
    )
    budget: Optional[float] = Field(
        None, ge=0,
        description="Maximum budget in Rs. (optional).",
        examples=[200.0],
    )
    category_ids: Optional[List[int]] = Field(
        None,
        description="Limit recommendations to specific category IDs (optional).",
        examples=[[4, 5]],
    )
    max_results: int = Field(
        5, ge=1, le=10,
        description="Maximum number of products to recommend (1-10).",
    )


class RecommendedProduct(BaseModel):
    """A single AI-recommended product with Claude's explanation."""
    id:          int
    name:        str
    brand:       Optional[str]
    price:       float
    aisle:       Optional[str]
    shelf:       Optional[str]
    category:    Optional[str]
    stock:       int
    explanation: str    # Why Claude recommended this product

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    """Full response from POST /api/recommendations."""
    preferences:      str
    budget:           Optional[float]
    recommendations:  List[RecommendedProduct]
    total_found:      int
    ai_summary:       str    # Claude's overall shopping advice / intro paragraph
