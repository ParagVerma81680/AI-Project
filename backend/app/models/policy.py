"""
PolicyDocument ORM model.

Each row is one store policy document (e.g. "Return Policy", "Loyalty Program").
These documents form the RAG knowledge base — they are retrieved and sent
to Claude when a customer asks a policy-related question.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.database.session import Base


class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(200), nullable=False, index=True)
    category    = Column(String(100), nullable=True, index=True)   # e.g. "Returns", "Payment"
    content     = Column(Text,        nullable=False)               # full policy text
    is_active   = Column(Boolean,     nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<PolicyDocument id={self.id} title={self.title!r}>"
