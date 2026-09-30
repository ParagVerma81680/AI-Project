"""
Products router — all HTTP endpoints for the product resource.

Endpoints:
  GET    /api/products            — list (paginated, filterable, searchable)
  GET    /api/products/{id}       — get one by ID
  GET    /api/products/barcode/{barcode} — get one by barcode
  POST   /api/products            — create a new product
  PUT    /api/products/{id}       — partial update
  DELETE /api/products/{id}       — delete

All business logic lives in app/services/product_service.py.
This file only handles HTTP: parsing input, calling the service, returning responses.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.product  import ProductCreate, ProductList, ProductOut, ProductUpdate
from app.services         import product_service
from app.models.product   import Product
from app.models.category  import Category

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/products/stats  — home page stats
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stats", summary="Store statistics for the home page")
def get_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    categories     = db.query(func.count(Category.id)).scalar()
    in_stock       = db.query(func.count(Product.id)).filter(Product.stock > 0).scalar()
    from sqlalchemy import distinct
    aisles = db.query(func.count(distinct(Product.aisle))).scalar()
    return {
        "total_products": total_products,
        "categories":     categories,
        "aisles":         aisles,
        "in_stock":       in_stock,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/products  — list all products (with pagination + filters)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=ProductList,
    summary="List products",
    description=(
        "Returns a paginated list of products. "
        "Optionally filter by `category_id`, search by `name`, or show only in-stock items."
    ),
)
def list_products(
    skip:        int           = Query(0,    ge=0,   description="Number of records to skip"),
    limit:       int           = Query(20,   ge=1, le=100, description="Max records to return"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search:      Optional[str] = Query(None, description="Search products by name"),
    in_stock:    Optional[bool]= Query(None, description="If true, only show products with stock > 0"),
    db: Session = Depends(get_db),
):
    products, total = product_service.get_all_products(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        search=search,
        in_stock=in_stock,
    )
    return ProductList(total=total, skip=skip, limit=limit, products=products)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/products/barcode/{barcode}  — look up by barcode
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/barcode/{barcode}",
    response_model=ProductOut,
    summary="Get product by barcode",
)
def get_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = product_service.get_product_by_barcode(db, barcode)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No product found with barcode '{barcode}'.",
        )
    return product


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/products/{id}  — get one by primary key
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{product_id}",
    response_model=ProductOut,
    summary="Get product by ID",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/products  — create
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product",
)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    try:
        return product_service.create_product(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/products/{id}  — partial update
# ─────────────────────────────────────────────────────────────────────────────

@router.put(
    "/{product_id}",
    response_model=ProductOut,
    summary="Update a product",
    description="Send only the fields you want to change — all fields are optional.",
)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
):
    try:
        updated = product_service.update_product(db, product_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return updated


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/products/{id}  — hard delete
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    deleted = product_service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
