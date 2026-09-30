"""
Seed script for store policy documents.

Run from backend/ directory:
    python -m app.database.seed_policies
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import SessionLocal, init_db
from app.models.policy    import PolicyDocument

POLICIES = [
    {
        "title":    "Return & Refund Policy",
        "category": "Returns",
        "content":  """\
SmartMart offers a 30-day return policy on all eligible products from the date of purchase.

Eligibility:
- Products must be unused, unopened, and in original packaging.
- Perishable items (fresh produce, dairy, bakery) cannot be returned once purchased, \
unless they are found to be spoiled or damaged at the time of purchase.
- Personal care products (shampoo, toothpaste, etc.) that have been opened cannot be returned \
for hygiene reasons.
- Electronics and non-food items can be returned within 30 days with original receipt.

How to return:
- Visit the Customer Service desk at the store with the product and your receipt.
- If you paid by card, the refund will be credited to your original payment method within 5-7 business days.
- If you paid by cash, you will receive an immediate cash refund.

Damaged or defective products:
- If you receive a damaged or defective product, please report it within 48 hours of purchase.
- We will offer a full replacement or refund, whichever you prefer.

Exchanges:
- Exchanges are accepted within 30 days for non-perishable items in original condition.
- Bring the product and your receipt to the Customer Service desk.
""",
    },
    {
        "title":    "Membership & Loyalty Program",
        "category": "Membership",
        "content":  """\
SmartMart Loyalty Program — Earn points on every purchase!

How to join:
- Sign up at the Customer Service desk or on our website. Membership is free.
- You will receive a physical loyalty card and a digital account.

Earning points:
- Earn 1 point for every Rs. 10 spent on regular-priced items.
- Earn 2 points per Rs. 10 on items marked with the "Double Points" label.
- Fresh produce (fruits and vegetables) earns 1.5 points per Rs. 10 spent.

Redeeming points:
- 100 points = Rs. 10 discount on your next purchase.
- Points can be redeemed at checkout. Minimum redemption: 100 points.
- Points cannot be used to purchase alcohol, tobacco, or gift cards.
- Points expire 12 months after they are earned if not redeemed.

Membership tiers:
- Silver: 0–4,999 points  — standard benefits.
- Gold:   5,000–14,999 points — 5% extra discount on all purchases + priority checkout.
- Platinum: 15,000+ points — 10% extra discount + free home delivery on orders over Rs. 500.

Lost card:
- Report a lost card immediately at the Customer Service desk. Points are safely stored in your account.
""",
    },
    {
        "title":    "Payment Methods",
        "category": "Payment",
        "content":  """\
SmartMart accepts the following payment methods:

Cash:
- Indian Rupees (INR) accepted at all checkout counters.
- We maintain change for denominations up to Rs. 2,000.

Debit & Credit Cards:
- Visa, Mastercard, and RuPay cards accepted at all counters.
- American Express accepted at main checkout counters only.
- Contactless (tap) payments supported for amounts up to Rs. 5,000.

UPI (Unified Payments Interface):
- All major UPI apps accepted: GPay, PhonePe, Paytm, BHIM, Amazon Pay.
- Scan the QR code at the checkout counter.
- UPI payments are processed instantly.

Digital Wallets:
- Paytm Wallet, Mobikwik, and Freecharge accepted.

EMI:
- No-cost EMI available on purchases above Rs. 3,000 using select credit cards.
- EMI options: 3, 6, or 12 months. Ask the cashier for details.

Not accepted:
- Cheques and demand drafts are not accepted.
- Foreign currency is not accepted.

Billing:
- A GST-compliant digital receipt is sent to your registered email after every purchase.
- Physical receipts are available on request.
""",
    },
    {
        "title":    "Store Hours & Location",
        "category": "General",
        "content":  """\
SmartMart is open every day of the year, including public holidays.

Regular hours:
- Monday to Saturday: 8:00 AM – 10:00 PM
- Sunday: 9:00 AM – 9:00 PM

Holiday hours:
- On major public holidays (Republic Day, Independence Day, Diwali, Christmas, Eid), \
the store operates from 10:00 AM – 8:00 PM.
- The Customer Service desk closes 30 minutes before store closing time.

Special early access:
- Gold and Platinum loyalty members can shop from 7:30 AM on weekdays.

Services available at all hours:
- Self-checkout counters.
- ATM in the store lobby (24 hours).
- Parking facility (free for the first 2 hours; Rs. 20 per hour thereafter).

Contact:
- Customer helpline: 1800-SMART-MART (toll free, 8 AM – 9 PM)
- Email: support@smartmart.in
- In-store intercom: Dial 0 from any in-store phone.
""",
    },
    {
        "title":    "Product Quality & Freshness Guarantee",
        "category": "Quality",
        "content":  """\
SmartMart is committed to delivering the freshest and highest quality products.

