// Initial Seed Data for Static Web / GitHub Pages Mode

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Dairy", description: "Milk, cheese, butter, and yoghurt products" },
  { id: 2, name: "Bakery", description: "Bread, buns, cakes, and pastries" },
  { id: 3, name: "Beverages", description: "Juices, sodas, water, and hot drinks" },
  { id: 4, name: "Snacks", description: "Chips, biscuits, nuts, and confectionery" },
  { id: 5, name: "Fruits", description: "Fresh seasonal fruits" },
  { id: 6, name: "Vegetables", description: "Fresh seasonal vegetables" },
  { id: 7, name: "Personal Care", description: "Soaps, shampoos, toothpaste, and skincare" },
]

export const INITIAL_PRODUCTS = [
  { id: 1, name: "Whole Milk 1L", brand: "FreshFarm", price: 49.00, stock: 80, aisle: "A1", shelf: "Mid", category_id: 1, barcode: "8901001000001", description: "Full-fat whole milk, 1 litre", is_active: true, category: { id: 1, name: "Dairy" } },
  { id: 2, name: "Low-Fat Milk 500ml", brand: "FreshFarm", price: 29.00, stock: 60, aisle: "A1", shelf: "Mid", category_id: 1, barcode: "8901001000002", description: "Low-fat toned milk, 500 ml", is_active: true, category: { id: 1, name: "Dairy" } },
  { id: 3, name: "Paneer 200g", brand: "Amul", price: 85.00, stock: 40, aisle: "A1", shelf: "Top", category_id: 1, barcode: "8901001000003", description: "Fresh cottage cheese block", is_active: true, category: { id: 1, name: "Dairy" } },
  { id: 4, name: "Curd 400g", brand: "Mother Dairy", price: 45.00, stock: 55, aisle: "A1", shelf: "Bot", category_id: 1, barcode: "8901001000004", description: "Set dahi, 400 g cup", is_active: true, category: { id: 1, name: "Dairy" } },

  { id: 5, name: "White Sandwich Bread", brand: "Britannia", price: 40.00, stock: 50, aisle: "A2", shelf: "Mid", category_id: 2, barcode: "8901002000001", description: "Soft white sliced bread, 400 g", is_active: true, category: { id: 2, name: "Bakery" } },
  { id: 6, name: "Whole Wheat Bread", brand: "Britannia", price: 45.00, stock: 45, aisle: "A2", shelf: "Mid", category_id: 2, barcode: "8901002000002", description: "100% whole wheat bread, 400 g", is_active: true, category: { id: 2, name: "Bakery" } },
  { id: 7, name: "Butter Croissant", brand: "Harvest Gold", price: 25.00, stock: 30, aisle: "A2", shelf: "Top", category_id: 2, barcode: "8901002000003", description: "Flaky butter croissant, 2 pcs", is_active: true, category: { id: 2, name: "Bakery" } },

  { id: 8, name: "Orange Juice 1L", brand: "Tropicana", price: 95.00, stock: 70, aisle: "B1", shelf: "Mid", category_id: 3, barcode: "8901003000001", description: "100% pure squeezed orange juice", is_active: true, category: { id: 3, name: "Beverages" } },
  { id: 9, name: "Packaged Drinking Water", brand: "Bisleri", price: 20.00, stock: 200, aisle: "B1", shelf: "Bot", category_id: 3, barcode: "8901003000002", description: "Mineral water, 1 litre bottle", is_active: true, category: { id: 3, name: "Beverages" } },
  { id: 10, name: "Green Tea (25 bags)", brand: "Tetley", price: 120.00, stock: 35, aisle: "B1", shelf: "Top", category_id: 3, barcode: "8901003000003", description: "Natural green tea, 25 teabags", is_active: true, category: { id: 3, name: "Beverages" } },
  { id: 11, name: "Cola 600ml", brand: "Coca-Cola", price: 40.00, stock: 90, aisle: "B1", shelf: "Bot", category_id: 3, barcode: "8901003000004", description: "Chilled cola, 600 ml PET bottle", is_active: true, category: { id: 3, name: "Beverages" } },

  { id: 12, name: "Salted Chips 100g", brand: "Lay's", price: 20.00, stock: 120, aisle: "B2", shelf: "Mid", category_id: 4, barcode: "8901004000001", description: "Salted potato chips, 100 g", is_active: true, category: { id: 4, name: "Snacks" } },
  { id: 13, name: "Mixed Nuts 250g", brand: "Happilo", price: 299.00, stock: 25, aisle: "B2", shelf: "Top", category_id: 4, barcode: "8901004000002", description: "Premium mixed dry fruits & nuts", is_active: true, category: { id: 4, name: "Snacks" } },
  { id: 14, name: "Marie Biscuits", brand: "Britannia", price: 30.00, stock: 80, aisle: "B2", shelf: "Bot", category_id: 4, barcode: "8901004000003", description: "Light wheat biscuits, 200 g", is_active: true, category: { id: 4, name: "Snacks" } },
  { id: 15, name: "Dark Chocolate 80g", brand: "Amul", price: 55.00, stock: 60, aisle: "B2", shelf: "Top", category_id: 4, barcode: "8901004000004", description: "55% cocoa dark chocolate bar", is_active: true, category: { id: 4, name: "Snacks" } },

  { id: 16, name: "Bananas (6 pcs)", brand: "Local Farm", price: 35.00, stock: 100, aisle: "C1", shelf: "Bot", category_id: 5, barcode: "8901005000001", description: "Ripe yellow bananas, ~6 pieces", is_active: true, category: { id: 5, name: "Fruits" } },
  { id: 17, name: "Red Apples 4 pcs", brand: "Himachal", price: 89.00, stock: 50, aisle: "C1", shelf: "Mid", category_id: 5, barcode: "8901005000002", description: "Fresh Shimla red apples", is_active: true, category: { id: 5, name: "Fruits" } },

  { id: 18, name: "Tomatoes 500g", brand: "Local Farm", price: 25.00, stock: 90, aisle: "C2", shelf: "Bot", category_id: 6, barcode: "8901006000001", description: "Fresh ripe tomatoes, 500 g", is_active: true, category: { id: 6, name: "Vegetables" } },
  { id: 19, name: "Potatoes 1kg", brand: "Local Farm", price: 30.00, stock: 110, aisle: "C2", shelf: "Bot", category_id: 6, barcode: "8901006000002", description: "Farm-fresh potatoes, 1 kg", is_active: true, category: { id: 6, name: "Vegetables" } },

  { id: 20, name: "Shampoo 200ml", brand: "Head & Shoulders", price: 189.00, stock: 40, aisle: "D1", shelf: "Top", category_id: 7, barcode: "8901007000001", description: "Anti-dandruff shampoo, 200 ml", is_active: true, category: { id: 7, name: "Personal Care" } },
  { id: 21, name: "Toothpaste 150g", brand: "Colgate", price: 75.00, stock: 65, aisle: "D1", shelf: "Mid", category_id: 7, barcode: "8901007000002", description: "Strong Teeth fluoride toothpaste", is_active: true, category: { id: 7, name: "Personal Care" } },
]

