import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user
from app.database.models import User, Product, Cart, CartItem
from app.schemas.cart import CartOut, CartItemCreate, CartItemUpdate, CartItemOut

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

def get_or_create_cart(
    db: Session,
    current_user: Optional[User] = None,
    session_id: Optional[str] = None
) -> Cart:
    """Finds or creates a shopping cart for an authenticated user or guest session."""
    cart = None
    if current_user:
        cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
        if not cart and session_id:
            # Adopt guest cart if exists
            cart = db.query(Cart).filter(Cart.session_id == session_id).first()
            if cart:
                cart.user_id = current_user.id
                db.commit()
                db.refresh(cart)
    elif session_id:
        cart = db.query(Cart).filter(Cart.session_id == session_id).first()

    if not cart:
        new_session = session_id or str(uuid.uuid4())
        cart = Cart(
            user_id=current_user.id if current_user else None,
            session_id=new_session
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart

def format_cart_out(cart: Cart) -> CartOut:
    items_out = []
    subtotal = 0.0

    for item in cart.items:
        p = item.product
        if not p:
            continue
        item_tot = round(float(p.price) * item.quantity, 2)
        subtotal += item_tot
        items_out.append(CartItemOut(
            id=item.id,
            product_id=p.id,
            product_name=p.name,
            price=float(p.price),
            image_url=p.image_url,
            aisle=str(p.aisle or "1"),
            quantity=item.quantity,
            stock_available=p.stock,
            item_total=item_tot
        ))

    subtotal = round(subtotal, 2)
    # Free delivery for orders >= ₹199, otherwise ₹25
    delivery_fee = 0.0 if (subtotal >= 199.0 or subtotal == 0) else 25.0
    tax = round(subtotal * 0.05, 2)  # 5% GST
    grand_total = round(subtotal + delivery_fee + tax, 2)

    return CartOut(
        id=cart.id,
        session_id=cart.session_id,
        items=items_out,
        item_count=sum(i.quantity for i in cart.items),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax=tax,
        grand_total=grand_total,
        free_delivery_eligible=(subtotal >= 199.0 and subtotal > 0)
    )

@router.get("", response_model=CartOut, summary="Get current shopping cart")
def get_cart(
    session_id: Optional[str] = Query(None, description="Guest session ID"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)
    return format_cart_out(cart)

@router.post("/items", response_model=CartOut, summary="Add item to shopping cart")
def add_to_cart(
    payload: CartItemCreate,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = payload.session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)

    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or inactive")

    # Check stock
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()

    current_qty = existing_item.quantity if existing_item else 0
    new_qty = current_qty + payload.quantity

    if new_qty > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add {payload.quantity}. Only {product.stock} units of {product.name} available in stock."
        )

    if existing_item:
        existing_item.quantity = new_qty
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=payload.quantity
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return format_cart_out(cart)

@router.put("/items/{item_id}", response_model=CartOut, summary="Update quantity of cart item")
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = payload.session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)

    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if payload.quantity <= 0:
        db.delete(item)
    else:
        # Check product stock
        product = item.product
        if product and payload.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock} units available in stock."
            )
        item.quantity = payload.quantity

    db.commit()
    db.refresh(cart)
    return format_cart_out(cart)

@router.delete("/items/{item_id}", response_model=CartOut, summary="Remove item from cart")
def remove_cart_item(
    item_id: int,
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)

    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    if item:
        db.delete(item)
        db.commit()
        db.refresh(cart)

    return format_cart_out(cart)

@router.delete("", response_model=CartOut, summary="Clear entire cart")
def clear_cart(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(cart)
    return format_cart_out(cart)
