"""
Claude API client — thin wrapper around the Anthropic Python SDK.

Design principles:
  - API key is ALWAYS read from settings (never hardcoded)
  - Raises a clear error if the key is missing
  - A single `chat()` function covers all use cases in this project
  - Model name is configurable via .env (CLAUDE_MODEL)

Usage:
    from app.ai.claude_client import chat

    response = chat(
        system="You are a helpful store assistant.",
        user="What is the return policy?",
    )
    print(response)  # → "You can return items within 30 days..."
"""

from anthropic import Anthropic, APIConnectionError, APIStatusError
from fastapi   import HTTPException, status

from app.config import settings


def _get_client() -> Anthropic:
    """
    Create and return an Anthropic client.
    Raises HTTP 503 if the API key is not configured.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Claude API key is not configured. "
                "Set ANTHROPIC_API_KEY in your .env file."
            ),
        )
    return Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def chat(
    user:        str,
    system:      str  = "You are a helpful retail store assistant.",
    max_tokens:  int  = 1024,
    temperature: float = 0.3,
) -> str:
    """
    Send a single-turn message to Claude and return the text response.

    Args:
        user:        The user's message / question.
        system:      The system prompt (persona + instructions).
        max_tokens:  Max length of Claude's response.
        temperature: 0 = deterministic, 1 = creative. Keep low for factual Q&A.

    Returns:
        Claude's response as a plain string.

    Raises:
        HTTPException 503 — if API key not set.
        HTTPException 502 — if Claude API call fails.
    """
    client = _get_client()

    try:
        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return message.content[0].text

    except APIConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to Claude API: {exc}",
        )
    except APIStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Claude API error {exc.status_code}: {exc.message}",
        )
