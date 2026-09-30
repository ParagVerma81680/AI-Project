import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const FEATURES = [
  {
    icon: '🛍️',
    title: 'Product Catalog',
    desc: 'Browse 21+ products with category filters, live search, and aisle mapping.',
    to: '/products',
    cta: 'Browse Products',
  },
  {
    icon: '🗺️',
    title: 'Route Planner',
    desc: 'Dijkstra shortest path algorithm with interactive SVG store map and aisle stops.',
    to: '/planner',
    cta: 'Plan My Route',
  },
  {
    icon: '💬',
    title: 'Policy Chat',
    desc: 'Ask any store policy question and get instant RAG-grounded answers with sources.',
    to: '/policy-chat',
    cta: 'Ask AI',
  },
  {
    icon: '✨',
    title: 'AI Recommendations',
    desc: 'Get personalised product suggestions based on your budget and preferences.',
    to: '/recommendations',
    cta: 'Get Suggestions',
  },
  {
    icon: '🤖',
    title: 'Multi-Agent AI',
    desc: 'Customer Agent & Store Agent dialogue in a 3-turn collaborative pipeline.',
    to: '/agents',
    cta: 'Talk to Agents',
  },
  {
    icon: '⚡',
    title: 'Compare AI Paradigms',
    desc: 'Benchmark Rule-Based, Zero-Shot, RAG & Multi-Agent side-by-side.',
    to: '/comparison',
    cta: 'Compare Now',
  },
]

const STAT_KEYS = [
  { key: 'total_products', label: 'Products', suffix: '+' },
  { key: 'categories', label: 'Categories', suffix: '' },
  { key: 'aisles', label: 'Store Aisles', suffix: '' },
  { key: 'in_stock', label: 'In Stock', suffix: '' },
]

export default function Home() {
  const { isAdmin, user, loginCustomer } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    client.get('/products/stats').then((r) => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <section
        className="relative pt-20 pb-28 px-6 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)',
        }}
      >
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: '#86efac' }}
        />
        <div
          className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: '#4ade80' }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <span
              className="text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase shadow-sm"
              style={{ backgroundColor: '#16a34a', color: '#bbf7d0' }}
            >
              CSE276 College AI Project · Two User Dimensions
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            AI-Based Smart Retail <br className="hidden sm:block" />
            <span style={{ color: '#86efac' }}>Store Assistant</span>
          </h1>
          <p className="text-base sm:text-lg text-green-200 max-w-2xl mx-auto mb-8 leading-relaxed">
            A dual-dimension platform: Store management for the <strong>Administrator</strong> and grounded generative intelligence for the <strong>Customer</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/products"
              className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: '#16a34a' }}
            >
              Explore Products
            </Link>
            <Link
              to="/planner"
              className="px-8 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: '#86efac', color: '#14532d' }}
            >
              Plan In-Store Route
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dual Dimension Selector Cards (Floating) ─────────────── */}
      <section className="px-6 max-w-5xl mx-auto -mt-14 relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Admin Dimension Card */}
          <div
            className="bg-white rounded-2xl p-6 shadow-xl border flex flex-col justify-between transition-all hover:-translate-y-1"
            style={{ borderColor: '#fde68a' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">👨‍💼</span>
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  🔒 Staff Only
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">
                Store Administrator Portal
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Full catalog inventory control (Add, Edit, Delete products), live stock restock alerts, inventory valuation, aisle shelf allocation, and AI engine health monitor.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link
                to="/admin"
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white text-center transition-all bg-amber-600 hover:bg-amber-700 shadow flex items-center justify-center gap-1.5"
              >
                <span>🔑</span>
                <span>Enter Admin Console ➔</span>
              </Link>
            </div>
          </div>

          {/* Customer Dimension Card */}
          <div
            className="bg-white rounded-2xl p-6 shadow-xl border flex flex-col justify-between transition-all hover:-translate-y-1"
            style={{ borderColor: '#bbf7d0' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🛒</span>
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  Dimension 2: Customer
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">
                Smart Shopper Experience
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Calculate the shortest in-store shopping route with Dijkstra, chat with the store policy RAG agent, receive personalized generative product recommendations, and talk to shopping bots.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link
                to="/planner"
                onClick={() => loginCustomer()}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white text-center transition-all bg-green-600 hover:bg-green-700 shadow"
              >
                Launch Route Planner ➔
              </Link>
              <Link
                to="/products"
                onClick={() => loginCustomer()}
                className="py-2.5 px-4 rounded-xl font-bold text-xs border border-green-300 text-green-700 text-center hover:bg-green-50"
              >
                Shop
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      {stats && (
        <section
          className="py-8 px-6 mt-12"
          style={{ backgroundColor: '#14532d' }}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STAT_KEYS.map(({ key, label, suffix }) => (
              <div key={key} className="text-center">
                <p className="text-3xl font-black text-white">
                  {stats[key] ?? '—'}{suffix}
                </p>
                <p className="text-sm font-medium mt-1" style={{ color: '#86efac' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Feature Cards ────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl font-black text-center mb-3"
            style={{ color: '#14532d' }}
          >
            Core Project Modules & Capabilities
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm">
            Everything specified in the CSE276 project guidelines built into a connected full-stack application.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, to, cta }) => (
              <div
                key={to}
                className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3 border transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ borderColor: '#d1fae5' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: '#f0fdf4' }}
                >
                  {icon}
                </div>
                <h3 className="font-bold text-lg" style={{ color: '#14532d' }}>
                  {title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed flex-1">{desc}</p>
                <Link
                  to={to}
                  className="mt-2 inline-block text-xs font-bold px-4 py-2 rounded-lg transition-colors text-center"
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                >
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="mt-auto py-6 text-center text-xs"
        style={{ backgroundColor: '#14532d', color: '#86efac' }}
      >
        CSE276 College Project · SmartMart AI Assistant · Built with React + FastAPI + Claude API + SQLite
      </footer>
    </div>
  )
}
