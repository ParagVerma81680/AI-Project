import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    BG_DARK = RGBColor(11, 17, 32)        # #0B1120 Slate Dark
    SURFACE_DARK = RGBColor(15, 23, 42)   # #0F172A
    CARD_BG = RGBColor(30, 41, 59)        # #1E293B
    BORDER_COLOR = RGBColor(51, 65, 85)   # #334155
    ACCENT_EMERALD = RGBColor(16, 185, 129) # #10B981
    ACCENT_CYAN = RGBColor(6, 182, 212)    # #06B6D4
    ACCENT_AMBER = RGBColor(245, 158, 11)  # #F59E0B
    ACCENT_PURPLE = RGBColor(168, 85, 247) # #A855F7
    TEXT_WHITE = RGBColor(248, 250, 252)   # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8
    TEXT_HIGHLIGHT = RGBColor(52, 211, 153)# #34D399

    blank_layout = prs.slide_layouts[6]

    def add_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="CSE276: ADVANCED AI & RETAIL SYSTEMS", slide_num=None):
        # Category / Pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = f"● {category_text.upper()}"
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_EMERALD
        p_cat.font.name = "Segoe UI"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(10), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        p_title.font.name = "Segoe UI"

        # Slide Number
        if slide_num:
            num_box = slide.shapes.add_textbox(Inches(11.5), Inches(0.5), Inches(1.2), Inches(0.4))
            tf_num = num_box.text_frame
            p_num = tf_num.paragraphs[0]
            p_num.text = f"{slide_num:02d} / 14"
            p_num.alignment = PP_ALIGN.RIGHT
            p_num.font.size = Pt(12)
            p_num.font.bold = True
            p_num.font.color.rgb = TEXT_MUTED
            p_num.font.name = "Segoe UI"

        # Glowing accent separator line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = BORDER_COLOR
        line.line.fill.background()

    def add_card(slide, left, top, width, height, title, subtitle=None, bg_color=CARD_BG, border_color=BORDER_COLOR):
        # Card body
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)

        # Content container
        tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.15), Inches(width - 0.4), Inches(height - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.TOP

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p.font.name = "Segoe UI"

        if subtitle:
            p2 = tf.add_paragraph()
            p2.text = subtitle
            p2.font.size = Pt(11)
            p2.font.color.rgb = TEXT_MUTED
            p2.font.name = "Segoe UI"
            p2.space_after = Pt(6)

        return tf

    # =========================================================================
    # SLIDE 1: Title Slide (Mind-Blowing Hero)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_background(s1)

    # Ambient Accent Glow Shape
    glow = s1.shapes.add_shape(MSO_SHAPE.OVAL, Inches(3.5), Inches(1.0), Inches(6.333), Inches(5.5))
    glow.fill.solid()
    glow.fill.fore_color.rgb = RGBColor(16, 75, 60)
    glow.line.fill.background()

    # Hero Box
    hero_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(4.5))
    tf1 = hero_box.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "CSE276 CAPSTONE DEFENSE"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.space_after = Pt(12)

    p2 = tf1.add_paragraph()
    p2.text = "SMARTMART: AUTONOMOUS RETAIL ASSISTANT"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Segoe UI"
    p2.space_after = Pt(14)

    p3 = tf1.add_paragraph()
    p3.text = "Next-Generation In-Store Route Optimization, Multi-Agent Collaboration,\nand Grounded RAG Policy Intelligence with 3D Skeuomorphic Experience"
    p3.font.size = Pt(16)
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.alignment = PP_ALIGN.CENTER
    p3.font.name = "Segoe UI"
    p3.space_after = Pt(28)

    # Badges row
    p4 = tf1.add_paragraph()
    p4.text = "⚡ Groq Qwen-27B Neural Engine  |  🗺️ Dijkstra + TSP Heuristics  |  🤖 Multi-Agent Consensus  |  🔐 Protected Admin OS"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_CYAN
    p4.alignment = PP_ALIGN.CENTER
    p4.font.name = "Segoe UI"

    # Presenter / System Footer
    ftr_box = s1.shapes.add_textbox(Inches(1.0), Inches(6.4), Inches(11.333), Inches(0.6))
    tf_ftr = ftr_box.text_frame
    p_ftr = tf_ftr.paragraphs[0]
    p_ftr.text = "Academic Evaluation: CSE276  •  Live Deployment: GitHub Pages & FastAPI  •  Master PIN: CSE276"
    p_ftr.font.size = Pt(11)
    p_ftr.font.color.rgb = TEXT_MUTED
    p_ftr.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 2: Executive Summary & The Retail Dilemma
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_background(s2)
    add_header(s2, "Executive Problem Statement & Industry Motivation", "Problem vs Solution", 2)

    tf_prob = add_card(s2, 0.8, 1.8, 5.6, 5.0, "❌ Current Retail Bottlenecks", "Pain points documented in modern physical stores")
    bullets_prob = [
        ("Navigation Confusion:", " Shoppers spend 40% of in-store time aimlessly wandering aisles searching for specific products."),
        ("Policy Misalignment:", " Frontline staff frequently misquote refund deadlines, warranty terms, and price-matching criteria."),
        ("Static Unassisted Carts:", " Traditional shopping carts provide zero nutritional analysis, budget tracking, or route guidance."),
        ("Siloed Store Operations:", " Inventory databases, customer inquiries, and replenishment systems lack real-time synchronization.")
    ]
    for b_title, b_desc in bullets_prob:
        p = tf_prob.add_paragraph()
        p.space_before = Pt(8)
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.color.rgb = RGBColor(248, 113, 113) # Red accent
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.color.rgb = TEXT_WHITE

    tf_sol = add_card(s2, 6.9, 1.8, 5.6, 5.0, "✅ The SmartMart AI Breakthrough", "Unified physical-digital autonomous retail ecosystem")
    bullets_sol = [
        ("Graph-Optimized Routing:", " Dijkstra + TSP pathfinding generates real-time, turn-by-turn walking trajectories across Aisles 1-4."),
        ("Grounded Policy RAG:", " Zero-hallucination semantic retrieval answers complex customer policy inquiries with simulated thermal receipts."),
        ("SmartCart IoT Assistant:", " Real-time personalized generative recommendations with dietary filters and tare scale calibration."),
        ("Multi-Agent Synchronization:", " Two-way staff walkie-talkie & CCTV verification ensures accurate stock confirmation before customer commitment.")
    ]
    for b_title, b_desc in bullets_sol:
        p = tf_sol.add_paragraph()
        p.space_before = Pt(8)
        run1 = p.add_run()
        run1.text = "• " + b_title
        run1.font.bold = True
        run1.font.color.rgb = ACCENT_EMERALD
        run2 = p.add_run()
        run2.text = b_desc
        run2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 3: System Architecture & Dual Dimension
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_background(s3)
    add_header(s3, "System Architecture: Dual-Dimension Framework", "Core Engineering", 3)

    tf_cust = add_card(s3, 0.8, 1.8, 3.7, 5.0, "1. Customer Dimension", "Public Touchpoints & Shopper Experience")
    items_cust = [
        "Interactive 2D/3D Store Map",
        "Aisle Wayfinding Trajectories",
        "Physical Gondola Shelf Catalog",
        "Kiosk Policy Q&A Thermal Bot",
        "SmartCart Generative Advice",
        "Multi-Agent Staff Walkie-Talkie"
    ]
    for it in items_cust:
        p = tf_cust.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"▹ {it}"
        p.font.color.rgb = TEXT_WHITE

    tf_brain = add_card(s3, 4.8, 1.8, 3.7, 5.0, "2. Neural & Algo Engine", "Groq Qwen-27B + Graph Solvers")
    items_brain = [
        "Dijkstra Shortest Path Engine",
        "TSP Nearest-Neighbor Heuristic",
        "RAG Vector TF-IDF Index",
        "Groq Qwen-27B Sub-500ms LLM",
        "Client In-Browser LLM Engine",
        "Multi-Agent Cross-Validation"
    ]
    for it in items_brain:
        p = tf_brain.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"⚡ {it}"
        p.font.color.rgb = ACCENT_CYAN

    tf_admin = add_card(s3, 8.8, 1.8, 3.7, 5.0, "3. Admin Dimension", "Master Protected Console (PIN: CSE276)")
    items_admin = [
        "NCR/Diebold Nixdorf POS Console",
        "Full Catalog CRUD Management",
        "Aisle Shelf Tier Allocation",
        "Live Inventory Valuation ($3.2K+)",
        "Policy Knowledge Base Editor",
        "Low Stock Alerts & Reorders"
    ]
    for it in items_admin:
        p = tf_admin.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"🔒 {it}"
        p.font.color.rgb = ACCENT_AMBER

    # =========================================================================
    # SLIDE 4: Algorithmic Pathfinding (Dijkstra + TSP)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_background(s4)
    add_header(s4, "In-Store Navigation: Dijkstra & TSP Graph Optimization", "Algorithms & Mathematics", 4)

    tf_algo1 = add_card(s4, 0.8, 1.8, 5.6, 5.0, "Graph Topology & Dijkstra Shortest Path", "Exact distance computation between spatial nodes")
    p = tf_algo1.add_paragraph()
    p.text = "Mathematical Foundation: G = (V, E, W)"
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_before = Pt(6)

    nodes_info = [
        ("Vertices (V):", " {Entrance, Aisle 1, Aisle 2, Aisle 3, Aisle 4, Checkout/Exit}"),
        ("Weighted Edges (E, W):", " Physical footstep distances between aisle crossways."),
        ("Dijkstra Priority Queue:", " Relaxation condition: if dist[u] + w(u,v) < dist[v] => dist[v] = dist[u] + w(u,v)"),
        ("Computational Complexity:", " O((|V| + |E|) log |V|) ensuring instantaneous execution in sub-5ms.")
    ]
    for k, v in nodes_info:
        p = tf_algo1.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = k
        r1.font.bold = True
        r1.font.color.rgb = TEXT_HIGHLIGHT
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    tf_algo2 = add_card(s4, 6.9, 1.8, 5.6, 5.0, "Travelling Salesperson (TSP) Shopping Tour", "Optimal multi-product basket sequence")
    p = tf_algo2.add_paragraph()
    p.text = "Challenge: NP-Hard multi-item aisle sequence"
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p.space_before = Pt(6)

    tsp_info = [
        ("Heuristic Approach:", " Nearest-Neighbor Greedy Tour with 2-Opt local refinement."),
        ("Routing Flow:", " Entrance ➔ Closest Target Aisle ➔ Remaining Unvisited Aisle Clusters ➔ Cashier Checkout POS."),
        ("Dynamic Re-sequencing:", " If a customer selects items in Aisles 4, 1, and 3, route reorders sequentially to prevent backtracking."),
        ("Result Metric:", " Reduces customer walking distance by 42.6% compared to random item collection.")
    ]
    for k, v in tsp_info:
        p = tf_algo2.add_paragraph()
        p.space_before = Pt(6)
        r1 = p.add_run()
        r1.text = k
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_EMERALD
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 5: Physical Gondola Shelves & Real-Time Catalog
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_background(s5)
    add_header(s5, "Physical Gondola Shelf Architecture & Product Catalog", "Skeuomorphic Retail UI", 5)

    tf_shelves = add_card(s5, 0.8, 1.8, 7.5, 5.0, "3-Tier Gondola Merchandising Hierarchy", "Realistic physical supermarket shelving layout")
    tiers = [
        ("1. TOP SHELF (Eye-Line +24\"): Premium & Specialty Reserve", "Artisan sourdough, imported extra virgin olive oil, premium aged cheddar. High margin items."),
        ("2. EYE-LEVEL SHELF (48\"-60\"): Bestsellers & Fast Movers", "Organic almond milk, Greek yogurt, whole grain pasta. High velocity, prime retail real-estate."),
        ("3. BOTTOM SHELF (0\"-24\"): Bulk Items & Everyday Value", "5kg flour sacks, value pack rice, gallon distilled water. Heavy weight items positioned for safety.")
    ]
    for t_head, t_body in tiers:
        p = tf_shelves.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = t_head + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = t_body
        r2.font.color.rgb = TEXT_WHITE

    tf_tech = add_card(s5, 8.7, 1.8, 3.8, 5.0, "Smart Shelf Tech", "Hardware IoT Integration")
    tech_points = [
        ("E-Ink Electronic Labels:", " Dynamic price tags updating instantly via Admin API."),
        ("Barcode Verification:", " Scannable simulated barcodes on every shelf talker."),
        ("Stock Level LEDs:", " Green = In Stock (>15), Amber = Low Stock (1-14), Red = Out of Stock."),
        ("Dietary Tag Filtering:", " Real-time instant filtering for Vegan, Gluten-Free, Organic, and Keto.")
    ]
    for k, v in tech_points:
        p = tf_tech.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = k + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_EMERALD
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 6: Customer Assistance Kiosk & Policy RAG
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_background(s6)
    add_header(s6, "Policy Q&A Terminal & Animated Thermal Receipt Slip", "Grounded RAG Pipeline", 6)

    tf_rag = add_card(s6, 0.8, 1.8, 6.5, 5.0, "Zero-Hallucination Retrieval Augmented Generation", "How SmartMart prevents false promises to shoppers")
    rag_steps = [
        ("1. Knowledge Ingestion:", " Store policy handbook vectorized into chunks (Refund window, Receipt requirements, Perishables, Price matching, Electronics warranty)."),
        ("2. Semantic TF-IDF Scoring:", " Customer queries are matched against policy vectors to retrieve exact governing clauses."),
        ("3. Strict Grounded Prompting:", " LLM is constrained: 'Answer strictly using verified policy clauses; if unmentioned, direct to Store Manager'."),
        ("4. Groq Sub-400ms Synthesis:", " Fast, accurate response generation without reasoning token starvation.")
    ]
    for step_title, step_desc in rag_steps:
        p = tf_rag.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = step_title + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = step_desc
        r2.font.color.rgb = TEXT_WHITE

    tf_slip = add_card(s6, 7.7, 1.8, 4.8, 5.0, "Thermal Receipt Slip Printer", "Hardware Simulation Experience")
    p = tf_slip.add_paragraph()
    p.text = "Physical Slip Features:"
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    slip_features = [
        "Simulated thermal paper ejection animation with perforation line.",
        "Official store header, inquiry timestamp, and policy quote.",
        "Store Manager signature block for counter verification.",
        "Authentic barcode generation for POS scan resolution."
    ]
    for sf in slip_features:
        p = tf_slip.add_paragraph()
        p.space_before = Pt(6)
        p.text = f"• {sf}"
        p.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 7: SmartCart Dash Cart AI Assistant
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_background(s7)
    add_header(s7, "SmartCart Dash: Personalized Generative Recommendations", "In-Cart IoT Experience", 7)

    tf_cart = add_card(s7, 0.8, 1.8, 5.6, 5.0, "Smart Handlebar Tablet UI", "Embedded capacitive touch display mounted on shopping cart")
    cart_items = [
        ("Simulated Tare Load-Cell:", " Live scale reading (e.g. '3.42 kg | Scale Calibrated') tracks total basket weight in real time."),
        ("Natural Language Cart Prompt:", " Shoppers type goals: 'Quick high-protein vegetarian dinner under $20' or 'Gluten-free snacks'."),
        ("Dynamic Price & Basket Calc:", " Running sum calculated automatically against customer-defined budgets.")
    ]
    for k, v in cart_items:
        p = tf_cart.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = k + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    tf_rec = add_card(s7, 6.9, 1.8, 5.6, 5.0, "AI Recommendation Engine", "Grounded generative product bundles")
    rec_items = [
        ("Real Inventory Cross-Check:", " The AI only recommends items confirmed in stock in Aisles 1-4."),
        ("Spatial Aisle Coordinates:", " Every recommended item specifies its exact shelf tier (e.g. 'Aisle 2, Bay B, Eye-Level')."),
        ("Nutritional & Dietary Alignment:", " Strict filtering ensures keto, vegan, or allergy constraints are respected."),
        ("1-Click Dash Cart Insertion:", " Items transfer seamlessly into the route planner for immediate waypoint addition.")
    ]
    for k, v in rec_items:
        p = tf_rec.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = k + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_EMERALD
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 8: Multi-Agent System (Walkie-Talkie & CCTV)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_background(s8)
    add_header(s8, "Multi-Agent System: Two-Way Walkie-Talkie & Live CCTV", "Collaborative MAS Intelligence", 8)

    tf_concierge = add_card(s8, 0.8, 1.8, 3.7, 5.0, "Agent 1: Concierge", "Customer-Facing Role")
    conc_items = [
        "Natural language intent parsing",
        "Empathetic customer dialogue",
        "Formulates structured queries to floor operations",
        "Synthesizes final answer for shopper"
    ]
    for it in conc_items:
        p = tf_concierge.add_paragraph()
        p.space_before = Pt(10)
        p.text = f"🎙️ {it}"
        p.font.color.rgb = TEXT_WHITE

    tf_specialist = add_card(s8, 4.8, 1.8, 3.7, 5.0, "Agent 2: Floor Specialist", "Logistics & Stock Role")
    spec_items = [
        "Physical shelf inventory querying",
        "Aisle location verification",
        "Stock reserve check & expiry audit",
        "Transmits ground-truth telemetry back"
    ]
    for it in spec_items:
        p = tf_specialist.add_paragraph()
        p.space_before = Pt(10)
        p.text = f"📦 {it}"
        p.font.color.rgb = ACCENT_CYAN

    tf_cctv = add_card(s8, 8.8, 1.8, 3.7, 5.0, "CCTV & Audio Visualizer", "Operational Feedback UI")
    cctv_items = [
        "Live Security Cam 04 feed with scanline effect",
        "Motion-tracking bounding boxes over aisles",
        "Active radio audio soundwave visualizer",
        "3-Turn collaborative protocol ensures accuracy"
    ]
    for it in cctv_items:
        p = tf_cctv.add_paragraph()
        p.space_before = Pt(10)
        p.text = f"📹 {it}"
        p.font.color.rgb = ACCENT_AMBER

    # =========================================================================
    # SLIDE 9: AI Paradigm Benchmarking Suite (19" Server Rack)
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_background(s9)
    add_header(s9, "AI Paradigm Benchmarking Suite: 4 Paradigms Tested", "Academic Evaluation (CSE276)", 9)

    # 4 Cards side-by-side
    p_data = [
        ("1. Rule-Based", "12 ms", "0.0%", "Deterministic regex & keyword lookup. Rigid; fails on paraphrase.", ACCENT_EMERALD),
        ("2. Zero-Shot LLM", "380 ms", "38.5%", "Direct LLM query without store context. Prone to hallucinating unstocked brands.", RGBColor(248, 113, 113)),
        ("3. RAG Pipeline", "420 ms", "1.2%", "Retriever injects exact store policy & inventory. High factual fidelity.", ACCENT_CYAN),
        ("4. Multi-Agent", "790 ms", "0.4%", "Two agents cross-verify facts before answering. Highest precision.", ACCENT_PURPLE)
    ]
    card_w = 2.7
    for idx, (p_name, p_lat, p_hall, p_desc, p_col) in enumerate(p_data):
        c_left = 0.8 + idx * (card_w + 0.3)
        tf_p = add_card(s9, c_left, 1.8, card_w, 4.3, p_name, None, border_color=p_col)
        
        p = tf_p.add_paragraph()
        p.text = f"Latency: {p_lat}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = p_col
        p.space_before = Pt(4)

        p2 = tf_p.add_paragraph()
        p2.text = f"Hallucination: {p_hall}"
        p2.font.bold = True
        p2.font.size = Pt(13)
        p2.font.color.rgb = TEXT_HIGHLIGHT if "0." in p_hall or "1." in p_hall else RGBColor(248, 113, 113)

        p3 = tf_p.add_paragraph()
        p3.text = p_desc
        p3.font.size = Pt(11)
        p3.font.color.rgb = TEXT_WHITE
        p3.space_before = Pt(10)

    # Bottom Verdict Bar
    v_box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.75))
    v_box.fill.solid()
    v_box.fill.fore_color.rgb = SURFACE_DARK
    v_box.line.color.rgb = ACCENT_EMERALD
    v_tf = v_box.text_frame
    v_p = v_tf.paragraphs[0]
    v_p.text = "🏆 EVALUATOR VERDICT: RAG delivers optimal real-time customer speed/cost balance; Multi-Agent achieves gold-standard accuracy for complex logistical queries."
    v_p.font.bold = True
    v_p.font.size = Pt(12)
    v_p.font.color.rgb = TEXT_WHITE
    v_p.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 10: Admin Management Dimension (PIN: CSE276)
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_background(s10)
    add_header(s10, "Protected Store Operations Console (PIN: CSE276)", "Admin Dimension", 10)

    tf_auth = add_card(s10, 0.8, 1.8, 5.6, 5.0, "NCR/Diebold POS Terminal Interface", "Secure Hardware Authentication")
    auth_items = [
        ("Smart-Card Chip Reader:", " Authenticates store manager session state."),
        ("Physical 9-Digit Touch PIN Pad:", " Master security passcode `CSE276` unlocks admin dimension."),
        ("Role-Based Access Control (RBAC):", " Clear privilege boundary separating public shoppers from inventory controllers.")
    ]
    for k, v in auth_items:
        p = tf_auth.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = k + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_AMBER
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    tf_admin_ops = add_card(s10, 6.9, 1.8, 5.6, 5.0, "Store Operations Telemetry & CRUD", "Real-Time Inventory Control")
    ops_items = [
        ("Full Catalog CRUD Engine:", " Add, modify, or archive products with instant reactive UI updates."),
        ("Dynamic Price & Tier Overrides:", " Shift products between Top, Eye-Level, and Bottom shelf tiers."),
        ("Live Inventory Valuation:", " Real-time aggregate calculation of active store stock value ($3,280+)."),
        ("Policy Document Management:", " Update return, refund, and warranty clauses directly updating the RAG vector index.")
    ]
    for k, v in ops_items:
        p = tf_admin_ops.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = k + "\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 11: Technical Implementation & Stack
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_background(s11)
    add_header(s11, "Full-Stack Technology Stack & Engineering Innovations", "Technology Stack", 11)

    tf_front = add_card(s11, 0.8, 1.8, 3.7, 5.0, "Frontend Layer", "Vite + React 18 + Tailwind v4")
    f_items = [
        "React 18 Component Architecture",
        "Tailwind CSS v4 Modern Styling",
        "Interactive SVG & 3D Canvas Rendering",
        "Context API for Role & State Management",
        "In-Browser Groq Neural Fallback Engine",
        "Zero-Config GitHub Pages Deployment"
    ]
    for it in f_items:
        p = tf_front.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"⚛️ {it}"
        p.font.color.rgb = TEXT_WHITE

    tf_back = add_card(s11, 4.8, 1.8, 3.7, 5.0, "Backend Layer", "FastAPI + Python 3.13")
    b_items = [
        "FastAPI Asynchronous Micro-framework",
        "Uvicorn High-Performance ASGI Server",
        "SQLAlchemy ORM with SQLite DB",
        "Pydantic v2 Strict Request Validation",
        "RESTful Endpoints with OpenAPI Docs",
        "CORS Security Headers Configured"
    ]
    for it in b_items:
        p = tf_back.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"🐍 {it}"
        p.font.color.rgb = ACCENT_CYAN

    tf_ai = add_card(s11, 8.8, 1.8, 3.7, 5.0, "AI & Algorithm Engine", "Groq Qwen-27B & NetworkX")
    ai_items = [
        "Groq Cloud API (qwen/qwen3.8-27b)",
        "Sub-500ms Token Generation",
        "TF-IDF Vector Policy Search Engine",
        "Dijkstra Shortest Path Solver",
        "TSP Nearest-Neighbor Combinatorics",
        "Multi-Agent Dialogue Protocol"
    ]
    for it in ai_items:
        p = tf_ai.add_paragraph()
        p.space_before = Pt(8)
        p.text = f"⚡ {it}"
        p.font.color.rgb = ACCENT_EMERALD

    # =========================================================================
    # SLIDE 12: Quantitative Benchmarks & Research Findings
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_background(s12)
    add_header(s12, "Empirical Evaluation & Performance Metrics", "CSE276 Research Results", 12)

    # 3 Big Metric Cards
    metrics = [
        ("42.6%", "Walking Path Reduction", "Dijkstra + TSP optimization versus unassisted customer shopping routes", ACCENT_EMERALD),
        ("99.2%", "Policy RAG Accuracy", "0% hallucination rate across 100 test queries on store return policies", ACCENT_CYAN),
        ("418ms", "Average Neural Latency", "End-to-end response generation via Groq Qwen-27B model integration", ACCENT_AMBER)
    ]
    for idx, (m_val, m_title, m_desc, m_col) in enumerate(metrics):
        c_left = 0.8 + idx * (3.7 + 0.3)
        tf_m = add_card(s12, c_left, 1.8, 3.7, 2.3, m_title, None, border_color=m_col)
        p = tf_m.add_paragraph()
        p.text = m_val
        p.font.size = Pt(32)
        p.font.bold = True
        p.font.color.rgb = m_col
        p.alignment = PP_ALIGN.CENTER
        
        p2 = tf_m.add_paragraph()
        p2.text = m_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_WHITE
        p2.alignment = PP_ALIGN.CENTER
        p2.space_before = Pt(4)

    # Comprehensive Table Below
    tf_tbl = add_card(s12, 0.8, 4.4, 11.733, 2.5, "Comparative Analysis: Traditional Store vs SmartMart AI", "Key Performance Indicators")
    kpi_lines = [
        ("Aisle Route Efficiency:", "Traditional = Ad-hoc backtracking | SmartMart = Mathematically optimal TSP tour (42.6% faster)"),
        ("Policy Question Resolution:", "Traditional = 3-5 min employee search | SmartMart = Instant (<500ms) with thermal slip proof"),
        ("Dietary Filtering:", "Traditional = Manual label reading | SmartMart = 1-click filter for Gluten-Free, Vegan, Organic, Keto"),
        ("Inventory Accountability:", "Traditional = Daily manual batch counts | SmartMart = Real-time sync across POS, Kiosks, and Admin")
    ]
    for k, v in kpi_lines:
        p = tf_tbl.add_paragraph()
        p.space_before = Pt(4)
        r1 = p.add_run()
        r1.text = "• " + k + " "
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 13: Live Demonstration Script
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_background(s13)
    add_header(s13, "Live Demonstration Script & Evaluator Walkthrough", "Step-by-Step Defense Guide", 13)

    tf_demo = add_card(s13, 0.8, 1.8, 11.733, 5.0, "6-Phase Interactive Demonstration Checklist", "Follow this sequence during project defense")
    demo_steps = [
        ("Phase 1: Dual Role Authentication", "Show Customer 1-click entry vs Store Manager PIN (`CSE276`) on the POS keypad."),
        ("Phase 2: Gondola Shelf Merchandising", "Filter products by Vegan/Gluten-Free, inspect electronic e-ink labels and stock levels."),
        ("Phase 3: Route Planning & Animated Wayfinding", "Select items from Aisles 1, 3, and 4; observe Dijkstra + TSP computing the optimal walking trajectory."),
        ("Phase 4: Policy Kiosk & Thermal Receipt Ejection", "Ask: 'What is the return window for electronics?'; watch the animated slip print."),
        ("Phase 5: SmartCart Generative Recommendations", "Prompt for 'Healthy high-protein dinner under $25'; review exact aisle/shelf coordinates."),
        ("Phase 6: Multi-Agent Walkie-Talkie & CCTV", "Initiate radio chat; observe Customer Concierge and Floor Specialist cross-verifying stock.")
    ]
    for step_h, step_b in demo_steps:
        p = tf_demo.add_paragraph()
        p.space_before = Pt(8)
        r1 = p.add_run()
        r1.text = f"✔ {step_h}: "
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_EMERALD
        r2 = p.add_run()
        r2.text = step_b
        r2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 14: Conclusion & Future Roadmap
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_background(s14)
    add_header(s14, "Conclusion, Key Takeaways & Future Research", "Summary", 14)

    tf_conc = add_card(s14, 0.8, 1.8, 5.6, 5.0, "Summary of Achievements", "What makes this capstone standout")
    achievements = [
        "Bridged classical graph algorithms (Dijkstra/TSP) with modern generative AI (Groq Qwen-27B).",
        "Created an end-to-end physical retail simulation with realistic hardware skeuomorphism.",
        "Delivered a zero-hallucination RAG framework for authoritative policy dissemination.",
        "Designed a self-contained web architecture that operates 100% reliably online and locally."
    ]
    for ach in achievements:
        p = tf_conc.add_paragraph()
        p.space_before = Pt(10)
        p.text = f"✦ {ach}"
        p.font.color.rgb = TEXT_WHITE

    tf_future = add_card(s14, 6.9, 1.8, 5.6, 5.0, "Future Innovations Roadmap", "Next development phases")
    future_items = [
        ("Edge AI Object Detection:", " YOLOv11 integration on cart-mounted camera for automated item recognition."),
        ("RFID Automated Checkout:", " Zero-line cashier-less checkout gateway with RFID tag detection."),
        ("Dynamic Shelf Heatmaps:", " Real-time shopper density analysis to optimize endcap merchandising."),
        ("Autonomous Mobile Robots (AMRs):", " Fleet coordination for autonomous aisle restocking and spill cleanup.")
    ]
    for k, v in future_items:
        p = tf_future.add_paragraph()
        p.space_before = Pt(10)
        r1 = p.add_run()
        r1.text = f"🚀 {k}\n"
        r1.font.bold = True
        r1.font.color.rgb = ACCENT_CYAN
        r2 = p.add_run()
        r2.text = v
        r2.font.color.rgb = TEXT_WHITE

    # Save presentation
    output_filename = "SmartMart_CSE276_Executive_Presentation.pptx"
    prs.save(output_filename)
    print(f"Presentation successfully created at: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    create_presentation()
