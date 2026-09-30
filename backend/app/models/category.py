"""
Category ORM model.

A category groups related products (e.g. "Dairy", "Bakery", "Electronics").
Each product belongs to exactly one category.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.session import Base


class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    # One category → many products
    products = relationship("Product", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r}>"
