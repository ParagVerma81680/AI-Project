import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import get_optional_current_user, require_admin_user
from app.database.models import User, Product, Cart, CartItem, Order, OrderItem
from app.schemas.order import CheckoutRequest, OrderOut, OrderList, OrderStatusUpdate
from app.core.websocket_manager import ws_manager
from app.api.routes.cart import get_or_create_cart

router = APIRouter(prefix="/orders", tags=["Order Management & Checkout"])

def generate_order_number() -> str:
    """Generates an order tracking identifier like SM-849102."""
    rnd = random.randint(100000, 999999)
    return f"SM-{rnd}"

@router.post("/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED, summary="Place order and reserve inventory (Transactional)")
async def checkout(
    payload: CheckoutRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    sid = payload.session_id or x_session_id
    cart = get_or_create_cart(db, current_user, sid)

    if not cart.items or len(cart.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your shopping cart is empty. Add products before checking out."
        )

    # Calculate financial totals
    subtotal = 0.0
    items_to_order = []

    # Transactional stock validation
    try:
        # Atomic stock verification loop
        for item in cart.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if not product or not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{item.product.name if item.product else 'Item'}' is currently unavailable."
                )

            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Only {product.stock} units remaining, but you requested {item.quantity}."
                )

            item_total = round(float(product.price) * item.quantity, 2)
            subtotal += item_total
            items_to_order.append((product, item.quantity, item_total))

        subtotal = round(subtotal, 2)
        delivery_fee = 0.0 if (subtotal >= 199.0) else 25.0
        tax = round(subtotal * 0.05, 2)
        total_amount = round(subtotal + delivery_fee + tax, 2)

        order_no = generate_order_number()

        # Create Order
        order = Order(
            order_number=order_no,
            user_id=current_user.id if current_user else None,
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            delivery_address=payload.delivery_address,
            delivery_instructions=payload.delivery_instructions,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax=tax,
            total_amount=total_amount,
            payment_method=payload.payment_method,
            payment_status="Paid (Demo Simulation)",
            status="Order Placed",
            estimated_delivery="10-15 mins"
        )
        db.add(order)
        db.flush()

        # Decrement inventory and record OrderItems
        affected_products = []
        for product, qty, item_tot in items_to_order:
            product.stock -= qty
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=float(product.price),
                quantity=qty,
                total_price=item_tot
            )
            db.add(order_item)
            affected_products.append((product.id, product.name, product.stock))

        # Clear cart
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

        # Commit transaction atomically
        db.commit()
        db.refresh(order)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order placement failed during inventory deduction: {str(e)}"
        )

    # Broadcast real-time stock updates over WebSocket to all active browser sessions
    for pid, pname, new_stock in affected_products:
        await ws_manager.broadcast_inventory_update(pid, pname, new_stock)

    await ws_manager.broadcast_order_created(order.order_number, order.total_amount)

    return order

@router.get("", response_model=List[OrderOut], summary="List orders for customer or admin")
def list_orders(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Order)
    if current_user and current_user.role == "admin":
        # Admin can view all orders
        orders = q.order_by(Order.created_at.desc()).all()
    elif current_user:
        # Customer views their account orders
        orders = q.filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    else:
        # Anonymous/guest orders
        orders = q.order_by(Order.created_at.desc()).limit(10).all()

    return orders

@router.get("/{order_id}", response_model=OrderOut, summary="Get order details and tracking status")
def get_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    # Support lookup by integer ID or order_number string
    if order_id.isdigit():
        order = db.query(Order).filter(Order.id == int(order_id)).first()
    else:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return order

@router.post("/{order_id}/cancel", response_model=OrderOut, summary="Cancel order and restore inventory (Policy compliant)")
async def cancel_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    if order_id.isdigit():
        order = db.query(Order).filter(Order.id == int(order_id)).first()
    else:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status in ["Delivered", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already {order.status.lower()} and cannot be cancelled."
        )

    if order.status in ["Ready for Dispatch", "Out for Delivery"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already out for delivery. Please refuse delivery upon arrival for refund."
        )

    # Eligible for cancellation — restore inventory atomically
    affected_products = []
    try:
        order.status = "Cancelled"
        for item in order.items:
            if item.product_id:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity
                    affected_products.append((product.id, product.name, product.stock))

        db.commit()
        db.refresh(order)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(e)}")

    # Broadcast restored inventory to all active customer sessions
    for pid, pname, new_stock in affected_products:
        await ws_manager.broadcast_inventory_update(pid, pname, new_stock)

    return order

@router.patch("/{order_id}/status", response_model=OrderOut, summary="Update order status (Admin)")
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    if order_id.isdigit():
        order = db.query(Order).filter(Order.id == int(order_id)).first()
    else:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
