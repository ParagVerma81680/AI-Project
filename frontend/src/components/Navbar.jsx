import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar({ onSearch }) {
  const { user, isAdmin, logoutAdmin } = useAuth()
  const { cart, openCart } = useCart()
  const [navSearch, setNavSearch] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (navSearch.trim()) {
      if (onSearch) onSearch(navSearch.trim())
      navigate(`/products?search=${encodeURIComponent(navSearch.trim())}`)
    }
  }

  const adminLinks = [
    { to: '/', label: 'Storefront' },
    { to: '/admin', label: '📊 Admin Console', highlight: true },
    { to: '/orders', label: '📦 Orders' },
    { to: '/products', label: '🏬 Inventory' },
    { to: '/recommendations', label: '🛒 SmartCart AI' },
    { to: '/planner', label: '🗺️ Store Map' },
    { to: '/policy-chat', label: '💬 Policy Kiosk' },
    { to: '/agents', label: '📻 Staff Radio' },
    { to: '/comparison', label: '⚡ AI Diagnostics' },
  ]

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: '🏬 All Products' },
    { to: '/recommendations', label: '🛒 SmartCart AI' },
    { to: '/orders', label: '📦 My Orders' },
    { to: '/planner', label: '🗺️ Route Planner' },
    { to: '/policy-chat', label: '💬 Helpdesk Kiosk' },
    { to: '/agents', label: '📻 Staff Intercom' },
    { to: '/comparison', label: '⚡ AI Benchmark' },
  ]

  const navLinks = isAdmin ? adminLinks : customerLinks

  return (
    <header className="sticky top-0 z-40 shadow-md bg-white border-b border-slate-200">
      {/* ── Top Status Ticker ────────────────────────────────────────── */}
      <div className="bg-emerald-950 text-emerald-300 text-[10px] font-mono py-1 px-4 hidden sm:flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🏬 SMARTMART SUPERSTORE · LIVE INVENTORY ENGINE</span>
          </span>
          <span className="text-emerald-700 hidden md:inline">|</span>
          <span className="text-emerald-300 hidden md:inline">🕒 07:00 AM - 10:00 PM (DAILY)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>WEBSOCKETS: REAL-TIME</span>
          </span>
          <span className="text-emerald-700">|</span>
          <span className="text-amber-300 font-bold">META LLAMA AUTONOMOUS</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">

          {/* ── Brand Logo ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                🛍️
              </div>
              <div className="flex flex-col">
                <span className="text-slate-900 font-black text-xl tracking-tight leading-none">
                  Smart<span className="text-emerald-600">Mart</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase">
                  ⚡ 10-15 Min Delivery
                </span>
              </div>
            </Link>
          </div>

          {/* ── Search Bar (Blinkit style header search) ─────────────── */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-2 relative items-center"
          >
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search 'milk', 'chips', 'bread', 'dal'..."
              className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
            />
            <span className="absolute left-3.5 text-slate-400 text-sm select-none">🔍</span>
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </form>

          {/* ── Desktop Navigation Links ─────────────────────────────── */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map(({ to, label, highlight }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : highlight
                      ? 'text-amber-700 hover:bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Right Action Controls: Cart Pill & Auth ───────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Shopping Cart Button Pill */}
            <button
              type="button"
              onClick={openCart}
              className="relative bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-2xl shadow-md shadow-emerald-900/20 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              aria-label="Open Shopping Cart"
            >
              <div className="relative">
                <span className="text-base">🛒</span>
                {cart.item_count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-400 text-amber-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cart.item_count}
                  </span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-emerald-100 uppercase tracking-wider font-mono leading-none">
                  {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
                </div>
                <div className="text-xs font-black font-mono leading-tight">
                  ₹{(cart.grand_total || 0).toFixed(2)}
                </div>
              </div>
            </button>

            {/* Admin or Store Portal Switch */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  logoutAdmin()
                  navigate('/')
                }}
                className="px-3 py-2 rounded-2xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center gap-1.5 transition-colors"
                title="Store Manager Mode"
              >
                <span>👑</span>
                <span className="hidden sm:inline">Exit Manager</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Store Portal</span>
              </Link>
            )}

          </div>

        </div>
      </div>

      {/* ── Mobile Horizontal Navigation Bar ─────────────────────────── */}
      <div className="xl:hidden flex items-center justify-start overflow-x-auto px-4 py-2 gap-1 border-t border-slate-200 scrollbar-none bg-slate-50">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'px-2.5 py-1 rounded-xl text-xs whitespace-nowrap font-bold transition-all',
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
