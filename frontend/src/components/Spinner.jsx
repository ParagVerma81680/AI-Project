export default function Spinner({ size = 'md', label = 'Loading...' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          borderColor: '#86efac',
          borderTopColor: '#16a34a',
        }}
        role="status"
        aria-label={label}
      />
      {label && (
        <p className="text-sm font-medium" style={{ color: '#15803d' }}>
          {label}
        </p>
      )}
    </div>
  )
}
