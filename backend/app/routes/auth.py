"""
Auth router — provides authentication with security for the Admin Dimension.

Security rules:
  - Admin Dimension: Requires password 'CSE276'
  - Customer Dimension: Direct login, no password required
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

ADMIN_PASSWORD = "CSE276"


class LoginRequest(BaseModel):
    email:    Optional[str]  = Field(None, examples=["admin@smartmart.ai", "customer@smartmart.ai"])
    password: Optional[str]  = Field(None, description="Required for admin (must be 'CSE276'). Optional for customer.")
    role:     str            = Field("customer", description="'admin' or 'customer'")


class UserProfile(BaseModel):
    id:       int
    name:     str
    email:    str
    role:     str   # "admin" | "customer"
    title:    str
    avatar:   str


class LoginResponse(BaseModel):
    token:    str
    user:     UserProfile
    message:  str


DEMO_USERS = {
    "admin": UserProfile(
        id=1,
        name="Parag (Store Owner)",
        email="admin@smartmart.ai",
        role="admin",
        title="Store Administrator & AI Lead",
        avatar="👨‍💼",
    ),
    "customer": UserProfile(
        id=2,
        name="Shopper",
        email="customer@smartmart.ai",
        role="customer",
        title="SmartMart Customer",
        avatar="🛒",
    ),
}


@router.post("/login", response_model=LoginResponse, summary="Sign in as Admin or Customer")
def login(request: LoginRequest):
    role = request.role.strip().lower()

    if role == "admin":
        pwd = (request.password or "").strip().upper()
        if pwd != "CSE276":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access Denied: Invalid password.",
            )
        user = DEMO_USERS["admin"]
        token = "smartmart-admin-auth-token-verified-cse276"
        message = "Authenticated successfully as Store Administrator (Parag)."
    else:
        # Customer mode: Direct access, no password required
        user = DEMO_USERS["customer"]
        token = "smartmart-customer-session-token"
        message = "Welcome to SmartMart Customer Dimension!"

    return LoginResponse(
        token=token,
        user=user,
        message=message,
    )


@router.get("/me", response_model=UserProfile, summary="Get default active demo profile")
def get_current_user(role: str = "customer"):
    return DEMO_USERS.get(role, DEMO_USERS["customer"])


@router.get("/roles", summary="Get information about the two dimensions")
def get_roles_info():
    return {
        "dimensions": [
            {
                "id": "admin",
                "name": "Store Admin Dimension",
                "security": "Password Protected (Requires CSE276)",
                "for_who": "Store Manager (Parag)",
                "capabilities": [
                    "Full catalog management (Add, Edit, Delete)",
                    "Live inventory valuation & restock alerts",
                    "Store routing graph layout inspection",
                    "Policy documents database maintenance",
                    "AI systems health and diagnostics",
                ],
            },
            {
                "id": "customer",
                "name": "Customer Dimension",
                "security": "Open Access (No Password Required)",
                "for_who": "Store Shoppers & Public Visitors",
                "capabilities": [
                    "Browse & search products catalog",
                    "Calculate shortest path route with Dijkstra",
                    "Ask store policy questions (RAG grounded)",
                    "Get personalized generative product recommendations",
                    "Engage in Multi-Agent shopping dialogues",
                    "Benchmark AI paradigms across store queries",
                ],
            },
        ]
    }
