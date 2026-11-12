from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user
from app.database.models import User, Conversation, Message
from app.schemas.chat import ConversationOut, ConversationSummary

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationSummary], summary="Retrieve conversations list")
def list_conversations(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Conversation)
    if current_user:
        query = query.filter(Conversation.user_id == current_user.id)
    else:
        # For guest, return recent guest conversations
        query = query.filter(Conversation.user_id == None)

    convs = query.order_by(Conversation.updated_at.desc()).limit(20).all()
    summaries = []
    for c in convs:
        msg_count = db.query(Message).filter(Message.conversation_id == c.id).count()
        summaries.append(ConversationSummary(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=msg_count
        ))
    return summaries

@router.get("/{conversation_id}", response_model=ConversationOut, summary="Get conversation messages")
def get_conversation(
    conversation_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # User isolation check
    if conv.user_id and current_user and conv.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation")

    return conv

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete conversation")
def delete_conversation(
    conversation_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if conv.user_id and current_user and conv.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation")

    db.delete(conv)
    db.commit()
    return None
