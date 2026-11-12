import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import client from '../api/client'

const STATUS_STEPS = [
  { id: 'Order Placed', label: 'Order Placed', icon: '📝', desc: 'Received at SmartMart dark store' },
  { id: 'Confirmed', label: 'Confirmed', icon: '✓', desc: 'Inventory verified & reserved' },
  { id: 'Preparing', label: 'Preparing', icon: '📦', desc: 'Bagging fresh items carefully' },
  { id: 'Ready for Dispatch', label: 'Ready', icon: '🛵', desc: 'Handed over to delivery rider' },
  { id: 'Out for Delivery', label: 'Out for Delivery', icon: '⚡', desc: 'Rider is on the way to you' },
  { id: 'Delivered', label: 'Delivered', icon: '🏡', desc: 'Arrived at your doorstep' },
]

export default function Orders() {
  const { orderId } = useParams()
  const { sessionId, showToast } = useCart()
  const navigate = useNavigate()

  const [activeOrder, setActiveOrder] = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [activeTab, setActiveTab] = useState(orderId ? 'tracking' : 'history')

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await client.get('/orders', {
        headers: { 'X-Session-ID': sessionId },
        params: { session_id: sessionId }
      })
      if (res.data) {
        setAllOrders(res.data)
        if (orderId) {
          const match = res.data.find(
            (o) => o.order_number === orderId || String(o.id) === orderId
          )
          if (match) setActiveOrder(match)
        } else if (res.data.length > 0) {
          setActiveOrder(res.data[0])
        }
      }
    } catch (err) {
      console.warn('Failed to load orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [orderId, sessionId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Single order lookup if directed to specific order
  useEffect(() => {
    if (orderId) {
      client.get(`/orders/${orderId}`)
        .then((res) => {
          if (res.data) {
            setActiveOrder(res.data)
            setActiveTab('tracking')
          }
        })
        .catch(() => {})
    }
  }, [orderId])

  const handleCancelOrder = async (ordNo) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${ordNo}? Reserved items will be restored to store inventory.`)) {
      return
    }

    setIsCancelling(true)
    try {
      const res = await client.post(`/orders/${ordNo}/cancel`)
      if (res.data) {
        setActiveOrder(res.data)
        showToast(`Order #${ordNo} cancelled. Inventory restored.`, 'info')
        fetchOrders()
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Cannot cancel this order.'
      showToast(detail, 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  const getStepIndex = (status) => {
    if (status === 'Cancelled') return -1
    const idx = STATUS_STEPS.findIndex((s) => s.id === status)
    return idx >= 0 ? idx : 0
  }

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0
  const isCancelled = activeOrder?.status === 'Cancelled'
  const canCancel = activeOrder && ['Order Placed', 'Confirmed', 'Preparing'].includes(activeOrder.status)

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header & Tabs ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order Management & Live Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time dark store fulfillment status and shared database consistency
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl w-max">
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tracking'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Tracking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order History ({allOrders.length})
            </button>
          </div>
        </div>

        {/* ── Active Tab: Live Tracking ────────────────────────────── */}
        {activeTab === 'tracking' && (
          <>
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block mr-2" />
                Loading order tracking data...
              </div>
            ) : !activeOrder ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No Active Orders Found</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Place an order from your shopping cart to track real-time delivery here.
                </p>
                <Link
                  to="/"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs inline-block"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Success Card / Status Badge */}
                <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-lg ${
                  isCancelled
                    ? 'bg-gradient-to-r from-rose-900 to-slate-900 border border-rose-800'
                    : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{isCancelled ? '❌' : '🎉'}</span>
                        <h2 className="text-lg sm:text-xl font-black">
                          {isCancelled
                            ? `Order #${activeOrder.order_number} Cancelled`
                            : `Order #${activeOrder.order_number} Placed!`}
                        </h2>
                      </div>
                      <p className="text-xs text-emerald-300 font-mono">
                        {isCancelled
                          ? 'Stock quantities have been successfully restored to the store catalog.'
                          : `Estimated Delivery: ${activeOrder.estimated_delivery || '10-15 mins'} · Fast Doorstep Rider`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {canCancel && (
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => handleCancelOrder(activeOrder.order_number)}
                          className="bg-rose-900/80 hover:bg-rose-800 border border-rose-600 text-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          {isCancelling ? 'Restoring Stock...' : 'Cancel Order'}
                        </button>
                      )}
                      <div className="bg-white/10 px-4 py-2 rounded-xl text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">Total Paid (Demo)</span>
                        <span className="text-base font-black font-mono text-emerald-400">
                          ₹{activeOrder.total_amount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                {!isCancelled && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-6">
                      Live Delivery Progress
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {STATUS_STEPS.map((s, idx) => {
                        const isDone = idx <= currentStepIdx
                        const isCurrent = idx === currentStepIdx
                        return (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                                : isDone
                                ? 'bg-slate-50 border-emerald-300 text-slate-800'
                                : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xl">{s.icon}</span>
                              {isDone && (
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div>
                              <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-950 font-black' : ''}`}>
                                {s.label}
                              </div>
                              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                {s.desc}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Items Ordered */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Ordered Products ({activeOrder.items?.length || 0})</span>
                      <span className="font-mono text-slate-500">
                        {new Date(activeOrder.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </h3>

                    <div className="space-y-2.5 divide-y divide-slate-100">
                      {(activeOrder.items || []).map((it) => (
                        <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{it.product_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {it.quantity} × ₹{it.unit_price?.toFixed(2)}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{it.total_price?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{activeOrder.subtotal?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-mono font-semibold">
                          {activeOrder.delivery_fee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${activeOrder.delivery_fee?.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Taxes</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{activeOrder.tax?.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                        <span>Total Paid</span>
                        <span className="font-mono text-emerald-700 text-base">
                          ₹{activeOrder.total_amount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Payment Metadata */}
                  <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Delivery Address
                      </h4>
                      <p className="text-xs font-semibold text-slate-900">
                        {activeOrder.customer_name} ({activeOrder.customer_phone})
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {activeOrder.delivery_address}
                      </p>
                      {activeOrder.delivery_instructions && (
                        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-2 font-mono">
                          Note: {activeOrder.delivery_instructions}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Payment & Verification
                      </h4>
                      <div className="text-xs text-slate-800 font-semibold flex items-center justify-between">
                        <span>{activeOrder.payment_method}</span>
                        <span className="text-emerald-600 font-mono text-[11px]">✓ Verified</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to="/"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                      >
                        ← Back to Shopping
                      </Link>
                      <Link
                        to="/planner"
                        className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Store Route Map ➔
                      </Link>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </>
        )}

        {/* ── Active Tab: Order History ────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                All Past Customer Orders
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {allOrders.length} orders saved in database
              </span>
            </div>

            {allOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setActiveOrder(ord)
                      setActiveTab('tracking')
                    }}
                    className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 font-mono">
                          #{ord.order_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {ord.items?.length || 0} items · {new Date(ord.created_at).toLocaleDateString()} at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-mono text-sm font-black text-slate-900">
                        ₹{ord.total_amount?.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Track ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
