import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  const navigate = useNavigate()

  if (!isCartOpen) return null

  const items = cart.items || []
  const subtotal = cart.subtotal || 0
  const deliveryFee = cart.delivery_fee || 0
  const tax = cart.tax || 0
  const grandTotal = cart.grand_total || 0
  const freeThreshold = 199.0
  const amountNeededForFree = Math.max(0, roundTwo(freeThreshold - subtotal))

  function roundTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  const handleProceedToCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="bg-emerald-950 text-white p-4 border-b border-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <div>
                <h2 className="text-base font-bold leading-tight">My Shopping Cart</h2>
                <p className="text-[11px] text-emerald-300 font-mono">
                  {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'} · Instant 10-Min Delivery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-emerald-400 hover:text-rose-300 text-xs px-2 py-1 rounded hover:bg-emerald-900/60 transition-colors"
                  title="Empty cart"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Free Delivery Progress Bar ────────────────────────── */}
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 flex items-center gap-1">
                <span>⚡</span>
                {subtotal >= freeThreshold ? (
                  <span className="text-emerald-700 font-bold">🎉 You unlocked FREE Delivery!</span>
                ) : (
                  <span>Add <strong className="text-emerald-700">₹{amountNeededForFree.toFixed(2)}</strong> more for <strong>FREE Delivery</strong></span>
                )}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold">
                {subtotal >= freeThreshold ? '₹0' : '₹25 fee'}
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* ── Cart Items List ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-3 shadow-inner">
                  🛍️
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Add fresh milk, bread, fruits, or snacks to start your instant shopping order.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all transform hover:scale-105 active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = '🛒'
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🛒</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Aisle {item.aisle || '1'}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        ₹{item.price?.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">
                      Total: ₹{item.item_total?.toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg p-0.5 shadow-xs">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center transition-colors shadow-xs"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold text-emerald-950 px-1 font-mono min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isLoading || item.quantity >= item.stock_available}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center transition-colors shadow-xs"
                      title={item.quantity >= item.stock_available ? 'Max stock reached' : 'Increase quantity'}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 text-sm transition-colors"
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ── Bill Details & Checkout CTA ───────────────────────── */}
          {items.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold font-mono">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Govt. Taxes (5% GST)</span>
                  <span className="font-semibold text-slate-900 font-mono">₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-base text-emerald-700 font-mono">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-between text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span>Proceed to Checkout</span>
                  <span className="text-xs bg-emerald-800/80 px-2 py-0.5 rounded-full font-mono">
                    {cart.item_count} items
                  </span>
                </div>
                <span className="font-mono text-base font-black">₹{grandTotal.toFixed(2)} ➔</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
