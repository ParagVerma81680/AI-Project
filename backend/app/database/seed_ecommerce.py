import sys
from pathlib import Path

# Add backend directory to sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.database.connection import SessionLocal
from app.database.models import Product, Category

PRODUCTS_DATA = [
    # ── 1. Dairy & Breakfast ──────────────────────────────────────────
    {
        "name": "Amul Taaza Whole Milk 1L",
        "category": "Dairy & Breakfast",
        "price": 66.0,
        "stock": 50,
        "aisle": "1",
        "shelf": "Mid",
        "barcode": "890126201001",
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60",
        "description": "Pasteurized homogenized standardized whole milk with 4.5% fat. Fresh daily farm sourced."
    },
    {
        "name": "Country Delight Low-Fat Milk 500ml",
        "category": "Dairy & Breakfast",
        "price": 36.0,
        "stock": 40,
        "aisle": "1",
        "shelf": "Top",
        "barcode": "890126201002",
        "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60",
        "description": "Low fat cow milk, 1.5% fat. Enriched with Vitamin A and Vitamin D for healthy breakfast."
    },
    {
        "name": "Fresh Malai Paneer 200g",
        "category": "Dairy & Breakfast",
        "price": 95.0,
        "stock": 30,
        "aisle": "1",
        "shelf": "Bottom",
        "barcode": "890126201003",
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60",
        "description": "Soft and succulent cottage cheese crafted from pure milk. Rich in natural protein."
    },
    {
        "name": "Farm Fresh Brown Eggs (Pack of 6)",
        "category": "Dairy & Breakfast",
        "price": 65.0,
        "stock": 45,
        "aisle": "1",
        "shelf": "Mid",
        "barcode": "890126201004",
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=60",
        "description": "Omega-3 enriched free-range brown eggs. High protein source for active daily energy."
    },
    {
        "name": "Epigamia Greek Yogurt Strawberry 120g",
        "category": "Dairy & Breakfast",
        "price": 50.0,
        "stock": 25,
        "aisle": "1",
        "shelf": "Top",
        "barcode": "890126201005",
        "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60",
        "description": "Thick Greek yogurt made from real strawberries with zero preservatives and high natural protein."
    },

    # ── 2. Bakery ─────────────────────────────────────────────────────
    {
        "name": "English Oven Whole Wheat Bread 400g",
        "category": "Bakery",
        "price": 45.0,
        "stock": 35,
        "aisle": "2",
        "shelf": "Mid",
        "barcode": "890126202001",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
        "description": "100% whole grain brown bread with fiber-rich wheat grains. Zero trans fat."
    },
    {
        "name": "Artisan Butter Croissant (2 Pcs)",
        "category": "Bakery",
        "price": 89.0,
        "stock": 20,
        "aisle": "2",
        "shelf": "Top",
        "barcode": "890126202002",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
        "description": "Flaky golden butter croissants baked fresh in store daily with premium French butter."
    },
    {
        "name": "Herb & Garlic Baguette 250g",
        "category": "Bakery",
        "price": 60.0,
        "stock": 18,
        "aisle": "2",
        "shelf": "Bottom",
        "barcode": "890126202003",
        "image_url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=60",
        "description": "Crispy crust baguette infused with roasted garlic, thyme, and virgin olive oil."
    },

    # ── 3. Snacks & Munchies ──────────────────────────────────────────
    {
        "name": "Lay's Classic Salted Potato Chips 50g",
        "category": "Snacks & Munchies",
        "price": 20.0,
        "stock": 100,
        "aisle": "3",
        "shelf": "Mid",
        "barcode": "890126203001",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60",
        "description": "Crispy potato chips sliced thin and seasoned with pure sea salt."
    },
    {
        "name": "Doritos Cheese Nachos 60g",
        "category": "Snacks & Munchies",
        "price": 30.0,
        "stock": 80,
        "aisle": "3",
        "shelf": "Top",
        "barcode": "890126203002",
        "image_url": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60",
        "description": "Crunchy roasted corn tortilla chips loaded with tangy nacho cheese explosion."
    },
    {
        "name": "Roasted California Almonds 200g",
        "category": "Snacks & Munchies",
        "price": 199.0,
        "stock": 25,
        "aisle": "3",
        "shelf": "Bottom",
        "barcode": "890126203003",
        "image_url": "https://images.unsplash.com/photo-1508061252445-5350f37dfc3b?w=500&auto=format&fit=crop&q=60",
        "description": "Lightly salted slow-roasted California almonds. Packed with heart-healthy vitamin E."
    },
    {
        "name": "Cadbury Bournville 70% Dark Chocolate 80g",
        "category": "Snacks & Munchies",
        "price": 110.0,
        "stock": 40,
        "aisle": "3",
        "shelf": "Mid",
        "barcode": "890126203004",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=60",
        "description": "Intense rich cocoa beans dark chocolate bar with smooth melt and anti-oxidant benefits."
    },

    # ── 4. Cold Drinks & Beverages ────────────────────────────────────
    {
        "name": "Real Valencia Orange Juice 1L",
        "category": "Cold Drinks",
        "price": 125.0,
        "stock": 45,
        "aisle": "4",
        "shelf": "Mid",
        "barcode": "890126204001",
        "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60",
        "description": "100% natural fruit juice without added sugar. Bursting with vitamin C vitality."
    },
    {
        "name": "Coca-Cola Zero Sugar 750ml",
        "category": "Cold Drinks",
        "price": 45.0,
        "stock": 60,
        "aisle": "4",
        "shelf": "Bottom",
        "barcode": "890126204002",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
        "description": "Crisp sparkling zero calorie cola beverage with legendary refreshing taste."
    },
    {
        "name": "Red Bull Energy Drink Can 250ml",
        "category": "Cold Drinks",
        "price": 125.0,
        "stock": 50,
        "aisle": "4",
        "shelf": "Top",
        "barcode": "890126204003",
        "image_url": "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=500&auto=format&fit=crop&q=60",
        "description": "Revitalizes body and mind with taurine, caffeine, and B-group vitamins."
    },

    # ── 5. Fruits & Vegetables ────────────────────────────────────────
    {
        "name": "Fresh Royal Gala Apples (4 Pcs)",
        "category": "Fruits & Vegetables",
        "price": 140.0,
        "stock": 30,
        "aisle": "1",
        "shelf": "Mid",
        "barcode": "890126205001",
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60",
        "description": "Crisp sweet aromatic red apples handpicked from Himalayan orchards."
    },
    {
        "name": "Fresh Robusta Bananas (6 Pcs)",
        "category": "Fruits & Vegetables",
        "price": 48.0,
        "stock": 40,
        "aisle": "1",
        "shelf": "Bottom",
        "barcode": "890126205002",
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60",
        "description": "Naturally ripened sweet bananas rich in potassium and instant energy."
    },
    {
        "name": "Hydroponic Baby Spinach 250g",
        "category": "Fruits & Vegetables",
        "price": 40.0,
        "stock": 25,
        "aisle": "1",
        "shelf": "Top",
        "barcode": "890126205003",
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60",
        "description": "Clean, tender, pesticide-free spinach leaves washed and ready to cook."
    },

    # ── 6. Grocery & Staples ──────────────────────────────────────────
    {
        "name": "India Gate Basmati Rice Feast Rozzana 1kg",
        "category": "Grocery & Staples",
        "price": 115.0,
        "stock": 60,
        "aisle": "2",
        "shelf": "Bottom",
        "barcode": "890126206001",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
        "description": "Aged long grain aromatic basmati rice for biryanis and daily curries."
    },
    {
        "name": "Tata Sampann Unpolished Toor Dal 1kg",
        "category": "Grocery & Staples",
        "price": 165.0,
        "stock": 40,
        "aisle": "2",
        "shelf": "Mid",
        "barcode": "890126206002",
        "image_url": "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=500&auto=format&fit=crop&q=60",
        "description": "Unpolished nutritious yellow pigeon peas rich in dietary protein and fiber."
    },
    {
        "name": "Fortune Sunlite Refined Sunflower Oil 1L",
        "category": "Grocery & Staples",
        "price": 145.0,
        "stock": 50,
        "aisle": "2",
        "shelf": "Bottom",
        "barcode": "890126206003",
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60",
        "description": "Light, healthy cooking oil with essential vitamins E and D."
    },

    # ── 7. Personal Care ──────────────────────────────────────────────
    {
        "name": "Dove Deep Moisture Body Wash 250ml",
        "category": "Personal Care",
        "price": 180.0,
        "stock": 35,
        "aisle": "6",
        "shelf": "Mid",
        "barcode": "890126207001",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
        "description": "Nourishing formula with NutriumMoisture for soft, smooth skin after one shower."
    },
    {
        "name": "Colgate Total Charcoal Toothpaste 150g",
        "category": "Personal Care",
        "price": 120.0,
        "stock": 45,
        "aisle": "6",
        "shelf": "Top",
        "barcode": "890126207002",
        "image_url": "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=500&auto=format&fit=crop&q=60",
        "description": "12 hour whole mouth antibacterial protection with micro charcoal particles."
    },

    # ── 8. Household Essentials ───────────────────────────────────────
    {
        "name": "Vim Lemon Dishwash Gel 500ml",
        "category": "Household Essentials",
        "price": 105.0,
        "stock": 50,
        "aisle": "5",
        "shelf": "Mid",
        "barcode": "890126208001",
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=60",
        "description": "Concentrated grease-cutting lemon gel cleans tough stains with just one spoon."
    },
    {
        "name": "Surf Excel Matic Liquid Detergent 1L",
        "category": "Household Essentials",
        "price": 230.0,
        "stock": 30,
        "aisle": "5",
        "shelf": "Bottom",
        "barcode": "890126208002",
        "image_url": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=60",
        "description": "Superior stain removal in washing machines without leaving powdery residue."
    },

    # ── 9. Electronics & Accessories ──────────────────────────────────
    {
        "name": "boAt Type-C Fast Charging Cable 1.5m",
        "category": "Electronics & Accessories",
        "price": 199.0,
        "stock": 20,
        "aisle": "5",
        "shelf": "Top",
        "barcode": "890126209001",
        "image_url": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=500&auto=format&fit=crop&q=60",
        "description": "Rugged braided nylon USB-C charging cable with 3A rapid sync and charging."
    },
    {
        "name": "Duracell Ultra AA Alkaline Batteries (Pack of 4)",
        "category": "Electronics & Accessories",
        "price": 160.0,
        "stock": 35,
        "aisle": "5",
        "shelf": "Top",
        "barcode": "890126209002",
        "image_url": "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=60",
        "description": "Long lasting power check batteries with up to 100% extra life for remotes and toys."
    }
]

