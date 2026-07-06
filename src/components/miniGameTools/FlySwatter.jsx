import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

const SCENE = { width: 320, height: 210 }
const SCENE_SCALE = 2.2
const FLY_AREA = { xMin: 20, xMax: 300, yMin: 16, yMax: 194 }
const DEFAULT_GROUP_SIZE = 4
const MIN_GROUP_SIZE = 2
const MAX_GROUP_SIZE = 20
const SWAT_ANIM_MS = 450
const WANDER_MIN_MS = 900
const WANDER_MAX_MS = 2000

function randomPointInRect(rect) {
  return {
    x: rect.xMin + Math.random() * (rect.xMax - rect.xMin),
    y: rect.yMin + Math.random() * (rect.yMax - rect.yMin),
  }
}

export default function FlySwatter() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const restPositions = useMemo(
    () => students.map(() => randomPointInRect(FLY_AREA)),
    [roster?.id, students.length]
  )
  const flyBuzz = useMemo(
    () => students.map(() => ({ delay: Math.random() * 2.4, duration: 1.8 + Math.random() * 1.4 })),
    [roster?.id, students.length]
  )

  const [groupSize, setGroupSize] = useState(DEFAULT_GROUP_SIZE)
  const [remaining, setRemaining] = useState([])
  const [dying, setDying] = useState([])
  const [groups, setGroups] = useState([])
  const [splats, setSplats] = useState([])

  const containerRef = useRef(null)
  const flyRefs = useRef({})
  const wanderTimers = useRef({})
  const initializedRosterRef = useRef(null)

  function startWander(i) {
    const el = flyRefs.current[i]
    if (!el) return
    const target = randomPointInRect(FLY_AREA)
    const duration = WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS)
    el.style.transitionDuration = `${duration}ms`
    el.style.transform = `translate(${target.x}px, ${target.y}px)`
    wanderTimers.current[i] = setTimeout(() => startWander(i), duration)
  }

  function getLocalPosition(el) {
    const containerEl = containerRef.current
    if (!el || !containerEl) return { x: SCENE.width / 2, y: SCENE.height / 2 }
    const containerRect = containerEl.getBoundingClientRect()
    const flyRect = el.getBoundingClientRect()
    const scale = containerRect.width / SCENE.width || 1
    return {
      x: (flyRect.left + flyRect.width / 2 - containerRect.left) / scale,
      y: (flyRect.top + flyRect.height / 2 - containerRect.top) / scale,
    }
  }

  useEffect(() => {
    Object.values(wanderTimers.current).forEach(clearTimeout)
    wanderTimers.current = {}
    initializedRosterRef.current = null
    setRemaining(students.map((_, i) => i))
    setGroups([])
    setDying([])
    setSplats([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster?.id, students.length])

  useEffect(() => {
    if (!roster || students.length === 0) return
    if (remaining.length === 0) return
    if (initializedRosterRef.current === roster.id) return
    initializedRosterRef.current = roster.id

    const kickoffTimers = students.map((_, i) => {
      const el = flyRefs.current[i]
      if (el) {
        const start = restPositions[i]
        el.style.transitionDuration = '0ms'
        el.style.transform = `translate(${start.x}px, ${start.y}px)`
      }
      return setTimeout(() => startWander(i), Math.random() * 500)
    })
    return () => kickoffTimers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, students.length, remaining, restPositions])

  useEffect(() => {
    return () => Object.values(wanderTimers.current).forEach(clearTimeout)
  }, [])

  function selectRoster(id) {
    setRosterId(id)
  }

  function resetGroups() {
    Object.values(wanderTimers.current).forEach(clearTimeout)
    wanderTimers.current = {}
    initializedRosterRef.current = null
    setSplats([])
    setRemaining(students.map((_, i) => i))
    setGroups([])
    setDying([])
  }

  function swat() {
    if (dying.length > 0 || remaining.length === 0) return
    // Nếu phần còn lại sau khi tách 1 nhóm sẽ nhỏ hơn 1 nhóm đầy đủ,
    // gộp luôn số dư đó vào nhóm cuối này thay vì để lẻ ra một nhóm riêng.
    const batchSize = remaining.length < groupSize * 2 ? remaining.length : groupSize
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const batch = shuffled.slice(0, batchSize)
    const rest = shuffled.slice(batchSize)

    const newSplats = batch.map((i) => {
      const el = flyRefs.current[i]
      const pos = getLocalPosition(el)
      if (wanderTimers.current[i]) {
        clearTimeout(wanderTimers.current[i])
        delete wanderTimers.current[i]
      }
      if (el) {
        el.style.transitionDuration = '0ms'
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      }
      return { index: i, x: pos.x, y: pos.y }
    })

    setSplats((prev) => [...prev, ...newSplats])
    setDying(batch)
    setTimeout(() => {
      setRemaining(rest)
      setDying([])
      setGroups((prev) => [...prev, batch])
    }, SWAT_ANIM_MS)
  }

  const finished = remaining.length === 0 && groups.length > 0

  return (
    <div className="space-y-4">
      <RosterPicker rosterId={rosterId} onRosterIdChange={selectRoster} />

      {roster && students.length === 0 && (
        <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
      )}

      {roster && students.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="group-size" className="shrink-0">Số người / nhóm</Label>
              <Input
                id="group-size"
                type="number"
                min={MIN_GROUP_SIZE}
                max={Math.max(MIN_GROUP_SIZE, students.length)}
                value={groupSize}
                disabled={dying.length > 0}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setGroupSize(
                    Number.isFinite(v) ? Math.max(MIN_GROUP_SIZE, Math.min(MAX_GROUP_SIZE, v)) : DEFAULT_GROUP_SIZE
                  )
                }}
                className="w-16"
              />
            </div>
            <span className="text-muted-foreground">
              Còn lại: {remaining.length}/{students.length}
            </span>
          </div>

          <div className="relative mx-auto" style={{ width: SCENE.width * SCENE_SCALE, height: SCENE.height * SCENE_SCALE }}>
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-400/20 via-sky-500/5 to-transparent shadow-inner shadow-black/30"
              style={{ width: SCENE.width, height: SCENE.height, transform: `scale(${SCENE_SCALE})`, transformOrigin: 'top left' }}
            >
              {splats.map((s, si) => (
                <span
                  key={`splat-${si}`}
                  style={{ transform: `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) rotate(90deg)` }}
                  className="absolute top-0 left-0 text-lg leading-none opacity-40 grayscale"
                >
                  🪰
                </span>
              ))}

              {students.map((_, i) => {
                const isDying = dying.includes(i)
                if (!remaining.includes(i) && !isDying) return null
                const buzz = flyBuzz[i]
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      flyRefs.current[i] = el
                    }}
                    className="absolute top-0 left-0 transition-transform ease-in-out"
                    style={{ willChange: 'transform' }}
                  >
                    <div
                      style={!isDying ? { animationDelay: `${buzz.delay}s`, animationDuration: `${buzz.duration}s` } : undefined}
                      className={cn(
                        'relative flex -translate-x-1/2 -translate-y-1/2 items-center justify-center',
                        !isDying && 'animate-bee-hover',
                        isDying && 'animate-out fade-out-0 zoom-out-50 spin-out-45 duration-400'
                      )}
                    >
                      <span className="text-xl leading-none">🪰</span>
                      <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-black shadow">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={swat} disabled={dying.length > 0 || remaining.length === 0}>
              <Sparkles className="size-4" /> {remaining.length === 0 ? 'Đã chia xong' : 'Đập ruồi'}
            </Button>
            <Button variant="outline" onClick={resetGroups}>Reset</Button>
          </div>

          {groups.length > 0 && (
            <div className="mx-auto flex max-w-xl flex-col gap-2">
              {groups.map((group, gi) => (
                <div
                  key={gi}
                  className="animate-in rounded-xl border-t-4 border-t-orange-400 bg-card px-4 py-3 shadow-lg fade-in-0 zoom-in-95 duration-500"
                >
                  <p className="mb-1 text-sm font-bold text-orange-400">Nhóm {gi + 1}</p>
                  <p className="text-base">{group.map((idx) => students[idx]).join(', ')}</p>
                </div>
              ))}
            </div>
          )}

          {finished && (
            <p className="text-center font-medium text-muted-foreground">
              Đã chia xong {groups.length} nhóm!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
