import { useEffect, useRef } from 'react'

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#eab308']
const PARTICLE_COUNT = 70
const LIFETIME_MS = 1400

// Hiệu ứng pháo giấy nhẹ, tự vẽ bằng canvas — không cần thư viện ngoài.
// Bắn 1 đợt mỗi khi `triggerKey` đổi giá trị (VD: đổi từ null sang 1 kết quả mới).
export default function ConfettiBurst({ triggerKey }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (triggerKey == null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rect.width / 2,
      y: rect.height / 3,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 7 - 2,
      size: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
    }))

    let raf
    const start = performance.now()

    function frame(now) {
      const elapsed = now - start
      ctx.clearRect(0, 0, rect.width, rect.height)
      particles.forEach((p) => {
        p.vy += 0.28
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, 1 - elapsed / LIFETIME_MS)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      })
      if (elapsed < LIFETIME_MS) {
        raf = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [triggerKey])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
}
