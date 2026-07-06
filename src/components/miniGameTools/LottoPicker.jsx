import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dices } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LottoCageStand, LottoCageSphere } from '@/components/miniGameTools/LottoCageFrame'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

const BALL_BASE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4']
const CAGE_CENTER = { x: 130, y: 105 }
const CAGE_SCATTER_RADIUS = 66
const SPIN_DURATION_MS = 2200
const MIN_CAGE_BALLS = 26
const JITTER_INTERVAL_MS = 160
const BALL_SIZE_CLASS = 'size-7'
const CAGE_SCALE = 3

function randomPointInDisk(radius) {
  const angle = Math.random() * Math.PI * 2
  const r = radius * Math.sqrt(Math.random())
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
}

function ballGradient(hex) {
  return `radial-gradient(circle at 32% 26%, #ffffff 0%, ${hex} 45%, color-mix(in srgb, ${hex} 55%, black) 100%)`
}

export default function LottoPicker() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const ballPositions = useMemo(() => {
    return students.map(() => randomPointInDisk(CAGE_SCATTER_RADIUS))
  }, [roster?.id, students.length])

  const fillerCount = Math.max(0, MIN_CAGE_BALLS - students.length)
  const fillerPositions = useMemo(() => {
    return Array.from({ length: fillerCount }, () => randomPointInDisk(CAGE_SCATTER_RADIUS))
  }, [roster?.id, fillerCount])

  const [livePositions, setLivePositions] = useState(ballPositions)
  const [liveFillerPositions, setLiveFillerPositions] = useState(fillerPositions)

  useEffect(() => {
    setLivePositions(ballPositions)
    setLiveFillerPositions(fillerPositions)
  }, [ballPositions, fillerPositions])

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true)
  const [drawn, setDrawn] = useState(new Set())
  const [spinning, setSpinning] = useState(false)
  const [spinRound, setSpinRound] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!spinning) return
    const interval = setInterval(() => {
      setLivePositions(students.map(() => randomPointInDisk(CAGE_SCATTER_RADIUS)))
      setLiveFillerPositions(Array.from({ length: fillerCount }, () => randomPointInDisk(CAGE_SCATTER_RADIUS)))
    }, JITTER_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [spinning, students.length, fillerCount])

  function selectRoster(id) {
    setRosterId(id)
    setDrawn(new Set())
    setResult(null)
  }

  function resetDraw() {
    setDrawn(new Set())
    setResult(null)
  }

  function spin() {
    if (spinning || students.length === 0) return
    const pool = students.map((_, i) => i).filter((i) => (removeAfterDraw ? !drawn.has(i) : true))
    if (pool.length === 0) return
    setSpinning(true)
    setResult(null)
    setSpinRound((r) => r + 1)
    setLivePositions(students.map(() => randomPointInDisk(CAGE_SCATTER_RADIUS)))
    setLiveFillerPositions(Array.from({ length: fillerCount }, () => randomPointInDisk(CAGE_SCATTER_RADIUS)))
    const idx = pool[Math.floor(Math.random() * pool.length)]
    setTimeout(() => {
      setResult({ index: idx, name: students[idx] })
      if (removeAfterDraw) setDrawn((prev) => new Set(prev).add(idx))
      setSpinning(false)
    }, SPIN_DURATION_MS)
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
            Loại tên đã gọi khỏi lượt quay tiếp theo
          </label>

          <div className="relative mx-auto" style={{ width: 300 * CAGE_SCALE, height: 250 * CAGE_SCALE }}>
          <div
            className="relative"
            style={{ width: 300, height: 250, transform: `scale(${CAGE_SCALE})`, transformOrigin: 'top left' }}
          >
            <LottoCageStand />
            <div
              key={spinRound}
              style={{ transformOrigin: `${CAGE_CENTER.x}px ${CAGE_CENTER.y}px` }}
              className={cn('absolute inset-0', spinning && 'animate-lotto-spin')}
            >
              <LottoCageSphere />
              {liveFillerPositions.map((pos, i) => (
                <span
                  key={`filler-${i}`}
                  style={{
                    left: CAGE_CENTER.x + pos.x,
                    top: CAGE_CENTER.y + pos.y,
                    transform: 'translate(-50%, -50%)',
                    background: ballGradient(BALL_BASE_COLORS[i % BALL_BASE_COLORS.length]),
                  }}
                  className={cn(
                    'absolute shrink-0 rounded-full opacity-60 shadow-md shadow-black/40 transition-all duration-150 ease-out',
                    BALL_SIZE_CLASS
                  )}
                />
              ))}
              {students.map((_, i) => {
                if (result?.index === i) return null
                const isDrawn = drawn.has(i)
                const pos = livePositions[i] ?? { x: 0, y: 0 }
                return (
                  <span
                    key={i}
                    style={{
                      left: CAGE_CENTER.x + pos.x,
                      top: CAGE_CENTER.y + pos.y,
                      transform: 'translate(-50%, -50%)',
                      background: isDrawn ? undefined : ballGradient(BALL_BASE_COLORS[i % BALL_BASE_COLORS.length]),
                    }}
                    className={cn(
                      'absolute flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md shadow-black/40 transition-all duration-150 ease-out',
                      BALL_SIZE_CLASS,
                      isDrawn && 'bg-white/10 text-white/30'
                    )}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={spin} disabled={spinning}>
              <Dices className="size-4" /> {spinning ? 'Đang quay...' : 'Quay số'}
            </Button>
            <Button variant="outline" onClick={resetDraw}>Reset</Button>
          </div>

          {result && (
            <div className="mx-auto flex w-fit flex-col items-center gap-2">
              <span
                style={{ background: ballGradient(BALL_BASE_COLORS[result.index % BALL_BASE_COLORS.length]) }}
                className="flex size-16 shrink-0 animate-in items-center justify-center rounded-full text-xl font-bold text-white shadow-lg shadow-black/40 zoom-in-50 slide-in-from-top-10 duration-500"
              >
                {result.index + 1}
              </span>
              <span className="animate-in rounded-xl border-t-4 border-t-orange-400 bg-card px-6 py-2 text-xl font-bold shadow-lg fade-in-0 duration-500">
                {result.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
