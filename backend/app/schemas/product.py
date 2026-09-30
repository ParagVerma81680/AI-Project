"""
Pydantic schemas for the Product resource.

Schemas are the "shape" of data at the HTTP boundary:
  - CategoryBase / CategoryOut   — for category responses
  - ProductBase                  — shared fields
  - ProductCreate                — what you send in POST body
  - ProductUpdate                — what you send in PUT body (all fields optional)
  - ProductOut                   — what the API returns
  - ProductList                  — paginated list wrapper
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ─────────────────────────────────────────────────────────────────────────────
# Category schemas
# ─────────────────────────────────────────────────────────────────────────────

class CategoryOut(BaseModel):
    """Lightweight category object embedded inside product responses."""
    id:   int
    name: str

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# Product schemas
# ─────────────────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    """Fields shared by create and update schemas."""
    name:        str   = Field(...,  min_length=1, max_length=200, examples=["Whole Milk"])
    brand:       Optional[str]  = Field(None, max_length=100,      examples=["FreshFarm"])
    description: Optional[str] = Field(None,                       examples=["Full-fat whole milk, 1 litre"])
    barcode:     Optional[str] = Field(None, max_length=50,        examples=["8901234567890"])
    price:       float         = Field(...,  ge=0.0,               examples=[49.99])
    stock:       int           = Field(...,  ge=0,                 examples=[100])
    is_active:   bool          = Field(True)
    aisle:       Optional[str] = Field(None, max_length=10,        examples=["A3"])
    shelf:       Optional[str] = Field(None, max_length=10,        examples=["Mid"])
    category_id: Optional[int] = Field(None,                       examples=[1])


class ProductCreate(ProductBase):
    """Request body for POST /api/products."""
    pass


class ProductUpdate(BaseModel):
    """
    Request body for PUT /api/products/{id}.
    Every field is optional — send only what you want to change.
    """
    name:        Optional[str]   = Field(None, min_length=1, max_length=200)
    brand:       Optional[str]   = Field(None, max_length=100)
    description: Optional[str]  = None
    barcode:     Optional[str]   = Field(None, max_length=50)
    price:       Optional[float] = Field(None, ge=0.0)
    stock:       Optional[int]   = Field(None, ge=0)
    is_active:   Optional[bool]  = None
    aisle:       Optional[str]   = Field(None, max_length=10)
    shelf:       Optional[str]   = Field(None, max_length=10)
    category_id: Optional[int]   = None


class ProductOut(ProductBase):
    """Response body returned by all product endpoints."""
    id:         int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category:   Optional[CategoryOut] = None

    model_config = ConfigDict(from_attributes=True)


class ProductList(BaseModel):
    """Paginated product list response."""
    total:    int
    skip:     int
    limit:    int
    products: list[ProductOut]
