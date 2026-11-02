import { useState, useEffect } from 'react'

// Department and aisle physical metadata
const AISLE_DATA = {
  A1: { x: 120, y: 150, width: 140, height: 75, color: '#38bdf8', bg: '#f0f9ff', border: '#bae6fd', icon: '🥛', name: 'Dairy & Cold Storage', desc: 'Chilled Milk, Paneer, Curd, Butter', shelfStyle: 'cooler' },
  A2: { x: 340, y: 150, width: 140, height: 75, color: '#fb923c', bg: '#fff7ed', border: '#fed7aa', icon: '🥖', name: 'Artisan Bakery', desc: 'Fresh Breads, Buns, Croissants', shelfStyle: 'wood' },
  B1: { x: 120, y: 260, width: 140, height: 75, color: '#34d399', bg: '#ecfdf5', border: '#a7f3d0', icon: '🥤', name: 'Beverages & Sodas', desc: 'Juices, Sodas, Cold Water, Teas', shelfStyle: 'fridge' },
  B2: { x: 340, y: 260, width: 140, height: 75, color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', icon: '🍿', name: 'Snacks & Confectionery', desc: 'Chips, Nuts, Chocolates, Cookies', shelfStyle: 'gondola' },
  C1: { x: 120, y: 370, width: 140, height: 75, color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '🍎', name: 'Fresh Fruits Market', desc: 'Apples, Bananas, Citrus, Berries', shelfStyle: 'crates' },
  C2: { x: 340, y: 370, width: 140, height: 75, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: '🥦', name: 'Farm Fresh Vegetables', desc: 'Tomatoes, Potatoes, Greens, Onions', shelfStyle: 'bins' },
  D1: { x: 120, y: 480, width: 140, height: 75, color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', icon: '🧴', name: 'Personal Care & Hygiene', desc: 'Shampoo, Toothpaste, Soaps', shelfStyle: 'pharmacy' },
}

const WAYPOINTS = {
  ENTRANCE: { x: 300, y: 60,  label: 'Main Entrance' },
  A1:       { x: 190, y: 185, label: 'A1 · Dairy' },
  A2:       { x: 410, y: 185, label: 'A2 · Bakery' },
  B1:       { x: 190, y: 295, label: 'B1 · Drinks' },
  B2:       { x: 410, y: 295, label: 'B2 · Snacks' },
  C1:       { x: 190, y: 405, label: 'C1 · Fruits' },
  C2:       { x: 410, y: 405, label: 'C2 · Veggies' },
  D1:       { x: 190, y: 515, label: 'D1 · Care' },
  EXIT:     { x: 300, y: 610, label: 'Checkout & Exit' },
}

export default function StoreMap({ route = [], interactive = true }) {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState('architectural') // 'architectural' or 'isometric'
  const [selectedAisle, setSelectedAisle] = useState(null)

  const normalizedRoute = route.map(r => r.toUpperCase())
  const hasRoute = normalizedRoute.length > 0

  // Walking simulation
  useEffect(() => {
    let timer = null
    if (isPlaying && hasRoute) {
      timer = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= normalizedRoute.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 900)
    }
    return () => clearInterval(timer)
  }, [isPlaying, hasRoute, normalizedRoute.length])

  // Reset step when route changes
  useEffect(() => {
    setActiveStep(0)
    setIsPlaying(false)
  }, [route])

  // Coordinate interpolation for walking avatar
  const currentStopName = hasRoute ? normalizedRoute[activeStep] : 'ENTRANCE'
  const currentPos = WAYPOINTS[currentStopName] || WAYPOINTS.ENTRANCE

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── View Controls & Store Info ─────────────────────────── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-gray-700">
            Physical Store Floorplan (Superstore Sector 14)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
            {hasRoute ? `${normalizedRoute.length} Waypoints Active` : 'Idle · Showing Layout'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation playback button */}
          {hasRoute && (
            <button
              type="button"
              onClick={() => {
                if (!isPlaying && activeStep >= normalizedRoute.length - 1) {
                  setActiveStep(0)
                }
                setIsPlaying(!isPlaying)
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition-all text-white"
              style={{ backgroundColor: isPlaying ? '#dc2626' : '#16a34a' }}
            >
              <span>{isPlaying ? '⏸️ Pause Walk' : '🚶‍♂️ Walk Route'}</span>
            </button>
          )}

          {/* Mode toggle */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('architectural')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'architectural' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500'
              }`}
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => setViewMode('isometric')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'isometric' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500'
              }`}
            >
              Isometric 3D
            </button>
          </div>
        </div>
      </div>

      {/* ── SVG Supermarket Map ─────────────────────────────────── */}
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border shadow-inner overflow-hidden relative transition-all duration-500"
        style={{
          borderColor: '#bbf7d0',
          perspective: viewMode === 'isometric' ? '1200px' : 'none',
        }}
      >
        <svg
          viewBox="0 0 600 680"
          className="w-full h-auto block select-none"
          style={{
            transform: viewMode === 'isometric' ? 'rotateX(24deg) rotateZ(-6deg) scale(0.92)' : 'none',
            transformOrigin: '50% 50%',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <defs>
            {/* Tile grid pattern */}
            <pattern id="floorTiles" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#f8fafc" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>

            {/* Entrance welcome mat pattern */}
            <linearGradient id="matGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>

            {/* Path Glow Filter */}
            <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#16a34a" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 1. Base Supermarket Floor */}
          <rect x="10" y="10" width="580" height="660" rx="20" fill="url(#floorTiles)" stroke="#cbd5e1" strokeWidth="3" />

          {/* Outer Perimeter Wall */}
          <rect x="20" y="20" width="560" height="640" rx="14" fill="none" stroke="#94a3b8" strokeWidth="4" />

          {/* 2. Top Entrance Zone */}
          <g transform="translate(0, 0)">
            {/* Entrance Canopy / Glass Doors */}
            <rect x="210" y="15" width="180" height="18" rx="4" fill="#38bdf8" fillOpacity="0.3" stroke="#0284c7" strokeWidth="2" />
            <text x="300" y="27" textAnchor="middle" fontSize="10" fontWeight="900" fill="#0369a1" letterSpacing="1">
              AUTOMATIC SLIDING DOORS
            </text>

            {/* Green Welcome Mat */}
            <rect x="230" y="38" width="140" height="35" rx="6" fill="url(#matGrad)" stroke="#14532d" strokeWidth="1.5" />
            <text x="300" y="55" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff" letterSpacing="0.5">
              WELCOME TO SMARTMART
            </text>
            <text x="300" y="67" textAnchor="middle" fontSize="8" fontWeight="700" fill="#86efac">
              ▼ Turnstile 1 & 2 Entrance
            </text>

            {/* Cart Staging Area (Left of entrance) */}
            <rect x="35" y="30" width="140" height="50" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="105" y="48" textAnchor="middle" fontSize="9" fontWeight="800" fill="#475569">
              🛒 TROLLEY BAY
            </text>
            <text x="105" y="62" textAnchor="middle" fontSize="8" fill="#64748b">
              Sanitized Carts & Baskets
            </text>

            {/* Customer Service / Helpdesk Kiosk (Right of entrance) */}
            <rect x="425" y="30" width="140" height="50" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.5" />
            <text x="495" y="48" textAnchor="middle" fontSize="9" fontWeight="800" fill="#92400e">
              💁 HELPDESK KIOSK
            </text>
            <text x="495" y="62" textAnchor="middle" fontSize="8" fill="#b45309">
              Policy Q&A Terminal #01
            </text>
          </g>

          {/* 3. Central Promenade / Walking Corridor */}
          <line x1="300" y1="80" x2="300" y2="580" stroke="#e2e8f0" strokeWidth="48" strokeLinecap="round" strokeOpacity="0.4" />
          <line x1="300" y1="80" x2="300" y2="580" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 6" />

          {/* 4. Physical Aisles (Gondola Shelving Blocks) */}
          {Object.entries(AISLE_DATA).map(([id, aisle]) => {
            const inRoute = normalizedRoute.includes(id)
            const isSelected = selectedAisle === id

            return (
              <g
                key={id}
                onClick={() => setSelectedAisle(isSelected ? null : id)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Aisle Shadow */}
                <rect
                  x={aisle.x + 3}
                  y={aisle.y + 4}
                  width={aisle.width}
                  height={aisle.height}
                  rx="10"
                  fill="#000000"
                  fillOpacity="0.08"
                />

                {/* Aisle Shelving Unit Body */}
                <rect
                  x={aisle.x}
                  y={aisle.y}
                  width={aisle.width}
                  height={aisle.height}
                  rx="10"
                  fill={inRoute ? '#ecfdf5' : aisle.bg}
                  stroke={inRoute ? '#16a34a' : aisle.border}
                  strokeWidth={inRoute ? 3 : 1.5}
                />

                {/* Internal Shelf Tier Bars (Physical Rack Lines) */}
                <line x1={aisle.x + 8} y1={aisle.y + 24} x2={aisle.x + aisle.width - 8} y2={aisle.y + 24} stroke={aisle.border} strokeWidth="1.5" />
                <line x1={aisle.x + 8} y1={aisle.y + 48} x2={aisle.x + aisle.width - 8} y2={aisle.y + 48} stroke={aisle.border} strokeWidth="1.5" />

                {/* Shelf Section Badges: Top, Mid, Bot */}
                <text x={aisle.x + 12} y={aisle.y + 18} fontSize="7" fontWeight="700" fill="#94a3b8">TOP</text>
                <text x={aisle.x + 12} y={aisle.y + 40} fontSize="7" fontWeight="700" fill="#94a3b8">MID (Eye-Level)</text>
                <text x={aisle.x + 12} y={aisle.y + 64} fontSize="7" fontWeight="700" fill="#94a3b8">BOT</text>

                {/* Overhead Physical Aisle Signboard */}
                <g transform={`translate(${aisle.x + aisle.width - 34}, ${aisle.y - 10})`}>
                  <rect x="0" y="0" width="36" height="20" rx="5" fill={inRoute ? '#15803d' : '#1e293b'} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))" />
                  <text x="18" y="14" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff">
                    {id}
                  </text>
                </g>

                {/* Department Icon + Name */}
                <text x={aisle.x + 36} y={aisle.y + 18} fontSize="13">
                  {aisle.icon}
                </text>
                <text x={aisle.x + 54} y={aisle.y + 17} fontSize="9" fontWeight="800" fill="#1e293b">
                  {aisle.name.split('&')[0]}
                </text>
                <text x={aisle.x + 36} y={aisle.y + 40} fontSize="7.5" fontWeight="600" fill="#475569">
                  {aisle.desc}
                </text>

                {/* Route Order Indicator Badge if visited */}
                {inRoute && (
                  <g transform={`translate(${aisle.x + 8}, ${aisle.y + 8})`}>
                    <circle cx="8" cy="8" r="8" fill="#16a34a" />
                    <text x="8" y="11" textAnchor="middle" fontSize="8" fontWeight="900" fill="#ffffff">
                      {normalizedRoute.indexOf(id) + 1}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* 5. Path Connections & Active Route Tracing */}
          {hasRoute && (
            <g filter="url(#pathGlow)">
              {/* Connected Path Line */}
              {normalizedRoute.map((nodeName, idx) => {
                if (idx === normalizedRoute.length - 1) return null
                const nextNodeName = normalizedRoute[idx + 1]
                const p1 = WAYPOINTS[nodeName]
                const p2 = WAYPOINTS[nextNodeName]
                if (!p1 || !p2) return null

                const isCurrentSegment = idx === activeStep

                return (
                  <g key={`${nodeName}-${nextNodeName}`}>
                    {/* Direction path line */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={isCurrentSegment ? '#22c55e' : '#16a34a'}
                      strokeWidth={isCurrentSegment ? 5 : 3.5}
                      strokeLinecap="round"
                      strokeDasharray={isCurrentSegment ? '8 4' : 'none'}
                      strokeOpacity={idx < activeStep ? 0.4 : 1}
                    />

                    {/* Midpoint walking arrow */}
                    <circle
                      cx={(p1.x + p2.x) / 2}
                      cy={(p1.y + p2.y) / 2}
                      r="4"
                      fill="#15803d"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* 6. Waypoint Pins */}
          {hasRoute && normalizedRoute.map((nodeName, idx) => {
            const pt = WAYPOINTS[nodeName]
            if (!pt) return null
            const isCurrent = idx === activeStep
            const isStart = idx === 0
            const isEnd = idx === normalizedRoute.length - 1

            return (
              <g key={`pin-${nodeName}-${idx}`} transform={`translate(${pt.x}, ${pt.y})`}>
                {/* Pulse ring for active waypoint */}
                {isCurrent && (
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.8">
                    <animate attributeName="r" values="10;24;10" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  cx="0" cy="0"
                  r={isCurrent ? 12 : 9}
                  fill={isStart ? '#15803d' : isEnd ? '#ea580c' : '#16a34a'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x="0" y="3.5"
                  textAnchor="middle"
                  fontSize={isCurrent ? "9" : "7.5"}
                  fontWeight="900"
                  fill="#ffffff"
                >
                  {isStart ? '🏁' : isEnd ? '🚪' : idx + 1}
                </text>
              </g>
            )
          })}

          {/* 7. Animated Walking Shopper Avatar with Cart */}
          {hasRoute && (
            <g
              transform={`translate(${currentPos.x}, ${currentPos.y})`}
              className="transition-all duration-700 ease-out"
            >
              {/* Shopper footprint glow */}
              <ellipse cx="0" cy="14" rx="14" ry="6" fill="#15803d" fillOpacity="0.25" />

              {/* Shopper bubble */}
              <circle cx="0" cy="0" r="16" fill="#14532d" stroke="#86efac" strokeWidth="2.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="14">
                🚶‍♂️
              </text>

              {/* Floating current step banner */}
              <g transform="translate(0, -26)">
                <rect x="-45" y="-12" width="90" height="20" rx="10" fill="#1e293b" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
                <text x="0" y="2" textAnchor="middle" fontSize="8" fontWeight="800" fill="#f8fafc">
                  {currentStopName === 'ENTRANCE' ? 'At Entrance' : currentStopName === 'EXIT' ? 'At Checkout' : `Aisle ${currentStopName}`}
                </text>
              </g>
            </g>
          )}

          {/* 8. Bottom Checkout & Exit Zone */}
          <g transform="translate(0, 560)">
            {/* Cash Registers / Checkout Lanes 1, 2, 3 */}
            {[100, 240, 380].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, 0)`}>
                {/* Conveyor Belt Counter */}
                <rect x="0" y="0" width="100" height="24" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
                {/* Register Screen */}
                <rect x="10" y="-8" width="16" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                {/* Lane Number */}
                <text x="55" y="15" textAnchor="middle" fontSize="8" fontWeight="900" fill="#f8fafc">
                  CHECKOUT #{i + 1}
                </text>
                <circle cx="85" cy="12" r="3" fill="#22c55e" />
              </g>
            ))}

            {/* Exit Security Sensor Gates */}
            <rect x="235" y="42" width="130" height="12" rx="3" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
            <text x="300" y="51" textAnchor="middle" fontSize="8" fontWeight="900" fill="#b91c1c" letterSpacing="0.5">
              SECURITY SENSOR PYLONS · STORE EXIT
            </text>

            <rect x="250" y="60" width="100" height="20" rx="5" fill="#f97316" />
            <text x="300" y="74" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff" letterSpacing="1">
              STORE EXIT ➔
            </text>
          </g>
        </svg>

        {/* Selected Aisle Physical Detail Card Overlay */}
        {selectedAisle && AISLE_DATA[selectedAisle] && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-green-200 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-green-50 border border-green-200">
                {AISLE_DATA[selectedAisle].icon}
              </span>
              <div>
                <span className="text-xs font-bold text-green-700 uppercase">
                  Aisle {selectedAisle} Inspection
                </span>
                <h4 className="text-sm font-black text-gray-900">
                  {AISLE_DATA[selectedAisle].name}
                </h4>
                <p className="text-xs text-gray-500">
                  {AISLE_DATA[selectedAisle].desc} · 3 Tiers (Top, Eye-Level, Bottom Bin)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAisle(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 text-gray-700"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* ── Floorplan Physical Legend ──────────────────────────── */}
      <div className="w-full flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400" />
          <span>Cold Dairy Cooler</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-400" />
          <span>Artisan Bakery Wood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400" />
          <span>Beverage Fridge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-200 border border-rose-400" />
          <span>Snack Gondolas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-yellow-200 border border-yellow-400" />
          <span>Fruit Produce Baskets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-purple-200 border border-purple-400" />
          <span>Care Pharmacy Rack</span>
        </div>
      </div>
    </div>
  )
}
