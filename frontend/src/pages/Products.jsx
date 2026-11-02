import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'

// ─── Empty form state ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', brand: '', description: '', barcode: '',
  price: '', stock: '', aisle: '', shelf: '',
  category_id: '', is_active: true,
}

const AISLES  = ['A1','A2','B1','B2','C1','C2','D1']
const SHELVES = ['Top','Mid','Bot']

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function ProductModal({ mode, initial, categories, onClose, onSaved }) {
  const [form, setForm]       = useState(initial ?? EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())       { setError('Product name is required.'); return }
    if (form.price === '')       { setError('Price is required.'); return }
    if (form.stock === '')       { setError('Stock quantity is required.'); return }
    setError('')
    setSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        brand:       form.brand.trim()       || null,
        description: form.description.trim() || null,
        barcode:     form.barcode.trim()     || null,
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock),
        aisle:       form.aisle              || null,
        shelf:       form.shelf              || null,
        category_id: form.category_id        ? parseInt(form.category_id) : null,
        is_active:   form.is_active,
      }
      if (mode === 'add') {
        await client.post('/products/', payload)
      } else {
        await client.put(`/products/${initial.id}`, payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
  const inputStyle = { borderColor: '#d1fae5' }
  const labelCls = "block text-xs font-semibold mb-1 text-gray-600"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10"
          style={{ borderColor: '#d1fae5' }}
        >
          <h2 className="text-lg font-black" style={{ color: '#14532d' }}>
            {mode === 'add' ? '➕ Add New Product (Admin)' : '✏️ Edit Product (Admin)'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg"
          >✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className={labelCls}>Product Name *</label>
            <input
              className={inputCls} style={inputStyle}
              placeholder="e.g. Whole Milk 1L"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Brand + Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Brand</label>
              <input
                className={inputCls} style={inputStyle}
                placeholder="e.g. FreshFarm"
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Barcode</label>
              <input
                className={inputCls} style={inputStyle}
                placeholder="e.g. 8901234567890"
                value={form.barcode}
                onChange={e => set('barcode', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`} style={inputStyle}
              placeholder="Short product description..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price (Rs.) *</label>
              <input
                type="number" min="0" step="0.01"
                className={inputCls} style={inputStyle}
                placeholder="e.g. 49.99"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Stock Qty *</label>
              <input
                type="number" min="0"
                className={inputCls} style={inputStyle}
                placeholder="e.g. 100"
                value={form.stock}
                onChange={e => set('stock', e.target.value)}
              />
            </div>
          </div>

          {/* Category + Aisle + Shelf */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select
                className={inputCls} style={inputStyle}
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
              >
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Aisle</label>
              <select
                className={inputCls} style={inputStyle}
                value={form.aisle}
                onChange={e => set('aisle', e.target.value)}
              >
                <option value="">— None —</option>
                {AISLES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Shelf</label>
              <select
                className={inputCls} style={inputStyle}
                value={form.shelf}
                onChange={e => set('shelf', e.target.value)}
              >
                <option value="">— None —</option>
                {SHELVES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              style={{ backgroundColor: form.is_active ? '#16a34a' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: form.is_active ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
            <span className="text-sm text-gray-600">
              {form.is_active ? 'Active — visible in store' : 'Inactive — hidden from store'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#d1d5db' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#16a34a' }}
            >
              {saving ? 'Saving…' : mode === 'add' ? '➕ Add Product' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await client.delete(`/products/${product.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl text-center mb-3">🗑️</div>
        <h3 className="text-lg font-black text-center text-gray-800 mb-2">Delete Product?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-semibold text-gray-700">"{product.name}"</span> will be permanently removed.
          This cannot be undone.
        </p>
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
            style={{ borderColor: '#d1d5db' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
            style={{ backgroundColor: '#dc2626' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Products page ───────────────────────────────────────────────────────
export default function Products() {
  const { isAdmin } = useAuth()

  const [products, setProducts]           = useState([])
  const [categories, setCategories]       = useState([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  // Shopping cart for customer
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('smartmart_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Modals
  const [addOpen, setAddOpen]             = useState(false)
  const [editProduct, setEditProduct]     = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)
  const [viewProduct, setViewProduct]     = useState(null)

  // Success toast
  const [toast, setToast] = useState('')
  const [displayMode, setDisplayMode] = useState('physical_shelves') // 'physical_shelves' | 'grid'
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    localStorage.setItem('smartmart_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product) => {
    if (cart.some(p => p.id === product.id)) {
      showToast(`"${product.name}" is already in your route cart`)
      return
    }
    setCart(prev => [...prev, product])
    showToast(`Added "${product.name}" to Route Planner cart!`)
  }

  useEffect(() => {
    client.get('/recommendations/categories')
      .then(r => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { limit: 100 }
      if (selectedCatId) params.category_id = selectedCatId
      if (search)        params.search       = search
      const res  = await client.get('/products/', { params })
      setProducts(res.data?.products ?? [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [selectedCatId, search])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [fetchProducts])

  // Convert product for edit form initial values
  const productToForm = (p) => ({
    name:        p.name        ?? '',
    brand:       p.brand       ?? '',
    description: p.description ?? '',
    barcode:     p.barcode     ?? '',
    price:       p.price       ?? '',
    stock:       p.stock       ?? '',
    aisle:       p.aisle       ?? '',
    shelf:       p.shelf       ?? '',
    category_id: p.category_id ?? p.category?.id ?? '',
    is_active:   p.is_active   ?? true,
    id:          p.id,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-semibold animate-bounce"
          style={{ backgroundColor: isAdmin ? '#d97706' : '#16a34a' }}
        >
          ✓ {toast}
        </div>
      )}

      {/* ── Header row with Dimension Info ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black" style={{ color: isAdmin ? '#78350f' : '#14532d' }}>
              Product Catalog
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: isAdmin ? '#fef3c7' : '#dcfce7',
                color: isAdmin ? '#92400e' : '#15803d',
              }}
            >
              {isAdmin ? '👨‍💼 Admin Dimension' : '🛒 Customer Dimension'}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {isAdmin
              ? 'Full management authority: add, edit, delete, and restock products.'
              : 'Browse items, check store aisle locations, and add to your shopping route.'}
          </p>
        </div>

        {/* Action Controls based on Role + View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Physical Shelves vs Grid Mode Switcher */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('physical_shelves')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                displayMode === 'physical_shelves' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🏬</span>
              <span>Physical Shelves</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                displayMode === 'grid' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>▦</span>
              <span>Grid View</span>
            </button>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: '#d97706' }}
            >
              <span className="text-lg">➕</span> Add Product
            </button>
          ) : (
            <Link
              to="/planner"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition-all hover:scale-105"
              style={{ backgroundColor: '#16a34a' }}
            >
              <span>🗺️</span>
              <span>Route Cart ({cart.length}) ➔</span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="lg:w-56 flex-shrink-0">
          <div
            className="bg-white rounded-2xl shadow-sm border p-5 sticky top-24"
            style={{ borderColor: '#d1fae5' }}
          >
            <h2 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: '#15803d' }}>
              Categories
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedCatId('')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={selectedCatId === '' ? { backgroundColor: '#16a34a', color: 'white' } : { color: '#374151' }}
                >
                  All Products
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={selectedCatId === cat.id ? { backgroundColor: '#16a34a', color: 'white' } : { color: '#374151' }}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-green-300"
              style={{ borderColor: '#d1fae5' }}
            />
          </div>

          {!loading && !error && (
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-700">{products.length}</span> product{products.length !== 1 ? 's' : ''} found
              {search && ` for "${search}"`}
            </p>
          )}

          {loading && <Spinner />}

          {error && (
            <div className="rounded-xl p-5 text-sm border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-medium">No products found.</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
              {isAdmin && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="mt-6 px-6 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  ➕ Add First Product
                </button>
              )}
            </div>
          )}

          {/* Product display: Physical Shelves View or Standard Grid */}
          {!loading && !error && products.length > 0 && (
            displayMode === 'physical_shelves' ? (
              /* ── Physical Aisle & Shelves View ──────────────────────── */
              <div className="space-y-8">
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1'].map(aisleCode => {
                  const aisleProds = products.filter(p => (p.aisle || 'A1') === aisleCode)
                  if (aisleProds.length === 0) return null

                  const AISLE_TITLES = {
                    A1: { name: 'Dairy & Chilled Goods', icon: '🥛', color: '#0284c7', bg: '#f0f9ff' },
                    A2: { name: 'Artisan Bakery & Breads', icon: '🥖', color: '#d97706', bg: '#fffbeb' },
                    B1: { name: 'Cold Beverages & Sodas', icon: '🥤', color: '#059669', bg: '#ecfdf5' },
                    B2: { name: 'Snacks & Confectionery', icon: '🍿', color: '#e11d48', bg: '#fff1f2' },
                    C1: { name: 'Fresh Fruits Market', icon: '🍎', color: '#ca8a04', bg: '#fefce8' },
                    C2: { name: 'Farm Fresh Vegetables', icon: '🥦', color: '#16a34a', bg: '#f0fdf4' },
                    D1: { name: 'Personal Care & Hygiene', icon: '🧴', color: '#9333ea', bg: '#faf5ff' },
                  }
                  const meta = AISLE_TITLES[aisleCode] || { name: 'Store Bay', icon: '📦', color: '#475569', bg: '#f8fafc' }

                  const topProds = aisleProds.filter(p => p.shelf === 'Top')
                  const midProds = aisleProds.filter(p => p.shelf === 'Mid' || !p.shelf)
                  const botProds = aisleProds.filter(p => p.shelf === 'Bot')

                  const renderShelfTier = (title, icon, tierProds, shelfBg = '#f1f5f9') => (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                          <span>{icon}</span>
                          <span>{title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700 font-semibold">
                            {tierProds.length} items
                          </span>
                        </span>
                      </div>

                      {/* Physical Shelf Rack Structure */}
                      <div
                        className="p-4 rounded-2xl border relative shadow-xs"
                        style={{ backgroundColor: shelfBg, borderColor: '#e2e8f0' }}
                      >
                        {tierProds.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400 italic">
                            Empty shelf bay · Products will restock shortly
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {tierProds.map(p => {
                              const inCart = cart.some(c => c.id === p.id)
                              return (
                                <div key={p.id} className="relative group">
                                  <ProductCard
                                    product={p}
                                    onClick={setViewProduct}
                                    onAddToCart={!isAdmin ? () => addToCart(p) : undefined}
                                    inCart={inCart}
                                  />
                                  {isAdmin && (
                                    <div className="absolute top-8 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <button
                                        onClick={e => { e.stopPropagation(); setEditProduct(productToForm(p)) }}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md bg-blue-600 text-white hover:scale-110 transition-transform"
                                        title="Edit Product"
                                      >✏️</button>
                                      <button
                                        onClick={e => { e.stopPropagation(); setDeleteProduct(p) }}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md bg-red-600 text-white hover:scale-110 transition-transform"
                                        title="Delete Product"
                                      >🗑️</button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Physical Wood/Steel Shelf Ledge Rail Bar */}
                        <div
                          className="h-3 rounded-b-xl mt-3 flex items-center justify-between px-3 shadow-inner"
                          style={{
                            background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
                            borderTop: '1px solid #cbd5e1',
                          }}
                        >
                          <span className="w-12 h-1 bg-gray-400 rounded-full" />
                          <span className="text-[8px] font-mono font-bold text-gray-200 uppercase tracking-widest">
                            SHELF RAIL · AISLE {aisleCode}
                          </span>
                          <span className="w-12 h-1 bg-gray-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )

                  return (
                    <div
                      key={aisleCode}
                      className="bg-white rounded-3xl border shadow-sm p-6 overflow-hidden"
                      style={{ borderColor: '#d1fae5' }}
                    >
                      {/* Physical Aisle Overhead Gondola Sign */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: meta.bg, border: `1.5px solid ${meta.color}40` }}>
                            {meta.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg text-xs font-black text-white" style={{ backgroundColor: meta.color }}>
                                AISLE {aisleCode}
                              </span>
                              <h3 className="text-lg font-black text-gray-900">{meta.name}</h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Physical Gondola Fixture · 3 Display Shelves</p>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          {aisleProds.length} total items on shelf
                        </span>
                      </div>

                      {/* 3 Shelf Tiers */}
                      {renderShelfTier('Top Shelf (Specialty & Premium)', '🪜', topProds, '#f8fafc')}
                      {renderShelfTier('Eye-Level Shelf (Bestsellers & Everyday)', '👁️', midProds, '#ffffff')}
                      {renderShelfTier('Bottom Shelf (Floor Bins & Value Packs)', '🧺', botProds, '#f8fafc')}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ── Standard Grid View ─────────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map(p => {
                  const inCart = cart.some(c => c.id === p.id)
                  return (
                    <div key={p.id} className="relative group flex flex-col">
                      <ProductCard
                        product={p}
                        onClick={setViewProduct}
                        onAddToCart={!isAdmin ? () => addToCart(p) : undefined}
                        inCart={inCart}
                      />

                      {/* Admin Action Buttons */}
                      {isAdmin && (
                        <div className="absolute top-8 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={e => { e.stopPropagation(); setEditProduct(productToForm(p)) }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-all hover:scale-110 bg-blue-600 text-white"
                            title="Edit Product (Admin)"
                          >✏️</button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteProduct(p) }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-all hover:scale-110 bg-red-600 text-white"
                            title="Delete Product (Admin)"
                          >🗑️</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </main>
      </div>

      {/* ── Detail view modal ────────────────────────────────────── */}
      {viewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setViewProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setViewProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg"
            >✕</button>
            <div className="h-36 rounded-xl flex items-center justify-center text-6xl mb-5" style={{ backgroundColor: '#f0fdf4' }}>
              🛒
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {viewProduct.category?.name && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  {viewProduct.category.name}
                </span>
              )}
              {viewProduct.aisle && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                  Aisle {viewProduct.aisle}{viewProduct.shelf ? ` · ${viewProduct.shelf} shelf` : ''}
                </span>
              )}
              {!viewProduct.is_active && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>
              )}
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: '#14532d' }}>{viewProduct.name}</h2>
            {viewProduct.brand && <p className="text-sm text-gray-400 mb-2">by {viewProduct.brand}</p>}
            {viewProduct.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{viewProduct.description}</p>}
            {viewProduct.barcode && <p className="text-xs text-gray-400 mb-3">Barcode: {viewProduct.barcode}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold" style={{ color: '#16a34a' }}>Rs. {viewProduct.price?.toFixed(2)}</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-lg"
                style={{ backgroundColor: viewProduct.stock > 0 ? '#dcfce7' : '#fee2e2', color: viewProduct.stock > 0 ? '#15803d' : '#b91c1c' }}>
                {viewProduct.stock > 0 ? `${viewProduct.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Role-based actions inside detail modal */}
            <div className="mt-5">
              {isAdmin ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setViewProduct(null); setEditProduct(productToForm(viewProduct)) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                  >✏️ Edit</button>
                  <button
                    onClick={() => { setViewProduct(null); setDeleteProduct(viewProduct) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700"
                  >🗑️ Delete</button>
                </div>
              ) : (
                <button
                  onClick={() => { addToCart(viewProduct); setViewProduct(null) }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 shadow-md flex items-center justify-center gap-2"
                >
                  <span>🛒</span>
                  <span>Add to Route Planner Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add modal ────────────────────────────────────────────── */}
      {addOpen && (
        <ProductModal
          mode="add"
          categories={categories}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); fetchProducts(); showToast('Product added successfully!') }}
        />
      )}

      {/* ── Edit modal ───────────────────────────────────────────── */}
      {editProduct && (
        <ProductModal
          mode="edit"
          initial={editProduct}
          categories={categories}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); fetchProducts(); showToast('Product updated successfully!') }}
        />
      )}

      {/* ── Delete modal ─────────────────────────────────────────── */}
      {deleteProduct && (
        <DeleteModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onDeleted={() => { setDeleteProduct(null); fetchProducts(); showToast('Product deleted.') }}
        />
      )}
    </div>
  )
}
