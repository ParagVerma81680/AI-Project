from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_current_user
from app.database.models import User, AIMemory
from app.schemas.memory import MemoryOut, MemoryList, MemoryCreate
from app.ai.embeddings import embedding_service
from app.ai.memory_manager import memory_manager

router = APIRouter(prefix="/memory", tags=["AI Long-Term Memory"])

@router.get("", response_model=MemoryList, summary="Retrieve saved AI memories for user")
def list_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memories = db.query(AIMemory).filter(
        AIMemory.user_id == current_user.id
    ).order_by(AIMemory.updated_at.desc()).all()

    return MemoryList(total=len(memories), memories=memories)

@router.post("", response_model=MemoryOut, status_code=status.HTTP_201_CREATED, summary="Explicitly save a memory")
def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emb = embedding_service.embed_text(payload.memory_content)
    mem = AIMemory(
        user_id=current_user.id,
        memory_type=payload.memory_type,
        memory_content=payload.memory_content,
        embedding=emb,
        importance_score=payload.importance_score
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem

@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a saved memory")
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = memory_manager.delete_memory(db, current_user.id, memory_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found or access denied")
    return None
