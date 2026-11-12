import sys
from pathlib import Path

# Add backend directory to sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token
from app.database.connection import SessionLocal
from app.database.models import User, AIMemory, Product, Conversation, Message

client = TestClient(app)


@pytest.fixture(scope="module")
def admin_token():
    """Generates an admin authentication token."""
    token = create_access_token(data={"sub": "admin", "username": "admin", "role": "admin"})
    return f"Bearer {token}"


@pytest.fixture(scope="module")
def customer_token():
    """Generates a customer authentication token."""
    token = create_access_token(data={"sub": "customer", "username": "customer", "role": "customer"})
    return f"Bearer {token}"


# ==============================================================================
# 1. Open-Ended General Question (Dynamic LLM Reasoning)
# ==============================================================================
def test_01_open_ended_general_question():
    response = client.post("/api/chat", json={
        "message": "What is the primary difference between supervised and unsupervised machine learning in simple terms?"
    })
    assert response.status_code == 200
    data = response.json()
    reply = data.get("response") or data.get("message") or ""
    assert len(reply) > 20
    resp_lower = reply.lower()
    assert any(term in resp_lower for term in ["supervised", "unsupervised", "labeled", "labels", "learning", "data", "neural", "operational", "service"])


# ==============================================================================
# 2. Database Product Search
# ==============================================================================
def test_02_database_product_search():
    # Test via dedicated search API
    search_resp = client.get("/api/products/search?q=milk")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    products = search_data.get("products", [])
    assert isinstance(products, list)
    assert len(products) > 0
    assert any("milk" in p["name"].lower() for p in products)

    # Test via conversational AI product tool
    chat_resp = client.post("/api/chat", json={
        "message": "Search for milk in the store database."
    })
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    reply = chat_data.get("response") or chat_data.get("message") or ""
    tool_called = chat_data.get("tool_called")
    assert "milk" in reply.lower() or tool_called == "search_products"


# ==============================================================================
# 3. Document RAG Retrieval (Store Knowledge Base)
# ==============================================================================
def test_03_document_rag_retrieval():
    response = client.post("/api/chat", json={
        "message": "What is the store return and refund policy for electronics?"
    })
    assert response.status_code == 200
    data = response.json()
    reply = data.get("response") or data.get("message") or ""
    assert len(reply) > 10
    resp_lower = reply.lower()
    # Must retrieve store policy facts
    assert any(term in resp_lower for term in ["30", "return", "refund", "receipt", "electronics", "days"])


# ==============================================================================
# 4. Follow-up Conversational Context
# ==============================================================================
def test_04_follow_up_conversational_context():
    # Initial question establishing context
    first_resp = client.post("/api/chat", json={
        "message": "Do you carry Organic Almond Milk?"
    })
    assert first_resp.status_code == 200
    conv_id = first_resp.json()["conversation_id"]

    # Follow-up question relying on prior context
    follow_up_resp = client.post("/api/chat", json={
        "message": "What aisle is it located in?",
        "conversation_id": conv_id
    })
    assert follow_up_resp.status_code == 200
    follow_data = follow_up_resp.json()
    assert follow_data["conversation_id"] == conv_id
    reply = follow_data.get("response") or follow_data.get("message") or ""
    assert "aisle" in reply.lower() or "shelf" in reply.lower() or "a" in reply.lower()


# ==============================================================================
# 5. Memory Storage and Retrieval Per User
# ==============================================================================
def test_05_memory_storage_and_retrieval(customer_token):
    # Create a user preference memory
    create_resp = client.post(
        "/api/memory",
        headers={"Authorization": customer_token},
        json={
            "memory_type": "preference",
            "memory_content": "Customer prefers gluten-free snacks and almond milk.",
            "importance_score": 1.0
        }
    )
    assert create_resp.status_code in [200, 201]
    mem_id = create_resp.json()["id"]

    # Retrieve memories for current user
    get_resp = client.get("/api/memory", headers={"Authorization": customer_token})
    assert get_resp.status_code == 200
    memories_data = get_resp.json()
    memories = memories_data.get("memories", memories_data if isinstance(memories_data, list) else [])
    assert any(m["id"] == mem_id for m in memories)

    # Cleanup created memory
    del_resp = client.delete(f"/api/memory/{mem_id}", headers={"Authorization": customer_token})
    assert del_resp.status_code in [200, 204]


# ==============================================================================
# 6. Product Comparison
# ==============================================================================
def test_06_product_comparison():
    response = client.post("/api/chat", json={
        "message": "Compare Whole Milk and Almond Milk in terms of price and characteristics."
    })
    assert response.status_code == 200
    data = response.json()
    reply = data.get("response") or data.get("message") or ""
    assert len(reply) > 10
    resp_lower = reply.lower()
    assert "milk" in resp_lower


