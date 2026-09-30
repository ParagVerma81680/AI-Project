"""
Policies router.

Endpoints:
  GET  /api/policies           — list all active policy documents
  GET  /api/policies/{id}      — get one policy document
  POST /api/policies/ask       — RAG-powered policy Q&A using Claude
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session  import get_db
from app.schemas.policy    import PolicyAskRequest, PolicyAskResponse, PolicyList, PolicyOut, PolicyCreate, PolicyUpdate
from app.models.policy     import PolicyDocument
from app.services          import policy_service
from app.ai.rag_engine     import answer_policy_question

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/policies  — list all policies
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=PolicyList,
    summary="List store policies",
    description="Returns all active store policy documents.",
)
def list_policies(
    category:    Optional[str] = Query(None, description="Filter by category"),
    active_only: bool          = Query(True,  description="Only show active policies"),
    db: Session = Depends(get_db),
):
    policies, total = policy_service.get_all_policies(
        db, active_only=active_only, category=category
    )
    return PolicyList(total=total, policies=policies)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/policies/{id}  — get one
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{policy_id}",
    response_model=PolicyOut,
    summary="Get a policy by ID",
)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = policy_service.get_policy_by_id(db, policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found.",
        )
    return policy


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/policies  — create a new policy (Admin)
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=PolicyOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new store policy (Admin)",
)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    policy = PolicyDocument(
        title=payload.title.strip(),
        category=payload.category.strip() if payload.category else "General",
        content=payload.content.strip(),
        is_active=payload.is_active,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/policies/{policy_id}  — update a policy (Admin)
# ─────────────────────────────────────────────────────────────────────────────

@router.put(
    "/{policy_id}",
    response_model=PolicyOut,
    summary="Update a store policy (Admin)",
)
def update_policy(policy_id: int, payload: PolicyUpdate, db: Session = Depends(get_db)):
    policy = policy_service.get_policy_by_id(db, policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found.",
        )
    if payload.title is not None:
        policy.title = payload.title.strip()
    if payload.category is not None:
        policy.category = payload.category.strip()
    if payload.content is not None:
        policy.content = payload.content.strip()
    if payload.is_active is not None:
        policy.is_active = payload.is_active

    db.commit()
    db.refresh(policy)
    return policy


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/policies/{policy_id}  — delete a policy (Admin)
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a store policy (Admin)",
)
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = policy_service.get_policy_by_id(db, policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID {policy_id} not found.",
        )
    db.delete(policy)
    db.commit()
    return None


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/policies/ask  — RAG-powered Q&A
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/ask",
    response_model=PolicyAskResponse,
    summary="Ask a policy question (AI-powered)",
    description=(
        "Uses Retrieval-Augmented Generation (RAG) to answer customer questions "
        "about store policies. Relevant policy documents are retrieved from the "
        "database and passed to Claude as context. Claude's answer is grounded "
        "in actual store policy — no hallucination."
    ),
)
def ask_policy_question(request: PolicyAskRequest, db: Session = Depends(get_db)):
    result = answer_policy_question(db, question=request.question, top_k=request.top_k)
    return PolicyAskResponse(
        question=request.question,
        answer=result["answer"],
        sources_used=result["sources_used"],
        retrieved_count=result["retrieved_count"],
    )
