# AI-Based Smart Retail Store Assistant (SmartMart)

> **CSE276 College Project**  
> *"Create a retail assistant that plans product-finding routes, reasons over store policies, models customer and store agents, compares modern AI paradigms, and provides grounded generative recommendations."*

---

## 🌟 Key Features

1. **Dual Dimension Architecture**:
   - **Customer Dimension**: Public retail storefront with real-time catalog search, in-store route calculation, policy Q&A bot, generative recommendations, and shopping agent dialogues.
   - **Admin Dimension (Protected)**: Restricted store manager console protected by master password (`CSE276`). Full catalog CRUD, live inventory valuation, aisle shelf allocation, and policy RAG knowledge base control.

2. **Core AI & Algorithmic Modules**:
   - **In-Store Route Planner**: Uses **Dijkstra's Algorithm** and a **Travelling Salesperson (TSP)** nearest-neighbor heuristic to find the shortest walking path through store aisles (`A1–D1`, `ENTRANCE`, `EXIT`). Rendered on an interactive SVG store map.
   - **Store Policy Q&A (RAG)**: Uses **TF-IDF vector scoring** retrieval over store policy documents with **Claude 3.5 Sonnet** to deliver hallucination-free, policy-grounded answers.
   - **Generative Recommendations**: Claude-powered personalized recommendations with dietary, price, and category filters.
   - **Multi-Agent System (MAS)**: 3-turn collaborative dialogue between a **Customer Agent** (analyzes intent & synthesizes) and a **Store Agent** (queries real database facts).
   - **4-Paradigm Comparison Suite**: Real-time benchmark comparing **Rule-Based**, **Zero-Shot LLM**, **RAG**, and **Multi-Agent** approaches side-by-side with latency and source metrics.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, React Router DOM, Axios
- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2
- **Database**: SQLite (`retail_store.db`)
- **AI / LLM**: Anthropic Claude API (Claude 3.5 Sonnet)

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt

# Create .env from template
copy .env.example .env
# Set your ANTHROPIC_API_KEY=your_key_here in .env

# Run server (runs on port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Swagger API Docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Storefront opens at: `http://localhost:5173/`

---

## 🔐 Credentials & Roles

| Role | Access | Password |
|---|---|---|
| **Customer** | Direct 1-Click Login | *None required* |
| **Store Admin** | Manager Portal (`/admin`) | `CSE276` |

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & router registrations
│   │   ├── config.py            # Environment configuration
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routes/              # 8 API routers (products, routes, policies, etc.)
│   │   ├── services/            # Business logic & algorithms
│   │   ├── ai/                  # Claude client, RAG engine, & Multi-Agent system
│   │   └── utils/               # Graph theory & Dijkstra pathfinding
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, ProductCard, StoreMap, Spinner
│   │   ├── context/             # AuthContext (Dimension role management)
│   │   ├── pages/               # 8 full pages (Home, Products, RoutePlanner, etc.)
│   │   └── api/                 # Axios HTTP client
│   └── package.json
└── README.md
```
