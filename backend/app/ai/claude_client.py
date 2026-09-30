"""
AI client wrapper supporting both Groq (Llama 3.3) and Anthropic Claude.

Design:
  - If GROQ_API_KEY is configured in .env, calls Groq API (super fast, free).
  - If ANTHROPIC_API_KEY is configured in .env, calls Claude API.
  - A single chat() function covers RAG policy Q&A, recommendations, MAS, and comparisons.
"""

import httpx
from fastapi import HTTPException, status
from app.config import settings


def chat(
    user:        str,
    system:      str  = "You are a helpful retail store assistant.",
    max_tokens:  int  = 1024,
    temperature: float = 0.3,
) -> str:
    """
    Send a prompt to the configured AI provider (Groq or Claude) and return text response.
    """
    # ── 1. Check Groq API (Primary if configured) ─────────────────────────────
    if settings.GROQ_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=f"Groq API Error: {resp.text}",
                    )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to Groq API: {str(e)}",
            )

    # ── 2. Check Anthropic Claude API ─────────────────────────────────────────
    if settings.ANTHROPIC_API_KEY:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.ANTHROPIC_API_KEY.strip())
            message = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return message.content[0].text
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Claude API Error: {str(e)}",
            )

    # ── 3. Neither key is configured ─────────────────────────────────────────
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "No AI API key is configured. "
            "Please set GROQ_API_KEY or ANTHROPIC_API_KEY in your backend/.env file."
        ),
    )