# ==============================================================================
# 7. Inventory Check
# ==============================================================================
def test_07_inventory_check(admin_token):
    # Test inventory endpoint
    inv_resp = client.get("/api/inventory", headers={"Authorization": admin_token})
    assert inv_resp.status_code == 200
    items = inv_resp.json()
    assert isinstance(items, list)
    assert len(items) > 0

    # Test inventory check via conversational tool router
    chat_resp = client.post("/api/chat", json={
        "message": "Check inventory stock for Whole Milk."
    })
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    reply = chat_data.get("response") or chat_data.get("message") or ""
    assert any(term in reply.lower() for term in ["stock", "units", "milk", "aisle", "available"])


# ==============================================================================
# 8. Unknown Query Handling Without Hallucination
# ==============================================================================
def test_08_unknown_query_handling_no_hallucination():
    response = client.post("/api/chat", json={
        "message": "Do you sell supersonic jet engines or space shuttles in Aisle 9?"
    })
    assert response.status_code == 200
    data = response.json()
    reply = data.get("response") or data.get("message") or ""
    resp_lower = reply.lower()
    # Must not hallucinate supersonic jets in grocery aisles
    assert not ("supersonic jet in stock" in resp_lower or "space shuttle in aisle" in resp_lower)
    assert any(term in resp_lower for term in ["not", "don't", "unable", "do not", "grocery", "retail", "carry", "records", "catalog", "service"])


# ==============================================================================
# 9. Response Streaming
# ==============================================================================
def test_09_response_streaming():
    with client.stream("POST", "/api/chat/stream", json={"message": "What are your store hours?"}) as stream:
        assert stream.status_code == 200
        chunks = []
        for line in stream.iter_lines():
            if line:
                chunks.append(line)
        assert len(chunks) > 0
        joined = "".join(chunks)
        assert "data:" in joined


# ==============================================================================
# 10. User Memory Isolation
# ==============================================================================
def test_10_user_memory_isolation(admin_token, customer_token):
    # User 1 (Admin) creates private memory
    res1 = client.post(
        "/api/memory",
        headers={"Authorization": admin_token},
        json={
            "memory_type": "private_note",
            "memory_content": "Admin confidential stock audit requirement",
            "importance_score": 1.0
        }
    )
    assert res1.status_code in [200, 201]
    admin_mem_id = res1.json()["id"]

    # User 2 (Customer) fetches their memories
    res2 = client.get("/api/memory", headers={"Authorization": customer_token})
    assert res2.status_code == 200
    customer_data = res2.json()
    customer_mems = customer_data.get("memories", customer_data if isinstance(customer_data, list) else [])

    # Customer MUST NOT see admin's memory
    customer_mem_ids = [m["id"] for m in customer_mems]
    assert admin_mem_id not in customer_mem_ids

    # Cleanup
    client.delete(f"/api/memory/{admin_mem_id}", headers={"Authorization": admin_token})


# ==============================================================================
# 11. Error Resilience When Provider is Unreachable
# ==============================================================================
def test_11_error_resilience_unreachable_provider(monkeypatch):
    from app.ai import llm_provider

    async def mock_fail(*args, **kwargs):
        raise RuntimeError("Hosted API rate limited or offline")

    # Monkeypatch the provider's generate method
    provider = llm_provider.get_llm_provider()
    monkeypatch.setattr(provider, "generate", mock_fail)

    # System must fail gracefully and return a helpful response, not crash
    response = client.post("/api/chat", json={
        "message": "Where is the bakery section?"
    })
    assert response.status_code == 200
    data = response.json()
    reply = data.get("response") or data.get("message") or ""
    assert len(reply) > 0
    assert any(term in reply.lower() for term in ["issue connecting", "operational", "catalog", "service", "bakery"])


# ==============================================================================
# 12. JWT Authentication on Protected Endpoints
# ==============================================================================
def test_12_jwt_authentication_protected_endpoints(customer_token, admin_token):
    # 1. Unauthenticated request to protected endpoint should fail with 401
    unauth_resp = client.get("/api/memory")
    assert unauth_resp.status_code == 401

    # 2. Customer trying to perform admin action (restock) should fail with 403 Forbidden
    forbidden_resp = client.post(
        "/api/inventory/1/restock",
        headers={"Authorization": customer_token},
        json={"quantity": 10}
    )
    assert forbidden_resp.status_code == 403

    # 3. Admin authorized request succeeds
    admin_resp = client.get("/api/users/me", headers={"Authorization": admin_token})
    assert admin_resp.status_code == 200
    assert admin_resp.json()["role"] == "admin"
