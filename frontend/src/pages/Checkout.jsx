import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import client from '../api/client'

export default function Checkout() {
  const { cart, sessionId, clearCart, setRecentOrder, showToast } = useCart()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    customer_name: 'Parag Verma',
    customer_phone: '9876543210',
    delivery_address: 'Flat 402, Green Valley Apartments, Near City Center',
    delivery_instructions: 'Please ring the bell and leave package at front door.',
    payment_method: 'UPI / QR Code (Demo Simulation)',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const items = cart.items || []
  const subtotal = cart.subtotal || 0
  const deliveryFee = cart.delivery_fee || 0
  const tax = cart.tax || 0
  const grandTotal = cart.grand_total || 0

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl mx-auto mb-4">
          🛒
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          You need items in your cart before proceeding to checkout.
        </p>
        <Link
          to="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors"
        >
          Return to Store & Browse
        </Link>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const response = await client.post(
        '/orders/checkout',
        {
          ...formData,
          session_id: sessionId,
        },
        {
          headers: { 'X-Session-ID': sessionId }
        }
      )

      if (response.data && response.data.order_number) {
        const placedOrder = response.data
        setRecentOrder(placedOrder)
        await clearCart()
        showToast(`Order #${placedOrder.order_number} confirmed!`)
        navigate(`/orders/${placedOrder.order_number}`)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to place order. Please check inventory.'
      setErrorMsg(detail)
      showToast(detail, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Breadcrumb & Title ──────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/" className="hover:text-emerald-600">Home</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order Delivery & Checkout
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-100 border border-emerald-300 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>⚡ Instant 10-15 Min Delivery</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left Column: Delivery & Payment Details ──────────── */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Delivery Address Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                <span className="text-xl">📍</span>
                <h2 className="text-base font-bold text-slate-900">1. Delivery Address & Contact</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                      placeholder="e.g. Parag Verma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      required
                      value={formData.customer_phone}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address & Apartment / Landmark *
                  </label>
                  <textarea
                    rows={2}
                    name="delivery_address"
                    required
                    value={formData.delivery_address}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                    placeholder="Complete residential or office delivery address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rider Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    name="delivery_instructions"
                    value={formData.delivery_instructions}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                    placeholder="e.g. Leave with security / Call upon arrival / Avoid ringing bell"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💳</span>
                  <h2 className="text-base font-bold text-slate-900">2. Payment Method</h2>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                  Demo Academic Simulation
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'UPI / QR Code (Demo Simulation)',
                    icon: '📱',
                    title: 'UPI Payment (GPay, PhonePe, Paytm)',
                    desc: 'Simulated 1-click instant approval',
                  },
                  {
                    id: 'Credit / Debit Card (Demo Simulation)',
                    icon: '💳',
                    title: 'Credit / Debit Card (Visa, MasterCard, RuPay)',
                    desc: 'Simulated 3D Secure transaction gateway',
                  },
                  {
                    id: 'Cash on Delivery (Demo Simulation)',
                    icon: '💵',
                    title: 'Cash on Delivery (COD)',
                    desc: 'Pay cash or UPI upon doorstep arrival',
                  },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.payment_method === m.id
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={m.id}
                      checked={formData.payment_method === m.id}
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{m.title}</div>
                      <div className="text-[11px] text-slate-500">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                ℹ️ <strong>College Academic Note:</strong> This checkout flow is designed with complete transactional integrity. When you place an order, inventory is reserved and subtracted atomically from the database. No real credit card or bank account will be charged.
              </div>
            </div>

          </div>

          {/* ── Right Column: Order Summary ───────────────────────── */}
          <div className="lg:col-span-5 space-y-6">

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🛍️</span>
                  <span>Order Items ({cart.item_count})</span>
                </h2>
                <Link to="/" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">
                  + Add more
                </Link>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin divide-y divide-slate-100">
                {items.map((i) => (
                  <div key={i.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                        {i.image_url ? (
                          <img src={i.image_url} alt={i.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>🛒</span>
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{i.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {i.quantity} × ₹{i.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{i.item_total?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-mono font-semibold">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST Taxes (5%)</span>
                  <span className="font-mono font-semibold text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                  <span>To Pay</span>
                  <span className="text-lg text-emerald-700 font-mono">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm & Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-900/20 text-sm sm:text-base flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Inventory & Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order</span>
                    <span className="font-mono">· ₹{grandTotal.toFixed(2)} ➔</span>
                  </>
                )}
              </button>

              <div className="mt-3 text-center text-[10px] text-slate-400">
                🔒 Safe & encrypted simulated transaction · Fast delivery guarantee
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  )
}
