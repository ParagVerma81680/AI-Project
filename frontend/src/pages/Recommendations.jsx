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
        setError('Claude API key not configured. Add ANTHROPIC_API_KEY to backend/.env')
      } else {
        setError('Failed to get recommendations. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const stockColor = (stock) => {
    if (stock === 0) return '#ef4444'
    if (stock < 20) return '#f59e0b'
    return '#16a34a'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ color: '#14532d' }}>
          ✨ AI Product Recommendations
        </h1>
        <p className="text-gray-500 mt-1">
          Describe what you need in plain English — Claude will pick the best products for you.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border p-6 mb-8"
        style={{ borderColor: '#d1fae5' }}
      >
        {/* Preferences */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
            What are you looking for? *
          </label>
          <textarea
            rows={3}
            placeholder="e.g. I want healthy snacks for my kids' school lunchbox, or I need ingredients for a birthday cake under Rs. 200"
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ borderColor: '#d1fae5' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
              Budget (Rs.) — optional
            </label>
            <input
              type="number"
              min="0"
              step="10"
              placeholder="e.g. 500"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ borderColor: '#d1fae5' }}
            />
          </div>

          {/* Max results */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
              Number of recommendations: <span className="font-bold">{maxResults}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={maxResults}
              onChange={e => setMaxResults(parseInt(e.target.value))}
              className="w-full accent-green-600 mt-3"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#14532d' }}>
              Filter by Category — optional (none = all categories)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const active = selectedCategories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={{
                      backgroundColor: active ? '#16a34a' : '#f0fdf4',
                      color: active ? 'white' : '#16a34a',
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
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#16a34a' }}
        >
          {loading ? 'Getting recommendations…' : '✨ Get AI Recommendations'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Spinner />
          <p className="text-sm text-gray-500">Claude is analysing our product inventory for you…</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {/* AI Summary */}
          <div
            className="rounded-2xl p-5 mb-6 border"
            style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="font-bold text-sm" style={{ color: '#14532d' }}>Claude's Take</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.ai_summary}</p>
          </div>

          {/* Count */}
          <p className="text-sm text-gray-500 mb-4">
            Found <strong>{result.total_found}</strong> recommendation{result.total_found !== 1 ? 's' : ''} for:{' '}
            <em>"{result.preferences}"</em>
          </p>

          {/* Recommendation Cards */}
          {result.total_found === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              No matching products found. Try broadening your preferences or adjusting the budget.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col gap-3 transition-all hover:shadow-md"
                  style={{ borderColor: '#d1fae5' }}
                >
                  {/* Rank badge + name */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                      style={{ backgroundColor: '#16a34a' }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: '#14532d' }}>{rec.name}</h3>
                      {rec.brand && <p className="text-xs text-gray-400">{rec.brand}</p>}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                    >
                      Rs. {rec.price}
                    </span>
                    {rec.category && (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}
                      >
                        {rec.category}
                      </span>
                    )}
                    {rec.aisle && (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                      >
                        Aisle {rec.aisle}{rec.shelf ? ` · ${rec.shelf} shelf` : ''}
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: '#fafafa', color: stockColor(rec.stock) }}
                    >
                      {rec.stock > 0 ? `${rec.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* AI Explanation */}
                  <div
                    className="rounded-xl p-3 text-sm text-gray-700 leading-relaxed"
                    style={{ backgroundColor: '#f9fafb' }}
                  >
                    <span className="font-semibold text-xs" style={{ color: '#16a34a' }}>
                      Why Claude picked this:{' '}
                    </span>
                    {rec.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
