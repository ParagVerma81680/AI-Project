"""
RAG Engine — Retrieval-Augmented Generation for store policies.

What is RAG?
  Instead of asking Claude "what is the return policy?" from memory,
  we first RETRIEVE the actual policy text from our database,
  then AUGMENT Claude's prompt with that text,
  so Claude GENERATES an answer grounded in real store data.

  This prevents hallucination — Claude can only say what's in our policies.

Retrieval method:
  We use TF-IDF-style keyword scoring — no vector database needed.
  For a college project this is accurate enough and easy to explain.

  How it works:
    1. Tokenise the user question into keywords.
    2. Score each policy document by how many keywords it contains.
    3. Return the top-K highest scoring documents as context.

Usage:
    from app.ai.rag_engine import retrieve_relevant_policies, answer_policy_question
"""

from __future__ import annotations

import re
import math
from typing import List

from sqlalchemy.orm import Session

from app.models.policy         import PolicyDocument
from app.ai.claude_client      import chat
from app.ai.prompt_builder     import build_policy_qa_prompt


# ─────────────────────────────────────────────────────────────────────────────
# Stop words (common words that don't help retrieval)
# ─────────────────────────────────────────────────────────────────────────────

_STOP_WORDS = {
    "a", "an", "the", "is", "it", "in", "on", "at", "to", "for",
    "of", "and", "or", "but", "not", "with", "do", "does", "can",
    "will", "what", "how", "when", "where", "who", "i", "my", "me",
    "we", "our", "you", "your", "be", "are", "was", "were", "have",
    "has", "had", "this", "that", "these", "those", "about", "if",
}


def _tokenise(text: str) -> List[str]:
    """Lowercase, strip punctuation, remove stop words."""
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    return [t for t in tokens if t not in _STOP_WORDS and len(t) > 2]


# ─────────────────────────────────────────────────────────────────────────────
# TF-IDF keyword scoring
# ─────────────────────────────────────────────────────────────────────────────

def _score_document(doc_text: str, query_tokens: List[str]) -> float:
    """
    Score a document against a query using TF-IDF-inspired keyword matching.

    TF  (Term Frequency)  = how often the query word appears in the document
    IDF (Inverse Doc Freq)= rarer words get higher weight (log scale)

    Returns a float score — higher means more relevant.
    """
    if not query_tokens:
        return 0.0

    doc_tokens  = _tokenise(doc_text)
    doc_len     = len(doc_tokens) or 1
    doc_counter = {}
    for t in doc_tokens:
        doc_counter[t] = doc_counter.get(t, 0) + 1

    score = 0.0
    for token in query_tokens:
        tf = doc_counter.get(token, 0) / doc_len
        # Simple IDF boost: rarer tokens (shorter queries) matter more
        idf = math.log(1 + 1 / (query_tokens.count(token) or 1))
        score += tf * idf

    return score


# ─────────────────────────────────────────────────────────────────────────────
# Public functions
# ─────────────────────────────────────────────────────────────────────────────

def retrieve_relevant_policies(
    db:          Session,
    question:    str,
    top_k:       int = 3,
    min_score:   float = 0.0,
) -> List[PolicyDocument]:
    """
    Retrieve the most relevant policy documents for a given question.

    Args:
        db:        Database session.
        question:  The customer's question.
        top_k:     How many policy documents to return (default: 3).
        min_score: Minimum relevance score to include a document.

    Returns:
        List of PolicyDocument objects, ordered by relevance (most relevant first).
    """
    all_policies = db.query(PolicyDocument).filter(PolicyDocument.is_active == True).all()

    if not all_policies:
        return []

    query_tokens = _tokenise(question)

    # Score every policy document
    scored = []
    for policy in all_policies:
        # Score both title and content (title gets a 3× boost)
        title_score   = _score_document(policy.title,   query_tokens) * 3
        content_score = _score_document(policy.content, query_tokens)
        total_score   = title_score + content_score

        if total_score > min_score:
            scored.append((total_score, policy))

    # Sort by score descending and return top K
    scored.sort(key=lambda x: x[0], reverse=True)
    return [policy for _, policy in scored[:top_k]]


def answer_policy_question(
    db:       Session,
    question: str,
    top_k:    int = 3,
) -> dict:
    """
    Full RAG pipeline — retrieve relevant policies, call Claude, return answer.

    Args:
        db:       Database session.
        question: The customer's question.
        top_k:    Number of policy chunks to feed Claude as context.

    Returns:
        {
          "answer":        str,   ← Claude's answer
          "sources_used":  list,  ← policy titles used as context
          "retrieved_count": int, ← how many policies were retrieved
        }
    """
    # Step 1 — Retrieve
    relevant_docs = retrieve_relevant_policies(db, question, top_k=top_k)

    # Step 2 — Build context chunks
    context_chunks = []
    sources_used   = []

    for doc in relevant_docs:
        chunk = f"[{doc.title}]\n{doc.content}"
        context_chunks.append(chunk)
        sources_used.append(doc.title)

    # Step 3 — Build prompt
    system_prompt, user_message = build_policy_qa_prompt(
        question=question,
        context_chunks=context_chunks,
    )

    # Step 4 — Call Claude
    answer = chat(
        user=user_message,
        system=system_prompt,
        max_tokens=512,
        temperature=0.2,   # low temperature = more factual
    )

    return {
        "answer":          answer,
        "sources_used":    sources_used,
        "retrieved_count": len(relevant_docs),
    }
