"""
Pydantic schemas for the Multi-Agent system.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AgentMessage(BaseModel):
    """A single message in the agent dialogue transcript."""
    agent:   str   # "customer_agent" | "store_agent" | "system"
    content: str


class AgentChatRequest(BaseModel):
    """Request body for POST /api/agents/chat."""
    request: str = Field(
        ...,
        min_length=5,
        max_length=600,
        description="The customer's request in natural language.",
        examples=["I need healthy breakfast items for a family of 4 under Rs. 300 total."],
    )


class AgentChatResponse(BaseModel):
    """Full multi-agent dialogue response."""
    customer_request:  str
    transcript:        List[AgentMessage]   # full agent dialogue
    final_answer:      str                  # synthesised customer-facing answer
    agents_involved:   List[str]            # which agents participated
