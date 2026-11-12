from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import logger
from app.database.models import KnowledgeBase
from app.ai.embeddings import embedding_service

class RAGEngine:
    """
    Retrieval-Augmented Generation Engine.
    Searches the KnowledgeBase table using vector similarity.
    """
    def __init__(self, top_k: int = 4, threshold: float = 0.05):
        self.top_k = top_k
        self.threshold = threshold

    def retrieve(self, db: Session, query: str, top_k: int = None, category_filter: str = None) -> List[Dict[str, Any]]:
        k = top_k or self.top_k
        query_embedding = embedding_service.embed_text(query)

        # Check if database dialect supports pgvector native distance operator (<=>)
        dialect_name = db.bind.dialect.name if db.bind else ""
        if dialect_name == "postgresql":
            try:
                # Use native pgvector cosine distance: embedding <=> query_embedding
                query_str = """
                    SELECT id, title, content, category, source,
                           1 - (embedding <=> CAST(:query_vec AS vector)) AS similarity
                    FROM knowledge_base
                """
                params = {"query_vec": str(query_embedding)}
                if category_filter:
                    query_str += " WHERE category = :cat"
                    params["cat"] = category_filter
                query_str += " ORDER BY similarity DESC LIMIT :k;"
                params["k"] = k

                results = db.execute(text(query_str), params).fetchall()
                hits = []
                for row in results:
                    sim = float(row.similarity) if row.similarity is not None else 0.0
                    if sim >= self.threshold:
                        hits.append({
                            "id": row.id,
                            "title": row.title,
                            "content": row.content,
                            "category": row.category,
                            "source": row.source,
                            "similarity": round(sim, 4)
                        })
                if hits:
                    return hits
            except Exception as e:
                logger.warning(f"Native pgvector query failed, falling back to Python cosine search: {e}")

        # Python / NumPy Cosine Search (Works universally on SQLite & PostgreSQL)
        kb_query = db.query(KnowledgeBase)
        if category_filter:
            kb_query = kb_query.filter(KnowledgeBase.category == category_filter)
        all_docs = kb_query.all()

        scored_docs: List[Tuple[float, KnowledgeBase]] = []
        for doc in all_docs:
            if doc.embedding is not None:
                sim = embedding_service.cosine_similarity(query_embedding, doc.embedding)
            else:
                # Fallback to lexical token overlap if embedding not computed
                q_words = set(query.lower().split())
                d_words = set(f"{doc.title} {doc.content}".lower().split())
                overlap = len(q_words.intersection(d_words)) / max(len(q_words), 1)
                sim = float(overlap)

            # Also score lexical overlap
            q_words = set(query.lower().split())
            d_words = set(f"{doc.title} {doc.content}".lower().split())
            overlap = len(q_words.intersection(d_words)) / max(len(q_words), 1)
            final_score = max(sim, overlap * 0.5)

            if final_score >= self.threshold:
                scored_docs.append((final_score, doc))

        # Check PolicyDocument table as well if KnowledgeBase yields few hits
        if len(scored_docs) < k:
            from app.database.models import PolicyDocument
            policies = db.query(PolicyDocument).filter(PolicyDocument.is_active == True).all()
            for pol in policies:
                q_words = set(query.lower().split())
                p_words = set(f"{pol.title} {pol.content}".lower().split())
                overlap = len(q_words.intersection(p_words)) / max(len(q_words), 1)
                if overlap > 0.1:
                    scored_docs.append((overlap, pol))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        top_docs = scored_docs[:k]

        return [
            {
                "id": doc.id,
                "title": doc.title,
                "content": doc.content,
                "category": doc.category,
                "source": doc.source,
                "similarity": round(sim, 4)
            }
            for sim, doc in top_docs
        ]

rag_engine = RAGEngine()

# ─────────────────────────────────────────────────────────────────────────────
# Backward-compatibility helpers for legacy routes (/api/policies/ask)
# ─────────────────────────────────────────────────────────────────────────────

def retrieve_relevant_policies(db: Session, question: str, top_k: int = 3) -> List[Any]:
    from app.database.models import PolicyDocument
    hits = rag_engine.retrieve(db, question, top_k=top_k)
    titles = [h["title"] for h in hits]
    docs = db.query(PolicyDocument).filter(PolicyDocument.title.in_(titles)).all()
    if not docs:
        docs = db.query(PolicyDocument).limit(top_k).all()
    return docs

async def async_answer_policy_question(db: Session, question: str, top_k: int = 3) -> Dict[str, Any]:
    from app.ai.llm_provider import get_llm_provider

    hits = rag_engine.retrieve(db, question, top_k=top_k)
    context_text = "\n\n".join([f"[{h['title']}]: {h['content']}" for h in hits])
    sources_used = [h["title"] for h in hits]

    system_prompt = (
        "You are SmartMart's authoritative store policy assistant. "
        "Answer the user's inquiry strictly based on the verified policy clauses provided below. "
        "If a specific detail is not covered, advise them to visit the Customer Service Desk at Aisle 1.\n\n"
        f"STORE POLICIES CONTEXT:\n{context_text}"
    )

    provider = get_llm_provider()
    try:
        answer = await provider.generate(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=600
        )
    except Exception as e:
        logger.warning(f"Llama policy completion fallback: {e}")
        answer = (
            f"Based on SmartMart store records: {hits[0]['content'] if hits else 'Please consult our store manager at Aisle 1.'}"
        )

    return {
        "answer": answer,
        "sources_used": sources_used,
        "retrieved_count": len(hits)
    }

def answer_policy_question(db: Session, question: str, top_k: int = 3) -> Dict[str, Any]:
    from app.ai.llm_provider import get_llm_provider
    import asyncio

    hits = rag_engine.retrieve(db, question, top_k=top_k)
    context_text = "\n\n".join([f"[{h['title']}]: {h['content']}" for h in hits])
    sources_used = [h["title"] for h in hits]

    system_prompt = (
        "You are SmartMart's authoritative store policy assistant. "
        "Answer the user's inquiry strictly based on the verified policy clauses provided below. "
        "If a specific detail is not covered, advise them to visit the Customer Service Desk at Aisle 1.\n\n"
        f"STORE POLICIES CONTEXT:\n{context_text}"
    )

    provider = get_llm_provider()
    try:
        answer = asyncio.run(provider.generate(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=600
        ))
    except Exception as e:
        logger.warning(f"Llama policy completion fallback: {e}")
        answer = (
            f"Based on SmartMart store records: {hits[0]['content'] if hits else 'Please consult our store manager at Aisle 1.'}"
        )

    return {
        "answer": answer,
        "sources_used": sources_used,
        "retrieved_count": len(hits)
    }

