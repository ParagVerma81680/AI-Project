import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { loginAdmin, loginCustomer, isAdmin, logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [userId, setUserId]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // Determine if user entered admin ID
  const isAdminId = userId.trim().toLowerCase() === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isAdminId) {
        if (!password.trim()) {
          setError('Please enter the admin password.')
          setLoading(false)
          return
        }
        await loginAdmin(password)
        setSuccess('Authenticated as Administrator (Parag)!')
        setTimeout(() => navigate('/admin'), 400)
      } else {
        // Any customer ID or 'customer' logs in directly
        await loginCustomer()
        setSuccess('Entering SmartMart as Customer…')
        setTimeout(() => navigate('/products'), 300)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* ── Brand Header ─────────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-md mb-3"
            style={{ backgroundColor: '#14532d', color: '#86efac' }}
          >
            🏪
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            SmartMart <span style={{ color: '#16a34a' }}>Sign In</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your User ID to proceed to your store portal.
          </p>
        </div>

        {/* ── Login Card ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-xl p-8" style={{ borderColor: '#d1fae5' }}>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── User ID Input Box ──────────────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                User ID
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="Enter User ID (e.g. customer, admin)"
                value={userId}
                onChange={e => { setUserId(e.target.value); setError('') }}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 font-medium"
                style={{ borderColor: '#d1fae5' }}
              />

              {/* Quick autofill helper chips */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-gray-400">Quick fill:</span>
                <button
                  type="button"
                  onClick={() => { setUserId('customer'); setError('') }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                >
                  customer
                </button>
                <button
                  type="button"
                  onClick={() => { setUserId('admin'); setError('') }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                >
                  admin
                </button>
              </div>
            </div>

            {/* ── Password Field (ONLY appears if User ID is 'admin') ─── */}
            {isAdminId && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900">
                    Admin Verification
                  </span>
                </div>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  style={{ borderColor: '#fde68a' }}
                />
              </div>
            )}

            {/* ── Error Message ──────────────────────────────────────── */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 text-center">
                ⚠️ {error}
              </div>
            )}

            {/* ── Success Message ────────────────────────────────────── */}
            {success && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs font-bold text-green-700 text-center">
                ✓ {success}
              </div>
            )}

            {/* ── Submit Action Button ───────────────────────────────── */}
            <button
              type="submit"
              disabled={loading || !userId.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: isAdminId ? '#d97706' : '#16a34a',
              }}
            >
              {loading ? (
                <span>Verifying…</span>
              ) : isAdminId ? (
                <>
                  <span>🔒</span>
                  <span>Sign In as Admin</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>Login as Customer</span>
                </>
              )}
            </button>

            {!isAdminId && (
              <p className="text-[11px] text-center text-gray-400">
                Customer access is direct with no password required.
              </p>
            )}

          </form>

          {/* Active Admin Session Status */}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Currently logged in as Admin (Parag)</span>
              <button
                onClick={() => { logoutAdmin(); navigate('/products') }}
                className="text-red-600 font-semibold hover:underline"
              >
                Logout
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
