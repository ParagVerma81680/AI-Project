"""
SmartMart Autonomous AI Retail Store Assistant
FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.connection import init_db

# Legacy & Core Retail Routers (preserves all working features)
from app.routes import (
    health, products, route_planner, policies, recommendations, agents, comparison, auth, admin
)

# New Meta Llama AI & Database Routers
from app.api.routes import (
    chat as ai_chat,
    conversations as ai_conversations,
    memory as ai_memory,
    knowledge as ai_knowledge,
    inventory as ai_inventory,
    analytics as ai_analytics,
    users as ai_users,
    cart as retail_cart,
    orders as retail_orders,
    ws as retail_ws,
    smartbot as central_smartbot
)

setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Next-generation Meta Llama powered AI assistant with long-term memory, "
        "vector RAG retrieval, controlled tool calling, and dual-dimension retail operations."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup() -> None:
    """Initializes tables, pgvector extensions, and seeds initial data."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER} | Active Model: {settings.LLAMA_MODEL}")
    init_db()

# ─────────────────────────────────────────────────────────────────────────────
# 1. New Autonomous AI Routers
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(ai_chat.router,          prefix="/api")
app.include_router(ai_conversations.router, prefix="/api")
app.include_router(ai_memory.router,        prefix="/api")
app.include_router(ai_knowledge.router,     prefix="/api")
app.include_router(ai_inventory.router,     prefix="/api")
app.include_router(ai_analytics.router,     prefix="/api")
app.include_router(ai_users.router,         prefix="/api")
app.include_router(retail_cart.router,      prefix="/api")
app.include_router(retail_orders.router,    prefix="/api")
app.include_router(retail_ws.router,        prefix="/api")
app.include_router(central_smartbot.router, prefix="/api")

# ─────────────────────────────────────────────────────────────────────────────
# 2. Existing Core Retail Store Routers (100% Backward Compatibility)
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(health.router,           prefix="/api",                 tags=["Health"])
app.include_router(products.router,         prefix="/api/products",        tags=["Products Catalog"])
app.include_router(route_planner.router,    prefix="/api/routes",          tags=["Route Planning"])
app.include_router(policies.router,         prefix="/api/policies",        tags=["Policies & RAG"])
app.include_router(recommendations.router,  prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(agents.router,           prefix="/api/agents",          tags=["Multi-Agent System"])
app.include_router(comparison.router,       prefix="/api/comparison",      tags=["AI Paradigm Comparison"])
app.include_router(auth.router,             prefix="/api/auth",            tags=["Authentication & Dimensions"])
app.include_router(admin.router,            prefix="/api/admin",           tags=["Store Administration"])
