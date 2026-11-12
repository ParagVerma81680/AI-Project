from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import require_admin_user
from app.database.models import Product, User

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

class RestockPayload(BaseModel):
    quantity: int = Field(..., ge=1, description="Quantity to add to stock")

@router.get("", summary="Get inventory status across aisles")
def get_inventory(
    low_stock_only: bool = Query(False, description="Filter for products with stock < 15"),
    aisle: Optional[int] = Query(None, description="Filter by Aisle number (1-4)"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    q = db.query(Product).filter(Product.is_active == True)
    if low_stock_only:
        q = q.filter(Product.stock < 15)
    if aisle is not None:
        q = q.filter(Product.aisle == aisle)

    products = q.order_by(Product.aisle, Product.name).all()
    return [
        {
            "id": p.id,
            "product_name": p.product_name,
            "category": p.category,
            "stock_quantity": p.stock_quantity,
            "price": p.price,
            "aisle": p.aisle,
            "shelf_tier": p.shelf_tier,
            "barcode": p.barcode,
            "status": "In Stock" if p.stock_quantity > 15 else ("Low Stock" if p.stock_quantity > 0 else "Out of Stock")
        }
        for p in products
    ]

@router.post("/{product_id}/restock", summary="Restock product inventory (Admin)")
async def restock_product(
    product_id: int,
    payload: RestockPayload,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.stock_quantity += payload.quantity
    db.commit()
    db.refresh(product)

    from app.core.websocket_manager import ws_manager
    await ws_manager.broadcast_inventory_update(product.id, product.name, product.stock)

    return {
        "message": f"Successfully added {payload.quantity} units to {product.product_name}.",
        "product_id": product.id,
        "new_stock": product.stock_quantity
    }
