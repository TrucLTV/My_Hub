// Trang trí SVG tĩnh (bụi tre + cột chấm bi) cho giao diện "ebook" của trang Giải trí.
// Thuần trang trí — luôn aria-hidden, không chứa thông tin.
const BAMBOO_STALKS = [
  { x: 30, bend: -6, nodes: [40, 120, 205, 285, 365, 440] },
  { x: 68, bend: 5, nodes: [70, 150, 230, 310, 390] },
  { x: 104, bend: -4, nodes: [30, 105, 185, 265, 345, 425] },
]

const DOT_COLUMNS = [
  { x: 210, dots: [10, 45, 80, 118] },
  { x: 250, dots: [30, 68, 105, 145, 185] },
  { x: 288, dots: [15, 55, 92] },
  { x: 326, dots: [40, 78, 118, 160] },
]

function Stalk({ x, bend, nodes }) {
  const topY = 0
  const bottomY = 480
  const midX = x + bend
  return (
    <g opacity="0.55">
      <path
        d={`M${x},${topY} Q${midX},${bottomY / 2} ${x},${bottomY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {nodes.map((y) => (
        <line
          key={y}
          x1={x - 6}
          y1={y}
          x2={x + 6}
          y2={y}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  )
}

function Leaf({ x, y, rotate, scale = 1 }) {
  return (
    <path
      d="M0,0 C10,-4 22,-3 30,2 C22,4 10,5 0,0 Z"
      fill="currentColor"
      opacity="0.4"
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    />
  )
}

const LEAVES = [
  { x: 32, y: 55, rotate: -30 },
  { x: 66, y: 90, rotate: 20 },
  { x: 100, y: 45, rotate: -15 },
  { x: 40, y: 140, rotate: 35 },
  { x: 95, y: 180, rotate: -25 },
  { x: 70, y: 235, rotate: 10 },
]

export default function EbookOrnament({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {BAMBOO_STALKS.map((s) => (
        <Stalk key={s.x} {...s} />
      ))}
      {LEAVES.map((leaf, i) => (
        <Leaf key={i} {...leaf} />
      ))}
      {DOT_COLUMNS.map((col) => (
        <g key={col.x} opacity="0.45">
          <line x1={col.x} y1={0} x2={col.x} y2={200} stroke="currentColor" strokeWidth="1" strokeDasharray="1 7" />
          {col.dots.map((y) => (
            <circle key={y} cx={col.x} cy={y} r={2.5} fill="currentColor" />
          ))}
        </g>
      ))}
    </svg>
  )
}