def seed_ecommerce_catalog():
    db = SessionLocal()
    try:
        # 1. Seed Categories
        category_map = {}
        unique_categories = list(set(p["category"] for p in PRODUCTS_DATA))
        for cat_name in unique_categories:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name, description=f"{cat_name} department")
                db.add(cat)
                db.commit()
                db.refresh(cat)
            category_map[cat_name] = cat.id

        # 2. Seed Products
        added_count = 0
        updated_count = 0
        for item in PRODUCTS_DATA:
            p = db.query(Product).filter(Product.name == item["name"]).first()
            cat_id = category_map.get(item["category"])

            if not p:
                p = Product(
                    name=item["name"],
                    category_id=cat_id,
                    price=item["price"],
                    stock=item["stock"],
                    shelf=item["shelf"],
                    aisle=item["aisle"],
                    barcode=item["barcode"],
                    description=item["description"],
                    is_active=True
                )
                db.add(p)
                added_count += 1
            else:
                p.price = item["price"]
                p.description = item["description"]
                p.category_id = cat_id
                p.shelf = item["shelf"]
                p.aisle = item["aisle"]
                updated_count += 1

        db.commit()
        total = db.query(Product).count()
        print(f"E-commerce catalogue seeded: {added_count} added, {updated_count} updated. Total products in store: {total}.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding catalogue: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_ecommerce_catalog()
