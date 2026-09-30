"""
Agent service — orchestrates the Customer ↔ Store agent dialogue.

Full pipeline (3 Claude calls):

  Turn 1: Customer Agent analyses the request → formulates questions
  Turn 2: Store Agent answers those questions using real DB data
  Turn 3: Customer Agent synthesises answers → final response for user

Each turn is logged into a transcript so the full agent dialogue
is visible in the API response (great for your college demo!).
"""

from sqlalchemy.orm import Session

from app.schemas.agent         import AgentChatRequest, AgentChatResponse, AgentMessage
from app.ai.agents.customer_agent import analyse_request, synthesise_response
from app.ai.agents.store_agent    import answer_questions


def run_agent_chat(db: Session, request: AgentChatRequest) -> AgentChatResponse:
    """
    Run a full multi-agent dialogue for the customer's request.

    Args:
        db:      Database session (passed to Store Agent for DB queries).
        request: AgentChatRequest with the customer's natural-language request.

    Returns:
        AgentChatResponse with full transcript + synthesised final answer.
    """
    transcript: list[AgentMessage] = []

    # ── Turn 1: Customer Agent analyses request ──────────────────────────────
    transcript.append(AgentMessage(
        agent="system",
        content=f'Customer request received: "{request.request}"',
    ))

    questions = analyse_request(request.request)

    transcript.append(AgentMessage(
        agent="customer_agent",
        content=questions,
    ))

    # ── Turn 2: Store Agent answers questions ────────────────────────────────
    store_answers = answer_questions(
        db=db,
        questions=questions,
        customer_request=request.request,
    )

    transcript.append(AgentMessage(
        agent="store_agent",
        content=store_answers,
    ))

    # ── Turn 3: Customer Agent synthesises final answer ──────────────────────
    final_answer = synthesise_response(
        customer_request=request.request,
        questions_asked=questions,
        store_response=store_answers,
    )

    transcript.append(AgentMessage(
        agent="customer_agent",
        content=f"[Final Answer for Customer]\n{final_answer}",
    ))

    return AgentChatResponse(
        customer_request=request.request,
        transcript=transcript,
        final_answer=final_answer,
        agents_involved=["customer_agent", "store_agent"],
    )
