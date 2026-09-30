"""
Pydantic schemas for the AI Paradigm Comparison feature.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ComparisonRequest(BaseModel):
    """Request body for POST /api/comparison/run."""
    question: str = Field(
        ...,
        min_length=5,
        max_length=400,
        description="The question to run through all AI paradigms.",
        examples=["Can I return an opened shampoo? What snacks do you have under Rs. 50?"],
    )


class ParadigmResult(BaseModel):
    """Result from one AI paradigm."""
    paradigm:       str            # "rule_based" | "zero_shot" | "rag" | "multi_agent"
    display_name:   str            # Human-readable name
    description:    str            # What this paradigm is / how it works
    answer:         str            # The actual answer produced
    response_time_ms: float        # How long it took (milliseconds)
    sources_used:   List[str]      # Policy names, DB tables, etc. used
    pros:           List[str]      # Advantages of this approach
    cons:           List[str]      # Disadvantages of this approach
    ai_calls_made:  int            # Number of LLM calls (0 for rule-based)


class ComparisonResponse(BaseModel):
    """Full side-by-side comparison response."""
    question:  str
    results:   List[ParadigmResult]
    verdict:   str   # Claude's verdict: which paradigm performed best and why
