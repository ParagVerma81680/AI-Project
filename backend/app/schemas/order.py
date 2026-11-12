from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True

class CheckoutRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=128)
    customer_phone: str = Field(..., min_length=7, max_length=20)
    delivery_address: str = Field(..., min_length=5)
    delivery_instructions: Optional[str] = None
    payment_method: str = Field("Demo Simulation (Cash on Delivery)", description="Payment method")
    session_id: Optional[str] = Field(None, description="Guest session identifier")

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="New order status")

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_instructions: Optional[str] = None
    subtotal: float
    delivery_fee: float
    tax: float
    total_amount: float
    payment_method: str
    payment_status: str
    status: str
    estimated_delivery: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True

class OrderList(BaseModel):
    total: int
    orders: List[OrderOut]
