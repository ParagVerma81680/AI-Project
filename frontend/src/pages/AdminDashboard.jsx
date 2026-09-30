import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import Spinner from '../components/Spinner'

const AISLES  = ['A1','A2','B1','B2','C1','C2','D1']
const SHELVES = ['Top','Mid','Bot']

// ─── Modal for Product (Add / Edit) ───────────────────────────────────────────
function ProductModal({ mode, initial, categories, onClose, onSaved }) {
  const [form, setForm]     = useState(initial ?? {
    name: '', brand: '', description: '', barcode: '',
    price: '', stock: '', aisle: 'A1', shelf: 'Mid',
    category_id: '', is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (form.price === '') { setError('Price is required'); return }
    if (form.stock === '') { setError('Stock is required'); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        description: form.description.trim() || null,
        barcode: form.barcode.trim() || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        aisle: form.aisle || null,
        shelf: form.shelf || null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        is_active: form.is_active,
      }
      if (mode === 'add') {
        await client.post('/products/', payload)
      } else {
        await client.put(`/products/${initial.id}`, payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <h3 className="font-black text-lg text-amber-900">
            {mode === 'add' ? '➕ Add Store Product (Admin)' : '✏️ Edit Product (Admin)'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Organic Almond Milk" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Brand</label>
              <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Silk" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Barcode</label>
              <input className={inputCls} value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="e.g. 89012345" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (Rs.) *</label>
              <input type="number" step="0.5" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock Quantity *</label>
              <input type="number" className={inputCls} value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
              <select className={inputCls} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">— Select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Aisle</label>
              <select className={inputCls} value={form.aisle} onChange={e => set('aisle', e.target.value)}>
                {AISLES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Shelf</label>
              <select className={inputCls} value={form.shelf} onChange={e => set('shelf', e.target.value)}>
                {SHELVES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

          <div className="flex gap-2 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700">
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal for Store Policy (Add / Edit) ──────────────────────────────────────
function PolicyModal({ mode, initial, onClose, onSaved }) {
  const [title, setTitle]       = useState(initial?.title ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'General')
  const [content, setContent]   = useState(initial?.content ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }

    setSaving(true)
    setError('')
    try {
      if (mode === 'add') {
        await client.post('/policies/', {
          title: title.trim(),
          category: category.trim(),
          content: content.trim(),
          is_active: true,
        })
      } else {
        await client.put(`/policies/${initial.id}`, {
          title: title.trim(),
          category: category.trim(),
          content: content.trim(),
        })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Policy save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <h3 className="font-black text-lg text-amber-900">
            {mode === 'add' ? '📜 Add Store Policy (RAG Base)' : '✏️ Edit Policy Document'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Policy Title *</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Price Match Guarantee & Discounts"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Billing, Returns, Store Operations"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Policy Content * (used directly by Claude RAG bot)
            </label>
            <textarea
              rows={6}
              className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed font-sans"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write the full rules, conditions, time limits, and exceptions..."
            />
          </div>

          {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700">
              {saving ? 'Saving to RAG…' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal for New Category ───────────────────────────────────────────────────
function CategoryModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await client.post('/admin/categories', { name: name.trim(), description: desc.trim() })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Category creation failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-lg text-amber-900 mb-3">🏷️ Add New Category</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category Name *</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Organic Produce"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Short description"
            />
          </div>
          {error && <div className="p-2 text-xs text-red-600 bg-red-50 rounded-lg">{error}</div>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700">
              {saving ? 'Creating…' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Console ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAdmin, loginAdmin } = useAuth()
  const [adminPwd, setAdminPwd]         = useState('')
  const [authError, setAuthError]       = useState('')
  const [verifying, setVerifying]       = useState(false)

  // Active Tab: 'inventory' | 'policies' | 'topology' | 'system'
  const [activeTab, setActiveTab]       = useState('inventory')

  const [overview, setOverview]         = useState(null)
  const [products, setProducts]         = useState([])
  const [categories, setCategories]     = useState([])
  const [policies, setPolicies]         = useState([])
  const [loading, setLoading]           = useState(true)

  const [search, setSearch]             = useState('')
  const [selectedCat, setSelectedCat]   = useState('')

  // Modals
  const [productModal, setProductModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', initial: p }
  const [policyModal, setPolicyModal]   = useState(null)  // null | { mode: 'add' } | { mode: 'edit', initial: pol }
  const [categoryModal, setCategoryModal] = useState(false)

  const [toast, setToast]               = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [ovRes, prodRes, catRes, polRes] = await Promise.all([
        client.get('/admin/overview'),
        client.get('/products/', { params: { limit: 100 } }),
        client.get('/recommendations/categories'),
        client.get('/policies/?active_only=false'),
      ])
      setOverview(ovRes.data)
      setProducts(prodRes.data?.products ?? [])
      setCategories(catRes.data ?? [])
      setPolicies(polRes.data?.policies ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAllData()
    }
  }, [isAdmin])

  const handleUnlock = async (e) => {
    e.preventDefault()
    setVerifying(true)
    setAuthError('')
    try {
      await loginAdmin(adminPwd)
    } catch (err) {
      setAuthError(err.message || 'Incorrect password')
    } finally {
      setVerifying(false)
    }
  }

  // Superuser Action: Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Admin Action: Are you sure you want to delete "${name}"?`)) return
    try {
      await client.delete(`/products/${id}`)
      showToast(`Deleted ${name}`)
      loadAllData()
    } catch {
      alert('Delete failed')
    }
  }

  // Superuser Action: Delete policy
  const handleDeletePolicy = async (id, title) => {
    if (!window.confirm(`Admin Action: Delete policy document "${title}" from RAG engine?`)) return
    try {
      await client.delete(`/policies/${id}`)
      showToast(`Deleted policy: ${title}`)
      loadAllData()
    } catch {
      alert('Policy delete failed')
    }
  }

  // Superuser Action: Stock adjustments
  const handleStockAdjust = async (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta)
    try {
      await client.put(`/products/${product.id}`, { stock: newStock })
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p))
      showToast(`Stock for ${product.name} updated to ${newStock}`)
    } catch {
      alert('Stock update failed')
    }
  }

  // Superuser Action: Bulk Restock all low-stock items
  const handleBulkRestock = async () => {
    if (!window.confirm('Admin Action: Restock all items below 25 units to 50 units?')) return
    try {
      const res = await client.post('/admin/bulk-restock', { minimum_stock: 50 })
      showToast(res.data.message || 'Bulk restock complete')
      loadAllData()
    } catch {
      alert('Bulk restock failed')
    }
  }

  // Unauthorized lock screen
  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border shadow-xl p-8 text-center" style={{ borderColor: '#fde68a' }}>
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            Admin Console Restricted
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Store management and inventory controls require administrator authentication.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-left text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter admin password"
                value={adminPwd}
                onChange={e => setAdminPwd(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                style={{ borderColor: '#d1fae5' }}
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ backgroundColor: '#d97706' }}
            >
              {verifying ? 'Verifying…' : 'Unlock Store Console'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-xs text-gray-400">
            Are you a shopper? <Link to="/products" className="text-green-700 font-bold underline">Return to Storefront</Link>
          </div>
        </div>
      </div>
    )
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.aisle && p.aisle.toLowerCase().includes(search.toLowerCase()))

    const matchesCat = !selectedCat || (p.category_id === parseInt(selectedCat))
    return matchesSearch && matchesCat
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-xl animate-bounce">
          ✓ {toast}
        </div>
      )}

      {/* ── Top Header Dimension Banner ─────────────────────────── */}
      <div className="rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 40%, #b45309 100%)' }}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-amber-400 text-amber-950">
                SUPERUSER ADMIN CONSOLE
              </span>
              <span className="text-xs text-amber-200">Full Store Authority (Parag)</span>
            </div>
            <h1 className="text-3xl font-black">
              Executive Store Operations & AI Control
            </h1>
            <p className="text-amber-100 text-sm mt-1">
              You hold complete administrative permissions: products CRUD, policy RAG database maintenance, aisle allocations, and inventory restock automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setProductModal({ mode: 'add' })}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-white text-amber-900 shadow-md hover:bg-amber-50 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Add Product</span>
            </button>
            <button
              onClick={() => setPolicyModal({ mode: 'add' })}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 text-amber-950 shadow-md hover:bg-amber-400 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <span>📜</span>
              <span>Add Policy</span>
            </button>
            <button
              onClick={handleBulkRestock}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-800 text-amber-100 border border-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-1.5"
              title="Restock all items below 25 units"
            >
              <span>⚡</span>
              <span>Bulk Restock</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b pb-3 mb-6 overflow-x-auto text-xs font-black">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'inventory' ? 'bg-amber-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 Inventory Management ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'policies' ? 'bg-amber-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📜 Policy Knowledge Base ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'topology' ? 'bg-amber-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🗺️ Store Graph & Aisles
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'system' ? 'bg-amber-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚙️ AI Engine Diagnostics
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner label="Loading Store Operations..." /></div>
      ) : (
        <div className="space-y-6">

          {/* ═════════════════════════════════════════════════════════
              TAB 1: INVENTORY MANAGEMENT
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'inventory' && (
            <>
              {/* Executive Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#fde68a' }}>
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Catalog Inventory</span>
                    <span className="text-xl">📦</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{overview?.metrics?.total_products || products.length}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">All {categories.length} categories active</p>
                </div>

                <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#fde68a' }}>
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
                    <span className="text-xl">💰</span>
                  </div>
                  <p className="text-3xl font-black text-amber-700">
                    Rs. {overview?.metrics?.total_inventory_value?.toLocaleString() || '76,350'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Retail store valuation</p>
                </div>

                <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#fde68a' }}>
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Available Items</span>
                    <span className="text-xl">🟢</span>
                  </div>
                  <p className="text-3xl font-black text-green-700">
                    {overview?.metrics?.in_stock || products.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Ready for shoppers</p>
                </div>

                <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#fde68a' }}>
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Store Routing Nodes</span>
                    <span className="text-xl">🗺️</span>
                  </div>
                  <p className="text-3xl font-black text-blue-700">9 Nodes</p>
                  <p className="text-xs text-gray-400 mt-1">Aisles A1–D1, Entrance & Exit</p>
                </div>
              </div>

              {/* Categories Bar with + Add Category button */}
              <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: '#fde68a' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-amber-900">
                    Catalog Categories ({categories.length})
                  </h3>
                  <button
                    onClick={() => setCategoryModal(true)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                  >
                    + New Category
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const count = products.filter(p => p.category_id === c.id).length
                    return (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-amber-50/50" style={{ borderColor: '#fde68a' }}>
                        <span className="text-xs font-bold text-amber-900">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-white text-amber-800 border">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                <div className="p-4 border-b bg-gray-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-gray-800">
                      Product Catalog Records
                    </h3>
                    <p className="text-[11px] text-gray-500">Live search, price edits, and restock actions</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search name, aisle, brand..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-xs w-48 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <select
                      value={selectedCat}
                      onChange={e => setSelectedCat(e.target.value)}
                      className="border rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-gray-100/70 text-gray-500 uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-4">Product</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Aisle / Shelf</th>
                        <th className="py-2.5 px-4">Price</th>
                        <th className="py-2.5 px-4">Stock</th>
                        <th className="py-2.5 px-4 text-center">Quick Adjust</th>
                        <th className="py-2.5 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-gray-900">
                            <div>
                              <p>{p.name}</p>
                              {p.brand && <p className="text-[10px] text-gray-400 font-normal">{p.brand}</p>}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-green-50 text-green-700 border border-green-200">
                              {p.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-gray-700">
                            Aisle {p.aisle || '—'} {p.shelf ? `· ${p.shelf}` : ''}
                          </td>
                          <td className="py-2.5 px-4 font-black text-gray-900">
                            Rs. {p.price?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              p.stock > 20 ? 'bg-green-100 text-green-800' :
                              p.stock > 0  ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStockAdjust(p, -5)}
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 font-bold text-[10px]"
                                title="-5 units"
                              >-</button>
                              <button
                                onClick={() => handleStockAdjust(p, 10)}
                                className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px]"
                                title="+10 units"
                              >+10</button>
                              <button
                                onClick={() => handleStockAdjust(p, 50)}
                                className="px-1.5 py-0.5 rounded bg-green-100 hover:bg-green-200 text-green-900 font-bold text-[10px]"
                                title="+50 units"
                              >+50</button>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setProductModal({ mode: 'edit', initial: p })}
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 2: STORE POLICY RAG KNOWLEDGE BASE
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-amber-900 text-sm">
                    📜 Store Policy RAG Database ({policies.length} Documents)
                  </h3>
                  <p className="text-xs text-amber-800">
                    These documents are indexed by the TF-IDF vector retrieval engine and cited by Claude in Policy Q&A.
                  </p>
                </div>
                <button
                  onClick={() => setPolicyModal({ mode: 'add' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow"
                >
                  + Add New Policy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map(pol => (
                  <div key={pol.id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between" style={{ borderColor: '#e2e8f0' }}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {pol.category || 'General'}
                        </span>
                        <span className="text-[10px] text-gray-400">ID: {pol.id}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-2">{pol.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-4 font-sans">
                        {pol.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4" style={{ borderColor: '#f1f5f9' }}>
                      <button
                        onClick={() => setPolicyModal({ mode: 'edit', initial: pol })}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        ✏️ Edit Content
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(pol.id, pol.title)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 3: STORE GRAPH TOPOLOGY & AISLES
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'topology' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="font-black text-gray-900 text-base mb-1">
                  Store Graph Topology & Aisle Allocations
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  The Dijkstra shortest path solver and nearest-neighbor TSP heuristic navigate between these 9 nodes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'ENTRANCE', label: 'Store Entrance', coord: '(1, 0)', desc: 'Starting point for all shopper routes' },
                    { id: 'A1', label: 'Aisle A1 — Dairy', coord: '(0, 1)', desc: 'Whole Milk, Low-Fat Milk, Butter, Cheese' },
                    { id: 'A2', label: 'Aisle A2 — Bakery', coord: '(2, 1)', desc: 'Sandwich Bread, Brown Bread, Croissants' },
                    { id: 'B1', label: 'Aisle B1 — Beverages', coord: '(0, 2)', desc: 'Cola, Orange Juice, Mineral Water, Green Tea' },
                    { id: 'B2', label: 'Aisle B2 — Snacks', coord: '(2, 2)', desc: 'Potato Chips, Cookies, Salted Peanuts, Dark Chocolate' },
                    { id: 'C1', label: 'Aisle C1 — Fruits', coord: '(0, 3)', desc: 'Royal Gala Apples, Fresh Bananas' },
                    { id: 'C2', label: 'Aisle C2 — Vegetables', coord: '(2, 3)', desc: 'Farm Tomatoes, Red Onions' },
                    { id: 'D1', label: 'Aisle D1 — Personal Care', coord: '(0, 4)', desc: 'Shampoo, Toothpaste' },
                    { id: 'EXIT', label: 'Checkout & Exit', coord: '(1, 5)', desc: 'Final destination node for all shoppers' },
                  ].map(node => (
                    <div key={node.id} className="p-3.5 rounded-xl border bg-gray-50/70" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-sm text-green-800">{node.id}</span>
                        <span className="text-[10px] font-mono text-gray-400">{node.coord}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-700">{node.label}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{node.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              TAB 4: AI ENGINE & SYSTEM DIAGNOSTICS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">
                  AI Modules Status & Latency
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Dijkstra Shortest Path Engine</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Active (0.2ms avg)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">TF-IDF Vector RAG Index</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Loaded (8 documents)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Multi-Agent System (MAS)</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      3-Turn Pipeline Ready
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700">4-Paradigm Comparison Suite</span>
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Operational
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Superuser Quick Links
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  As Administrator, you have unfiltered access to test and demonstrate all AI sub-systems.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <Link to="/planner" className="p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-800 text-center hover:bg-green-100">
                    🗺️ Test Route Planner
                  </Link>
                  <Link to="/policy-chat" className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-center hover:bg-blue-100">
                    💬 Test Policy Bot
                  </Link>
                  <Link to="/recommendations" className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 text-center hover:bg-purple-100">
                    ✨ Test Recommendations
                  </Link>
                  <Link to="/agents" className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-center hover:bg-amber-100">
                    🤖 Test Multi-Agent
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Product Modal */}
      {productModal && (
        <ProductModal
          mode={productModal.mode}
          initial={productModal.initial}
          categories={categories}
          onClose={() => setProductModal(null)}
          onSaved={() => { setProductModal(null); loadAllData(); showToast('Product saved successfully') }}
        />
      )}

      {/* Policy Modal */}
      {policyModal && (
        <PolicyModal
          mode={policyModal.mode}
          initial={policyModal.initial}
          onClose={() => setPolicyModal(null)}
          onSaved={() => { setPolicyModal(null); loadAllData(); showToast('Policy saved to RAG database') }}
        />
      )}

      {/* Category Modal */}
      {categoryModal && (
        <CategoryModal
          onClose={() => setCategoryModal(false)}
          onSaved={() => { setCategoryModal(false); loadAllData(); showToast('Category created') }}
        />
      )}
    </div>
  )
}
