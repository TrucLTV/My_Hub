import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

const RACER_EMOJIS = ['🐇', '🐢', '🚗', '🐎', '🦁', '🐆', '🚀', '🐕']
const TRACK_WIDTH = 560
const LANE_HEIGHT = 34
const DEFAULT_RACE_SECONDS = 4
const MIN_RACE_SECONDS = 2
const MAX_RACE_SECONDS = 10

export default function AnimalRace() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const racerEmojis = useMemo(
    () => students.map(() => RACER_EMOJIS[Math.floor(Math.random() * RACER_EMOJIS.length)]),
    [roster?.id, students.length]
  )

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true)
  const [drawn, setDrawn] = useState(new Set())
  const [raceSeconds, setRaceSeconds] = useState(DEFAULT_RACE_SECONDS)
  const [racing, setRacing] = useState(false)
  const [result, setResult] = useState(null)

  const trackRef = useRef(null)
  const laneRefs = useRef({})

  useEffect(() => {
    setDrawn(new Set())
    setResult(null)
    setRacing(false)
  }, [roster?.id])

  function selectRoster(id) {
    setRosterId(id)
    setDrawn(new Set())
    setResult(null)
  }

  function resetRace() {
    setDrawn(new Set())
    setResult(null)
    students.forEach((_, i) => {
      const el = laneRefs.current[i]
      if (el) {
        el.style.transitionDuration = '0ms'
        el.style.transform = 'translateX(0px)'
      }
    })
  }

  function startRace() {
    if (racing || students.length === 0) return
    const pool = students.map((_, i) => i).filter((i) => (removeAfterDraw ? !drawn.has(i) : true))
    if (pool.length === 0) return

    setRacing(true)
    setResult(null)
    const winnerIdx = pool[Math.floor(Math.random() * pool.length)]
    const winnerDurationMs = raceSeconds * 1000
    const finishX = TRACK_WIDTH - LANE_HEIGHT

    students.forEach((_, i) => {
      const el = laneRefs.current[i]
      if (!el) return
      const duration = i === winnerIdx ? winnerDurationMs : winnerDurationMs * (1.15 + Math.random() * 0.6)
      el.style.transitionDuration = '0ms'
      el.style.transform = 'translateX(0px)'
      void el.offsetWidth
      el.style.transitionDuration = `${duration}ms`
      el.style.transform = `translateX(${finishX}px)`
    })

    setTimeout(() => {
      const trackRect = trackRef.current?.getBoundingClientRect()
      students.forEach((_, i) => {
        if (i === winnerIdx) return
        const el = laneRefs.current[i]
        if (!el || !trackRect) return
        const rect = el.getBoundingClientRect()
        const currentX = rect.left - trackRect.left
        el.style.transitionDuration = '0ms'
        el.style.transform = `translateX(${currentX}px)`
      })
      setResult({ index: winnerIdx, name: students[winnerIdx] })
      if (removeAfterDraw) setDrawn((prev) => new Set(prev).add(winnerIdx))
      setRacing(false)
    }, winnerDurationMs)
  }

  return (
    <div className="space-y-4">
      <RosterPicker rosterId={rosterId} onRosterIdChange={selectRoster} />

      {roster && students.length === 0 && (
        <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
      )}

      {roster && students.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={removeAfterDraw}
                onChange={(e) => setRemoveAfterDraw(e.target.checked)}
              />
              Loại tên đã gọi khỏi lượt đua tiếp theo
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="race-seconds" className="shrink-0">Thời gian đua (giây)</Label>
              <Input
                id="race-seconds"
                type="number"
                min={MIN_RACE_SECONDS}
                max={MAX_RACE_SECONDS}
                value={raceSeconds}
                disabled={racing}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setRaceSeconds(
                    Number.isFinite(v) ? Math.max(MIN_RACE_SECONDS, Math.min(MAX_RACE_SECONDS, v)) : DEFAULT_RACE_SECONDS
                  )
                }}
                className="w-16"
              />
            </div>
          </div>

          <div
            ref={trackRef}
            className="relative mx-auto max-w-full overflow-x-auto rounded-lg border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-900/30 to-emerald-950/10 p-2"
            style={{ width: TRACK_WIDTH + 80 }}
          >
            <div className="pointer-events-none absolute top-0 right-3 bottom-0 w-0.5 bg-[repeating-linear-gradient(0deg,white,white_4px,transparent_4px,transparent_8px)] opacity-70" />
            {students.map((name, i) => {
              const isDrawn = drawn.has(i)
              return (
                <div key={i} className="relative border-b border-dashed border-white/10" style={{ height: LANE_HEIGHT }}>
                  <div
                    ref={(el) => {
                      laneRefs.current[i] = el
                    }}
                    className="absolute top-0 left-0 flex items-center gap-1 transition-transform ease-out"
                    style={{ willChange: 'transform' }}
                  >
                    <span
                      className={
                        isDrawn
                          ? 'rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white/40'
                          : 'rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white'
                      }
                    >
                      {i + 1}. {name}
                    </span>
                    <span className={isDrawn ? 'text-xl leading-none opacity-40 grayscale' : 'text-xl leading-none'}>
                      {racerEmojis[i]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={startRace} disabled={racing}>
              <Flag className="size-4" /> {racing ? 'Đang đua...' : 'Xuất phát'}
            </Button>
            <Button variant="outline" onClick={resetRace}>Reset</Button>
          </div>

          {result && (
            <div className="mx-auto flex w-fit flex-col items-center gap-2">
              <span className="flex size-16 shrink-0 animate-in items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-black/40 zoom-in-50 duration-500">
                {result.index + 1}
              </span>
              <span className="animate-in flex items-center gap-2 rounded-xl border-t-4 border-t-orange-400 bg-card px-6 py-2 text-xl font-bold shadow-lg fade-in-0 duration-500">
                <span>{racerEmojis[result.index]}</span>
                <span>{result.name}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
