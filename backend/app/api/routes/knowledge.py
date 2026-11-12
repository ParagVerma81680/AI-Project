from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user, require_admin_user
from app.database.models import User, KnowledgeBase
from app.schemas.knowledge import KnowledgeOut, KnowledgeList, KnowledgeCreate, KnowledgeUploadResponse
from app.services.knowledge_service import knowledge_service
from app.ai.embeddings import embedding_service

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & Document Ingestion"])

@router.get("", response_model=KnowledgeList, summary="List knowledge base articles")
def list_knowledge(
    category: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(KnowledgeBase)
    if category:
        q = q.filter(KnowledgeBase.category == category)
    items = q.order_by(KnowledgeBase.updated_at.desc()).limit(limit).all()
    return KnowledgeList(total=len(items), items=items)

@router.post("", response_model=KnowledgeOut, status_code=status.HTTP_201_CREATED, summary="Create knowledge entry")
def create_knowledge_entry(
    payload: KnowledgeCreate,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    emb = embedding_service.embed_text(f"{payload.title}\n{payload.content}")
    kb = KnowledgeBase(
        title=payload.title,
        content=payload.content,
        category=payload.category or "General",
        source=payload.source or "manual",
        embedding=emb
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)
    return kb

@router.post("/upload", response_model=KnowledgeUploadResponse, summary="Upload document (PDF, TXT, CSV, MD) to Knowledge Base")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("General"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingests PDF, TXT, MD, or CSV documents into the vector Knowledge Base.
    Extracts text, creates overlapping semantic chunks, embeds them, and saves to database.
    """
    user_id = current_user.id if current_user else None
    try:
        chunks_created, filename = await knowledge_service.ingest_file(
            db=db,
            file=file,
            category=category,
            user_id=user_id
        )
        return KnowledgeUploadResponse(
            filename=filename,
            chunks_created=chunks_created,
            category=category,
            status="success"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document ingestion failed: {str(e)}"
        )

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete knowledge article")
def delete_knowledge(
    item_id: int,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    item = db.query(KnowledgeBase).filter(KnowledgeBase.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge item not found")
    db.delete(item)
    db.commit()
    return None
