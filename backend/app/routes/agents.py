"""
Agents router.

Endpoints:
  POST /api/agents/chat    — run multi-agent dialogue for a customer request
  GET  /api/agents/info    — explain the agent architecture (no AI call)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session  import get_db
from app.schemas.agent     import AgentChatRequest, AgentChatResponse
from app.services          import agent_service

router = APIRouter()


@router.post(
    "/chat",
    response_model=AgentChatResponse,
    summary="Multi-agent customer assistance",
    description=(
        "Runs a full multi-agent dialogue to handle the customer's request. "
        "**Customer Agent** analyses the request and formulates questions. "
        "**Store Agent** answers using real store data (products, policies, routes). "
        "**Customer Agent** then synthesises a final answer. "
        "The full agent transcript is returned so you can see every step."
    ),
)
def agent_chat(request: AgentChatRequest, db: Session = Depends(get_db)):
    return agent_service.run_agent_chat(db, request)


@router.get(
    "/info",
    summary="Agent architecture overview",
    description="Returns a description of the multi-agent system — no AI call needed.",
)
def agent_info():
    return {
        "architecture": "Multi-Agent System (MAS)",
        "paradigm":     "Collaborative Agent-to-Agent Dialogue",
        "agents": [
            {
                "name":        "Customer Agent",
                "role":        "Represents the customer's intent and needs",
                "capabilities": [
                    "Analyses customer requests",
                    "Formulates structured queries for the Store Agent",
                    "Synthesises final customer-facing answers",
                ],
            },
            {
                "name":        "Store Agent",
                "role":        "Represents the store's complete knowledge base",
                "capabilities": [
                    "Queries real product inventory from database",
                    "Retrieves store policies",
                    "Provides store layout and aisle information",
                    "Answers factual questions grounded in real data",
                ],
            },
        ],
        "dialogue_turns": 3,
        "pipeline": [
            "Turn 1: Customer Agent analyses request → asks Store Agent questions",
            "Turn 2: Store Agent queries DB → answers with factual store data",
            "Turn 3: Customer Agent synthesises → final answer for customer",
        ],
    }
