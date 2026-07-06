import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

const SCENE = { width: 320, height: 230 }
const SCENE_SCALE = 3
const SKY = { xMin: 20, xMax: 300, yMin: 12, yMax: 116 }
const HOVER_ZONE = { xMin: 26, xMax: 294, yMin: 122, yMax: 146 }
const GROUND = { xMin: 26, xMax: 294, yMin: 154, yMax: 206 }
const MIN_FILLER_BEES = 10
const MIN_FILLER_FLOWERS = 10
const DEFAULT_FLIGHT_SECONDS = 3
const MIN_FLIGHT_SECONDS = 1
const MAX_FLIGHT_SECONDS = 10
const WAYPOINT_SAMPLES = 48
const FLOWERS = ['🌸', '🌼', '🌻', '🌺', '🌷']

function randomPointInRect(rect) {
  return {
    x: rect.xMin + Math.random() * (rect.xMax - rect.xMin),
    y: rect.yMin + Math.random() * (rect.yMax - rect.yMin),
  }
}

function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

// Lay mau tren 1 duong cong Bezier ngoan ngoeo (lech sang 1 ben roi ben kia)
// mo phong duong bay that cua ong, thay vi 1 duong thang.
function buildWigglyWaypoints(start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.hypot(dx, dy) || 1
  const nx = -dy / dist
  const ny = dx / dist
  const amp = Math.min(46, 16 + dist * 0.32)

  const p1 = { x: start.x + dx * 0.33 + nx * amp, y: start.y + dy * 0.33 + ny * amp }
  const p2 = { x: start.x + dx * 0.66 - nx * amp, y: start.y + dy * 0.66 - ny * amp }

  const points = []
  for (let s = 0; s <= WAYPOINT_SAMPLES; s++) {
    points.push(cubicBezierPoint(start, p1, p2, end, s / WAYPOINT_SAMPLES))
  }
  return points
}

