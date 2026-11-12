from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CartItemCreate(BaseModel):
    product_id: int = Field(..., ge=1, description="ID of product to add")
    quantity: int = Field(1, ge=1, description="Quantity to add")
    session_id: Optional[str] = Field(None, description="Guest session identifier")

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, description="New quantity (0 removes item)")
    session_id: Optional[str] = Field(None, description="Guest session identifier")

class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    image_url: Optional[str] = None
    aisle: Optional[str] = "1"
    quantity: int
    stock_available: int
    item_total: float

class CartOut(BaseModel):
    id: int
    session_id: Optional[str] = None
    items: List[CartItemOut] = []
    item_count: int = 0
    subtotal: float = 0.0
    delivery_fee: float = 0.0
    tax: float = 0.0
    grand_total: float = 0.0
    free_delivery_eligible: bool = False
