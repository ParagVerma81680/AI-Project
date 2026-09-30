"""
Database seed script.

Run this once to populate the database with sample categories and products.
Safe to run multiple times — it checks for existing data before inserting.

Usage (from the backend/ directory with venv active):
    python -m app.database.seed
"""

import sys
import os

# Make sure the backend root is on sys.path when run directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import SessionLocal, init_db
from app.models.category  import Category
from app.models.product   import Product


# ─────────────────────────────────────────────────────────────────────────────
# Sample data
# ─────────────────────────────────────────────────────────────────────────────

CATEGORIES = [
    {"name": "Dairy",       "description": "Milk, cheese, butter, and yoghurt products"},
    {"name": "Bakery",      "description": "Bread, buns, cakes, and pastries"},
    {"name": "Beverages",   "description": "Juices, sodas, water, and hot drinks"},
    {"name": "Snacks",      "description": "Chips, biscuits, nuts, and confectionery"},
    {"name": "Fruits",      "description": "Fresh seasonal fruits"},
    {"name": "Vegetables",  "description": "Fresh seasonal vegetables"},
    {"name": "Personal Care","description": "Soaps, shampoos, toothpaste, and skincare"},
]

# (name, brand, price, stock, aisle, shelf, category_name, barcode, description)
PRODUCTS = [
    # Dairy — Aisle A1
    ("Whole Milk 1L",         "FreshFarm",    49.00, 80,  "A1", "Mid", "Dairy",        "8901001000001", "Full-fat whole milk, 1 litre"),
    ("Low-Fat Milk 500ml",    "FreshFarm",    29.00, 60,  "A1", "Mid", "Dairy",        "8901001000002", "Low-fat toned milk, 500 ml"),
    ("Paneer 200g",           "Amul",         85.00, 40,  "A1", "Top", "Dairy",        "8901001000003", "Fresh cottage cheese block"),
    ("Curd 400g",             "Mother Dairy", 45.00, 55,  "A1", "Bot", "Dairy",        "8901001000004", "Set dahi, 400 g cup"),

    # Bakery — Aisle A2
    ("White Sandwich Bread",  "Britannia",    40.00, 50,  "A2", "Mid", "Bakery",       "8901002000001", "Soft white sliced bread, 400 g"),
    ("Whole Wheat Bread",     "Britannia",    45.00, 45,  "A2", "Mid", "Bakery",       "8901002000002", "100% whole wheat bread, 400 g"),
    ("Butter Croissant",      "Harvest Gold", 25.00, 30,  "A2", "Top", "Bakery",       "8901002000003", "Flaky butter croissant, 2 pcs"),

    # Beverages — Aisle B1
    ("Orange Juice 1L",       "Tropicana",    95.00, 70,  "B1", "Mid", "Beverages",    "8901003000001", "100% pure squeezed orange juice"),
    ("Packaged Drinking Water","Bisleri",     20.00, 200, "B1", "Bot", "Beverages",    "8901003000002", "Mineral water, 1 litre bottle"),
    ("Green Tea (25 bags)",   "Tetley",       120.00, 35, "B1", "Top", "Beverages",    "8901003000003", "Natural green tea, 25 teabags"),
    ("Cola 600ml",            "Coca-Cola",    40.00, 90,  "B1", "Bot", "Beverages",    "8901003000004", "Chilled cola, 600 ml PET bottle"),

    # Snacks — Aisle B2
    ("Salted Chips 100g",     "Lay's",        20.00, 120, "B2", "Mid", "Snacks",       "8901004000001", "Salted potato chips, 100 g"),
    ("Mixed Nuts 250g",       "Happilo",      299.00, 25, "B2", "Top", "Snacks",       "8901004000002", "Premium mixed dry fruits & nuts"),
    ("Marie Biscuits",        "Britannia",    30.00, 80,  "B2", "Bot", "Snacks",       "8901004000003", "Light wheat biscuits, 200 g"),
    ("Dark Chocolate 80g",    "Amul",         55.00, 60,  "B2", "Top", "Snacks",       "8901004000004", "55% cocoa dark chocolate bar"),

    # Fruits — Aisle C1
    ("Bananas (6 pcs)",       "Local Farm",   35.00, 100, "C1", "Bot", "Fruits",       "8901005000001", "Ripe yellow bananas, ~6 pieces"),
    ("Red Apples 4 pcs",      "Himachal",     89.00, 50,  "C1", "Mid", "Fruits",       "8901005000002", "Fresh Shimla red apples"),

    # Vegetables — Aisle C2
    ("Tomatoes 500g",         "Local Farm",   25.00, 90,  "C2", "Bot", "Vegetables",   "8901006000001", "Fresh ripe tomatoes, 500 g"),
    ("Potatoes 1kg",          "Local Farm",   30.00, 110, "C2", "Bot", "Vegetables",   "8901006000002", "Farm-fresh potatoes, 1 kg"),

    # Personal Care — Aisle D1
    ("Shampoo 200ml",         "Head & Shoulders", 189.00, 40, "D1", "Top", "Personal Care", "8901007000001", "Anti-dandruff shampoo, 200 ml"),
    ("Toothpaste 150g",       "Colgate",      75.00, 65,  "D1", "Mid", "Personal Care", "8901007000002", "Strong Teeth fluoride toothpaste"),
]


# ─────────────────────────────────────────────────────────────────────────────
# Seed function
# ─────────────────────────────────────────────────────────────────────────────

def seed() -> None:
    # Make sure tables exist first
    init_db()

    db = SessionLocal()
    try:
        # ── Categories ──────────────────────────────────────────────────────
        existing_cats = {c.name for c in db.query(Category).all()}
        new_cats: dict[str, Category] = {}

        for cat_data in CATEGORIES:
            if cat_data["name"] not in existing_cats:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()   # get the id without committing yet
            else:
                cat = db.query(Category).filter(Category.name == cat_data["name"]).first()
            new_cats[cat_data["name"]] = cat

        db.commit()

        # ── Products ─────────────────────────────────────────────────────────
        existing_barcodes = {p.barcode for p in db.query(Product.barcode).all()}
        inserted = 0

        for (
            name, brand, price, stock, aisle, shelf,
            cat_name, barcode, description
        ) in PRODUCTS:
            if barcode in existing_barcodes:
                continue   # already seeded

            product = Product(
                name=name,
                brand=brand,
                price=price,
                stock=stock,
                aisle=aisle,
                shelf=shelf,
                description=description,
                barcode=barcode,
                category_id=new_cats[cat_name].id,
            )
            db.add(product)
            inserted += 1

        db.commit()
        print(f"[OK] Seed complete -- {inserted} products inserted.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
