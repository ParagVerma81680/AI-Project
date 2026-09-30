"""
Product service — all database operations for products.

Routes call these functions; they never touch the DB directly.
This keeps HTTP concerns (status codes, request parsing) separate from
business logic and makes unit testing much easier.
"""

from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.product  import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate


# ─────────────────────────────────────────────────────────────────────────────
# READ
# ─────────────────────────────────────────────────────────────────────────────

def get_all_products(
    db: Session,
    skip:        int           = 0,
    limit:       int           = 20,
    category_id: Optional[int] = None,
    search:      Optional[str] = None,
    in_stock:    Optional[bool] = None,
) -> tuple[list[Product], int]:
    """
    Return a paginated list of products plus the total count.

    Args:
        skip:        How many rows to skip (for pagination).
        limit:       Max rows to return.
        category_id: Filter by category (optional).
        search:      Case-insensitive substring search on product name (optional).
        in_stock:    If True, only return products with stock > 0.

    Returns:
        (list_of_products, total_count)
    """
    query = db.query(Product).options(joinedload(Product.category))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if in_stock is True:
        query = query.filter(Product.stock > 0)

    total = query.count()
    products = query.order_by(Product.id).offset(skip).limit(limit).all()
    return products, total


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Return a single product by primary key, or None if not found."""
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )


def get_product_by_barcode(db: Session, barcode: str) -> Optional[Product]:
    """Return a product by its barcode, or None if not found."""
    return db.query(Product).filter(Product.barcode == barcode).first()


# ─────────────────────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────────────────────

def create_product(db: Session, data: ProductCreate) -> Product:
    """
    Insert a new product row.

    Raises:
        ValueError: if a product with the same barcode already exists.
    """
    if data.barcode and get_product_by_barcode(db, data.barcode):
        raise ValueError(f"A product with barcode '{data.barcode}' already exists.")

    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

def update_product(
    db: Session, product_id: int, data: ProductUpdate
) -> Optional[Product]:
    """
    Partially update a product (only fields explicitly set in `data`).

    Returns:
        Updated Product, or None if not found.
    """
    product = get_product_by_id(db, product_id)
    if not product:
        return None

    # Only apply fields that were actually provided in the request body
    updates = data.model_dump(exclude_unset=True)

    # Guard against duplicate barcode collisions on update
    new_barcode = updates.get("barcode")
    if new_barcode and new_barcode != product.barcode:
        existing = get_product_by_barcode(db, new_barcode)
        if existing:
            raise ValueError(f"A product with barcode '{new_barcode}' already exists.")

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────

def delete_product(db: Session, product_id: int) -> bool:
    """
    Hard-delete a product row.

    Returns:
        True if the product existed and was deleted, False otherwise.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_category(db: Session, name: str) -> Category:
    """Return existing category by name, or create it."""
    cat = db.query(Category).filter(Category.name == name).first()
    if not cat:
        cat = Category(name=name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat
