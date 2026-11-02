import { useState, useEffect } from 'react'
import client from '../api/client'
import Spinner from '../components/Spinner'

export default function Recommendations() {
  const [preferences, setPreferences] = useState('')
  const [budget, setBudget] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [maxResults, setMaxResults] = useState(5)
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [smartCartItems, setSmartCartItems] = useState([])

  useEffect(() => {
    client.get('/recommendations/categories')
      .then(r => setCategories(r.data))
      .catch(() => {})
  }, [])

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!preferences.trim()) { setError('Please describe what you are looking for.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        preferences: preferences.trim(),
        max_results: maxResults,
        ...(budget ? { budget: parseFloat(budget) } : {}),
        ...(selectedCategories.length > 0 ? { category_ids: selectedCategories } : {}),
      }
      const r = await client.post('/recommendations/', payload)
      setResult(r.data)
    } catch (err) {
      const msg = err.response?.data?.detail
      if (typeof msg === 'string' && msg.includes('API key')) {
        setError('AI service error. Ensure backend is running with GROQ_API_KEY set.')
      } else {
        setError('Failed to get recommendations. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const addToSmartCart = (item) => {
    if (!smartCartItems.some(i => i.id === item.id)) {
      setSmartCartItems(prev => [...prev, item])
    }
  }

  const removeFromSmartCart = (id) => {
    setSmartCartItems(prev => prev.filter(i => i.id !== id))
  }

  const totalCartCost = smartCartItems.reduce((acc, item) => acc + (item.price || 0), 0)
  const totalCartWeight = (smartCartItems.length * 0.45).toFixed(1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs uppercase tracking-widest border border-emerald-300 shadow-xs mb-2">
          <span>🛒</span>
          <span>In-Store Autonomous Shopping</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          SmartCart <span style={{ color: '#16a34a' }}>Digital Tablet</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Mounted Cart Unit #C-12 · Integrated Weight Scale & AI Shopping Assistant
        </p>
      </div>

      {/* ── Physical SmartCart Frame (Handlebar & Mounted Tablet) ─── */}
      <div className="relative">
        {/* Chrome Handlebar Structure */}
        <div className="hidden md:flex items-center justify-between px-12 -mb-4 z-0 relative">
          <div className="w-24 h-6 rounded-l-full bg-gradient-to-r from-gray-700 to-gray-500 border-2 border-gray-600 shadow-md flex items-center justify-center">
            <span className="text-[10px] font-mono text-gray-300 font-bold">GRIP L</span>
          </div>
          <div className="flex-1 h-3 bg-gradient-to-b from-gray-300 via-gray-100 to-gray-400 border-y border-gray-400 mx-1" />
          <div className="w-24 h-6 rounded-r-full bg-gradient-to-l from-gray-700 to-gray-500 border-2 border-gray-600 shadow-md flex items-center justify-center">
            <span className="text-[10px] font-mono text-gray-300 font-bold">GRIP R</span>
          </div>
        </div>

        {/* Physical Tablet Housing */}
        <div className="relative z-10 rounded-3xl p-4 sm:p-7 shadow-2xl border-4 bg-slate-900 border-slate-700">
          {/* Tablet Status Header */}
          <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800 text-slate-300 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 font-bold border border-green-500/30">
                CART TROLLEY #12
              </span>
              <span className="text-slate-400">WEIGHT SCALE: <strong className="text-white">{totalCartWeight} kg</strong> / 25.0 kg</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-green-400">● SCANNER ACTIVE</span>
              <span className="text-slate-400">BATTERY: 98% 🔋</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form & Recommendations Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Query Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-300 shadow-xs space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-green-900 mb-1.5">
                    What does your shopping list need today? *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Healthy breakfast items for a family under Rs. 200, or snacks for a birthday party..."
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-green-400"
                    style={{ borderColor: '#d1fae5' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Budget */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-green-900 mb-1">
                      Max Spend Budget (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="e.g. 300"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-400"
                      style={{ borderColor: '#d1fae5' }}
                    />
                  </div>

                  {/* Max results slider */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-green-900 mb-1">
                      Max Items: <strong className="text-green-700">{maxResults}</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={maxResults}
                      onChange={e => setMaxResults(parseInt(e.target.value))}
                      className="w-full accent-green-600 mt-2"
                    />
                  </div>
                </div>

                {/* Category Filter Chips */}
                {categories.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-green-900 mb-1.5">
                      Filter Departments:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map(cat => {
                        const active = selectedCategories.includes(cat.id)
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                            style={{
                              backgroundColor: active ? '#16a34a' : '#ffffff',
                              color: active ? '#ffffff' : '#166534',
                              borderColor: active ? '#16a34a' : '#bbf7d0',
                            }}
                          >
                            {cat.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-black text-white text-sm shadow-md transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {loading ? 'SmartCart AI is scanning shelves…' : '✨ Generate Smart Recommendations'}
                </button>
              </form>

              {/* Loading */}
              {loading && (
                <div className="bg-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 border border-slate-700">
                  <Spinner />
                  <p className="text-xs font-mono text-green-400">ANALYZING AISLE INVENTORY & NUTRITION DATA…</p>
                </div>
              )}

              {/* Recommendations Result */}
              {result && !loading && (
                <div className="space-y-4">
                  {/* AI Summary Banner */}
                  {result.ai_summary && (
                    <div className="rounded-2xl p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-100 text-xs leading-relaxed shadow-sm">
                      <div className="flex items-center gap-2 mb-1 text-emerald-400 font-bold uppercase tracking-wider">
                        <span>🤖</span>
                        <span>SmartCart Shopping Strategy</span>
                      </div>
                      <p>{result.ai_summary}</p>
                    </div>
                  )}

                  {/* Recommendation Item Cards */}
                  {(!result.recommendations || result.recommendations.length === 0) ? (
                    <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400 border border-slate-700 text-xs">
                      No matching products found within this budget. Try broadening your criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.recommendations.map((rec, idx) => {
                        const inSmartCart = smartCartItems.some(i => i.id === rec.id)
                        return (
                          <div
                            key={rec.id || idx}
                            className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
                            style={{ borderColor: inSmartCart ? '#16a34a' : '#d1fae5' }}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-green-600 text-white font-black text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                                  Aisle {rec.aisle || 'A1'}{rec.shelf ? ` · ${rec.shelf} shelf` : ''}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-sm text-gray-900 leading-snug">
                                {rec.name}
                              </h4>
                              {rec.brand && <p className="text-xs text-gray-400">by {rec.brand}</p>}

                              {/* Price + Category */}
                              <div className="flex items-center justify-between mt-2 mb-3">
                                <span className="text-base font-black text-green-700">
                                  Rs. {rec.price}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold border border-green-200">
                                  {rec.category || 'General'}
                                </span>
                              </div>

                              {/* Explanation */}
                              {rec.explanation && (
                                <p className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3 leading-relaxed">
                                  💡 {rec.explanation}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => inSmartCart ? removeFromSmartCart(rec.id) : addToSmartCart(rec)}
                              className="w-full py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                              style={
                                inSmartCart
                                  ? { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
                                  : { backgroundColor: '#16a34a', color: '#ffffff' }
                              }
                            >
                              <span>{inSmartCart ? '✕ Drop from Cart' : '🛒 Drop in SmartCart'}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Physical SmartCart Live Tray & Scale Status */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 flex flex-col justify-between text-slate-200">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧺</span>
                    <div>
                      <h3 className="font-black text-sm text-white">Live Cart Tray</h3>
                      <p className="text-[10px] text-slate-400 font-mono">WEIGHT SENSOR CALIBRATED</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-green-400">
                    {smartCartItems.length} items
                  </span>
                </div>

                {/* Items in physical cart list */}
                {smartCartItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <span className="text-3xl block mb-2">🛒</span>
                    Cart tray is empty. Click "Drop in SmartCart" to physically add recommended items!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {smartCartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Aisle {item.aisle || 'A1'} · Rs. {item.price}</p>
                        </div>
                        <button
                          onClick={() => removeFromSmartCart(item.id)}
                          className="w-6 h-6 rounded-lg bg-red-900/60 text-red-300 font-bold flex items-center justify-center hover:bg-red-800"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Ledger & Checkout Preview */}
              <div className="mt-6 pt-4 border-t border-slate-700 space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Cart Items Subtotal:</span>
                  <span className="text-white font-mono font-bold">Rs. {totalCartCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tray Weight:</span>
                  <span className="text-green-400 font-mono font-bold">{totalCartWeight} kg / 25 kg</span>
                </div>
                {budget && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Budget Balance:</span>
                    <span className={`font-mono font-bold ${totalCartCost > parseFloat(budget) ? 'text-red-400' : 'text-green-400'}`}>
                      Rs. {(parseFloat(budget) - totalCartCost).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-green-950 border border-green-800 text-center text-xs">
                  <p className="font-bold text-green-300">Ready to walk to Checkout?</p>
                  <p className="text-[10px] text-green-400/80 mt-0.5">Push cart to Lane 1, 2, or 3 near exit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
