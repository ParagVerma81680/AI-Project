"""
Comparison service — runs the same question through 4 AI paradigms
and returns a side-by-side comparison.

Paradigms compared:
  1. Rule-Based      — keyword search over policies, zero AI
  2. Zero-Shot LLM   — Claude with no context, just the question
  3. RAG             — our retrieval-augmented generation pipeline
  4. Multi-Agent     — Customer Agent + Store Agent dialogue

Each paradigm records:
  - The answer it produced
  - How long it took (ms)
  - What sources it used
  - How many AI calls it made
"""

import time
import re
from typing import List

from sqlalchemy.orm import Session

from app.schemas.comparison        import ComparisonRequest, ComparisonResponse, ParadigmResult
from app.models.policy             import PolicyDocument
from app.ai.claude_client          import chat
from app.ai.rag_engine             import answer_policy_question
from app.ai.agents.customer_agent  import analyse_request, synthesise_response
from app.ai.agents.store_agent     import answer_questions


# ─────────────────────────────────────────────────────────────────────────────
# Paradigm metadata (static — same for every run)
# ─────────────────────────────────────────────────────────────────────────────

PARADIGM_META = {
    "rule_based": {
        "display_name": "Rule-Based System",
        "description":  (
            "Traditional keyword matching — no AI involved. "
            "Searches policy text for matching words and returns the "
            "most relevant paragraph. Fast but rigid and brittle."
        ),
        "pros": [
            "Extremely fast (no API calls)",
            "100% deterministic — same input always gives same output",
            "No API cost",
            "Works offline",
        ],
        "cons": [
            "Cannot understand intent or context",
            "Fails on synonyms and paraphrasing",
            "Returns raw text, not a helpful answer",
            "No reasoning ability",
        ],
        "ai_calls_made": 0,
    },
    "zero_shot": {
        "display_name": "Zero-Shot LLM",
        "description":  (
            "Claude is asked the question with absolutely no context — "
            "no store data, no policies, no products. Relies entirely on "
            "training knowledge. May hallucinate store-specific details."
        ),
        "pros": [
            "Simple to implement (one API call)",
            "Can handle any question fluently",
            "Good general reasoning",
        ],
        "cons": [
            "Hallucination risk — may invent policy details",
            "Has no knowledge of this specific store's products/policies",
            "Cannot give store-specific prices or aisle numbers",
        ],
        "ai_calls_made": 1,
    },
    "rag": {
        "display_name": "RAG (Retrieval-Augmented Generation)",
        "description":  (
            "Retrieves the most relevant policy chunks from our database "
            "using TF-IDF keyword scoring, then sends them to Claude as "
            "context. Grounded answers, no hallucination."
        ),
        "pros": [
            "Grounded in real store data — no hallucination",
            "Cites sources used",
            "Good balance of speed and accuracy",
            "Easy to update (just change the DB)",
        ],
        "cons": [
            "Quality depends on retrieval quality",
            "May miss relevant info if keyword scoring fails",
            "Only covers what's in the knowledge base",
        ],
        "ai_calls_made": 1,
    },
    "multi_agent": {
        "display_name": "Multi-Agent System",
        "description":  (
            "Two specialised AI agents collaborate. The Customer Agent "
            "analyses intent and formulates questions. The Store Agent "
            "answers using real product + policy data. Customer Agent "
            "synthesises a final answer. Most thorough but slowest."
        ),
        "pros": [
            "Deepest understanding of customer intent",
            "Combines product data + policies + reasoning",
            "Produces most complete and helpful answer",
            "Shows agent dialogue (great for debugging)",
        ],
        "cons": [
            "Slowest — makes 3 API calls",
            "Highest API cost",
            "More complex to maintain",
        ],
        "ai_calls_made": 3,
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Paradigm 1: Rule-Based keyword search
# ─────────────────────────────────────────────────────────────────────────────

def _run_rule_based(db: Session, question: str) -> tuple[str, list[str]]:
    """
    Keyword matching over policy documents.
    Returns (answer_text, sources_used).
    No AI calls.
    """
    policies = db.query(PolicyDocument).filter(PolicyDocument.is_active == True).all()
    if not policies:
        return "No policy documents found in database.", []

    # Tokenise question
    keywords = set(re.findall(r"[a-zA-Z]{3,}", question.lower()))
    stop = {"the","and","for","are","can","you","what","how","when","where","this","that"}
    keywords -= stop

    best_score  = -1
    best_policy = None
    best_snippet = ""

    for policy in policies:
        full_text = policy.title + " " + policy.content
        text_lower = full_text.lower()
        score = sum(1 for kw in keywords if kw in text_lower)

        if score > best_score:
            best_score = score
            best_policy = policy
            # Find the most relevant paragraph
            paragraphs = [p.strip() for p in policy.content.split("\n\n") if p.strip()]
            para_scores = [
                (sum(1 for kw in keywords if kw in p.lower()), p)
                for p in paragraphs
            ]
            para_scores.sort(reverse=True)
            best_snippet = para_scores[0][1] if para_scores else policy.content[:300]

    if not best_policy or best_score == 0:
        return "No matching policy found for this query.", []

    answer = (
        f"[Matched: {best_policy.title}]\n\n"
        f"{best_snippet}"
    )
    return answer, [best_policy.title]


# ─────────────────────────────────────────────────────────────────────────────
# Paradigm 2: Zero-Shot LLM
# ─────────────────────────────────────────────────────────────────────────────

def _run_zero_shot(question: str) -> str:
    """Ask Claude with no store context at all."""
    return chat(
        system=(
            "You are a general customer service assistant for a retail store. "
            "Answer the customer's question based on your general knowledge. "
            "Be helpful and concise."
        ),
        user=question,
        max_tokens=400,
        temperature=0.5,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Paradigm 3: RAG
# ─────────────────────────────────────────────────────────────────────────────

def _run_rag(db: Session, question: str) -> tuple[str, list[str]]:
    """Use our existing RAG engine."""
    result = answer_policy_question(db, question, top_k=2)
    return result["answer"], result["sources_used"]


# ─────────────────────────────────────────────────────────────────────────────
# Paradigm 4: Multi-Agent
# ─────────────────────────────────────────────────────────────────────────────

def _run_multi_agent(db: Session, question: str) -> tuple[str, list[str]]:
    """Use our Customer Agent + Store Agent pipeline."""
    questions   = analyse_request(question)
    store_ans   = answer_questions(db, questions, question)
    final       = synthesise_response(question, questions, store_ans)
    return final, ["Customer Agent", "Store Agent", "Product DB", "Policy DB"]


# ─────────────────────────────────────────────────────────────────────────────
# Verdict generator
# ─────────────────────────────────────────────────────────────────────────────

def _generate_verdict(question: str, results: list[ParadigmResult]) -> str:
    """Ask Claude to evaluate which paradigm did best."""
    summary = "\n\n".join([
        f"**{r.display_name}** (took {r.response_time_ms:.0f}ms, {r.ai_calls_made} AI calls):\n{r.answer[:300]}"
        for r in results
    ])

    return chat(
        system=(
            "You are an AI systems evaluator for a university course. "
            "Compare the 4 AI paradigm responses and give a concise educational verdict (3-4 sentences). "
            "Mention which performed best, which was fastest, and what the key trade-offs are."
        ),
        user=(
            f"Question asked: \"{question}\"\n\n"
            f"Responses from each paradigm:\n{summary}\n\n"
            "Which paradigm gave the best answer and why? What are the key trade-offs?"
        ),
        max_tokens=300,
        temperature=0.4,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Main comparison orchestrator
# ─────────────────────────────────────────────────────────────────────────────

def run_comparison(db: Session, request: ComparisonRequest) -> ComparisonResponse:
    """
    Run the question through all 4 paradigms, measure each, return comparison.
    Total AI calls: 0 + 1 + 1 + 3 + 1 (verdict) = 6 Claude calls.
    """
    question = request.question
    results: list[ParadigmResult] = []

    # ── 1. Rule-Based ────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    rb_answer, rb_sources = _run_rule_based(db, question)
    rb_time = (time.perf_counter() - t0) * 1000
    results.append(ParadigmResult(
        paradigm="rule_based",
        answer=rb_answer,
        response_time_ms=round(rb_time, 1),
        sources_used=rb_sources,
        **PARADIGM_META["rule_based"],
    ))

    # ── 2. Zero-Shot LLM ─────────────────────────────────────────────────────
    t0 = time.perf_counter()
    zs_answer = _run_zero_shot(question)
    zs_time = (time.perf_counter() - t0) * 1000
    results.append(ParadigmResult(
        paradigm="zero_shot",
        answer=zs_answer,
        response_time_ms=round(zs_time, 1),
        sources_used=[],
        **PARADIGM_META["zero_shot"],
    ))

    # ── 3. RAG ───────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    rag_answer, rag_sources = _run_rag(db, question)
    rag_time = (time.perf_counter() - t0) * 1000
    results.append(ParadigmResult(
        paradigm="rag",
        answer=rag_answer,
        response_time_ms=round(rag_time, 1),
        sources_used=rag_sources,
        **PARADIGM_META["rag"],
    ))

    # ── 4. Multi-Agent ───────────────────────────────────────────────────────
    t0 = time.perf_counter()
    ma_answer, ma_sources = _run_multi_agent(db, question)
    ma_time = (time.perf_counter() - t0) * 1000
    results.append(ParadigmResult(
        paradigm="multi_agent",
        answer=ma_answer,
        response_time_ms=round(ma_time, 1),
        sources_used=ma_sources,
        **PARADIGM_META["multi_agent"],
    ))

    # ── Verdict ──────────────────────────────────────────────────────────────
    verdict = _generate_verdict(question, results)

    return ComparisonResponse(
        question=question,
        results=results,
        verdict=verdict,
    )
