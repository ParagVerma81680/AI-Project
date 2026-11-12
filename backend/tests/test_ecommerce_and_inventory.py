import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Product, Cart, CartItem, Order, OrderItem

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

# ==============================================================================
# TEST 1 — SHOPPING CART OPERATIONS
# ==============================================================================
def test_cart_operations(db_session):
    product = db_session.query(Product).filter(Product.stock > 10).first()
    assert product is not None

    session_id = "test-session-clean-cart-1"
    # Ensure fresh cart state
    client.delete(f"/api/cart?session_id={session_id}")

    # 1. Add product to cart
    add_resp = client.post(
        "/api/cart/items",
        json={"product_id": product.id, "quantity": 2, "session_id": session_id}
    )
    assert add_resp.status_code == 200
    cart_data = add_resp.json()
    assert cart_data["item_count"] == 2
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["quantity"] == 2
    item_id = cart_data["items"][0]["id"]

    # 2. Increase quantity
    update_resp = client.put(
        f"/api/cart/items/{item_id}",
        json={"quantity": 3, "session_id": session_id}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["items"][0]["quantity"] == 3

    # 3. Decrease quantity
    dec_resp = client.put(
        f"/api/cart/items/{item_id}",
        json={"quantity": 1, "session_id": session_id}
    )
    assert dec_resp.status_code == 200
    assert dec_resp.json()["items"][0]["quantity"] == 1

    # 4. Remove item
    del_resp = client.delete(
        f"/api/cart/items/{item_id}?session_id={session_id}"
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["item_count"] == 0

    # 5. Clear cart
    clear_resp = client.delete(f"/api/cart?session_id={session_id}")
    assert clear_resp.status_code == 200
    assert clear_resp.json()["item_count"] == 0


# ==============================================================================
# TEST 2 & 3 — REAL INVENTORY & MULTIPLE CUSTOMER SESSIONS
# ==============================================================================
def test_multiple_customers_and_inventory_consistency(db_session):
    test_prod = db_session.query(Product).filter(Product.name == "Amul Taaza Whole Milk 1L").first()
    if not test_prod:
        test_prod = db_session.query(Product).first()

    test_prod.stock = 10
    db_session.commit()
    db_session.refresh(test_prod)
    assert test_prod.stock == 10

    # Customer Session A
    session_a = "cust-session-clean-A"
    client.delete(f"/api/cart?session_id={session_a}")

    add_a = client.post(
        "/api/cart/items",
        json={"product_id": test_prod.id, "quantity": 2, "session_id": session_a}
    )
    assert add_a.status_code == 200

    order_a_resp = client.post(
        "/api/orders/checkout",
        json={
            "customer_name": "Customer A",
            "customer_phone": "9876543210",
            "delivery_address": "Flat 402, Green Valley Apartments",
            "delivery_instructions": "Leave at door",
            "session_id": session_a
        }
    )
    assert order_a_resp.status_code == 201

    # Stock in database must be exactly 8
    db_session.refresh(test_prod)
    assert test_prod.stock == 8

    # Customer Session B checks product
    inv_check = client.get(f"/api/products/{test_prod.id}")
    assert inv_check.status_code == 200
    assert inv_check.json()["stock"] == 8

    # Session B buys 3
    session_b = "cust-session-clean-B"
    client.delete(f"/api/cart?session_id={session_b}")
    add_b = client.post(
        "/api/cart/items",
        json={"product_id": test_prod.id, "quantity": 3, "session_id": session_b}
    )
    assert add_b.status_code == 200

    order_b_resp = client.post(
        "/api/orders/checkout",
        json={
            "customer_name": "Customer B",
            "customer_phone": "9123456780",
            "delivery_address": "Tower 3, Skyline Heights",
            "session_id": session_b
        }
    )
    assert order_b_resp.status_code == 201

    # Final stock must be 5
    db_session.refresh(test_prod)
    assert test_prod.stock == 5


# ==============================================================================
# TEST 4 — ATOMIC CONCURRENCY / PREVENT OVERSELLING
# ==============================================================================
def test_overselling_prevention(db_session):
    test_prod = db_session.query(Product).first()
    test_prod.stock = 1
    db_session.commit()

    s1 = "session-race-clean-1"
    s2 = "session-race-clean-2"
    client.delete(f"/api/cart?session_id={s1}")
    client.delete(f"/api/cart?session_id={s2}")

    # Session 1 adds 1 unit to cart
    res1 = client.post("/api/cart/items", json={"product_id": test_prod.id, "quantity": 1, "session_id": s1})
    assert res1.status_code == 200

    # Session 2 adds 1 unit to cart
    res2 = client.post("/api/cart/items", json={"product_id": test_prod.id, "quantity": 1, "session_id": s2})
    assert res2.status_code == 200

    # Session 1 checks out first -> succeeds
    checkout1 = client.post("/api/orders/checkout", json={
        "customer_name": "First Buyer",
        "customer_phone": "9999911111",
        "delivery_address": "123 Main St",
        "session_id": s1
    })
    assert checkout1.status_code == 201

    # Session 2 checks out -> MUST FAIL with 400 Insufficient stock
    checkout2 = client.post("/api/orders/checkout", json={
        "customer_name": "Second Buyer",
        "customer_phone": "9999922222",
        "delivery_address": "456 Side St",
        "session_id": s2
    })
    assert checkout2.status_code == 400
    assert "insufficient stock" in checkout2.json()["detail"].lower()


# ==============================================================================
# TEST 5 — ORDER CANCELLATION RESTORES STOCK
# ==============================================================================
def test_order_cancellation_restores_stock(db_session):
    test_prod = db_session.query(Product).first()
    test_prod.stock = 20
    db_session.commit()

    s = "cancel-test-clean-session"
    client.delete(f"/api/cart?session_id={s}")
    client.post("/api/cart/items", json={"product_id": test_prod.id, "quantity": 4, "session_id": s})
    order_resp = client.post("/api/orders/checkout", json={
        "customer_name": "Cancel Customer",
        "customer_phone": "9988776655",
        "delivery_address": "789 Park Lane",
        "session_id": s
    })
    assert order_resp.status_code == 201
    ord_data = order_resp.json()
    order_num = ord_data["order_number"]

    # Stock was deducted to 16
    db_session.refresh(test_prod)
    assert test_prod.stock == 16

    # Cancel the order
    cancel_resp = client.post(f"/api/orders/{order_num}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "Cancelled"

    # Stock must be restored to 20!
    db_session.refresh(test_prod)
    assert test_prod.stock == 20


# ==============================================================================
# TEST 6 — STORE ROUTE PLANNER (GREEDY VS DIJKSTRA)
# ==============================================================================
def test_store_route_planner():
    from app.ai.route_planner import route_planner
    db = SessionLocal()
    result = route_planner.plan_route(db, ["Milk", "Bread", "Chips", "Apples"])
    db.close()

    assert "stops" in result
    assert "comparison" in result
    assert "greedy_nearest_neighbour" in result["comparison"]
    assert "dijkstra_graph_search" in result["comparison"]
    assert result["items_found"] > 0
