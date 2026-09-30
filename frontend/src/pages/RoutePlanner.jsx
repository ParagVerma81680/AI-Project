import { useState, useRef, useEffect } from 'react'
import client from '../api/client'
import StoreMap from '../components/StoreMap'
import Spinner from '../components/Spinner'

// Quick sample carts for instant 1-click testing
const SAMPLE_CARTS = [
  {
    name: 'Breakfast Essentials',
    icon: '🥞',
    items: ['Whole Milk 1L', 'White Sandwich Bread', 'Bananas (1 Dozen)'],
  },
  {
    name: 'Snack & Party Run',
    icon: '🎉',
    items: ['Cola 600ml', 'Potato Chips Classic 150g', 'Chocolate Chip Cookies 200g'],
  },
  {
    name: 'Full Store Sweep',
    icon: '🛒',
    items: ['Whole Milk 1L', 'Butter Croissant', 'Cola 600ml', 'Potato Chips Classic 150g', 'Apples Royal Gala 1kg', 'Shampoo Daily Care 200ml'],
  }
]

export default function RoutePlanner() {
  const [searchQuery, setSearchQuery]       = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [searching, setSearching]           = useState(false)
  const [allProducts, setAllProducts]       = useState([])
  const [cart, setCart]                     = useState([])
  const [routeResult, setRouteResult]       = useState(null)
  const [planning, setPlanning]             = useState(false)
  const [error, setError]                   = useState(null)
  const [checkedItems, setCheckedItems]     = useState({})
  const searchTimer = useRef(null)

  // Fetch product list for quick recommendations and reliable lookup
  useEffect(() => {
    client.get('/products/', { params: { limit: 100 } })
      .then(res => {
        const prods = res.data?.products ?? []
        setAllProducts(prods)
      })
      .catch(() => {})
  }, [])

  // Check if cart has products passed from elsewhere (e.g. localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('smartmart_cart')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed)
        }
      } catch {}
    }
  }, [])

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('smartmart_cart', JSON.stringify(cart))
  }, [cart])

  const handleSearch = (q) => {
    setSearchQuery(q)
    clearTimeout(searchTimer.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await client.get('/products/', { params: { search: q.trim(), limit: 10 } })
        const data = res.data?.products ?? []
        setSearchResults(data)
      } catch {
        // Fallback to client-side filter of loaded products
        const filtered = allProducts.filter(p =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(q.toLowerCase()))
        )
        setSearchResults(filtered.slice(0, 8))
      } finally {
        setSearching(false)
      }
    }, 250)
  }

  const addToCart = (product) => {
    if (cart.some(p => p.id === product.id)) return
    setCart(prev => [...prev, product])
    setSearchQuery('')
    setSearchResults([])
    setRouteResult(null)
    setCheckedItems({})
  }

  const removeFromCart = (product) => {
    setCart(prev => prev.filter(p => p.id !== product.id))
    setRouteResult(null)
  }

  const clearCart = () => {
    setCart([])
    setRouteResult(null)
    setCheckedItems({})
  }

  const loadSampleCart = (sample) => {
    if (allProducts.length === 0) return
    const matched = allProducts.filter(p => sample.items.includes(p.name))
    setCart(matched.length > 0 ? matched : allProducts.slice(0, 4))
    setRouteResult(null)
    setCheckedItems({})
  }

  const planRoute = async () => {
    if (cart.length === 0) return
    setPlanning(true)
    setError(null)
    setRouteResult(null)
    setCheckedItems({})

    try {
      const productIds = cart
        .map(p => parseInt(p.id))
        .filter(id => !isNaN(id))

      if (productIds.length === 0) {
        setError('No valid product IDs in cart.')
        return
      }

      // Exact backend endpoint: POST /api/routes/plan
      const res = await client.post('/routes/plan', {
        product_ids: productIds,
        start: 'ENTRANCE',
        end: 'EXIT',
      })

      setRouteResult(res.data)
    } catch (err) {
      console.error('Route plan error:', err)
      setError(
        err.response?.data?.detail ||
        'Failed to calculate optimal route. Please ensure the backend is running.'
      )
    } finally {
      setPlanning(false)
    }
  }

  const toggleItemCheck = (productId) => {
    setCheckedItems(prev => ({ ...prev, [productId]: !prev[productId] }))
  }

  const fullPath     = routeResult?.full_path || []
  const orderedStops = routeResult?.ordered_stops || []
  const aisleStops   = routeResult?.aisle_stops || []
  const segments     = routeResult?.segments || []
  const totalDist    = routeResult?.total_distance ?? 0

  const totalCartPrice = cart.reduce((sum, p) => sum + (p.price || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🗺️</span>
            <h1 className="text-3xl font-black" style={{ color: '#14532d' }}>
              In-Store Route Planner
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
            >
              Dijkstra + TSP
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Add items to your cart and our graph algorithm calculates the shortest path through the store aisles.
          </p>
        </div>

        {/* Quick Sample Carts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Try Preset:
          </span>
          {SAMPLE_CARTS.map(sample => (
            <button
              key={sample.name}
              onClick={() => loadSampleCart(sample)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-green-500 hover:bg-green-50 shadow-sm"
              style={{ borderColor: '#d1fae5', color: '#166534', backgroundColor: '#ffffff' }}
            >
              <span>{sample.icon}</span>
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left Column: Product Search & Cart ───────────────────── */}
        <div className="lg:w-96 flex-shrink-0 space-y-6">

          {/* Search Box */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#d1fae5' }}
          >
            <h2 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center justify-between" style={{ color: '#15803d' }}>
              <span>Search Products</span>
              <span className="text-xs font-normal text-gray-400">{allProducts.length} items catalog</span>
            </h2>

            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search milk, bread, chips, apples..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-shadow focus:ring-2 focus:ring-green-400"
                style={{ borderColor: '#d1fae5' }}
              />
            </div>

            {searching && (
              <p className="text-xs text-center text-gray-400 mt-2">Searching catalog…</p>
            )}

            {searchResults.length > 0 && (
              <ul
                className="mt-3 border rounded-xl divide-y max-h-64 overflow-y-auto shadow-sm"
                style={{ borderColor: '#d1fae5' }}
              >
                {searchResults.map(p => {
                  const inCart = cart.some(c => c.id === p.id)
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={inCart}
                        className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between gap-2 text-sm ${
                          inCart ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-green-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            Aisle <span className="font-bold text-gray-600">{p.aisle}</span> · Shelf {p.shelf || 'Mid'} · Rs. {p.price}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                            inCart ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {inCart ? 'Added' : '+ Add'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Shopping Cart List */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#d1fae5' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: '#15803d' }}>
                  Shopping List
                </h2>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                >
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-sm font-medium">Your shopping list is empty.</p>
                <p className="text-xs mt-1 text-gray-400">
                  Search products or click one of the preset sample carts above.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cart.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all"
                    style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-bold text-green-700">Aisle {p.aisle}</span>
                        <span>•</span>
                        <span>Rs. {p.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-bold"
                      title="Remove from list"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#d1fae5' }}>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Estimated Total:</span>
                  <span className="font-bold text-sm text-gray-800">Rs. {totalCartPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={planRoute}
                  disabled={planning || cart.length === 0}
                  className="w-full py-3 rounded-xl font-black text-white text-sm shadow-md transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {planning ? (
                    <>
                      <Spinner />
                      <span>Calculating Shortest Route…</span>
                    </>
                  ) : (
                    <>
                      <span>🗺️</span>
                      <span>Calculate Store Navigation Route</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Interactive Map & Step by Step Guide ───── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Route Stats & Path Strip (Shown when calculated) */}
          {routeResult && (
            <div
              className="bg-white rounded-2xl border shadow-sm p-5"
              style={{ borderColor: '#86efac' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                    Route Calculated Successfully
                  </span>
                  <h3 className="text-xl font-black text-gray-800">
                    {orderedStops.length} Waypoints · {totalDist} Walking Units
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs text-gray-400">Total Distance</p>
                    <p className="font-black text-sm text-green-700">{totalDist} steps</p>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs text-gray-400">Est. Time</p>
                    <p className="font-black text-sm text-green-700">~{Math.max(2, Math.round(totalDist * 0.25))} mins</p>
                  </div>
                </div>
              </div>

              {/* Waypoint sequence breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold text-gray-500 mr-1">Sequence:</span>
                {orderedStops.map((stop, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={
                        i === 0
                          ? { backgroundColor: '#15803d', color: '#fff' }
                          : i === orderedStops.length - 1
                          ? { backgroundColor: '#f97316', color: '#fff' }
                          : { backgroundColor: '#dcfce7', color: '#15803d' }
                      }
                    >
                      {stop === 'ENTRANCE' ? '🏁 Entrance' : stop === 'EXIT' ? '🚪 Exit' : `Aisle ${stop}`}
                    </span>
                    {i < orderedStops.length - 1 && (
                      <span className="text-gray-400 text-xs font-bold">➔</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Store Map Container */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-6"
            style={{ borderColor: '#d1fae5' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#15803d' }}>
                  Store Layout Visualizer
                </h2>
                <p className="text-xs text-gray-400">
                  {fullPath.length > 0
                    ? `Highlighted path: ${fullPath.join(' → ')}`
                    : 'Add items and click Calculate Route to trace your walking path.'}
                </p>
              </div>

              {fullPath.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-800">
                  {fullPath.length} path nodes
                </span>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-xl p-4 text-sm bg-red-50 text-red-700 border border-red-200">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* SVG Store Map */}
            <div className="py-2">
              <StoreMap route={fullPath} />
            </div>
          </div>

          {/* Aisle Pickups & Step by Step Guide */}
          {routeResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Aisle Pickups Checklist */}
              <div
                className="bg-white rounded-2xl border shadow-sm p-5"
                style={{ borderColor: '#d1fae5' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#15803d' }}>
                    📦 Pick Up Items by Aisle
                  </h3>
                  <span className="text-xs font-bold text-gray-400">
                    {Object.values(checkedItems).filter(Boolean).length}/{cart.length} Collected
                  </span>
                </div>

                <div className="space-y-4">
                  {aisleStops.map((stop) => (
                    <div
                      key={stop.aisle}
                      className="border rounded-xl p-3.5"
                      style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-green-800 flex items-center gap-1.5">
                          <span>📍</span>
                          <span>{stop.label || `Aisle ${stop.aisle}`}</span>
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border font-semibold text-gray-600">
                          {stop.products.length} {stop.products.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="space-y-2 mt-2">
                        {stop.products.map(prod => {
                          const isDone = !!checkedItems[prod.id]
                          return (
                            <div
                              key={prod.id}
                              onClick={() => toggleItemCheck(prod.id)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                                isDone
                                  ? 'bg-green-50 border-green-300 line-through opacity-70'
                                  : 'bg-white border-gray-200 hover:border-green-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-400"
                                />
                                <div>
                                  <p className="text-xs font-bold text-gray-800">{prod.name}</p>
                                  {prod.brand && <p className="text-[10px] text-gray-400">{prod.brand}</p>}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-green-700">Rs. {prod.price}</span>
                                {prod.shelf && (
                                  <p className="text-[10px] text-gray-400">Shelf: {prod.shelf}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Turn-by-Turn Leg Segments */}
              <div
                className="bg-white rounded-2xl border shadow-sm p-5"
                style={{ borderColor: '#d1fae5' }}
              >
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: '#15803d' }}>
                  🧭 Walking Instructions
                </h3>

                <div className="space-y-3">
                  {segments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl border text-sm"
                      style={{ borderColor: '#d1fae5', backgroundColor: '#f0fdf4' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: '#16a34a' }}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800">
                          Walk from <span className="text-green-700">{seg.from_node}</span> to{' '}
                          <span className="text-green-700">{seg.to_node}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Distance: <span className="font-semibold">{seg.distance} steps</span> · Path: {seg.path.join(' → ')}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 flex items-center gap-2">
                    <span>🚪</span>
                    <span>Proceed to <strong>EXIT</strong> after collecting all items to checkout.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