Fresh produce (Fruits & Vegetables):
- All fresh produce is sourced daily from certified local farms.
- Any unsold produce past its freshness date is removed from shelves by 6 PM daily.
- If a product looks or smells spoiled, please do not purchase it. Inform staff immediately.

Dairy products:
- Dairy products are received fresh every morning and stored at regulated temperatures (0–4°C).
- Always check the "Best Before" date on packaging before purchasing.

Bakery items:
- Baked goods are prepared fresh in-store every morning.
- Unsold bakery items from the previous day are discounted by 50% from 7 PM.
- Day-old bakery items are clearly labelled "Baked Yesterday."

Packaged products:
- We guarantee that all packaged products are within their expiry date at the time of sale.
- If you find an expired product on our shelves, please inform a staff member. \
You will receive the product free of charge as a thank-you.

Quality complaints:
- If you are dissatisfied with the quality of any product, return it for a full refund or exchange. \
No questions asked, within 30 days.
""",
    },
    {
        "title":    "Home Delivery & Click-and-Collect",
        "category": "Delivery",
        "content":  """\
SmartMart offers convenient home delivery and Click-and-Collect services.

Home Delivery:

Availability:
- Available within a 10 km radius of the store.
- Delivery slots: 9 AM – 12 PM, 12 PM – 3 PM, 3 PM – 6 PM, 6 PM – 9 PM.

Charges:
- Orders above Rs. 500: Free delivery.
- Orders below Rs. 500: Delivery charge of Rs. 40.
- Platinum loyalty members: Free delivery on all orders.

Ordering:
- Place your order via our website or app by 11:59 PM for next-day delivery.
- Same-day delivery available for orders placed before 12 PM (subject to slot availability).

Click-and-Collect:
- Order online and collect from the store at no extra charge.
- Your order will be ready within 2 hours of placing it.
- Collect from the dedicated Click-and-Collect counter near the store entrance.
- Orders are held for 48 hours. After that, they are returned to stock and a refund is issued.

Substitutions:
- If an item is out of stock, we will contact you to offer a substitute or refund.
""",
    },
    {
        "title":    "Discounts, Offers & Price Match",
        "category": "Offers",
        "content":  """\
SmartMart offers regular discounts and a Price Match Guarantee.

Weekly Offers:
- Every Wednesday is "Fresh Wednesday" — all fresh produce discounted by 20%.
- "Weekend Specials" are announced every Friday on our app and in-store boards.

Seasonal Sales:
- Major sales during Diwali, New Year, and summer seasons with discounts up to 50%.
- Sale items are clearly labelled with red price tags.

Senior Citizen Discount:
- Customers aged 60 and above receive a flat 5% discount every Tuesday.
- Show a valid government ID at checkout.

Student Discount:
- Full-time students receive 10% off on stationery and snacks with a valid student ID.

Bulk Purchase Discount:
- Buy 3 or more of the same non-perishable item and receive an additional 10% off.

Price Match Guarantee:
- If you find the same product (same brand, same size) cheaper at a competing supermarket \
within 5 km, we will match that price.
- Show proof (receipt or app screenshot) at the Customer Service desk within 7 days of purchase.
- Price match does not apply to online-only retailers or flash sales.

Coupons:
- Physical and digital coupons can be presented at checkout.
- Only one coupon per transaction unless otherwise stated.
""",
    },
    {
        "title":    "Complaint & Grievance Policy",
        "category": "Support",
        "content":  """\
SmartMart takes customer complaints seriously and aims to resolve every issue promptly.

How to raise a complaint:

In-store:
- Speak to any store staff member, or visit the Customer Service desk.
- Ask to speak with the Store Manager for escalated issues.

Phone:
- Call our toll-free helpline: 1800-SMART-MART (available 8 AM – 9 PM, 7 days a week).

Email:
- Send your complaint to: complaints@smartmart.in
- Include your name, contact number, receipt number (if applicable), and a description of the issue.
- You will receive an acknowledgement within 24 hours and a resolution within 5 business days.

Online:
- Visit our website and use the "Feedback" section.

Response timelines:
- Billing errors: Resolved within 24 hours.
- Product quality complaints: Resolved within 48 hours.
- Delivery complaints: Resolved within 3 business days.
- General feedback: Addressed within 5 business days.

Escalation:
- If you are not satisfied with the resolution, you may escalate to our Regional Customer Experience Manager \
by emailing escalation@smartmart.in.

All complaints are logged and reviewed weekly to improve store operations.
""",
    },
]


def seed_policies() -> None:
    init_db()
    db = SessionLocal()
    try:
        existing_titles = {p.title for p in db.query(PolicyDocument.title).all()}
        inserted = 0
        for data in POLICIES:
            if data["title"] not in existing_titles:
                db.add(PolicyDocument(**data))
                inserted += 1
        db.commit()
        print(f"[OK] Policy seed complete -- {inserted} policies inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_policies()
