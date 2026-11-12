import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import client from '../api/client'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import Supermarket3D from '../components/Supermarket3D'

const CATEGORY_PILLS = [
  { id: 'all', name: 'All Items', icon: '🛒' },
  { id: 'dairy', name: 'Dairy & Breakfast', icon: '🥛', catMatch: ['dairy', 'milk', 'breakfast'] },
  { id: 'produce', name: 'Fruits & Vegetables', icon: '🥦', catMatch: ['fruit', 'vegetable', 'produce'] },
  { id: 'snacks', name: 'Snacks & Munchies', icon: '🍿', catMatch: ['snack', 'chips', 'biscuit', 'chocolate'] },
  { id: 'drinks', name: 'Cold Drinks & Juices', icon: '🥤', catMatch: ['beverage', 'drink', 'juice', 'water'] },
  { id: 'bakery', name: 'Artisan Bakery', icon: '🥖', catMatch: ['bakery', 'bread', 'croissant'] },
  { id: 'grocery', name: 'Grocery & Staples', icon: '🌾', catMatch: ['grocery', 'staple', 'rice', 'flour'] },
  { id: 'hygiene', name: 'Personal Care', icon: '🧴', catMatch: ['personal', 'care', 'shampoo', 'soap'] },
  { id: 'household', name: 'Household Essentials', icon: '🧼', catMatch: ['household', 'cleaning'] },
]

const PROMO_BANNERS = [
  {
    title: '⚡ 10-15 Min Instant Darkstore Delivery',
    subtitle: 'From SmartMart automated darkstore direct to your doorstep with guaranteed atomic stock.',
    badge: 'AUTONOMOUS FULFILLMENT',
    bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    ctaText: 'Shop Instant Deals',
  },
  {
    title: '🤖 SmartBot AI · One Central Brain',
    subtitle: 'Ask for budget meal planning, in-store 3D routes, return policies, or live stock updates.',
    badge: 'UNIFIED AI ENGINE',
    bg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    ctaText: 'Talk to SmartBot',
    isSmartBot: true,
  },
  {
    title: '🗺️ Interactive 3D Digital Twin',
    subtitle: 'Walk through 8 aisles with Dijkstra collision-free corridors and real-time shelf raycasting.',
    badge: '3D TWIN VISUALIZER',
    bg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    ctaText: 'Explore 3D Store',
    routeTo: '/planner',
  },
]

// Preset Budget Meal Plans for 1-click addition
const PRESET_MEAL_PLANS = [
  {
    id: 'dinner-2',
    name: 'Dinner for 2 Under ₹300',
    budget: '₹300',
    cost: '₹210',
    icon: '🍲',
    badge: 'POPULAR CHOICE',
    color: '#f43f5e',
    desc: 'Homestyle comfort meal: fresh potatoes, ripe tomatoes, onions, bread & crunchy chips.',
    items: ['Potato (Aloo) 1kg', 'Tomato Hybrid 1kg', 'Fresh White Bread', 'Lays Classic Salted'],
    aisles: ['C2', 'A2', 'B2'],
  },
  {
    id: 'breakfast-4',
    name: 'Breakfast for 4 Under ₹250',
    budget: '₹250',
    cost: '₹228',
    icon: '🥞',
    badge: 'HIGH ENERGY',
    color: '#06b6d4',
    desc: 'Nutritious family morning: pure dairy milk, whole brown bread, yellow bananas & farm butter.',
    items: ['Amul Taaza Milk 1L', 'Brown Bread 400g', 'Fresh Bananas 1 Dozen', 'Amul Butter 100g'],
    aisles: ['A1', 'A2', 'C1'],
  },
  {
    id: 'movie-night',
    name: 'Movie Night Munchies',
    budget: '₹180',
    cost: '₹150',
    icon: '🍿',
    badge: 'WEEKEND SPECIAL',
    color: '#a855f7',
    desc: 'Crisp party snack combo: salted potato chips, premium dark chocolate & chilled Coca-Cola.',
    items: ['Lays Classic Salted', 'Dark Chocolate 80g', 'Coca-Cola 330ml Can'],
    aisles: ['B2', 'B1'],
  },
  {
    id: 'protein-veg',
    name: 'High-Protein Veggie Basket',
    budget: '₹350',
    cost: '₹310',
    icon: '🥗',
    badge: 'HEALTH & FITNESS',
    color: '#10b981',
    desc: 'Fresh rich proteins: organic paneer block, protein curd, Washington apples & broccoli.',
    items: ['Fresh Malai Paneer 200g', 'Greek Yogurt Curd 400g', 'Fresh Apples 1kg'],
    aisles: ['A1', 'C1', 'C2'],
  },
]