export default function BeeRace() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const restPositions = useMemo(() => students.map(() => randomPointInRect(SKY)), [roster?.id, students.length])
  const flowerPositions = useMemo(() => students.map(() => randomPointInRect(GROUND)), [roster?.id, students.length])

  const fillerBeeCount = Math.max(0, MIN_FILLER_BEES - students.length)
  const fillerRestPositions = useMemo(() => {
    return Array.from({ length: fillerBeeCount }, () => randomPointInRect(SKY))
  }, [roster?.id, fillerBeeCount])
  const fillerIdle = useMemo(() => {
    return Array.from({ length: fillerBeeCount }, () => ({ delay: Math.random() * 2.4, duration: 2 + Math.random() * 1.4 }))
  }, [fillerBeeCount])

  const fillerFlowerCount = Math.max(0, MIN_FILLER_FLOWERS - students.length)
  const fillerFlowerPositions = useMemo(() => {
    return Array.from({ length: fillerFlowerCount }, () => randomPointInRect(GROUND))
  }, [roster?.id, fillerFlowerCount])

  const [flightSeconds, setFlightSeconds] = useState(DEFAULT_FLIGHT_SECONDS)
  const [removeAfterDraw, setRemoveAfterDraw] = useState(true)
  const [drawn, setDrawn] = useState(new Set())
  const [racing, setRacing] = useState(false)
  const [beePos, setBeePos] = useState([])
  const [beeDur, setBeeDur] = useState([])
  const [fillerPos, setFillerPos] = useState([])
  const [fillerDur, setFillerDur] = useState([])
  const [result, setResult] = useState(null)
  const raceIdRef = useRef(0)

  function selectRoster(id) {
    setRosterId(id)
    setDrawn(new Set())
    setResult(null)
    raceIdRef.current += 1
    setRacing(false)
    setBeePos([])
    setBeeDur([])
    setFillerPos([])
    setFillerDur([])
  }

  function resetDraw() {
    setDrawn(new Set())
    setResult(null)
    raceIdRef.current += 1
    setRacing(false)
    setBeePos(restPositions.map((p) => p))
    setBeeDur(students.map(() => 700))
    setFillerPos(fillerRestPositions.map((p) => p))
    setFillerDur(fillerRestPositions.map(() => 700))
  }

  function animateAlong(myRaceId, waypoints, totalDuration, onStep) {
    const stepMs = totalDuration / (waypoints.length - 1)
    let step = 0
    function advance() {
      if (raceIdRef.current !== myRaceId) return
      step++
      onStep(waypoints[step], stepMs)
      if (step < waypoints.length - 1) setTimeout(advance, stepMs)
    }
    setTimeout(advance, 20)
  }

  function launch() {
    if (racing || students.length === 0) return
    const pool = students.map((_, i) => i).filter((i) => (removeAfterDraw ? !drawn.has(i) : true))
    if (pool.length === 0) return

    setResult(null)
    setRacing(true)
    raceIdRef.current += 1
    const myRaceId = raceIdRef.current

    const winnerIdx = pool[Math.floor(Math.random() * pool.length)]
    const totalMs = flightSeconds * 1000

    const realDurations = students.map((_, i) => (i === winnerIdx ? totalMs : totalMs * (1.15 + Math.random() * 0.7)))
    const realWaypoints = students.map((_, i) => {
      const target = i === winnerIdx
        ? { x: flowerPositions[i].x, y: flowerPositions[i].y - 14 }
        : randomPointInRect(HOVER_ZONE)
      return buildWigglyWaypoints(restPositions[i], target)
    })

    const fillerDurations = fillerRestPositions.map(() => totalMs * (1.1 + Math.random() * 0.9))
    const fillerWaypoints = fillerRestPositions.map((pos) => buildWigglyWaypoints(pos, randomPointInRect(HOVER_ZONE)))

    setBeePos(restPositions.map((p) => p))
    setBeeDur(students.map(() => 0))
    setFillerPos(fillerRestPositions.map((p) => p))
    setFillerDur(fillerRestPositions.map(() => 0))

    students.forEach((_, i) => {
      animateAlong(myRaceId, realWaypoints[i], realDurations[i], (pos, dur) => {
        setBeePos((prev) => {
          const next = [...prev]
          next[i] = pos
          return next
        })
        setBeeDur((prev) => {
          const next = [...prev]
          next[i] = dur
          return next
        })
      })
    })

    fillerRestPositions.forEach((_, i) => {
      animateAlong(myRaceId, fillerWaypoints[i], fillerDurations[i], (pos, dur) => {
        setFillerPos((prev) => {
          const next = [...prev]
          next[i] = pos
          return next
        })
        setFillerDur((prev) => {
          const next = [...prev]
          next[i] = dur
          return next
        })
      })
    })

    setTimeout(() => {
      if (raceIdRef.current !== myRaceId) return
      raceIdRef.current += 1 // dung tat ca con ong con lai ngay tai vi tri hien tai
      setResult({ index: winnerIdx, name: students[winnerIdx] })
      if (removeAfterDraw) setDrawn((prev) => new Set(prev).add(winnerIdx))
      setRacing(false)
    }, realDurations[winnerIdx])
  }

  return (
    <div className="space-y-4">
      <RosterPicker rosterId={rosterId} onRosterIdChange={selectRoster} />

      {roster && students.length === 0 && (
        <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
      )}

      {roster && students.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex w-fit items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={removeAfterDraw}
                onChange={(e) => setRemoveAfterDraw(e.target.checked)}
              />
              Loại tên đã gọi khỏi lượt bay tiếp theo
            </label>
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="flight-seconds" className="shrink-0">Thời gian bay (giây)</Label>
              <Input
                id="flight-seconds"
                type="number"
                min={MIN_FLIGHT_SECONDS}
                max={MAX_FLIGHT_SECONDS}
                value={flightSeconds}
                disabled={racing}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setFlightSeconds(Number.isFinite(v) ? Math.min(MAX_FLIGHT_SECONDS, Math.max(MIN_FLIGHT_SECONDS, v)) : DEFAULT_FLIGHT_SECONDS)
                }}
                className="w-16"
              />
            </div>
          </div>

          <div
            className="relative mx-auto"
            style={{ width: SCENE.width * SCENE_SCALE, height: SCENE.height * SCENE_SCALE }}
          >
          <div
            className="relative overflow-hidden rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-400/30 via-sky-500/10 to-transparent shadow-inner shadow-black/30"
            style={{ width: SCENE.width, height: SCENE.height, transform: `scale(${SCENE_SCALE})`, transformOrigin: 'top left' }}
          >
            {/* mat dat / bai co */}
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-emerald-700/50 to-emerald-900/70"
              style={{ top: GROUND.yMin - 15 }}
            />

            {/* hoa trang tri lap day bai co */}
            {fillerFlowerPositions.map((pos, i) => (
              <span
                key={`filler-flower-${i}`}
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                className="absolute text-xl leading-none opacity-50"
              >
                {FLOWERS[i % FLOWERS.length]}
              </span>
            ))}

            {/* hoa that, moi hoc sinh 1 bong */}
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

            {/* ong trang tri: cung bay khi xuat phat, chi lon von tai cho khi chua choi */}
            {fillerRestPositions.map((restPos, i) => {
              const pos = fillerPos[i] ?? restPos
              const dur = fillerDur[i] ?? 0
              return (
                <span
                  key={`filler-bee-${i}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    transitionDuration: `${dur}ms`,
                    animationDelay: `${fillerIdle[i]?.delay ?? 0}s`,
                    animationDuration: `${fillerIdle[i]?.duration ?? 2.5}s`,
                  }}
                  className={cn('absolute text-lg opacity-70 transition-all ease-linear', !racing && 'animate-bee-hover')}
                >
                  🐝
                </span>
              )
            })}

            {/* ong that, gan voi hoc sinh */}
            {students.map((_, i) => {
              const isWinner = result?.index === i
              const isDrawn = drawn.has(i)
              const pos = beePos[i] ?? restPositions[i]
              const dur = beeDur[i] ?? 0
              return (
                <div
                  key={i}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    transitionDuration: `${dur}ms`,
                  }}
                  className={cn(
                    'absolute flex items-center justify-center transition-all ease-linear',
                    !racing && !result && 'animate-bee-hover',
                    isWinner && 'animate-in zoom-in-50 scale-125 duration-500'
                  )}
                >
                  <span className={cn('text-xl leading-none', isDrawn && 'opacity-30 grayscale')}>🐝</span>
                  <span
                    className={cn(
                      'absolute flex size-3.5 items-center justify-center rounded-full text-[9px] font-bold shadow',
                      isDrawn ? 'bg-white/30 text-white/60' : 'bg-amber-400 text-black'
                    )}
                  >
                    {i + 1}
                  </span>
                </div>
              )
            })}
          </div>
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
