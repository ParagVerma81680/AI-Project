import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.models import AIMemory
from app.ai.embeddings import embedding_service
from app.core.logging import logger

class MemoryManager:
    """
    Manages Long-Term Memory for authenticated users.
    Ensures user isolation, semantic retrieval, and automatic preference saving.
    """
    MEMORY_TRIGGERS = [
        (r"\b(?:i am|i'm|i follow|my diet is)\s+(vegan|vegetarian|keto|gluten[- ]free|halal|kosher)\b", "dietary"),
        (r"\b(?:i am allergic to|i have an allergy to)\s+([\w\s]+)", "allergy"),
        (r"\b(?:my budget is|under|less than)\s+(\$\d+|\d+\s*dollars)\b", "budget"),
        (r"\b(?:i like|i prefer|i love|my favorite is)\s+([\w\s]+)", "preference"),
    ]

    def get_relevant_memories(self, db: Session, user_id: int, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not user_id:
            return []

        user_memories = db.query(AIMemory).filter(AIMemory.user_id == user_id).all()
        if not user_memories:
            return []

        query_embedding = embedding_service.embed_text(query)
        scored = []
        for m in user_memories:
            if m.embedding:
                sim = embedding_service.cosine_similarity(query_embedding, m.embedding)
            else:
                sim = 0.5
            scored.append((sim, m))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": m.id,
                "memory_type": m.memory_type,
                "memory_content": m.memory_content,
                "importance_score": m.importance_score,
                "similarity": round(sim, 3)
            }
            for sim, m in scored[:top_k]
        ]

    def auto_extract_and_save(self, db: Session, user_id: int, user_message: str) -> Optional[AIMemory]:
        """Scans user message for explicit persistent preferences to remember."""
        if not user_id or not user_message:
            return None

        msg_lower = user_message.lower()
        extracted_content = None
        extracted_type = "preference"

        for pattern, m_type in self.MEMORY_TRIGGERS:
            match = re.search(pattern, msg_lower)
            if match:
                extracted_content = f"User preference noted: {match.group(0).strip().capitalize()}"
                extracted_type = m_type
                break

        if not extracted_content:
            return None

        # Check for duplicate memory
        existing = db.query(AIMemory).filter(
            AIMemory.user_id == user_id,
            AIMemory.memory_content == extracted_content
        ).first()
        if existing:
            return existing

        emb = embedding_service.embed_text(extracted_content)
        new_memory = AIMemory(
            user_id=user_id,
            memory_type=extracted_type,
            memory_content=extracted_content,
            embedding=emb,
            importance_score=0.8
        )
        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)
        logger.info(f"Saved new AI memory for user {user_id}: {extracted_content}")
        return new_memory

    def delete_memory(self, db: Session, user_id: int, memory_id: int) -> bool:
        memory = db.query(AIMemory).filter(
            AIMemory.id == memory_id,
            AIMemory.user_id == user_id
        ).first()
        if memory:
            db.delete(memory)
            db.commit()
            return True
        return False

memory_manager = MemoryManager()
