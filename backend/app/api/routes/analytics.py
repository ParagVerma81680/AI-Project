from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.database.models import Product, Conversation, Message, AIActivityLog, AIMemory, KnowledgeBase
from app.ai.tool_router import tool_router

router = APIRouter(prefix="/analytics", tags=["Store & AI Analytics"])

@router.get("", summary="Retrieve real-time store and AI metrics")
def get_analytics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    store_stats = tool_router.get_store_analytics(db)
    total_convs = db.query(func.count(Conversation.id)).scalar() or 0
    total_msgs = db.query(func.count(Message.id)).scalar() or 0
    total_memories = db.query(func.count(AIMemory.id)).scalar() or 0
    total_kb_articles = db.query(func.count(KnowledgeBase.id)).scalar() or 0
    total_activities = db.query(func.count(AIActivityLog.id)).scalar() or 0

    return {
        **store_stats,
        "ai_metrics": {
            "total_conversations": total_convs,
            "total_messages": total_msgs,
            "saved_user_memories": total_memories,
            "knowledge_base_articles": total_kb_articles,
            "logged_ai_activities": total_activities,
            "neural_engine": "Meta Llama (3.3 70B / Ollama 3.1)"
        }
    }
