// Enhanced Physical Product Card with packaging aesthetics, barcode, and shelf tier tags

const PRODUCT_ICONS = {
  Dairy:          { icon: '🥛', bg: '#f0f9ff', tagBg: '#e0f2fe', tagText: '#0369a1', badge: 'Chilled Cooler' },
  Bakery:         { icon: '🥖', bg: '#fffbeb', tagBg: '#fef3c7', tagText: '#92400e', badge: 'Fresh Oven' },
  Beverages:      { icon: '🥤', bg: '#ecfdf5', tagBg: '#d1fae5', tagText: '#065f46', badge: 'Cold Fridge' },
  Snacks:         { icon: '🍿', bg: '#fff1f2', tagBg: '#ffe4e6', tagText: '#9f1239', badge: 'Gondola Bay' },
  Fruits:         { icon: '🍎', bg: '#fefce8', tagBg: '#fef9c3', tagText: '#854d0e', badge: 'Farm Crate' },
  Vegetables:     { icon: '🥦', bg: '#f0fdf4', tagBg: '#dcfce7', tagText: '#166534', badge: 'Veggie Bin' },
  'Personal Care':{ icon: '🧴', bg: '#faf5ff', tagBg: '#f3e8ff', tagText: '#6b21a8', badge: 'Hygiene Rack' },
}

export default function ProductCard({ product, onClick, onAddToCart, inCart = false }) {
  const stock = product.stock ?? 0
  const stockColor = stock > 20 ? '#16a34a' : stock > 5 ? '#d97706' : '#dc2626'
  const stockLabel = stock > 20 ? 'In Stock' : stock > 5 ? 'Low Stock' : 'Very Low'

  const categoryName = typeof product.category === 'object' && product.category !== null
    ? product.category.name
    : product.category || 'General'

  const style = PRODUCT_ICONS[categoryName] || { icon: '📦', bg: '#f8fafc', tagBg: '#f1f5f9', tagText: '#475569', badge: 'Store Bay' }

  // Fake or actual barcode
  const barcode = product.barcode || `890100${product.id ? String(product.id).padStart(7, '0') : '1000001'}`

  const shelfTier = product.shelf === 'Top' ? 'Top Shelf' : product.shelf === 'Mid' ? 'Eye-Level Shelf' : product.shelf === 'Bot' ? 'Bottom Shelf Bin' : 'Standard Shelf'

  return (
    <div
      onClick={() => onClick && onClick(product)}
      className="bg-white rounded-2xl shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 overflow-hidden flex flex-col group relative"
      style={{ borderColor: inCart ? '#16a34a' : '#d1fae5' }}
    >
      {/* Physical Shelf Rail Top Clip */}
      <div className="bg-gray-800 text-gray-300 text-[10px] font-mono px-3 py-1 flex items-center justify-between border-b border-gray-700">
        <span className="flex items-center gap-1 font-bold">
          <span>🏷️</span>
          <span>Aisle {product.aisle || 'A1'} · {shelfTier}</span>
        </span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-700 text-gray-200">
          {style.badge}
        </span>
      </div>

      {/* Physical Product Showcase Area */}
      <div
        className="h-36 flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundColor: style.bg }}
      >
        <span className="text-6xl filter drop-shadow-md select-none">{style.icon}</span>

        {/* In-Cart physical stamp */}
        {inCart && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-600 text-white shadow-sm flex items-center gap-1">
            <span>✓</span> In Cart
          </span>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: style.tagBg, color: style.tagText }}
          >
            {categoryName}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: `${stockColor}18`, color: stockColor }}
          >
            ● {stock} left ({stockLabel})
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-extrabold text-gray-900 text-sm leading-snug mb-1 group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-400 font-medium mb-3">by {product.brand}</p>
        )}

        {/* Physical Barcode Line Strip */}
        <div className="mt-auto pt-2 border-t border-dashed border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Price</span>
            <span className="text-base font-black text-green-700">
              Rs. {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>
          </div>

          {/* Barcode visual preview */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-[1.5px] h-4">
              {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2].map((w, i) => (
                <span key={i} className="h-full bg-gray-700 block" style={{ width: `${w}px` }} />
              ))}
            </div>
            <span className="text-[9px] font-mono text-gray-400 tracking-tighter">
              {barcode.slice(-8)}
            </span>
          </div>
        </div>

        {/* Add to Route Cart Button */}
        {onAddToCart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-full mt-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            style={
              inCart
                ? { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
                : { backgroundColor: '#16a34a', color: '#ffffff' }
            }
          >
            <span>{inCart ? '✕ Remove' : '🛒 Pick Up to Cart'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
