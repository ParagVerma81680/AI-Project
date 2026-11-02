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

  const cleanId = userId.trim().toLowerCase()
  const isDirectPassword = cleanId === 'cse276'
  const isAdminId = cleanId === 'admin' || cleanId === 'parag' || isDirectPassword

  const handleKeypadPress = (val) => {
    if (isAdminId && !isDirectPassword) {
      setPassword(prev => prev + val)
    } else {
      setUserId(prev => prev + val)
    }
    setError('')
  }

  const handleKeypadBackspace = () => {
    if (isAdminId && !isDirectPassword && password.length > 0) {
      setPassword(prev => prev.slice(0, -1))
    } else {
      setUserId(prev => prev.slice(0, -1))
    }
    setError('')
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isDirectPassword) {
        await loginAdmin('CSE276')
        setSuccess('SmartCard Verified: Store Manager (Parag)')
        setTimeout(() => navigate('/admin'), 400)
        return
      }

      if (isAdminId) {
        if (!password.trim()) {
          setError('Please enter the admin PIN password.')
          setLoading(false)
          return
        }
        await loginAdmin(password)
        setSuccess('PIN Accepted: Store Manager Access Granted!')
        setTimeout(() => navigate('/admin'), 400)
      } else {
        await loginCustomer()
        setSuccess('Guest Session Initialized: Entering Supermarket…')
        setTimeout(() => navigate('/products'), 400)
      }
    } catch (err) {
      setError(err.message || 'Access Denied: Invalid Terminal Password.')
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
            Store Access <span style={{ color: '#16a34a' }}>Terminal</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Station #01 · Insert User ID Badge or Enter PIN
          </p>
        </div>

        {/* ── Physical Terminal Housing ────────────────────────────── */}
        <div className="bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl p-6 sm:p-7 relative text-slate-200">
          {/* Card Reader Slot with Gold Microchip */}
          <div className="mb-5 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-6 rounded bg-amber-400 border border-amber-300 shadow-sm flex items-center justify-center">
                <span className="w-6 h-3 border border-amber-600 rounded-xs" />
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">SMARTKEY CHIP READER</span>
            </div>
            <span className="text-[10px] font-mono text-green-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              READY
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Terminal Screen Display */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>TERMINAL ID: ST-01</span>
                <span>AUTHENTICATION KIOSK</span>
              </div>

              {/* User ID Box */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider mb-1">
                  1. Scan User ID Card or Type Role:
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Type 'customer' or 'admin'"
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setError('') }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:ring-2 focus:ring-green-400"
                />

                {/* Quick Touch Preset Buttons */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">Tap Preset:</span>
                  <button
                    type="button"
                    onClick={() => { setUserId('customer'); setError('') }}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-green-950 text-green-300 border border-green-800 hover:bg-green-900"
                  >
                    🛒 customer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserId('admin'); setError('') }}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900"
                  >
                    👑 admin
                  </button>
                </div>
              </div>

              {/* Password Box (Only appears if User ID is admin) */}
              {isAdminId && !isDirectPassword && (
                <div className="pt-2 border-t border-slate-800 animate-fadeIn">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      2. Admin Security PIN:
                    </label>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800">
                      HIGH SECURITY
                    </span>
                  </div>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter admin password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    className="w-full bg-slate-900 border border-amber-700/60 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono outline-none focus:ring-2 focus:ring-amber-400 tracking-widest"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs font-bold text-red-300 text-center font-mono">
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-xl bg-green-950/80 border border-green-800 text-xs font-bold text-green-300 text-center font-mono">
                ✓ {success}
              </div>
            )}

            {/* Interactive Physical Keypad */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 uppercase block text-center mb-2">
                PHYSICAL PIN PAD
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(String(num))}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm shadow-xs transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-mono font-bold text-xs"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="py-2.5 rounded-xl bg-green-950/80 hover:bg-green-900 border border-green-800 text-green-300 font-mono font-bold text-xs"
                >
                  ENTER
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !userId.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: isAdminId ? '#d97706' : '#16a34a',
              }}
            >
              {loading ? (
                <span>Verifying Keycard Credentials…</span>
              ) : isAdminId ? (
                <>
                  <span>🔒</span>
                  <span>Authorize Store Administrator</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>Enter Supermarket as Customer</span>
                </>
              )}
            </button>
          </form>

          {/* Active Admin Session Status */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">● Active Store Owner Session (Parag)</span>
              <button
                onClick={() => { logoutAdmin(); navigate('/products') }}
                className="text-red-400 font-semibold hover:underline"
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
