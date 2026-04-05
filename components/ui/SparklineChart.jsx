export default function SparklineChart({ color, w = 84, h = 28 }) {
  const pts = [40, 55, 45, 70, 60, 80, 72]
  const points = pts.map((v, i) =>
    `${i * 14},${h + 12 - Math.round(v * 0.35)}`
  ).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  )
}