from typing import Dict, Any, AsyncGenerator, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.ai.llm_provider import get_llm_provider
from app.ai.context_manager import context_manager

class LlamaService:
    """High-level service coordinating Llama reasoning, streaming, and database context."""

    async def generate_response(
        self,
        db: Session,
        user_message: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Build unified context
        ctx = context_manager.assemble_context(
            db=db,
            user_message=user_message,
            conversation_id=conversation_id,
            user_id=user_id,
            session_id=session_id
        )

        provider = get_llm_provider()
        model_name = provider.get_model_name()

        try:
            raw_reply = await provider.generate(
                messages=ctx["messages"],
                temperature=0.6,
                max_tokens=1500
            )
        except Exception as e:
            logger.error(f"Llama generation error: {e}")
            if ctx.get("tool_result"):
                raw_reply = f"Verified Store Record:\n{ctx['tool_result']}"
            elif ctx.get("rag_hits"):
                top_hit = ctx["rag_hits"][0]
                raw_reply = f"From SmartMart Knowledge Base ({top_hit['title']}):\n{top_hit['content']}"
            else:
                raw_reply = (
                    "I apologize, but I encountered an issue connecting to the neural inference service. "
                    "However, our store records and aisle inventory remain fully operational! "
                    "You can search products directly in the catalog or visit the Customer Service Desk at Aisle 1."
                )

        return {
            "answer": raw_reply,
            "model_used": model_name,
            "sources_used": [h["title"] for h in ctx["rag_hits"]],
            "memories_applied": len(ctx["memories"]),
            "tool_called": ctx["tool_called"],
            "tool_result": ctx["tool_result"]
        }

    async def generate_stream_response(
        self,
        db: Session,
        user_message: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        ctx = context_manager.assemble_context(
            db=db,
            user_message=user_message,
            conversation_id=conversation_id,
            user_id=user_id
        )

        provider = get_llm_provider()
        async for chunk in provider.generate_stream(messages=ctx["messages"]):
            yield chunk

llama_service = LlamaService()
