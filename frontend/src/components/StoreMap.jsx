// SVG Store Map — renders a graph of the store layout and highlights
// route nodes passed via the `route` prop (array of node names).

const SCALE = 90
const OFFSET_X = 60
const OFFSET_Y = 40

const NODES = {
  ENTRANCE: { x: 1, y: 0, label: 'Entrance' },
  A1:       { x: 0, y: 1, label: 'A1' },
  A2:       { x: 2, y: 1, label: 'A2' },
  B1:       { x: 0, y: 2, label: 'B1' },
  B2:       { x: 2, y: 2, label: 'B2' },
  C1:       { x: 0, y: 3, label: 'C1' },
  C2:       { x: 2, y: 3, label: 'C2' },
  D1:       { x: 0, y: 4, label: 'D1' },
  EXIT:     { x: 1, y: 5, label: 'Exit' },
}

const EDGES = [
  ['ENTRANCE', 'A1'],
  ['ENTRANCE', 'A2'],
  ['A1', 'A2'],
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['B1', 'B2'],
  ['B1', 'C1'],
  ['B2', 'C2'],
  ['C1', 'C2'],
  ['C1', 'D1'],
  ['C2', 'EXIT'],
  ['D1', 'EXIT'],
]

function pos(node) {
  return {
    cx: node.x * SCALE + OFFSET_X,
    cy: node.y * SCALE + OFFSET_Y,
  }
}

export default function StoreMap({ route = [] }) {
  const routeSet = new Set(route.map((r) => r.toUpperCase()))

  // Build a set of highlighted edges (consecutive route pairs)
  const routeEdges = new Set()
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i].toUpperCase()
    const b = route[i + 1].toUpperCase()
    routeEdges.add(`${a}-${b}`)
    routeEdges.add(`${b}-${a}`)
  }

  const svgWidth = 3 * SCALE + OFFSET_X + 40
  const svgHeight = 5 * SCALE + OFFSET_Y + 60

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-xs mx-auto block"
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
    >
      {/* Background */}
      <rect
        x={0} y={0} width={svgWidth} height={svgHeight}
        rx={16} ry={16}
        fill="#f0fdf4"
        stroke="#bbf7d0"
        strokeWidth={1.5}
      />

      {/* Edges */}
      {EDGES.map(([a, b]) => {
        const pa = pos(NODES[a])
        const pb = pos(NODES[b])
        const key = `${a}-${b}`
        const isHighlighted = routeEdges.has(key)
        return (
          <line
            key={key}
            x1={pa.cx} y1={pa.cy}
            x2={pb.cx} y2={pb.cy}
            stroke={isHighlighted ? '#16a34a' : '#bbf7d0'}
            strokeWidth={isHighlighted ? 4 : 2}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
          />
        )
      })}

      {/* Nodes */}
      {Object.entries(NODES).map(([id, node]) => {
        const { cx, cy } = pos(node)
        const inRoute = routeSet.has(id)
        const isFirst = route.length > 0 && route[0].toUpperCase() === id
        const isLast = route.length > 1 && route[route.length - 1].toUpperCase() === id

        let fill = '#ffffff'
        let stroke = '#86efac'
        let textColor = '#374151'

        if (isFirst) {
          fill = '#15803d'
          stroke = '#15803d'
          textColor = '#ffffff'
        } else if (isLast) {
          fill = '#f97316'
          stroke = '#f97316'
          textColor = '#ffffff'
        } else if (inRoute) {
          fill = '#16a34a'
          stroke = '#16a34a'
          textColor = '#ffffff'
        }

        return (
          <g key={id}>
            <circle
              cx={cx} cy={cy} r={inRoute ? 22 : 18}
              fill={fill}
              stroke={stroke}
              strokeWidth={inRoute ? 3 : 2}
              style={{ transition: 'all 0.3s' }}
            />
            <text
              x={cx} y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={inRoute ? '10' : '9'}
              fontWeight={inRoute ? '700' : '500'}
              fill={textColor}
              style={{ userSelect: 'none', transition: 'all 0.3s' }}
            >
              {node.label}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      {route.length > 0 && (
        <g transform={`translate(${OFFSET_X - 10}, ${svgHeight - 26})`}>
          <circle cx={8} cy={8} r={6} fill="#15803d" />
          <text x={18} y={12} fontSize={9} fill="#374151">Start</text>
          <circle cx={55} cy={8} r={6} fill="#f97316" />
          <text x={65} y={12} fontSize={9} fill="#374151">End</text>
          <circle cx={102} cy={8} r={6} fill="#16a34a" />
          <text x={112} y={12} fontSize={9} fill="#374151">Stop</text>
        </g>
      )}
    </svg>
  )
}
