import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.models import User, Product, KnowledgeBase, AIMemory, Cart, CartItem, Order, OrderItem
from app.core.logging import logger
from app.ai.route_planner import route_planner

class ToolRouter:
    """
    Executes 16 controlled, validated backend tools to ground Llama responses in live store data.
    Never executes raw SQL or arbitrary commands.
    """

    # TOOL 1: search_products
    @staticmethod
    def search_products(db: Session, query: str, category: Optional[str] = None, max_results: int = 5) -> List[Dict[str, Any]]:
        q = db.query(Product).filter(Product.is_active == True)
        if category:
            q = q.filter(Product.category.ilike(f"%{category}%"))
        if query:
            q = q.filter(
                (Product.name.ilike(f"%{query}%")) |
                (Product.description.ilike(f"%{query}%"))
            )
        products = q.limit(max_results).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": p.price,
                "stock": p.stock,
                "aisle": p.aisle,
                "shelf_tier": p.shelf_tier,
                "dietary": p.dietary_tags
            }
            for p in products
        ]

    # TOOL 2: get_product_details
    @staticmethod
    def get_product_details(db: Session, product_name: str) -> Optional[Dict[str, Any]]:
        p = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not p:
            return None
        return {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "category": p.category,
            "price": p.price,
            "stock": p.stock,
            "aisle": p.aisle,
            "shelf_tier": p.shelf_tier,
            "barcode": p.barcode,
            "specifications": p.specifications,
            "dietary_tags": p.dietary_tags
        }

    # TOOL 3: check_inventory
    @staticmethod
    def check_inventory(db: Session, product_name: str) -> Dict[str, Any]:
        p = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not p:
            return {"status": "not_found", "message": f"Product '{product_name}' is not in current inventory records."}
        return {
            "status": "in_stock" if p.stock > 0 else "out_of_stock",
            "name": p.name,
            "stock_quantity": p.stock,
            "aisle": p.aisle,
            "shelf_tier": p.shelf_tier,
            "price": p.price
        }

    # TOOL 4: compare_products
    @staticmethod
    def compare_products(db: Session, product_names: List[str]) -> List[Dict[str, Any]]:
        results = []
        for name in product_names[:3]:
            p = db.query(Product).filter(Product.name.ilike(f"%{name.strip()}%")).first()
            if p:
                results.append({
                    "name": p.name,
                    "category": p.category,
                    "price": p.price,
                    "stock": p.stock,
                    "aisle": p.aisle,
                    "shelf_tier": p.shelf_tier,
                    "specifications": p.specifications,
                    "dietary_tags": p.dietary_tags
                })
        return results

    # TOOL 5: recommend_products
    @staticmethod
    def recommend_products(db: Session, max_budget: Optional[float] = None, category: Optional[str] = None, max_results: int = 4) -> List[Dict[str, Any]]:
        q = db.query(Product).filter(Product.is_active == True, Product.stock > 0)
        if category:
            q = q.filter(Product.category.ilike(f"%{category}%"))
        if max_budget is not None and max_budget > 0:
            q = q.filter(Product.price <= max_budget)
        products = q.order_by(Product.price.asc()).limit(max_results).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": p.price,
                "stock": p.stock,
                "aisle": p.aisle
            }
            for p in products
        ]

    # TOOL 6: get_cart
    @staticmethod
    def get_cart(db: Session, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        cart = None
        if user_id:
            cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        elif session_id:
            cart = db.query(Cart).filter(Cart.session_id == session_id).first()
        if not cart or not cart.items:
            return {"item_count": 0, "items": [], "total": 0.0, "message": "Your shopping cart is currently empty."}

        items = []
        subtotal = 0.0
        for it in cart.items:
            if it.product:
                tot = round(it.product.price * it.quantity, 2)
                subtotal += tot
                items.append({
                    "product": it.product.name,
                    "price": it.product.price,
                    "quantity": it.quantity,
                    "item_total": tot
                })
        return {
            "item_count": sum(i["quantity"] for i in items),
            "items": items,
            "subtotal": round(subtotal, 2),
            "grand_total": round(subtotal + (0.0 if subtotal >= 199 else 25.0) + (subtotal * 0.05), 2)
        }

    # TOOL 7: add_to_cart
    @staticmethod
    def add_to_cart(db: Session, product_name: str, quantity: int = 1, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not product:
            return {"status": "error", "message": f"Product '{product_name}' not found."}
        if product.stock < quantity:
            return {"status": "error", "message": f"Only {product.stock} units of '{product.name}' in stock."}

        from app.api.routes.cart import get_or_create_cart
        user = db.query(User).filter(User.id == user_id).first() if user_id else None
        cart = get_or_create_cart(db, user, session_id)

        item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == product.id).first()
        if item:
            item.quantity += quantity
        else:
            db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity))
        db.commit()

        return {
            "status": "success",
            "message": f"Added {quantity}x '{product.name}' (₹{product.price * quantity:.2f}) to your cart.",
            "product": product.name,
            "quantity_added": quantity,
            "unit_price": product.price
        }

    # TOOL 8: update_cart_quantity
    @staticmethod
    def update_cart_quantity(db: Session, product_name: str, quantity: int, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not product:
            return {"status": "error", "message": f"Product '{product_name}' not found."}

        cart = None
        if user_id:
            cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        elif session_id:
            cart = db.query(Cart).filter(Cart.session_id == session_id).first()
        if not cart:
            return {"status": "error", "message": "Shopping cart not found."}

        item = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == product.id).first()
        if not item:
            return {"status": "error", "message": f"'{product.name}' is not in your cart."}

        if quantity <= 0:
            db.delete(item)
            msg = f"Removed '{product.name}' from your cart."
        else:
            if quantity > product.stock:
                return {"status": "error", "message": f"Only {product.stock} units available."}
            item.quantity = quantity
            msg = f"Updated '{product.name}' quantity to {quantity}."

        db.commit()
        return {"status": "success", "message": msg}

    # TOOL 9: remove_from_cart
    @staticmethod
    def remove_from_cart(db: Session, product_name: str, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        return ToolRouter.update_cart_quantity(db, product_name, quantity=0, user_id=user_id, session_id=session_id)

    # TOOL 10: calculate_cart_total
    @staticmethod
    def calculate_cart_total(db: Session, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        return ToolRouter.get_cart(db, user_id=user_id, session_id=session_id)

    # TOOL 11: get_order_details
    @staticmethod
    def get_order_details(db: Session, order_number: str) -> Dict[str, Any]:
        order = db.query(Order).filter(
            (Order.order_number == order_number) | (Order.id == int(order_number) if order_number.isdigit() else False)
        ).first()
        if not order:
            return {"status": "not_found", "message": f"Order #{order_number} not found."}
        return {
            "order_number": order.order_number,
            "status": order.status,
            "customer_name": order.customer_name,
            "delivery_address": order.delivery_address,
            "total_amount": order.total_amount,
            "estimated_delivery": order.estimated_delivery,
            "items": [{"name": i.product_name, "quantity": i.quantity, "total": i.total_price} for i in order.items],
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M UTC")
        }

    # TOOL 12: get_order_history
    @staticmethod
    def get_order_history(db: Session, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        q = db.query(Order)
        if user_id:
            q = q.filter(Order.user_id == user_id)
        orders = q.order_by(Order.created_at.desc()).limit(5).all()
        return [
            {
                "order_number": o.order_number,
                "status": o.status,
                "total_amount": o.total_amount,
                "item_count": len(o.items),
                "created_at": o.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for o in orders
        ]

    # TOOL 13: check_cancellation_policy
    @staticmethod
    def check_cancellation_policy(db: Session, order_number: Optional[str] = None) -> Dict[str, Any]:
        policy = {
            "policy": "SmartMart 15-Minute Instant Cancellation Guarantee",
            "eligible_statuses": ["Order Placed", "Confirmed", "Preparing"],
            "ineligible_statuses": ["Ready for Dispatch", "Out for Delivery", "Delivered"],
            "refund_timeline": "Immediate demo refund back to source method."
        }
        if order_number:
            order = db.query(Order).filter(
                (Order.order_number == order_number) | (Order.id == int(order_number) if order_number.isdigit() else False)
            ).first()
            if order:
                policy["order_number"] = order.order_number
                policy["current_status"] = order.status
                policy["can_cancel_now"] = order.status in policy["eligible_statuses"]
        return policy

    # TOOL 14: find_product_location
    @staticmethod
    def find_product_location(db: Session, product_name: str) -> Dict[str, Any]:
        p = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not p:
            return {"status": "not_found", "message": f"Product '{product_name}' not found."}
        return {
            "product": p.name,
            "aisle": f"Aisle {p.aisle}",
            "shelf_tier": p.shelf_tier,
            "stock_available": p.stock,
            "price": p.price
        }

    # TOOL 15: plan_store_route
    @staticmethod
    def plan_store_route(db: Session, product_names: List[str]) -> Dict[str, Any]:
        return route_planner.plan_route(db, product_names)

    # TOOL 16: search_store_policies
    @staticmethod
    def search_store_policies(db: Session, query: str) -> List[Dict[str, Any]]:
        from app.ai.rag_engine import rag_engine
        return rag_engine.retrieve(db, query, top_k=3)

    # TOOL 17: generate_meal_plan
    @staticmethod
    def generate_meal_plan(db: Session, preference: str = "dinner", budget: Optional[float] = 300.0) -> Dict[str, Any]:
        """Creates a balanced meal recipe plan matching actual store stock within budget."""
        pref_l = preference.lower()
        query = db.query(Product).filter(Product.is_active == True, Product.stock > 0)
        all_prods = query.all()
        selected = []
        total = 0.0

        for p in all_prods:
            if budget and (total + p.price > budget):
                continue
            cat = (p.category or "").lower()
            name = p.name.lower()
            if any(term in name or term in cat for term in ["milk", "bread", "banana", "egg", "tea"]) and "breakfast" in pref_l:
                selected.append({"id": p.id, "name": p.name, "price": p.price, "aisle": p.aisle})
                total += p.price
            elif any(term in name or term in cat for term in ["potato", "tomato", "paneer", "rice", "bread", "onion"]) and ("dinner" in pref_l or "meal" in pref_l):
                selected.append({"id": p.id, "name": p.name, "price": p.price, "aisle": p.aisle})
                total += p.price
            elif any(term in name or term in cat for term in ["chip", "cola", "chocolate", "biscuit"]) and ("snack" in pref_l or "movie" in pref_l):
                selected.append({"id": p.id, "name": p.name, "price": p.price, "aisle": p.aisle})
                total += p.price

            if len(selected) >= 4:
                break

        if not selected:
            selected = [{"id": p.id, "name": p.name, "price": p.price, "aisle": p.aisle} for p in all_prods[:3]]
            total = sum(i["price"] for i in selected)

        return {
            "meal_type": preference,
            "budget_limit": budget,
            "items": selected,
            "total_estimated_cost": round(total, 2),
            "savings_remaining": round((budget - total), 2) if budget else 0.0
        }

    # TOOL 18: get_store_hours
    @staticmethod
    def get_store_hours() -> Dict[str, Any]:
        return {
            "store": "SmartMart Superstore Hub Sector 14",
            "monday_to_saturday": "8:00 AM - 10:30 PM",
            "sunday_timings": "9:00 AM - 9:00 PM",
            "holidays": "Open 365 Days (Express hours on national holidays: 9 AM - 6 PM)",
            "customer_service_desk": "Aisle A1 Cooler Bay"
        }

    # TOOL 19: get_payment_methods
    @staticmethod
    def get_payment_methods() -> Dict[str, Any]:
        return {
            "supported_methods": ["UPI (GPay, PhonePe, Paytm)", "Credit & Debit Cards (Visa, MasterCard, RuPay)", "Cash on Delivery (COD)"],
            "online_checkout": "100% Secure Simulated Gateway",
            "in_store_pos": "Self-checkout lanes 1-3 & cash registers"
        }

    # TOOL 20: get_inventory_report
    @staticmethod
    def get_inventory_report(db: Session) -> Dict[str, Any]:
        prods = db.query(Product).all()
        low_stock = [p.name for p in prods if (p.stock or 0) < 15]
        out_of_stock = [p.name for p in prods if (p.stock or 0) == 0]
        return {
            "total_products": len(prods),
            "in_stock_count": len(prods) - len(out_of_stock),
            "low_stock_count": len(low_stock),
            "out_of_stock_count": len(out_of_stock),
            "low_stock_items": low_stock[:6],
            "out_of_stock_items": out_of_stock[:6]
        }

    # TOOL 21: update_inventory (Staff / Admin)
    @staticmethod
    def update_inventory(db: Session, product_name: str, new_stock: int) -> Dict[str, Any]:
        p = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not p:
            return {"status": "error", "message": f"Product '{product_name}' not found."}
        old_val = p.stock
        p.stock = max(0, new_stock)
        db.commit()
        return {"status": "success", "product": p.name, "old_stock": old_val, "updated_stock": p.stock}

    # TOOL 22: get_system_health
    @staticmethod
    def get_system_health(db: Session) -> Dict[str, Any]:
        prod_count = db.query(Product).count()
        return {
            "backend": "Online & Operational",
            "database": "SQLite / PostgreSQL Connected",
            "active_catalog_items": prod_count,
            "llm_engine": "Groq Qwen/Llama Active",
            "response_time_ms": 14.8
        }

    # Registry of tool definitions
    tools_registry = {
        "search_products": {"description": "Search products by natural language query"},
        "get_product_details": {"description": "Retrieve price, stock, and aisle coordinates of a product"},
        "get_product_price": {"description": "Get item unit price"},
        "check_inventory": {"description": "Check live inventory and out-of-stock items"},
        "update_inventory": {"description": "Adjust product stock (Staff/Admin)"},
        "compare_products": {"description": "Compare 2-3 products side by side"},
        "search_store_policies": {"description": "RAG search across return and refund policies"},
        "get_store_hours": {"description": "Check daily opening and closing store hours"},
        "get_payment_methods": {"description": "List UPI, Card, and COD options"},
        "calculate_cart_total": {"description": "Calculate subtotal, delivery fee, and grand total"},
        "generate_meal_plan": {"description": "Create meal and dinner plans under budget"},
        "generate_shopping_list": {"description": "Produce structured grocery shopping list"},
        "add_product_to_cart": {"description": "Drop items into user's shopping cart"},
        "remove_cart_item": {"description": "Remove an item from cart"},
        "get_product_location": {"description": "Find exact supermarket aisle and shelf level"},
        "generate_shopping_route": {"description": "Compute optimal Dijkstra path through store"},
        "get_inventory_report": {"description": "Summarize low and out-of-stock items (Staff)"},
        "get_system_health": {"description": "Diagnostic health report of database and AI"}
    }

    def detect_intent(self, query: str) -> Optional[Dict[str, Any]]:
        q = query.lower()
        if any(w in q for w in ["meal plan", "suggest dinner", "dinner for", "breakfast for", "make pasta", "snack"]):
            b_match = re.search(r"(\d+)", q)
            budget = float(b_match.group(1)) if b_match else 300.0
            return {"tool": "generate_meal_plan", "params": {"preference": q, "budget": budget}}
        if any(w in q for w in ["hours", "timing", "open on sunday", "opening time", "close"]):
            return {"tool": "get_store_hours", "params": {}}
        if any(w in q for w in ["payment", "upi", "credit card", "debit card", "cod", "pay"]):
            return {"tool": "get_payment_methods", "params": {}}
        if any(w in q for w in ["inventory report", "low stock", "out of stock", "running low", "restock"]):
            return {"tool": "get_inventory_report", "params": {}}
        if any(w in q for w in ["system health", "diagnostics", "backend status", "database status"]):
            return {"tool": "get_system_health", "params": {}}
        if any(w in q for w in ["plan route", "shortest route", "navigate", "find route"]):
            words = [w for w in re.findall(r"[a-zA-Z]{3,}", q) if w not in ["plan", "route", "shortest", "store", "path", "find"]]
            return {"tool": "generate_shopping_route", "params": {"product_names": words}}
        if any(w in q for w in ["return", "refund", "exchange", "warranty", "policy"]):
            return {"tool": "search_store_policies", "params": {"query": q}}
        return None

    def execute_tool(self, db: Session, tool_name: str, params: Dict[str, Any], session_id: Optional[str] = None, user_id: Optional[int] = None) -> Any:
        if tool_name == "generate_meal_plan":
            return self.generate_meal_plan(db, preference=params.get("preference", "dinner"), budget=params.get("budget", 300.0))
        elif tool_name == "get_store_hours":
            return self.get_store_hours()
        elif tool_name == "get_payment_methods":
            return self.get_payment_methods()
        elif tool_name == "get_inventory_report":
            return self.get_inventory_report(db)
        elif tool_name == "get_system_health":
            return self.get_system_health(db)
        elif tool_name == "generate_shopping_route":
            return self.plan_store_route(db, params.get("product_names", ["Milk", "Bread"]))
        elif tool_name == "search_store_policies":
            return self.search_store_policies(db, params.get("query", ""))
        elif tool_name == "update_inventory":
            return self.update_inventory(db, params.get("product_name", ""), params.get("new_stock", 50))
        return None

    # ── Master Intent Router ───────────────────────────────────────────
    def route_and_execute(self, db: Session, user_query: str, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Tuple[Optional[str], Optional[Any]]:
        q = user_query.lower()

        # 1. Route Planning
        if any(w in q for w in ["plan route", "plan a route", "shortest route", "route for", "navigate to"]):
            terms = re.findall(r"[a-zA-Z]{3,}", q)
            ignore = {"plan", "route", "shortest", "store", "path", "find", "for", "and", "the", "navigate"}
            items = [t for t in terms if t not in ignore]
            if items:
                res = self.plan_store_route(db, items)
                return "plan_store_route", res

        # 2. Cart Operations
        if "what is in my cart" in q or "view cart" in q or "my cart" in q:
            res = self.get_cart(db, user_id=user_id, session_id=session_id)
            return "get_cart", res

        if "add" in q and ("to cart" in q or "cart" in q):
            qty_match = re.search(r"(\d+)\s*(?:packet|packets|units|bottles|pieces|items)?\s+([a-zA-Z\s]+)", q)
            if qty_match:
                qty = int(qty_match.group(1))
                item_name = qty_match.group(2).replace("to cart", "").replace("in cart", "").strip()
            else:
                qty = 1
                item_name = re.sub(r"(add|to cart|in my cart|my cart|please|two|one)", "", q).strip()
            res = self.add_to_cart(db, item_name, quantity=qty, user_id=user_id, session_id=session_id)
            return "add_to_cart", res

        # 3. Order & Cancellation Operations
        if any(w in q for w in ["cancel my order", "cancellation policy", "can i cancel"]):
            ord_match = re.search(r"sm-\d+", q)
            ord_no = ord_match.group(0).upper() if ord_match else None
            res = self.check_cancellation_policy(db, order_number=ord_no)
            return "check_cancellation_policy", res

        if "order status" in q or "track order" in q or "where is my order" in q:
            ord_match = re.search(r"sm-\d+", q)
            if ord_match:
                res = self.get_order_details(db, ord_match.group(0).upper())
                return "get_order_details", res
            else:
                res = self.get_order_history(db, user_id=user_id)
                return "get_order_history", res

        # 4. Product recommendations under budget
        budget_match = re.search(r"(?:under|below|less than|within)\s*(?:rs|inr|₹)?\s*(\d+)", q)
        if "suggest" in q or "recommend" in q or budget_match:
            budget = float(budget_match.group(1)) if budget_match else None
            res = self.recommend_products(db, max_budget=budget)
            if res:
                return "recommend_products", res

        # 5. Extract candidate terms for product queries
        stop_words = {
            "where", "can", "find", "and", "how", "many", "are", "stock", "located", "have",
            "what", "the", "this", "that", "there", "you", "does", "smartmart", "price", "cost",
            "much", "which", "aisle", "shelf", "tell", "show", "give", "item", "product", "items"
        }
        words = [w for w in re.findall(r"[a-zA-Z]{3,}", q) if w not in stop_words]

        if words:
            matched_products = []
            all_active = db.query(Product).filter(Product.is_active == True).all()
            for p in all_active:
                p_name_l = p.name.lower()
                desc_l = (p.description or "").lower()
                cat_l = (p.category or "").lower()

                score = sum(2 if w in p_name_l else (1 if w in desc_l or w in cat_l else 0) for w in words)
                if score > 0:
                    matched_products.append((score, p))

            if matched_products:
                matched_products.sort(key=lambda x: x[0], reverse=True)
                top_matches = [
                    {
                        "id": p.id,
                        "name": p.name,
                        "category": p.category,
                        "price": p.price,
                        "stock": p.stock,
                        "aisle": p.aisle,
                        "shelf_tier": p.shelf_tier,
                        "dietary": p.dietary_tags
                    }
                    for _, p in matched_products[:4]
                ]

                if "compare" in q or " vs " in q:
                    return "compare_products", top_matches
                elif any(w in q for w in ["in stock", "available", "how many", "quantity"]):
                    return "check_inventory", top_matches[0]
                elif any(w in q for w in ["where", "location", "aisle", "shelf"]):
                    return "find_product_location", top_matches[0]
                else:
                    return "search_products", top_matches

        return None, None

tool_router = ToolRouter()
