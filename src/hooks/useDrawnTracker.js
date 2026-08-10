import { useEffect, useState } from 'react'

// Dùng chung cho các mini game "Gọi tên ngẫu nhiên": theo dõi những học sinh
// đã được gọi (drawn), tự reset khi resetKey đổi (VD: đổi danh sách lớp).
export function useDrawnTracker(resetKey) {
  const [drawn, setDrawn] = useState(new Set())

  useEffect(() => {
    setDrawn(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function markDrawn(index) {
    setDrawn((prev) => new Set(prev).add(index))
  }

  function resetDraw() {
    setDrawn(new Set())
  }

  return { drawn, markDrawn, resetDraw, isDrawn: (index) => drawn.has(index) }
}
