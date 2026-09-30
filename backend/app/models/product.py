"""
Product ORM model.

Each product maps to a row in the `products` table and holds:
  - basic info  (name, brand, description, price, stock)
  - location    (aisle, shelf) — used by the route-planning module later
  - category FK — joins to the categories table
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    ForeignKey, Text, DateTime, func,
)
from sqlalchemy.orm import relationship

from app.database.session import Base


class Product(Base):
    __tablename__ = "products"

    # ------------------------------------------------------------------
    # Primary key
    # ------------------------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)

    # ------------------------------------------------------------------
    # Basic product info
    # ------------------------------------------------------------------
    name        = Column(String(200), nullable=False, index=True)
    brand       = Column(String(100), nullable=True)
    description = Column(Text,        nullable=True)
    barcode     = Column(String(50),  unique=True, nullable=True, index=True)

    # ------------------------------------------------------------------
    # Pricing & inventory
    # ------------------------------------------------------------------
    price    = Column(Float,   nullable=False, default=0.0)
    stock    = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    # ------------------------------------------------------------------
    # Store location — used by Dijkstra/A* route planner in Phase 2
    # ------------------------------------------------------------------
    aisle = Column(String(10),  nullable=True)   # e.g. "A3", "B7"
    shelf = Column(String(10),  nullable=True)   # e.g. "Top", "Mid", "Bot"

    # ------------------------------------------------------------------
    # Category foreign key
    # ------------------------------------------------------------------
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category    = relationship("Category", back_populates="products")

    # ------------------------------------------------------------------
    # Timestamps (set automatically by the database)
    # ------------------------------------------------------------------
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r} aisle={self.aisle!r}>"
