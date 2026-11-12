import json
from typing import Dict, Any, AsyncGenerator, Optional
from sqlalchemy.orm import Session

from app.database.models import Conversation, Message, AIActivityLog
from app.ai.llama_service import llama_service
from app.ai.memory_manager import memory_manager
from app.core.logging import logger

class ChatService:
    """Business logic for conversations, message persistence, and AI response generation."""

    async def process_chat(
        self,
        db: Session,
        message_text: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Resolve or create Conversation
        conversation = None
        if conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

        if not conversation:
            # Generate title from first message
            title = message_text[:40] + ("..." if len(message_text) > 40 else "")
            conversation = Conversation(
                user_id=user_id,
                title=title
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Persist User Message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            message_content=message_text,
            model_used="user"
        )
        db.add(user_msg)
        db.commit()

        # 3. Check and Auto-Save User Memory (if user is authenticated)
        if user_id:
            try:
                memory_manager.auto_extract_and_save(db, user_id, message_text)
            except Exception as e:
                logger.warning(f"Memory extraction error: {e}")

        # 4. Generate Llama AI Response
        ai_result = await llama_service.generate_response(
            db=db,
            user_message=message_text,
            conversation_id=conversation.id,
            user_id=user_id,
            session_id=session_id
        )

        # 5. Persist Assistant Message
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            message_content=ai_result["answer"],
            model_used=ai_result["model_used"],
            sources=ai_result.get("sources_used", []),
            token_usage={"memories_applied": ai_result.get("memories_applied", 0)}
        )
        db.add(assistant_msg)

        # 6. Activity Log
        log = AIActivityLog(
            user_id=user_id,
            conversation_id=conversation.id,
            activity_type="chat",
            status="success",
            details={
                "model": ai_result["model_used"],
                "sources_count": len(ai_result.get("sources_used", [])),
                "tool_called": ai_result.get("tool_called")
            }
        )
        db.add(log)
        db.commit()

        return {
            "conversation_id": conversation.id,
            "message": ai_result["answer"],
            "model_used": ai_result["model_used"],
            "sources": ai_result.get("sources_used", []),
            "tool_called": ai_result.get("tool_called")
        }

    async def stream_chat(
        self,
        db: Session,
        message_text: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        # Resolve or create conversation
        conversation = None
        if conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

        if not conversation:
            title = message_text[:40] + ("..." if len(message_text) > 40 else "")
            conversation = Conversation(
                user_id=user_id,
                title=title
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # Persist User Message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            message_content=message_text,
            model_used="user"
        )
        db.add(user_msg)
        db.commit()

        # Emit initial SSE metadata event with conversation_id
        meta_event = {
            "event": "meta",
            "conversation_id": conversation.id
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        full_reply = []
        async for chunk in llama_service.generate_stream_response(
            db=db,
            user_message=message_text,
            conversation_id=conversation.id,
            user_id=user_id
        ):
            full_reply.append(chunk)
            data_event = {"chunk": chunk}
            yield f"data: {json.dumps(data_event)}\n\n"

        complete_text = "".join(full_reply)
        # Persist full assistant response
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            message_content=complete_text,
            model_used="meta-llama"
        )
        db.add(assistant_msg)
        db.commit()

        # Emit done event
        yield f"data: {json.dumps({'event': 'done'})}\n\n"

chat_service = ChatService()
