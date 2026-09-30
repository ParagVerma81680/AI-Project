"""
AI-Based Smart Retail Store Assistant
Entry point for the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, products, route_planner, policies, recommendations, agents, comparison, auth, admin
from app.database.session import init_db

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI-Based Smart Retail Store Assistant",
    description=(
        "Backend API for the CSE276 college AI project. "
        "Supports product-finding routes, store-policy reasoning, "
        "multi-agent modelling, and grounded generative recommendations."
    ),
    version="0.1.0",
    docs_url="/docs",        # Swagger UI  →  http://localhost:8000/docs
    redoc_url="/redoc",      # ReDoc UI    →  http://localhost:8000/redoc
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — allow the React/Vite frontend during development
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup / shutdown events
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    """Initialise the database tables on first run."""
    init_db()


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(health.router,           prefix="/api",                 tags=["Health"])
app.include_router(products.router,         prefix="/api/products",        tags=["Products"])
app.include_router(route_planner.router,    prefix="/api/routes",          tags=["Route Planning"])
app.include_router(policies.router,         prefix="/api/policies",        tags=["Policies & AI"])
app.include_router(recommendations.router,  prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(agents.router,           prefix="/api/agents",          tags=["Multi-Agent System"])
app.include_router(comparison.router,       prefix="/api/comparison",      tags=["AI Paradigm Comparison"])
app.include_router(auth.router,             prefix="/api/auth",            tags=["Authentication & Dimensions"])
app.include_router(admin.router,            prefix="/api/admin",           tags=["Store Administration"])

# Future routers (uncomment as the project grows):
# app.include_router(policies.router,        prefix="/api/policies",        tags=["Policies"])
# app.include_router(routes.router,          prefix="/api/routes",          tags=["Route Planning"])
# app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
# app.include_router(agents.router,          prefix="/api/agents",          tags=["Agents"])

