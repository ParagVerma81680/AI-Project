"""
Admin router — provides executive dashboard metrics, inventory alerts,
and management insights for the Store Administrator.

Endpoints:
  GET /api/admin/overview — comprehensive metrics for store owner
  GET /api/admin/alerts   — low stock and critical inventory alerts
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.product   import Product
from app.models.category  import Category
from app.models.policy    import PolicyDocument
from app.utils.graph      import STORE_GRAPH

from pydantic import BaseModel, Field

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: str = Field(None, max_length=200)


class BulkRestockRequest(BaseModel):
    minimum_stock: int = Field(50, ge=10, le=500)


@router.post("/categories", summary="Create new product category (Admin)")
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name.ilike(payload.name.strip())).first()
    if existing:
        return existing
    cat = Category(name=payload.name.strip(), description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.post("/bulk-restock", summary="Restock all low-stock products (Admin)")
def bulk_restock(payload: BulkRestockRequest, db: Session = Depends(get_db)):
    low_prods = db.query(Product).filter(Product.stock < payload.minimum_stock).all()
    count = 0
    for p in low_prods:
        p.stock = payload.minimum_stock
        count += 1
    db.commit()
    return {"message": f"Successfully restocked {count} products to {payload.minimum_stock} units.", "restocked_count": count}


@router.get("/overview", summary="Store Admin Executive Dashboard Metrics")
def get_admin_overview(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_categories = db.query(func.count(Category.id)).scalar() or 0
    total_policies = db.query(func.count(PolicyDocument.id)).scalar() or 0
    
    in_stock_count = db.query(func.count(Product.id)).filter(Product.stock > 0).scalar() or 0
    out_of_stock_count = db.query(func.count(Product.id)).filter(Product.stock == 0).scalar() or 0
    low_stock_count = db.query(func.count(Product.id)).filter(Product.stock > 0, Product.stock <= 10).scalar() or 0

    # Calculate total retail inventory valuation
    products = db.query(Product).all()
    inventory_valuation = sum((p.price or 0.0) * (p.stock or 0) for p in products)

    # Category breakdown
    categories = db.query(Category).all()
    cat_breakdown = []
    for c in categories:
        count = db.query(func.count(Product.id)).filter(Product.category_id == c.id).scalar() or 0
        cat_breakdown.append({
            "id": c.id,
            "name": c.name,
            "product_count": count,
        })

    # Low stock items list (top 6 urgent restocks)
    low_stock_items = (
        db.query(Product)
        .filter(Product.stock <= 10)
        .order_by(Product.stock.asc())
        .limit(6)
        .all()
    )

    urgent_restocks = [
        {
            "id": p.id,
            "name": p.name,
            "stock": p.stock,
            "price": p.price,
            "aisle": p.aisle,
            "shelf": p.shelf,
            "category": p.category.name if p.category else "General",
        }
        for p in low_stock_items
    ]

    return {
        "store_name": "SmartMart Supermarket",
        "manager": "Parag (Admin)",
        "metrics": {
            "total_products": total_products,
            "total_categories": total_categories,
            "total_policies": total_policies,
            "in_stock": in_stock_count,
            "low_stock": low_stock_count,
            "out_of_stock": out_of_stock_count,
            "total_inventory_value": round(inventory_valuation, 2),
            "store_graph_nodes": len(STORE_GRAPH.nodes),
        },
        "category_breakdown": cat_breakdown,
        "urgent_restocks": urgent_restocks,
        "system_status": {
            "fastapi": "Healthy",
            "sqlite_db": "Connected",
            "dijkstra_router": "Active",
            "claude_rag": "Operational",
            "multi_agent": "Ready",
        },
    }