export const INITIAL_POLICIES = [
  {
    id: 1,
    title: "Return & Refund Policy",
    category: "Returns",
    content: "SmartMart offers a 30-day return policy on all eligible products from date of purchase. Products must be unused, unopened, and in original packaging. Perishable items cannot be returned unless found spoiled at time of purchase. Opened personal care products cannot be returned for hygiene reasons. Immediate cash refund or 5-7 business days for card payments.",
    is_active: true,
  },
  {
    id: 2,
    title: "Membership & Loyalty Program",
    category: "Membership",
    content: "Membership is free! Earn 1 point per Rs. 10 spent on regular items, 2 points per Rs. 10 on Double Points items, and 1.5 points on fresh produce. 100 points = Rs. 10 discount at checkout.",
    is_active: true,
  },
  {
    id: 3,
    title: "Accepted Payment Methods",
    category: "Payment",
    content: "We accept Cash, UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, MasterCard, RuPay), and Sodexo / Pluxee meal passes for eligible food groceries.",
    is_active: true,
  },
  {
    id: 4,
    title: "Store Hours & Holiday Operations",
    category: "Store Operations",
    content: "Monday to Sunday: 7:00 AM to 10:00 PM. Pharmacy counter: 8:00 AM to 9:00 PM. Open all 365 days including national holidays with adjusted timings on Diwali and New Year.",
    is_active: true,
  },
  {
    id: 5,
    title: "Freshness & Quality Guarantee",
    category: "Quality",
    content: "100% Freshness Guarantee on all fruits, vegetables, dairy, and bakery items. If not satisfied, return within 24 hours with receipt for a no-questions-asked replacement or full refund.",
    is_active: true,
  },
  {
    id: 6,
    title: "Home Delivery Policy",
    category: "Delivery",
    content: "Free home delivery within a 5 km radius on orders above Rs. 499. Orders below Rs. 499 incur a Rs. 30 delivery fee. Same-day delivery for orders placed before 4:00 PM.",
    is_active: true,
  },
  {
    id: 7,
    title: "Senior Citizens & Student Discounts",
    category: "Discounts",
    content: "Senior Citizens (age 60+) receive 5% off every Tuesday. Students receive 5% off on stationery and snacks on Wednesdays with valid student ID.",
    is_active: true,
  },
  {
    id: 8,
    title: "Customer Grievance & Escalation",
    category: "Customer Service",
    content: "Visit Customer Service desk or email support@smartmart.ai. Escalations resolved within 24-48 business hours with priority manager review.",
    is_active: true,
  },
]

// Store Graph nodes and edges
export const STORE_GRAPH = {
  ENTRANCE: { A1: 2, A2: 2 },
  A1: { ENTRANCE: 2, A2: 3, B1: 4 },
  A2: { ENTRANCE: 2, A1: 3, B2: 4 },
  B1: { A1: 4, B2: 3, C1: 4 },
  B2: { A2: 4, B1: 3, C2: 4 },
  C1: { B1: 4, C2: 3, D1: 4 },
  C2: { B2: 4, C1: 3, EXIT: 3 },
  D1: { C1: 4, EXIT: 2 },
  EXIT: { D1: 2, C2: 3 },
}

export const AISLE_LABELS = {
  A1: "Aisle A1 — Dairy",
  A2: "Aisle A2 — Bakery",
  B1: "Aisle B1 — Beverages",
  B2: "Aisle B2 — Snacks",
  C1: "Aisle C1 — Fruits",
  C2: "Aisle C2 — Vegetables",
  D1: "Aisle D1 — Personal Care",
}
