import { useCart } from '../context/CartContext'

const PRODUCT_ICONS = {
  'Dairy & Breakfast': { icon: '🥛', bg: '#f0f9ff', tagBg: '#e0f2fe', tagText: '#0369a1', badge: 'Chilled Cooler' },
  Dairy:               { icon: '🥛', bg: '#f0f9ff', tagBg: '#e0f2fe', tagText: '#0369a1', badge: 'Chilled Cooler' },
  Bakery:              { icon: '🥖', bg: '#fffbeb', tagBg: '#fef3c7', tagText: '#92400e', badge: 'Fresh Oven' },
  'Cold Drinks':       { icon: '🥤', bg: '#ecfdf5', tagBg: '#d1fae5', tagText: '#065f46', badge: 'Cold Fridge' },
  Beverages:           { icon: '🥤', bg: '#ecfdf5', tagBg: '#d1fae5', tagText: '#065f46', badge: 'Cold Fridge' },
  'Snacks & Munchies': { icon: '🍿', bg: '#fff1f2', tagBg: '#ffe4e6', tagText: '#9f1239', badge: 'Snack Bay' },
  Snacks:              { icon: '🍿', bg: '#fff1f2', tagBg: '#ffe4e6', tagText: '#9f1239', badge: 'Snack Bay' },
  'Fruits & Vegetables':{ icon: '🍎', bg: '#fefce8', tagBg: '#fef9c3', tagText: '#854d0e', badge: 'Fresh Farm' },
  Fruits:              { icon: '🍎', bg: '#fefce8', tagBg: '#fef9c3', tagText: '#854d0e', badge: 'Farm Crate' },
  Vegetables:          { icon: '🥦', bg: '#f0fdf4', tagBg: '#dcfce7', tagText: '#166534', badge: 'Veggie Bin' },
  'Grocery & Staples': { icon: '🌾', bg: '#fef3c7', tagBg: '#fde68a', tagText: '#78350f', badge: 'Pantry Aisle' },
  'Personal Care':     { icon: '🧴', bg: '#faf5ff', tagBg: '#f3e8ff', tagText: '#6b21a8', badge: 'Hygiene Rack' },
  'Household Essentials':{ icon: '🧼', bg: '#f0fdfa', tagBg: '#ccfbf1', tagText: '#115e59', badge: 'Home Care' },
  'Electronics & Accessories':{ icon: '⚡', bg: '#f1f5f9', tagBg: '#e2e8f0', tagText: '#334155', badge: 'Tech Hub' },
}

export default function ProductCard({ product, onClick }) {
  const { addToCart, updateQuantity, getItemQuantity, getItemId, getProductStock, isLoading } = useCart()

  const liveStock = getProductStock(product)
  const isOutOfStock = liveStock <= 0
  const qtyInCart = getItemQuantity(product.id)
  const cartItemId = getItemId(product.id)

  const categoryName = typeof product.category === 'object' && product.category !== null
    ? product.category.name
    : product.category || 'General'

  const style = PRODUCT_ICONS[categoryName] || { icon: '📦', bg: '#f8fafc', tagBg: '#f1f5f9', tagText: '#475569', badge: 'Store Bay' }
  const shelfTier = product.shelf === 'Top' ? 'Top Shelf' : product.shelf === 'Mid' ? 'Eye-Level' : product.shelf === 'Bot' ? 'Bottom Bin' : 'Shelf'
  const barcode = product.barcode || `890100${product.id ? String(product.id).padStart(7, '0') : '1000001'}`

  const handleAdd = (e) => {
    e.stopPropagation()
    if (!isOutOfStock) {
      addToCart(product, 1)
    }
  }

  const handleIncrement = (e) => {
    e.stopPropagation()
    if (cartItemId && qtyInCart < liveStock) {
      updateQuantity(cartItemId, qtyInCart + 1)
    }
  }

  const handleDecrement = (e) => {
    e.stopPropagation()
    if (cartItemId) {
      updateQuantity(cartItemId, qtyInCart - 1)
    }
  }

  return (
    <div
      onClick={() => onClick && onClick(product)}
      className="bg-white rounded-2xl shadow-xs border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative cursor-pointer"
    >
      {/* Physical Shelf & Aisle Clip */}
      <div className="bg-slate-900 text-slate-300 text-[10px] font-mono px-3 py-1 flex items-center justify-between border-b border-slate-800">
        <span className="flex items-center gap-1 font-bold text-emerald-400">
          <span>🏷️</span>
          <span>Aisle {product.aisle || '1'} · {shelfTier}</span>
        </span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
          {style.badge}
        </span>
      </div>

      {/* Image Showcase */}
      <div
        className="h-40 flex items-center justify-center relative overflow-hidden bg-slate-50 transition-transform duration-300 group-hover:scale-102"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML = `<span class="text-6xl select-none filter drop-shadow-sm">${style.icon}</span>`
            }}
          />
        ) : (
          <span className="text-6xl select-none filter drop-shadow-sm">{style.icon}</span>
        )}

        {/* 10-15 Min Delivery Stamp */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-emerald-800 border border-emerald-200 shadow-xs flex items-center gap-1">
          <span>⚡</span> 10-15 mins
        </span>

        {/* Stock Status Badge */}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
          isOutOfStock
            ? 'bg-rose-100 text-rose-700 border border-rose-300'
            : liveStock <= 10
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        }`}>
          {isOutOfStock ? 'Out of Stock' : `${liveStock} left`}
        </span>
      </div>

      {/* Content Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Category Tag */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: style.tagBg, color: style.tagText }}
            >
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Description Snippet */}
          {product.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Add to Cart Controls */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
              ₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>
          </div>

          {/* Add / Stepper CTA Button */}
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            >
              Sold Out
            </button>
          ) : qtyInCart > 0 ? (
            <div className="flex items-center bg-emerald-600 border border-emerald-700 rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center text-white font-black hover:bg-emerald-700 transition-colors"
                title="Decrease"
              >
                −
              </button>
              <span className="px-2 text-xs font-bold text-white font-mono min-w-[20px] text-center">
                {qtyInCart}
              </span>
              <button
                type="button"
                disabled={isLoading || qtyInCart >= liveStock}
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center text-white font-black hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                title="Increase"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleAdd}
              className="bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 hover:border-emerald-600 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              <span>+</span>
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
