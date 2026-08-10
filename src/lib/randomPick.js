// Chọn ngẫu nhiên 1 chỉ số trong [0, count) chưa bị loại (nếu removeAfterDraw bật).
// Trả về null nếu không còn ai để chọn.
export function pickRandomIndex(count, drawn, removeAfterDraw) {
  const pool = Array.from({ length: count }, (_, i) => i).filter((i) =>
    removeAfterDraw ? !drawn.has(i) : true
  )
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
