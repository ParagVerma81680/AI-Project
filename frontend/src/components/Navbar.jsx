import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ApiKeyModal from './ApiKeyModal'

export default function Navbar() {
  const { user, isAdmin, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('smartmart_groq_api_key')
      if (savedKey) {
        setHasApiKey(true)
      }
    }
  }, [])

  const adminLinks = [
    { to: '/', label: 'Home' },
    { to: '/admin', label: '📊 Admin Console', highlight: true },
    { to: '/products', label: '🏬 Shelves & Aisles' },
    { to: '/planner', label: '🗺️ Store Floorplan' },
    { to: '/policy-chat', label: '💬 Touch Kiosk' },
    { to: '/recommendations', label: '🛒 SmartCart' },
    { to: '/agents', label: '📻 Staff Radio' },
    { to: '/comparison', label: '⚡ AI Diagnostics' },
  ]

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: '🏬 Supermarket Shelves' },
    { to: '/planner', label: '🗺️ In-Store Route' },
    { to: '/policy-chat', label: '💬 Helpdesk Kiosk' },
    { to: '/recommendations', label: '🛒 SmartCart AI' },
    { to: '/agents', label: '📻 Staff Intercom' },
    { to: '/comparison', label: '⚡ AI Diagnostics' },
  ]

  const navLinks = isAdmin ? adminLinks : customerLinks

  const handleLogoutAdmin = () => {
    logoutAdmin()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 shadow-md transition-colors"
      style={{
        backgroundColor: isAdmin ? '#1c1917' : '#14532d',
        borderBottom: isAdmin ? '2px solid #f59e0b' : '2px solid #16a34a'
      }}
    >
      {/* ── Top Physical Store Status Ticker ───────────────────────── */}
      <div className="bg-black/40 text-emerald-300 text-[10px] font-mono py-1 px-4 border-b border-white/10 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🏬 SMARTMART SUPERSTORE · BRANCH #14</span>
          </span>
          <span className="text-gray-400 hidden md:inline">|</span>
          <span className="text-gray-300 hidden md:inline">🕒 STORE HOURS: 07:00 AM - 10:00 PM (DAILY)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Key status & trigger button */}
          <button
            type="button"
            onClick={() => setApiKeyModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-mono transition-colors text-[10px]"
            title="Configure Groq API Key"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>AI BRAIN: GROQ ACTIVE</span>
            <span className="text-[9px] opacity-70">⚙️</span>
          </button>
          <span className="text-gray-400">|</span>
          <span className="text-amber-300 font-bold">MODEL: QWEN 27B</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* ── Logo ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: isAdmin ? '#d97706' : '#16a34a' }}
              >
                {isAdmin ? '👑' : '🛒'}
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                Smart<span style={{ color: isAdmin ? '#fcd34d' : '#86efac' }}>Mart</span>
              </span>
            </Link>

            {/* Admin Badge */}
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-600">
                👨‍💼 Store Manager (Parag)
              </span>
            )}
          </div>

          {/* ── Desktop Nav Links ─────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, highlight }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    isActive
                      ? isAdmin
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-green-600 text-white shadow-sm'
                      : highlight
                      ? 'text-amber-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/10',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── User Auth Controls & API Key Pill ─────────────────── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900 transition-colors flex items-center gap-1"
              title="Groq API Key Settings"
            >
              <span>🔑</span>
              <span className="hidden sm:inline">API</span>
            </button>

            {isAdmin ? (
              <button
                onClick={handleLogoutAdmin}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-900/80 hover:bg-red-900 hover:text-white transition-colors border border-amber-700/60 flex items-center gap-1.5 shadow-xs"
                title="Logout from Store Manager Mode"
              >
                <span>🚪</span>
                <span>Exit Manager</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-green-100 bg-green-800/70 hover:bg-green-700 transition-colors border border-green-700 flex items-center gap-1.5 shadow-xs"
              >
                <span>👤</span>
                <span>Store Portal</span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile Navigation Bar ───────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-start overflow-x-auto px-4 py-2 gap-1 border-t scrollbar-none"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-bold transition-all',
                isActive
                  ? isAdmin ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* API Key Modal */}
      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </header>
  )
}
