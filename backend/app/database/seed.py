import json
from app.core.logging import logger
from app.core.security import get_password_hash
from app.database.connection import SessionLocal

def seed_initial_data():
    db = SessionLocal()
    try:
        from app.database.models import User, Product, Category, KnowledgeBase, PolicyDocument
        from app.ai.embeddings import embedding_service

        # 1. Seed Users
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@smartmart.local",
                password_hash=get_password_hash("CSE276"),
                role="admin"
            )
            db.add(admin_user)
            logger.info("Created default Administrator account: admin (Pass: CSE276)")

        customer_user = db.query(User).filter(User.username == "customer").first()
        if not customer_user:
            customer_user = User(
                username="customer",
                email="customer@smartmart.local",
                password_hash=get_password_hash("CSE276"),
                role="customer"
            )
            db.add(customer_user)
            logger.info("Created default Customer account: customer")

        # 2. Seed Categories
        categories_data = [
            ("Bakery", "Freshly baked artisan breads, pastries, and whole-grain goods."),
            ("Dairy & Eggs", "Farm-fresh milk, organic butter, artisan cheese, and plant milks."),
            ("Produce", "Organic vegetables, seasonal fruits, and fresh local herbs."),
            ("Pantry & Dry Goods", "Pastas, organic olive oils, rice, grains, and canned legumes."),
            ("Snacks & Health", "Keto chips, gluten-free crackers, dried nuts, and protein snacks."),
            ("Household & Tech", "Energy-saving bulbs, sustainable paper products, and small home electronics.")
        ]
        for name, desc in categories_data:
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name, description=desc))

        # 3. Seed Products
        if db.query(Product).count() == 0:
            products_data = [
                # Aisle 1: Bakery & Dairy
                {
                    "product_name": "Artisan Sourdough Loaf",
                    "description": "Slow-fermented artisan sourdough bread with a crispy crust and chewy crumb.",
                    "category": "Bakery",
                    "price": 5.49,
                    "stock_quantity": 28,
                    "aisle": 1,
                    "shelf_tier": "Top",
                    "barcode": "890123450001",
                    "dietary_tags": ["vegan", "organic"],
                    "specifications": {"weight": "750g", "allergens": ["wheat"], "shelf_life_days": 4}
                },
                {
                    "product_name": "Organic Almond Milk",
                    "description": "Unsweetened creamy plant-based almond milk enriched with Calcium and Vitamin D.",
                    "category": "Dairy & Eggs",
                    "price": 3.99,
                    "stock_quantity": 42,
                    "aisle": 1,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450002",
                    "dietary_tags": ["vegan", "gluten-free", "organic", "keto"],
                    "specifications": {"volume": "1 Liter", "allergens": ["almonds"], "shelf_life_days": 21}
                },
                {
                    "product_name": "Greek Whole Milk Yogurt",
                    "description": "Traditional thick strained whole milk Greek yogurt with 15g protein per serving.",
                    "category": "Dairy & Eggs",
                    "price": 4.29,
                    "stock_quantity": 35,
                    "aisle": 1,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450003",
                    "dietary_tags": ["gluten-free", "keto"],
                    "specifications": {"weight": "500g", "protein": "15g", "allergens": ["milk"]}
                },
                {
                    "product_name": "Free-Range Large Brown Eggs",
                    "description": "Grade-A pasture-raised free-range brown eggs from certified family farms.",
                    "category": "Dairy & Eggs",
                    "price": 4.89,
                    "stock_quantity": 50,
                    "aisle": 1,
                    "shelf_tier": "Bottom",
                    "barcode": "890123450004",
                    "dietary_tags": ["gluten-free", "keto"],
                    "specifications": {"count": 12, "grade": "Grade A", "origin": "Local Farm"}
                },

                # Aisle 2: Pantry & Dry Goods
                {
                    "product_name": "Extra Virgin Olive Oil",
                    "description": "Cold-pressed extra virgin olive oil imported from Mediterranean groves.",
                    "category": "Pantry & Dry Goods",
                    "price": 14.99,
                    "stock_quantity": 22,
                    "aisle": 2,
                    "shelf_tier": "Top",
                    "barcode": "890123450005",
                    "dietary_tags": ["vegan", "gluten-free", "keto", "organic"],
                    "specifications": {"volume": "750ml", "acidity": "< 0.3%", "origin": "Greece"}
                },
                {
                    "product_name": "Organic Whole Grain Penne",
                    "description": "Bronze-die extruded Italian organic durum whole-wheat penne rigate pasta.",
                    "category": "Pantry & Dry Goods",
                    "price": 2.79,
                    "stock_quantity": 60,
                    "aisle": 2,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450006",
                    "dietary_tags": ["vegan", "organic"],
                    "specifications": {"weight": "500g", "cook_time": "9 mins", "allergens": ["wheat"]}
                },
                {
                    "product_name": "Organic Marinara Pasta Sauce",
                    "description": "Slow-simmered San Marzano tomato sauce with fresh basil and garlic.",
                    "category": "Pantry & Dry Goods",
                    "price": 3.99,
                    "stock_quantity": 38,
                    "aisle": 2,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450007",
                    "dietary_tags": ["vegan", "gluten-free", "organic"],
                    "specifications": {"weight": "680g", "no_sugar_added": True}
                },
                {
                    "product_name": "Royal Basmati White Rice 5kg",
                    "description": "Naturally aged long-grain fragrant Himalayan Royal Basmati rice sack.",
                    "category": "Pantry & Dry Goods",
                    "price": 16.49,
                    "stock_quantity": 18,
                    "aisle": 2,
                    "shelf_tier": "Bottom",
                    "barcode": "890123450008",
                    "dietary_tags": ["vegan", "gluten-free"],
                    "specifications": {"weight": "5 kg", "origin": "India", "grain_length": "Extra Long"}
                },

                # Aisle 3: Organic & Snacks
                {
                    "product_name": "Organic Firm Tofu",
                    "description": "High-protein non-GMO organic firm tofu, ideal for stir-fries and grilling.",
                    "category": "Produce",
                    "price": 3.49,
                    "stock_quantity": 30,
                    "aisle": 3,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450009",
                    "dietary_tags": ["vegan", "gluten-free", "organic", "keto"],
                    "specifications": {"weight": "400g", "protein": "14g/100g", "allergens": ["soy"]}
                },
                {
                    "product_name": "Organic Tricolor Quinoa",
                    "description": "Pre-washed Andean tricolor quinoa rich in all 9 essential amino acids.",
                    "category": "Pantry & Dry Goods",
                    "price": 5.99,
                    "stock_quantity": 25,
                    "aisle": 3,
                    "shelf_tier": "Top",
                    "barcode": "890123450010",
                    "dietary_tags": ["vegan", "gluten-free", "organic"],
                    "specifications": {"weight": "454g", "origin": "Peru", "protein": "6g/serving"}
                },
                {
                    "product_name": "Roasted Salted Almonds 400g",
                    "description": "Oven-roasted California whole almonds lightly tossed in natural sea salt.",
                    "category": "Snacks & Health",
                    "price": 6.99,
                    "stock_quantity": 34,
                    "aisle": 3,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450011",
                    "dietary_tags": ["vegan", "gluten-free", "keto"],
                    "specifications": {"weight": "400g", "sodium": "120mg", "allergens": ["tree nuts"]}
                },

                # Aisle 4: Electronics & Household
                {
                    "product_name": "Smart Multi-Plug Surge Protector",
                    "description": "6-outlet surge protector with 3 high-speed USB-C charging ports and power switch.",
                    "category": "Household & Tech",
                    "price": 24.99,
                    "stock_quantity": 15,
                    "aisle": 4,
                    "shelf_tier": "Top",
                    "barcode": "890123450012",
                    "dietary_tags": [],
                    "specifications": {"joules": "1800J", "cord_length": "6 ft", "warranty": "2 Years"}
                },
                {
                    "product_name": "Rechargeable LED Desk Lamp",
                    "description": "Dimmable touch-controlled modern LED study desk lamp with 3 color temperatures.",
                    "category": "Household & Tech",
                    "price": 29.99,
                    "stock_quantity": 12,
                    "aisle": 4,
                    "shelf_tier": "Eye-Level",
                    "barcode": "890123450013",
                    "dietary_tags": [],
                    "specifications": {"battery": "2500mAh", "lumen": "450 lm", "warranty": "1 Year"}
                },
                {
                    "product_name": "Bamboo Fiber Kitchen Towels 6-Pack",
                    "description": "Ultra-absorbent reusable eco-friendly bamboo fiber multi-surface towels.",
                    "category": "Household & Tech",
                    "price": 8.99,
                    "stock_quantity": 40,
                    "aisle": 4,
                    "shelf_tier": "Bottom",
                    "barcode": "890123450014",
                    "dietary_tags": ["organic"],
                    "specifications": {"count": 6, "material": "Bamboo Viscose", "washable": True}
                }
            ]

            for item in products_data:
                p = Product(**item)
                db.add(p)
            db.commit()
            logger.info("Seeded 14 core SmartMart products across Aisles 1 to 4.")

        # 4. Seed Knowledge Base (RAG Corpus)
        if db.query(KnowledgeBase).count() == 0:
            knowledge_data = [
                {
                    "title": "30-Day Customer Return & Refund Policy",
                    "category": "Returns",
                    "source": "store_policy",
                    "content": (
                        "SmartMart offers a 30-day return policy for most general merchandise from the date of purchase. "
                        "Items must be returned in their original condition with receipt or proof of purchase. "
                        "Refunds are credited to the original payment method. For returns without a receipt, store credit "
                        "is issued at the lowest selling price over the past 30 days."
                    )
                },
                {
                    "title": "Perishable Goods, Dairy & Produce Exchange Policy",
                    "category": "Returns",
                    "source": "store_policy",
                    "content": (
                        "Perishable items including fresh produce, dairy products, bakery loaves, and chilled groceries "
                        "can be returned or exchanged within 7 days of purchase if freshness or quality does not meet satisfaction. "
                        "Receipt verification is required. Temperature-abused items left open for extended periods may not be refunded."
                    )
                },
                {
                    "title": "Electronics & Hardware Warranty Policy",
                    "category": "Electronics",
                    "source": "store_policy",
                    "content": (
                        "All electronics, surge protectors, LED lamps, and appliances carry a 30-day full store return window "
                        "and a minimum 1-year manufacturer warranty. Defective items within 30 days are eligible for instant 1-to-1 "
                        "replacement or full refund if returned in original packaging with all included accessories."
                    )
                },
                {
                    "title": "Local Supermarket Price Match Guarantee",
                    "category": "Pricing",
                    "source": "store_policy",
                    "content": (
                        "SmartMart guarantees the lowest grocery prices in town! We gladly match any identical in-stock "
                        "product price advertised by major supermarkets within a 5-mile radius. Simply show the current digital "
                        "or paper flyer to the cashier or customer service desk before checkout completion."
                    )
                },
                {
                    "title": "Store Hours, Location & Floor Layout",
                    "category": "Store Info",
                    "source": "store_info",
                    "content": (
                        "SmartMart Superstore Branch #14 is open daily from 07:00 AM to 10:00 PM. "
                        "Store Layout: Entrance and Cart Bay at Front-Left; Aisle 1 (Bakery, Dairy, Milk); "
                        "Aisle 2 (Pantry, Pasta, Oils, Grains); Aisle 3 (Organic Produce, Snacks, Nuts); "
                        "Aisle 4 (Electronics, Household, Appliances); Checkout POS Lanes 1-4 and Customer Service at Exit."
                    )
                },
                {
                    "title": "SmartCart Dash Cart and Weight Scale Technology",
                    "category": "Technology",
                    "source": "store_info",
                    "content": (
                        "SmartMart features SmartCart Dash Carts equipped with capacitive touch displays and tare load-cell scales. "
                        "As you place items into the cart, internal sensors cross-check the weight with barcode scans to ensure "
                        "frictionless checkout and instant running cost calculations."
                    )
                }
            ]

            for doc in knowledge_data:
                emb = embedding_service.embed_text(f"{doc['title']} - {doc['content']}")
                kb_entry = KnowledgeBase(
                    title=doc["title"],
                    category=doc["category"],
                    source=doc["source"],
                    content=doc["content"],
                    embedding=emb
                )
                db.add(kb_entry)

                # Also populate legacy policy document for backward compatibility
                if not db.query(PolicyDocument).filter(PolicyDocument.title == doc["title"]).first():
                    db.add(PolicyDocument(
                        title=doc["title"],
                        category=doc["category"],
                        content=doc["content"]
                    ))

            db.commit()
            logger.info("Seeded Knowledge Base vector articles for RAG.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seed: {e}")
    finally:
        db.close()
