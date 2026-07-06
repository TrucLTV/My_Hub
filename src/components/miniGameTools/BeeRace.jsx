import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

const SCENE = { width: 320, height: 230 }
const SKY = { xMin: 20, xMax: 300, yMin: 12, yMax: 128 }
const GROUND = { xMin: 26, xMax: 294, yMin: 150, yMax: 202 }
const MIN_FILLER_BEES = 10
const WINNER_MS = 1000
const OTHER_MIN_MS = 1300
const OTHER_MAX_MS = 2400
const FLOWERS = ['🌸', '🌼', '🌻', '🌺', '🌷']

function randomPointInRect(rect) {
  return {
    x: rect.xMin + Math.random() * (rect.xMax - rect.xMin),
    y: rect.yMin + Math.random() * (rect.yMax - rect.yMin),
  }
}

export default function BeeRace() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const restPositions = useMemo(() => students.map(() => randomPointInRect(SKY)), [roster?.id, students.length])
  const flowerPositions = useMemo(() => students.map(() => randomPointInRect(GROUND)), [roster?.id, students.length])

  const fillerCount = Math.max(0, MIN_FILLER_BEES - students.length)
  const fillerBees = useMemo(() => {
    return Array.from({ length: fillerCount }, () => ({
      pos: randomPointInRect(SKY),
      delay: Math.random() * 2.4,
      duration: 2 + Math.random() * 1.4,
    }))
  }, [roster?.id, fillerCount])

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true)
  const [drawn, setDrawn] = useState(new Set())
  const [racing, setRacing] = useState(false)
  const [diving, setDiving] = useState(false)
  const [beeDurations, setBeeDurations] = useState([])
  const [result, setResult] = useState(null)

  function selectRoster(id) {
    setRosterId(id)
    setDrawn(new Set())
    setResult(null)
    setDiving(false)
  }

  function resetDraw() {
    setDrawn(new Set())
    setResult(null)
    setDiving(false)
  }

  function launch() {
    if (racing || students.length === 0) return
    const pool = students.map((_, i) => i).filter((i) => (removeAfterDraw ? !drawn.has(i) : true))
    if (pool.length === 0) return

    setResult(null)
    setDiving(false)
    setRacing(true)

    const winnerIdx = pool[Math.floor(Math.random() * pool.length)]
    const durations = students.map((_, i) =>
      i === winnerIdx ? WINNER_MS : OTHER_MIN_MS + Math.random() * (OTHER_MAX_MS - OTHER_MIN_MS)
    )
    setBeeDurations(durations)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDiving(true))
    })

    setTimeout(() => {
      setResult({ index: winnerIdx, name: students[winnerIdx] })
      if (removeAfterDraw) setDrawn((prev) => new Set(prev).add(winnerIdx))
      setRacing(false)
    }, WINNER_MS)
  }

  return (
    <div className="space-y-4">
      <RosterPicker rosterId={rosterId} onRosterIdChange={selectRoster} />

      {roster && students.length === 0 && (
        <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
      )}

      {roster && students.length > 0 && (
        <div className="space-y-4">
          <label className="flex w-fit items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={removeAfterDraw}
              onChange={(e) => setRemoveAfterDraw(e.target.checked)}
            />
            Loại tên đã gọi khỏi lượt bay tiếp theo
          </label>

          <div
            className="relative mx-auto overflow-hidden rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-400/30 via-sky-500/10 to-transparent shadow-inner shadow-black/30"
            style={{ width: SCENE.width, height: SCENE.height }}
          >
            {/* mat dat / bai co */}
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-emerald-700/50 to-emerald-900/70"
              style={{ top: GROUND.yMin - 15 }}
            />

            {/* hoa */}
            {flowerPositions.map((pos, i) => (
              <div
                key={`flower-${i}`}
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                className="absolute flex flex-col items-center"
              >
                <span className="text-2xl leading-none">{FLOWERS[i % FLOWERS.length]}</span>
                <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-card text-[10px] font-bold shadow">
                  {i + 1}
                </span>
              </div>
            ))}

            {/* ong trang tri, bay lon von lien tuc, khong tham gia dua */}
            {fillerBees.map((bee, i) => (
              <span
                key={`filler-bee-${i}`}
                style={{
                  left: bee.pos.x,
                  top: bee.pos.y,
                  animationDelay: `${bee.delay}s`,
                  animationDuration: `${bee.duration}s`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 animate-bee-hover text-lg opacity-70"
              >
                🐝
              </span>
            ))}

            {/* ong that, gan voi hoc sinh */}
            {students.map((_, i) => {
              if (result?.index === i) return null
              const isDrawn = drawn.has(i)
              const pos = diving ? flowerPositions[i] : restPositions[i]
              return (
                <div
                  key={i}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    transitionDuration: `${beeDurations[i] ?? WINNER_MS}ms`,
                  }}
                  className={cn(
                    'absolute flex flex-col items-center transition-all ease-in',
                    !diving && !racing && 'animate-bee-hover'
                  )}
                >
                  <span className={cn('text-xl leading-none', isDrawn && 'opacity-30 grayscale')}>🐝</span>
                  <span
                    className={cn(
                      'mt-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold shadow',
                      isDrawn ? 'bg-white/20 text-white/50' : 'bg-amber-400 text-black'
                    )}
                  >
                    {i + 1}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={launch} disabled={racing}>
              <PlayCircle className="size-4" /> {racing ? 'Đang bay...' : 'Xuất phát'}
            </Button>
            <Button variant="outline" onClick={resetDraw}>Reset</Button>
          </div>

          {result && (
            <div className="mx-auto flex w-fit flex-col items-center gap-2">
              <span className="flex size-16 shrink-0 animate-in items-center justify-center rounded-full bg-amber-400 text-2xl shadow-lg shadow-black/40 zoom-in-50 slide-in-from-top-6 duration-500">
                🐝
              </span>
              <span className="animate-in rounded-xl border-t-4 border-t-orange-400 bg-card px-6 py-2 text-xl font-bold shadow-lg fade-in-0 duration-500">
                Ong số {result.index + 1} — {result.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
