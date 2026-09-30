"""
Pydantic schemas for the Policy resource.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# ─────────────────────────────────────────────────────────────────────────────
# Policy document schemas
# ─────────────────────────────────────────────────────────────────────────────

class PolicyOut(BaseModel):
    """Single policy document response."""
    id:        int
    title:     str
    category:  Optional[str]
    content:   str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PolicyCreate(BaseModel):
    """Schema for adding a new store policy."""
    title:     str = Field(..., min_length=2, max_length=150, examples=["Exchange & Return Policy"])
    category:  Optional[str] = Field("General", max_length=50, examples=["Customer Service"])
    content:   str = Field(..., min_length=10, examples=["Detailed policy text here..."])
    is_active: bool = Field(True)


class PolicyUpdate(BaseModel):
    """Schema for updating an existing store policy."""
    title:     Optional[str] = None
    category:  Optional[str] = None
    content:   Optional[str] = None
    is_active: Optional[bool] = None


class PolicyList(BaseModel):
    """List of policy documents."""
    total:    int
    policies: List[PolicyOut]


# ─────────────────────────────────────────────────────────────────────────────
# Policy Q&A schemas (RAG)
# ─────────────────────────────────────────────────────────────────────────────

class PolicyAskRequest(BaseModel):
    """Request body for POST /api/policies/ask."""
    question: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="The customer's policy-related question.",
        examples=["Can I return a product after 30 days?"],
    )
    top_k: int = Field(
        3,
        ge=1,
        le=5,
        description="How many policy documents to retrieve as context (1-5).",
    )


class PolicyAskResponse(BaseModel):
    """Response from POST /api/policies/ask."""
    question:        str
    answer:          str
    sources_used:    List[str]   # policy titles Claude used to answer
    retrieved_count: int         # how many policies were retrieved

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "question": "Can I return a product after 30 days?",
                "answer": "Our standard return window is 30 days from the date of purchase...",
                "sources_used": ["Return & Refund Policy"],
                "retrieved_count": 1,
            }]
        }
    }
