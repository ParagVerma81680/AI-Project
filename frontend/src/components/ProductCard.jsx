export default function ProductCard({ product, onClick }) {
  const stockColor =
    product.stock > 20
      ? '#16a34a'
      : product.stock > 5
      ? '#d97706'
      : '#dc2626'

  const stockLabel =
    product.stock > 20 ? 'In Stock' : product.stock > 5 ? 'Low Stock' : 'Very Low'

  // category can be an object {id, name} or a plain string
  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : product.category

  return (
    <div
      onClick={() => onClick && onClick(product)}
      className="bg-white rounded-2xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col"
      style={{ borderColor: '#d1fae5' }}
    >
      {/* Image placeholder */}
      <div
        className="h-40 flex items-center justify-center text-5xl"
        style={{ backgroundColor: '#f0fdf4' }}
      >
        🛒
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Category + Aisle badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {categoryName && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
            >
              {categoryName}
            </span>
          )}
          {product.aisle && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
            >
              Aisle {product.aisle}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-800 text-base leading-tight mb-1">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Price — Rs. not $ */}
          <span className="text-lg font-bold" style={{ color: '#15803d' }}>
            Rs. {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </span>

          {/* Stock indicator */}
          <span
            className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ backgroundColor: stockColor + '22', color: stockColor }}
          >
            {stockLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