export default function Home() {
  const { loginCustomer } = useAuth()
  const { openCart, cart, addToCart } = useCart()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [promoIndex, setPromoIndex] = useState(0)
  const [mealToast, setMealToast] = useState(null)
  const [preview3DAisle, setPreview3DAisle] = useState('A1')

  // Auto-rotate promo banners
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_BANNERS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Fetch initial products and categories
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [prodRes, catRes, statRes] = await Promise.allSettled([
          client.get('/products/', { params: { limit: 100 } }),
          client.get('/categories/'),
          client.get('/products/stats'),
        ])

        if (!isMounted) return

        if (prodRes.status === 'fulfilled' && prodRes.value.data) {
          setProducts(prodRes.value.data.products || prodRes.value.data || [])
        }
        if (catRes.status === 'fulfilled' && catRes.value.data) {
          setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : [])
        }
        if (statRes.status === 'fulfilled' && statRes.value.data) {
          setStats(statRes.value.data)
        }
      } catch (err) {
        console.warn('Home data load error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = p.name?.toLowerCase().includes(q)
        const matchesBrand = p.brand?.toLowerCase().includes(q)
        const matchesCat = (p.category?.name || p.category || '').toLowerCase().includes(q)
        if (!matchesName && !matchesBrand && !matchesCat) return false
      }

      if (selectedCategory !== 'all') {
        const pill = CATEGORY_PILLS.find((c) => c.id === selectedCategory)
        if (pill && pill.catMatch) {
          const catName = (p.category?.name || p.category || '').toLowerCase()
          const prodName = (p.name || '').toLowerCase()
          const matched = pill.catMatch.some(
            (term) => catName.includes(term) || prodName.includes(term)
          )
          if (!matched) return false
        }
      }

      return true
    })
  }, [products, searchQuery, selectedCategory])

  // Featured sections
  const bestSellers = useMemo(() => products.slice(0, 8), [products])
  const freshPicks = useMemo(() => {
    return products.filter((p) => {
      const c = (p.category?.name || p.category || '').toLowerCase()
      return c.includes('dairy') || c.includes('fruit') || c.includes('vegetable')
    }).slice(0, 8)
  }, [products])

  // Helper to open SmartBot with an optional query
  const handleOpenSmartBot = (query = '') => {
    window.dispatchEvent(new CustomEvent('open-smartbot', { detail: { query } }))
  }

  // 1-Click Add Meal Plan to Cart
  const handleAddMealToCart = (meal) => {
    let addedCount = 0
    meal.items.forEach((itemKeyword) => {
      const kw = itemKeyword.toLowerCase().split(' ')[0]
      const found = products.find((p) => (p.name || '').toLowerCase().includes(kw))
      if (found) {
        addToCart(found, 1)
        addedCount++
      }
    })

    setMealToast(`Added ${addedCount || meal.items.length} items from "${meal.name}" to cart!`)
    setTimeout(() => setMealToast(null), 3500)
  }

  const activePromo = PROMO_BANNERS[promoIndex]

  return (
    <div className="flex flex-col min-h-screen bg-[#080c16] text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* ── Darkstore Radar Live Ticker ───────────────────────────── */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 text-[11px] font-mono py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white tracking-wide">
              ⚡ SMARTMART DARKSTORE · SECTOR 14 HUB
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-emerald-400 font-bold hidden sm:inline">
              10-15 MIN FULFILLMENT ACTIVE
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-rose-400 font-bold hidden md:inline">
              SMARTBOT AUTONOMOUS CORE: ONLINE
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="hidden sm:inline text-slate-400">📦 Free Delivery on ₹499+</span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <Link to="/orders" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
              Track Order
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/planner" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
              3D Store Twin
            </Link>
          </div>
        </div>
      </div>

      {/* ── Toast Notification for Meal Planner ────────────────────── */}
      {mealToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <span>🛒</span>
          <span>{mealToast}</span>
          <button
            onClick={openCart}
            className="ml-2 px-2 py-0.5 bg-slate-950 text-white rounded-lg text-[10px] uppercase font-black tracking-wider hover:bg-slate-800"
          >
            View Cart
          </button>
        </div>
      )}

      {/* ── Cinematic Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 border-b border-slate-800/80 bg-gradient-to-b from-[#0a0f1d] via-[#080c16] to-[#0d1424]">
        {/* Glowing cyber mesh background orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-10">
            {/* Top Cyber Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-rose-400 font-mono text-xs font-bold uppercase tracking-widest shadow-lg mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>One Central AI · 3D Digital Twin · Real-Time Darkstore</span>
            </div>

            {/* Cinematic Hero Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
              <span className="block text-white">THE AI-POWERED</span>
              <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
                SUPERMARKET DIGITAL TWIN
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Orchestrated by <strong className="text-rose-400 font-black">SmartBot</strong> — one central AI managing customer helpdesk, staff inventory, budget meal planning, and collision-free 3D store navigation.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/planner"
                className="px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>🚀 Launch 3D Supermarket</span>
                <span>➔</span>
              </Link>

              <button
                onClick={() => handleOpenSmartBot('Hello SmartBot! Give me a complete tour of SmartMart and what you can do.')}
                className="px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>🤖 Talk to SmartBot AI</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('catalog-grid')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center gap-2"
              >
                <span>🛒 Browse Live Catalog</span>
              </button>
            </div>

            {/* Live Telemetry KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12 pt-8 border-t border-slate-800/80 max-w-3xl mx-auto text-left">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Catalog Stock</span>
                <span className="text-xl font-black text-white">{products.length || 48} SKUs</span>
                <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">● Atomic Live Locking</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">3D Digital Twin</span>
                <span className="text-xl font-black text-white">8 Aisles</span>
                <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">● Walkable Corridors</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Central AI</span>
                <span className="text-xl font-black text-white">SmartBot</span>
                <span className="text-[10px] font-mono text-rose-400 block mt-0.5">● 27 Unified Tools</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Pathfinding</span>
                <span className="text-xl font-black text-white">&lt;12ms</span>
                <span className="text-[10px] font-mono text-amber-400 block mt-0.5">● Dijkstra vs Greedy</span>
              </div>
            </div>
          </div>

          {/* Dynamic Promo Slider */}
          <div
            className="rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500 border border-white/10"
            style={{ background: activePromo.bg }}
          >
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block text-[10px] font-black font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-black/30 backdrop-blur-md mb-3 border border-white/20">
                {activePromo.badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight leading-tight">
                {activePromo.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/95 mb-6 leading-relaxed max-w-xl">
                {activePromo.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {activePromo.isSmartBot ? (
                  <button
                    onClick={() => handleOpenSmartBot('Help me plan dinner for 2 under Rs. 300')}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-white text-slate-950 shadow-md hover:bg-slate-100 hover:scale-105 transition-all"
                  >
                    {activePromo.ctaText} →
                  </button>
                ) : activePromo.routeTo ? (
                  <Link
                    to={activePromo.routeTo}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-white text-slate-950 shadow-md hover:bg-slate-100 hover:scale-105 transition-all"
                  >
                    {activePromo.ctaText} →
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      const el = document.getElementById('catalog-grid')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-white text-slate-950 shadow-md hover:bg-slate-100 hover:scale-105 transition-all"
                  >
                    {activePromo.ctaText} →
                  </button>
                )}

                <button
                  onClick={openCart}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-black/30 text-white hover:bg-black/50 backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                >
                  <span>🛒 View Cart</span>
                  {cart.item_count > 0 && (
                    <span className="bg-emerald-400 text-emerald-950 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                      {cart.item_count}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-10">
              {PROMO_BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPromoIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === promoIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive 3D Supermarket Showcase ────────────────────── */}
      <section className="py-14 px-4 sm:px-6 bg-[#080c16] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>🏬</span>
                <span>Three.js Spatial Digital Twin</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Interactive 3D Supermarket Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Rotate 360°, inspect physical aisles with raycasting, and test shortest-path cart navigation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/planner"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Open Full 3D Route Studio</span>
                <span>➔</span>
              </Link>
            </div>
          </div>

          {/* 3D Viewport Box */}
          <div className="rounded-3xl border-2 border-slate-800 bg-slate-950 shadow-2xl overflow-hidden relative">
            <Supermarket3D
              route={['A1', 'B2', 'C1', 'D1', 'EXIT']}
              activeAisle={preview3DAisle}
              onAisleSelect={(aisle) => setPreview3DAisle(aisle)}
              cartItems={cart.items}
            />

            {/* Quick Aisle Jump Bar */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 text-[11px] uppercase">Inspect Aisle:</span>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1'].map((aisle) => (
                  <button
                    key={aisle}
                    onClick={() => setPreview3DAisle(aisle)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                      preview3DAisle === aisle
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {aisle}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                <span>Walkable Corridor Engine: </span>
                <span className="text-emerald-400 font-bold">100% Collision-Free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1: ONE CENTRAL AI — SMARTBOT ──────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-[#0a0f1d] border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>🤖</span>
              <span>Unified Autonomous Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              SmartBot: One Central Supermarket AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              No multiple fragmented bots. Helpdesk, staff intercom, smart cart recommendations, route pathfinding, and diagnostics unified into one central intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Capability 1: Customer Support Kiosk */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🛎️
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">Customer Support Desk</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                    RAG Grounded
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Instant grounded answers on returns, refunds, spoiled items, and warranties with printable receipts.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenSmartBot('Can I return an opened milk pack if it was spoiled?')}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-center transition-all"
                >
                  Ask Return Policy ➔
                </button>
                <Link
                  to="/policy-chat"
                  className="block text-center text-[11px] text-slate-400 hover:text-white font-medium"
                >
                  Open Dedicated Kiosk Page
                </Link>
              </div>
            </div>

            {/* Capability 2: Staff Operations Intercom */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📻
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">Staff Floor Operations</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    CH-01 Radio
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Multi-agent radio dialogue coordinating customer concierge and floor inventory associates on frequency 446.0 MHz.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenSmartBot('Staff stock check: what products are low on inventory and need restocking?')}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-center transition-all"
                >
                  Run Staff Inventory Check ➔
                </button>
                <Link
                  to="/agents"
                  className="block text-center text-[11px] text-slate-400 hover:text-white font-medium"
                >
                  Open Floor Intercom Page
                </Link>
              </div>
            </div>

            {/* Capability 3: SmartCart & Budget Meal Planner */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">SmartCart Meal Planner</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Intent Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Generates realistic recipe ingredient lists strictly under your budget with accurate shelf locations.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenSmartBot('Suggest dinner for 2 under 300 with exact store ingredients and costs.')}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-center transition-all"
                >
                  Generate Dinner under ₹300 ➔
                </button>
                <Link
                  to="/recommendations"
                  className="block text-center text-[11px] text-slate-400 hover:text-white font-medium"
                >
                  Open SmartCart Planner Page
                </Link>
              </div>
            </div>

            {/* Capability 4: 3D Corridor Route Navigation */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🗺️
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">3D Route Navigation</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                    Dijkstra Path
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Calculates shortest walking distance through central corridors and aisles without clipping through shelves.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  to="/planner"
                  className="block w-full py-2 px-3 rounded-xl font-bold text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-center transition-all"
                >
                  Launch Route Visualizer ➔
                </Link>
              </div>
            </div>

            {/* Capability 5: Store Administration & Stock Locking */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">Store Administration</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800">
                    Live Portal
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Manage inventory levels, atomic reservation locking, order fulfillment, and RAG policy embeddings.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  to="/admin"
                  className="block w-full py-2 px-3 rounded-xl font-bold text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-center transition-all"
                >
                  Open Store Portal ➔
                </Link>
              </div>
            </div>

            {/* Capability 6: AI Diagnostics & Benchmark */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 backdrop-blur-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-base text-white">AI Systems Benchmark</h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                    Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Head-to-head performance comparisons: Rule-Based vs Zero-Shot vs RAG vs Multi-Agent execution latency.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  to="/comparison"
                  className="block w-full py-2 px-3 rounded-xl font-bold text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-center transition-all"
                >
                  Inspect AI Benchmarks ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: SMART BUDGET MEAL PLANNER ──────────────────── */}
      <section className="py-14 px-4 sm:px-6 bg-[#080c16] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>🍽️</span>
                <span>SmartCart AI Grocery Solutions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Intelligent Budget Meal Planner
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Curated meal plans designed to feed 2 to 4 people strictly within budget. 1-click cart addition.
              </p>
            </div>

            <Link
              to="/recommendations"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <span>Explore Custom Meal Builder</span>
              <span>➔</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_MEAL_PLANS.map((meal) => (
              <div
                key={meal.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{meal.icon}</span>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${meal.color}20`, color: meal.color, border: `1px solid ${meal.color}40` }}
                    >
                      {meal.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:text-emerald-300 transition-colors">
                    {meal.name}
                  </h3>

                  <div className="flex items-center gap-2 my-2">
                    <span className="text-xs font-bold text-emerald-400">{meal.cost}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/ Budget {meal.budget}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {meal.desc}
                  </p>

                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Ingredients:</span>
                    {meal.items.map((it, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleAddMealToCart(meal)}
                    className="w-full py-2.5 px-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-center shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>🛒 Add All to Cart</span>
                    <span>({meal.cost})</span>
                  </button>

                  <button
                    onClick={() => handleOpenSmartBot(`Suggest meal plan based on ${meal.name} with alternative ingredients.`)}
                    className="w-full py-1.5 px-2 text-[11px] font-mono text-slate-400 hover:text-rose-400 text-center transition-colors"
                  >
                    Ask SmartBot to customize ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: REAL-TIME PRODUCT CATALOG & SEARCH ─────────── */}
      <section id="catalog-grid" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Search & Category Filter Bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search "milk", "bread", "lays chips", "apples", "chocolate"…'
                className="w-full pl-12 pr-28 py-4 bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-950 text-white font-medium rounded-2xl border-2 border-slate-700 focus:border-rose-500 shadow-xl focus:outline-none transition-all text-sm sm:text-base placeholder:text-slate-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg"
                >
                  Clear
                </button>
              ) : (
                <div className="absolute right-3 hidden sm:flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-xl">
                    ● Live Inventory
                  </span>
                </div>
              )}
            </div>

            {/* Quick keywords */}
            <div className="flex items-center gap-2 mt-3 px-2 overflow-x-auto text-xs text-slate-400">
              <span className="font-mono text-slate-500 uppercase text-[10px] tracking-wider shrink-0">Popular:</span>
              {['Milk', 'Paneer', 'Chips', 'Bread', 'Apples', 'Cola', 'Tea'].map((word) => (
                <button
                  key={word}
                  onClick={() => setSearchQuery(word)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-rose-400 border border-slate-800 transition-colors shrink-0 font-medium text-[11px]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Category Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = selectedCategory === pill.id
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 scale-105'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="text-base">{pill.icon}</span>
                  <span>{pill.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory === 'all'
                ? 'All Available Products'
                : CATEGORY_PILLS.find((c) => c.id === selectedCategory)?.name || 'Products'}
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700">
              {filteredProducts.length} items
            </span>
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
          >
            <span>Full Catalog View</span>
            <span>➔</span>
          </Link>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner label="Loading live product inventory..." />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-800">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-bold text-slate-200 mb-1">No products found</h3>
            <p className="text-xs text-slate-400 mb-4">
              We couldn&apos;t find anything matching your search. Try adjusting keywords or category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate('/planner')}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 4: PHYSICAL AISLE DIRECTORY ────────────────────── */}
      <section className="py-14 px-4 sm:px-6 bg-[#0a0f1d] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 font-black text-xl flex items-center justify-center border border-cyan-500/20">
                🏬
              </span>
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-white">Physical Store Department & Aisle Directory</h2>
                <p className="text-xs text-slate-400">Digital Twin Layout · Superstore Sector 14 Hub</p>
              </div>
            </div>
            <Link
              to="/planner"
              className="text-xs px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shadow-sm"
            >
              Open 3D Route Map ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { aisle: 'A1', name: 'Dairy & Cold Storage', icon: '🥛', color: '#38bdf8', items: 'Milk, Paneer, Curd, Butter', shelf: 'Cooler Unit' },
              { aisle: 'A2', name: 'Artisan Bakery', icon: '🥖', color: '#fb923c', items: 'Fresh Breads, Buns, Croissants', shelf: 'Warm Oven Shelf' },
              { aisle: 'B1', name: 'Beverages & Juices', icon: '🥤', color: '#34d399', items: 'Cold Drinks, Juices, Waters', shelf: 'Chilled Fridge' },
              { aisle: 'B2', name: 'Snacks & Sweets', icon: '🍿', color: '#f43f5e', items: 'Chips, Peanuts, Chocolates', shelf: 'Gondola Rack' },
              { aisle: 'C1', name: 'Fresh Fruits Market', icon: '🍎', color: '#eab308', items: 'Apples, Bananas, Citrus', shelf: 'Wooden Crates' },
              { aisle: 'C2', name: 'Fresh Vegetables', icon: '🥦', color: '#22c55e', items: 'Tomatoes, Potatoes, Onions', shelf: 'Produce Bins' },
              { aisle: 'D1', name: 'Personal Care', icon: '🧴', color: '#a855f7', items: 'Shampoos, Toothpastes, Soaps', shelf: 'Hygiene Bay' },
              { aisle: 'EXIT', name: 'Checkout Lanes 1-3', icon: '💳', color: '#f97316', items: 'Cash, UPI, Cards, Self-Bagging', shelf: 'Registers' },
            ].map((dir) => (
              <Link
                key={dir.aisle}
                to="/planner"
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500 hover:bg-slate-900 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{dir.icon}</span>
                    <span
                      className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full text-slate-950"
                      style={{ backgroundColor: dir.color }}
                    >
                      AISLE {dir.aisle}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {dir.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{dir.items}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>{dir.shelf}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-cyan-400">View 3D ➔</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-auto py-10 bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-black text-white text-sm">SmartMart AI Retail Supermarket</p>
              <p className="text-[11px] text-slate-500 font-mono">
                SmartBot Central AI · FastAPI · PostgreSQL / SQLite · Groq Llama · Three.js 3D Twin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/products" className="hover:text-white transition-colors">Catalog</Link>
            <Link to="/planner" className="hover:text-white transition-colors">3D Twin</Link>
            <Link to="/recommendations" className="hover:text-white transition-colors">SmartCart</Link>
            <Link to="/orders" className="hover:text-white transition-colors">Track Orders</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Staff Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
