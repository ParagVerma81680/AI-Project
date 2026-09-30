"""
Policy service — CRUD operations for PolicyDocument.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.policy import PolicyDocument


def get_all_policies(
    db:        Session,
    active_only: bool = True,
    category:  Optional[str] = None,
) -> tuple[List[PolicyDocument], int]:
    query = db.query(PolicyDocument)
    if active_only:
        query = query.filter(PolicyDocument.is_active == True)
    if category:
        query = query.filter(PolicyDocument.category.ilike(f"%{category}%"))
    policies = query.order_by(PolicyDocument.id).all()
    return policies, len(policies)


def get_policy_by_id(db: Session, policy_id: int) -> Optional[PolicyDocument]:
    return db.query(PolicyDocument).filter(PolicyDocument.id == policy_id).first()
