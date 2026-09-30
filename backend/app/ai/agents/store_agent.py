"""
Store Agent — models the store's knowledge base.

The Store Agent:
  1. Receives structured questions from the Customer Agent
  2. Queries the actual database (products, policies)
  3. Runs route planning if needed
  4. Returns factual, grounded answers based on real store data

Think of it as the "all-knowing store manager" brain.
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.ai.claude_client  import chat
from app.models.product    import Product
from app.models.policy     import PolicyDocument
from app.utils.graph       import STORE_GRAPH, NODE_METADATA
from app.utils.pathfinding import plan_shopping_route

STORE_AGENT_SYSTEM = """\
You are the Store Agent in a multi-agent retail assistant system for SmartMart.

Your role:
- You have complete knowledge of SmartMart's products, policies, and store layout.
- You receive structured questions from the Customer Agent.
- You answer each question with specific, factual information from the store data provided.
- Be precise: include product names, prices, aisle numbers, shelf locations, and stock levels.
- If asked about policies, quote the relevant policy text.
- If asked about routes, describe the path clearly.
- Be thorough but concise.

Always structure your response to address each question number separately.
"""


def _get_product_context(db: Session, limit: int = 30) -> str:
    """Build a text snapshot of all active products for the Store Agent."""
    products = (
        db.query(Product)
        .filter(Product.is_active == True)
        .order_by(Product.category_id, Product.id)
        .limit(limit)
        .all()
    )
    lines = []
    for p in products:
        cat = p.category.name if p.category else "General"
        stock_label = f"{p.stock} in stock" if p.stock > 0 else "OUT OF STOCK"
        lines.append(
            f"• {p.name} | Brand: {p.brand or 'N/A'} | "
            f"Rs.{p.price} | Aisle {p.aisle or '?'} Shelf {p.shelf or '?'} | "
            f"{cat} | {stock_label}"
        )
    return "\n".join(lines)


def _get_policy_context(db: Session) -> str:
    """Build a text snapshot of all active policies for the Store Agent."""
    policies = db.query(PolicyDocument).filter(PolicyDocument.is_active == True).all()
    lines = []
    for p in policies:
        # Truncate long policies to save tokens
        content_preview = p.content[:400] + "..." if len(p.content) > 400 else p.content
        lines.append(f"[{p.title}]\n{content_preview}")
    return "\n\n".join(lines)


def _get_store_map_context() -> str:
    """Build a text description of the store layout for the Store Agent."""
    lines = ["Store Layout:"]
    for node_id in STORE_GRAPH.nodes:
        meta = NODE_METADATA.get(node_id, {})
        label = meta.get("label", node_id)
        neighbours = [n for n, _ in STORE_GRAPH.neighbors(node_id)]
        lines.append(f"  {node_id} ({label}) → connects to: {', '.join(neighbours)}")
    return "\n".join(lines)


def answer_questions(
    db: Session,
    questions: str,
    customer_request: str,
) -> str:
    """
    Store Agent: Answer the Customer Agent's questions using real store data.

    Args:
        db:               Database session.
        questions:        The Customer Agent's questions (numbered list).
        customer_request: Original customer request (for context).

    Returns:
        Store Agent's answers as a formatted string.
    """
    product_context = _get_product_context(db)
    policy_context  = _get_policy_context(db)
    store_map       = _get_store_map_context()

    user_message = f"""\
STORE INVENTORY:
{product_context}

STORE POLICIES:
{policy_context}

{store_map}

---

The Customer Agent is helping a customer with this request:
"{customer_request}"

The Customer Agent has asked you these questions:
{questions}

Please answer each question using the store data above.
Be specific with product names, prices, aisle locations, and policy details.
"""

    return chat(
        user=user_message,
        system=STORE_AGENT_SYSTEM,
        max_tokens=700,
        temperature=0.2,
    )
