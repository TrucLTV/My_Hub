import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { pickRandomIndex } from '@/lib/randomPick'
import { playWhoosh } from '@/lib/gameSound'
import { useDrawnTracker } from '@/hooks/useDrawnTracker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RosterPicker from '@/components/miniGameTools/RosterPicker'
import ResultReveal from '@/components/miniGameTools/ResultReveal'

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
  const { drawn, markDrawn, resetDraw: resetDrawnTracker, isDrawn } = useDrawnTracker(roster?.id)
  const [raceSeconds, setRaceSeconds] = useState(DEFAULT_RACE_SECONDS)
  const [racing, setRacing] = useState(false)
  const [result, setResult] = useState(null)
  const raceRoundRef = useRef(0)

  const trackRef = useRef(null)
  const laneRefs = useRef({})

  useEffect(() => {
    setResult(null)
    setRacing(false)
  }, [roster?.id])

  function selectRoster(id) {
    setRosterId(id)
    setResult(null)
  }

  function resetRace() {
    resetDrawnTracker()
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
    const winnerIdx = pickRandomIndex(students.length, drawn, removeAfterDraw)
    if (winnerIdx === null) return

    setRacing(true)
    setResult(null)
    playWhoosh()
    raceRoundRef.current += 1
    const myRound = raceRoundRef.current
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
      setResult({ index: winnerIdx, name: students[winnerIdx], round: myRound })
      if (removeAfterDraw) markDrawn(winnerIdx)
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
              const drawnAlready = isDrawn(i)
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
                        drawnAlready
                          ? 'rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white/40'
                          : 'rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white'
                      }
                    >
                      {i + 1}. {name}
                    </span>
                    <span className={drawnAlready ? 'text-xl leading-none opacity-40 grayscale' : 'text-xl leading-none'}>
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

          <ResultReveal
            resultKey={result ? result.round : null}
            icon={result ? racerEmojis[result.index] : null}
            subtitle={result ? `Hạng nhất —` : null}
            name={result?.name}
            accent="emerald"
          />
        </div>
      )}
    </div>
  )
}
