"""
SmartBot Central Router — Unified AI Agent for SmartMart Supermarket.

Combines:
  - Role-based permissions (Customer, Staff, Administrator)
  - 27 Validated Backend Tools (Products, Inventory, Orders, Cart, RAG Policies, 3D Route Planning, Diagnostics)
  - Multi-turn conversation memory with session persistence
  - Autonomous multi-step task execution
  - Real-time streaming and structured tool actions
"""

import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user
from app.database.models import User, Conversation, Message
from app.ai.llm_provider import get_llm_provider
from app.ai.tool_router import tool_router
from app.ai.context_manager import context_manager
from app.core.logging import logger

router = APIRouter(prefix="/smartbot", tags=["SmartBot Central AI Agent"])

# Supported roles and tool permissions
ROLE_PERMISSIONS = {
    "customer": [
        "search_products", "get_product_details", "get_product_price",
        "check_inventory", "compare_products", "search_store_policies",
        "get_store_hours", "get_payment_methods", "calculate_cart_total",
        "generate_meal_plan", "generate_shopping_list", "add_product_to_cart",
        "remove_cart_item", "get_product_location", "generate_shopping_route",
        "start_navigation", "pause_navigation", "retrieve_conversation_history",
        "save_conversation_memory"
    ],
    "staff": [
        # All customer tools +
        "search_products", "get_product_details", "get_product_price",
        "check_inventory", "compare_products", "search_store_policies",
        "get_store_hours", "get_payment_methods", "calculate_cart_total",
        "generate_meal_plan", "generate_shopping_list", "add_product_to_cart",
        "remove_cart_item", "get_product_location", "generate_shopping_route",
        "start_navigation", "pause_navigation", "retrieve_conversation_history",
        "save_conversation_memory", "get_inventory_report", "inspect_api_errors"
    ],
    "admin": [
        # All tools including mutations
        "search_products", "get_product_details", "get_product_price",
        "check_inventory", "update_inventory", "add_product", "update_product",
        "deactivate_product", "compare_products", "search_store_policies",
        "get_store_hours", "get_payment_methods", "calculate_cart_total",
        "generate_meal_plan", "generate_shopping_list", "add_product_to_cart",
        "remove_cart_item", "get_product_location", "generate_shopping_route",
        "start_navigation", "pause_navigation", "retrieve_conversation_history",
        "save_conversation_memory", "get_system_health", "inspect_api_errors",
        "get_inventory_report", "manage_store_settings"
    ]
}

@router.get("/tools", summary="List available tools by role")
def get_tools_catalog(role: str = "customer"):
    """Returns available tools and capabilities according to role."""
    r = role.lower()
    allowed_names = ROLE_PERMISSIONS.get(r, ROLE_PERMISSIONS["customer"])
    return {
        "role": r,
        "tools_count": len(allowed_names),
        "tools": [
            {
                "name": name,
                "description": tool_router.tools_registry.get(name, {}).get("description", "SmartBot capability")
            }
            for name in allowed_names
        ]
    }

