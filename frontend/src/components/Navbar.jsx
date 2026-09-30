import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, logoutAdmin } = useAuth()
  const navigate = useNavigate()

  // Dynamic navigation links based on whether Admin is logged in
  const adminLinks = [
    { to: '/', label: 'Home' },
    { to: '/admin', label: '📊 Admin Portal', highlight: true },
    { to: '/products', label: '📦 Manage Inventory' },
    { to: '/planner', label: '🗺️ Route Simulator' },
    { to: '/policy-chat', label: '💬 Store Policies' },
    { to: '/recommendations', label: '✨ AI Recs' },
    { to: '/agents', label: '🤖 Multi-Agent' },
    { to: '/comparison', label: '⚡ Compare AI' },
  ]

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: '🛍️ Shop Catalog' },
    { to: '/planner', label: '🗺️ Route Planner' },
    { to: '/policy-chat', label: '💬 Policy Chat' },
    { to: '/recommendations', label: '✨ Recommendations' },
    { to: '/agents', label: '🤖 AI Agents' },
    { to: '/comparison', label: '⚡ Compare AI' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

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

            {/* Admin Badge (ONLY shown when authenticated as Admin) */}
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-600">
                👨‍💼 Admin Console (Parag)
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
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
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

          {/* ── User Auth Controls ────────────────────────────────── */}
          <div className="flex items-center gap-2.5">

            {isAdmin ? (
              // When Admin is authenticated: show logout button
              <button
                onClick={handleLogoutAdmin}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-900/80 hover:bg-red-900 hover:text-white transition-colors border border-amber-700/60 flex items-center gap-1.5"
                title="Logout from Admin Console"
              >
                <span>🚪</span>
                <span>Exit Admin</span>
              </button>
            ) : (
              // When regular customer: show simple login button
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-green-100 bg-green-800/70 hover:bg-green-700 transition-colors border border-green-700 flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>Sign In</span>
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
    </header>
  )
}
