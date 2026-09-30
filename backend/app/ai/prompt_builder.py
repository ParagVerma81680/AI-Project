"""
Prompt builder — reusable prompt templates for Claude.

Keeping prompts here (instead of scattered in routes/services) means:
  - Easy to tweak wording in one place
  - Clear separation between "what Claude knows" and "how Claude behaves"
  - Easy to test prompts independently

Usage:
    from app.ai.prompt_builder import build_policy_qa_prompt

    system, user = build_policy_qa_prompt(
        question="Can I return an opened product?",
        context_chunks=["Our return policy allows...", "Opened items..."],
    )
"""

from typing import List


# ─────────────────────────────────────────────────────────────────────────────
# Policy Q&A prompt (Phase 3 — RAG)
# ─────────────────────────────────────────────────────────────────────────────

POLICY_SYSTEM_PROMPT = """\
You are a knowledgeable and friendly customer service assistant for \
"SmartMart" — an AI-powered retail store.

Your job is to answer customer questions about store policies \
using ONLY the policy information provided to you.

Rules you must follow:
1. Answer ONLY based on the provided policy context. Do not invent information.
2. If the context does not contain enough information, say so clearly and \
   politely suggest the customer contact store staff.
3. Be concise, warm, and helpful.
4. If a question has multiple parts, address each part.
5. Use simple, plain language — avoid jargon.
6. Do not mention that you are using a "context" or "chunks" internally.
"""


def build_policy_qa_prompt(
    question:       str,
    context_chunks: List[str],
) -> tuple[str, str]:
    """
    Build the system and user messages for a policy Q&A call.

    Args:
        question:       The customer's question.
        context_chunks: Relevant policy text retrieved by the RAG engine.

    Returns:
        (system_prompt, user_message) — pass both to claude_client.chat()
    """
    if context_chunks:
        context_block = "\n\n---\n\n".join(context_chunks)
    else:
        context_block = "No specific policy information was found for this query."

    user_message = f"""\
STORE POLICY INFORMATION:
{context_block}

---

CUSTOMER QUESTION:
{question}

Please answer the customer's question based on the policy information above.\
"""

    return POLICY_SYSTEM_PROMPT, user_message


# ─────────────────────────────────────────────────────────────────────────────
# Recommendation prompt (Phase 4 — placeholder)
# ─────────────────────────────────────────────────────────────────────────────

RECOMMENDATION_SYSTEM_PROMPT = """\
You are a smart shopping assistant for SmartMart. \
Your goal is to suggest products that genuinely match the customer's needs \
based on their shopping history and preferences. \
Be specific, helpful, and concise.\
"""


def build_recommendation_prompt(
    customer_context: str,
    available_products: str,
) -> tuple[str, str]:
    """
    Build prompt for product recommendations (used in Phase 4).
    """
    user_message = f"""\
CUSTOMER CONTEXT:
{customer_context}

AVAILABLE PRODUCTS:
{available_products}

Based on the customer's context, recommend 3-5 products they would likely enjoy.\
Explain briefly why each product suits them.\
"""
    return RECOMMENDATION_SYSTEM_PROMPT, user_message