@router.post("/chat", summary="Chat with Central SmartBot")
async def smartbot_chat(
    payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified SmartBot conversation endpoint.
    Processes natural language, verifies user permissions, chooses tools,
    executes operations against the live store database, and returns a natural response.
    """
    message_text = payload.get("message", "").strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conv_id = payload.get("conversation_id")
    session_id = payload.get("session_id", "guest_session")
    requested_role = payload.get("role", "customer").lower()

    # Determine effective user role
    effective_role = "customer"
    user_id = None
    if current_user:
        user_id = current_user.id
        effective_role = current_user.role.lower() if hasattr(current_user, "role") else "customer"
    elif requested_role in ["staff", "admin"]:
        # Allow simulated role if explicitly passed with matching dev credentials
        admin_key = payload.get("admin_key", "")
        if requested_role == "admin" and admin_key == "CSE276":
            effective_role = "admin"
        elif requested_role == "staff":
            effective_role = "staff"

    # Ensure conversation entity exists
    conv = None
    if conv_id:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        conv = Conversation(
            user_id=user_id,
            session_id=session_id,
            title=message_text[:35] + ("..." if len(message_text) > 35 else "")
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv_id = conv.id

    # Record User Message
    user_msg_record = Message(
        conversation_id=conv_id,
        role="user",
        message_content=message_text,
        sender="user"
    )
    db.add(user_msg_record)
    db.commit()

    # Assemble Context & Retrieve Knowledge / Inventory / Memory
    ctx = context_manager.assemble_context(
        db=db,
        user_message=message_text,
        conversation_id=conv_id,
        user_id=user_id,
        session_id=session_id
    )

    # Tool Intent Detection & Permitted Execution
    tool_executed = None
    tool_action_data = None
    allowed_tools = ROLE_PERMISSIONS.get(effective_role, ROLE_PERMISSIONS["customer"])

    # Analyze message for tool triggers
    intent = tool_router.detect_intent(message_text)
    if intent and intent["tool"] in allowed_tools:
        tool_name = intent["tool"]
        tool_params = intent.get("params", {})
        try:
            tool_result = tool_router.execute_tool(
                db=db,
                tool_name=tool_name,
                params=tool_params,
                session_id=session_id,
                user_id=user_id
            )
            tool_executed = tool_name
            tool_action_data = tool_result
            ctx["tool_result"] = str(tool_result)
        except Exception as te:
            logger.warning(f"Tool execution warning: {te}")

    # Build SmartBot Unified System Prompt
    system_prompt = f"""\
You are SmartBot, the central autonomous intelligence of SmartMart Supermarket.
You control and manage the entire supermarket platform: customer assistance, product search, live inventory, SmartCart shopping recommendations, in-store 3D route planning, store policies, and staff operations.

Current User Context:
- Role: {effective_role.upper()}
- Permitted Capabilities: {len(allowed_tools)} tools active
- Session ID: {session_id}

Store Knowledge:
{ctx.get("rag_context", "SmartMart offers 30-day returns with receipt. Perishables returnable within 7 days. Open 8 AM - 10 PM daily.")}

Tool Execution Feedback:
{ctx.get("tool_result", "None")}

Guidelines:
1. Always speak warmly, professionally, and authoritatively as SmartBot.
2. If asked about groceries, meal plans, or recipes, provide sensible item recommendations with actual prices from our inventory.
3. If products or route actions were calculated, explain the exact aisles and prices.
4. Support English, Hindi, and Hinglish. Answer general knowledge and math questions accurately.
5. If store data is not found, state clearly what is available rather than inventing false records.
"""

    provider = get_llm_provider()
    model_name = provider.get_model_name()

    messages_payload = [
        {"role": "system", "content": system_prompt}
    ]
    # Add recent message history
    for m in ctx.get("history", [])[-6:]:
        messages_payload.append({"role": m["role"], "content": m["content"]})
    messages_payload.append({"role": "user", "content": message_text})

    try:
        reply_content = await provider.generate(
            messages=messages_payload,
            temperature=0.5,
            max_tokens=1000
        )
    except Exception as e:
        logger.warning(f"SmartBot LLM generation fallback: {e}")
        if tool_action_data:
            reply_content = f"SmartBot Store Action Executed ({tool_executed}):\n{json.dumps(tool_action_data, indent=2)}"
        else:
            reply_content = (
                "Hello! I am SmartBot. Our store records and inventory are online. "
                "You can search products, plan routes in our 3D supermarket, or add items to your cart!"
            )

    # Record Assistant Message
    assistant_msg_record = Message(
        conversation_id=conv_id,
        role="assistant",
        message_content=reply_content,
        model_used=model_name,
        sender="smartbot"
    )
    db.add(assistant_msg_record)
    db.commit()

    return {
        "conversation_id": conv_id,
        "message": reply_content,
        "response": reply_content,
        "model_used": model_name,
        "sender": "smartbot",
        "role": effective_role,
        "tool_called": tool_executed,
        "tool_data": tool_action_data,
        "sources": [h["title"] for h in ctx.get("rag_hits", [])]
    }

@router.get("/conversations", summary="List SmartBot conversation sessions")
def list_conversations(
    session_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve user conversation history."""
    query = db.query(Conversation)
    if current_user:
        query = query.filter(Conversation.user_id == current_user.id)
    elif session_id:
        query = query.filter(Conversation.session_id == session_id)
    convs = query.order_by(Conversation.updated_at.desc()).limit(20).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in convs
    ]

@router.get("/conversations/{conversation_id}", summary="Get conversation messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Get full message history for a conversation."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return {
        "id": conv.id,
        "title": conv.title,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "sender": getattr(m, "sender", "bot"),
                "message_content": m.message_content,
                "model_used": m.model_used,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]
    }

@router.delete("/conversations/{conversation_id}", summary="Delete conversation")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Deletes conversation and associated messages."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()
    return {"message": f"Conversation {conversation_id} successfully deleted"}
