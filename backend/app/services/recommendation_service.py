"""
Recommendation service — AI-powered product recommendations using Claude.

Pipeline:
  1. Fetch candidate products from DB (filtered by budget / category if given).
  2. Build a structured product list as Claude context.
  3. Call Claude with the customer's preferences.
  4. Parse Claude's JSON response to extract recommended product IDs + explanations.
  5. Return full product details + explanations to the route layer.
"""

import json
import re
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.product        import Product
from app.models.category       import Category
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendedProduct
from app.ai.claude_client       import chat


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder (local — specific to recommendations)
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a smart, friendly shopping assistant for SmartMart retail store.
Your job is to recommend products from the store's actual inventory that \
best match what the customer is looking for.

Rules:
1. ONLY recommend products that are in the provided product list.
2. Do NOT invent products or brands that are not in the list.
3. If budget is given, only recommend products within that budget.
4. Give a short, friendly explanation for each recommendation (1-2 sentences).
5. Write a brief overall summary (1-2 sentences) as an intro.
6. Respond ONLY with valid JSON in exactly this format:

{
  "summary": "Overall shopping advice here...",
  "recommendations": [
    {
      "product_id": 1,
      "explanation": "Why this product matches the customer's needs."
    }
  ]
}
"""


def _build_product_context(products: List[Product]) -> str:
    """Convert a list of products into a concise text block for Claude."""
    lines = []
    for p in products:
        cat_name = p.category.name if p.category else "Uncategorised"
        stock_label = "In Stock" if p.stock > 0 else "Out of Stock"
        lines.append(
            f"ID:{p.id} | {p.name} | Brand:{p.brand or 'N/A'} | "
            f"Rs.{p.price} | Category:{cat_name} | Aisle:{p.aisle or 'N/A'} | {stock_label}"
        )
    return "\n".join(lines)


def _parse_claude_response(raw: str) -> dict:
    """
    Extract JSON from Claude's response even if it adds extra prose.
    Falls back to an empty structure on parse failure.
    """
    # Try to find a JSON block
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    return {"summary": raw.strip(), "recommendations": []}


# ─────────────────────────────────────────────────────────────────────────────
# Main service function
# ─────────────────────────────────────────────────────────────────────────────

def get_recommendations(
    db:      Session,
    request: RecommendationRequest,
) -> RecommendationResponse:
    """
    Generate AI product recommendations for a customer.

    Args:
        db:      Database session.
        request: RecommendationRequest with preferences, budget, category_ids.

    Returns:
        RecommendationResponse with recommended products + AI explanations.
    """

    # ── Step 1: Fetch candidate products ────────────────────────────────────
    query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active == True, Product.stock > 0)
    )

    if request.budget is not None:
        query = query.filter(Product.price <= request.budget)

    if request.category_ids:
        query = query.filter(Product.category_id.in_(request.category_ids))

    candidates: List[Product] = query.order_by(Product.id).all()

    if not candidates:
        return RecommendationResponse(
            preferences=request.preferences,
            budget=request.budget,
            recommendations=[],
            total_found=0,
            ai_summary="No products found matching your filters. Try adjusting your budget or category selection.",
        )

    # ── Step 2: Build Claude prompt ──────────────────────────────────────────
    product_context = _build_product_context(candidates)

    budget_note = f"Customer's budget: Rs. {request.budget}" if request.budget else "No budget limit specified."

    user_message = f"""\
AVAILABLE PRODUCTS IN STORE:
{product_context}

---

CUSTOMER REQUEST:
{request.preferences}

{budget_note}

Please recommend up to {request.max_results} products from the list above \
that best match the customer's needs. Remember to respond ONLY with the JSON format specified.\
"""

    # ── Step 3: Call Claude ──────────────────────────────────────────────────
    raw_response = chat(
        user=user_message,
        system=_SYSTEM_PROMPT,
        max_tokens=800,
        temperature=0.4,
    )

    # ── Step 4: Parse response ───────────────────────────────────────────────
    parsed = _parse_claude_response(raw_response)
    ai_summary = parsed.get("summary", "Here are my recommendations for you!")
    raw_recs   = parsed.get("recommendations", [])

    # ── Step 5: Build response with full product details ────────────────────
    # Index candidates by ID for fast lookup
    product_map = {p.id: p for p in candidates}

    recommended: List[RecommendedProduct] = []
    for rec in raw_recs[:request.max_results]:
        pid = rec.get("product_id")
        explanation = rec.get("explanation", "")
        product = product_map.get(pid)

        if not product:
            continue  # Claude hallucinated an ID — skip

        recommended.append(
            RecommendedProduct(
                id=product.id,
                name=product.name,
                brand=product.brand,
                price=product.price,
                aisle=product.aisle,
                shelf=product.shelf,
                category=product.category.name if product.category else None,
                stock=product.stock,
                explanation=explanation,
            )
        )

    return RecommendationResponse(
        preferences=request.preferences,
        budget=request.budget,
        recommendations=recommended,
        total_found=len(recommended),
        ai_summary=ai_summary,
    )
