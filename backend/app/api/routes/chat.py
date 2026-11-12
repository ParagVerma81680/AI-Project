from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user
from app.database.models import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["AI Chat & Autonomous Assistant"])

@router.post("", response_model=ChatResponse, summary="Send message to AI assistant")
async def chat_endpoint(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends a message to the Meta Llama powered AI assistant.
    Combines:
    - RAG Knowledge Base Retrieval
    - Long-Term User Memories
    - Controlled Database Tools
    - Short-Term Conversation History
    """
    user_id = current_user.id if current_user else None
    result = await chat_service.process_chat(
        db=db,
        message_text=request.message,
        conversation_id=request.conversation_id,
        user_id=user_id,
        session_id=request.session_id
    )
    return ChatResponse(
        conversation_id=result["conversation_id"],
        message=result["message"],
        response=result["message"],
        model_used=result["model_used"],
        sources=result["sources"],
        tool_called=result.get("tool_called")
    )

@router.post("/stream", summary="Stream real-time AI response via SSE")
async def chat_stream_endpoint(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Streams real-time response chunks from Meta Llama via Server-Sent Events (SSE)."""
    user_id = current_user.id if current_user else None
    generator = chat_service.stream_chat(
        db=db,
        message_text=request.message,
        conversation_id=request.conversation_id,
        user_id=user_id,
        session_id=request.session_id
    )
    return StreamingResponse(generator, media_type="text/event-stream")
