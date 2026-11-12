import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.models import Message
from app.ai.prompt_manager import prompt_manager
from app.ai.rag_engine import rag_engine
from app.ai.memory_manager import memory_manager
from app.ai.tool_router import tool_router

class ContextManager:
    """
    Builds the unified context for Meta Llama by combining:
    - RAG Knowledge Base Retrieval
    - Long-Term User Memory
    - Live Database Tool Execution
    - Short-Term Conversation History
    """
    def __init__(self, history_limit: int = 8):
        self.history_limit = history_limit

    def assemble_context(
        self,
        db: Session,
        user_message: str,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. RAG Retrieval
        rag_hits = rag_engine.retrieve(db, user_message, top_k=3)
        rag_context = ""
        if rag_hits:
            rag_context = "\n".join([
                f"[{h['title']} - Category: {h['category']}]\n{h['content']}"
                for h in rag_hits
            ])

        # 2. Long-Term User Memory
        memories = []
        memory_context = ""
        if user_id:
            memories = memory_manager.get_relevant_memories(db, user_id, user_message, top_k=3)
            if memories:
                memory_context = "\n".join([
                    f"- ({m['memory_type'].upper()}): {m['memory_content']}"
                    for m in memories
                ])

        # 3. Controlled Tool Calling (16 tools)
        tool_name, tool_result = tool_router.route_and_execute(db, user_message, user_id, session_id)
        tool_context = ""
        if tool_name and tool_result is not None:
            tool_context = f"[TOOL CALLED: {tool_name}]\n{json.dumps(tool_result, indent=2)}"

        # 4. Master System Message
        system_content = prompt_manager.build_system_message(
            rag_context=rag_context,
            memory_context=memory_context,
            tool_context=tool_context
        )

        messages = [{"role": "system", "content": system_content}]

        # 5. Short-Term Conversation History
        if conversation_id:
            past_messages = (
                db.query(Message)
                .filter(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(self.history_limit)
                .all()
            )
            # Reorder chronologically
            for m in reversed(past_messages):
                if m.role in ["user", "assistant"]:
                    messages.append({"role": m.role, "content": m.message_content})

        # 6. Current User Turn
        messages.append({"role": "user", "content": user_message})

        return {
            "messages": messages,
            "rag_hits": rag_hits,
            "memories": memories,
            "tool_called": tool_name,
            "tool_result": tool_result
        }

context_manager = ContextManager()
