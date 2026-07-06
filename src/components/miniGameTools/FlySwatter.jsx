import { useEffect, useMemo, useState } from 'react'
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
  const flyIdle = useMemo(
    () => students.map(() => ({ delay: Math.random() * 2.4, duration: 1.8 + Math.random() * 1.4 })),
    [roster?.id, students.length]
  )

  const [groupSize, setGroupSize] = useState(DEFAULT_GROUP_SIZE)
  const [remaining, setRemaining] = useState([])
  const [dying, setDying] = useState([])
  const [groups, setGroups] = useState([])

  useEffect(() => {
    setRemaining(students.map((_, i) => i))
    setGroups([])
    setDying([])
  }, [roster?.id, students.length])

  function selectRoster(id) {
    setRosterId(id)
  }

  function resetGroups() {
    setRemaining(students.map((_, i) => i))
    setGroups([])
    setDying([])
  }

  function swat() {
    if (dying.length > 0 || remaining.length === 0) return
    const batchSize = Math.min(groupSize, remaining.length)
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const batch = shuffled.slice(0, batchSize)
    const rest = shuffled.slice(batchSize)
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
              className="relative overflow-hidden rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-400/20 via-sky-500/5 to-transparent shadow-inner shadow-black/30"
              style={{ width: SCENE.width, height: SCENE.height, transform: `scale(${SCENE_SCALE})`, transformOrigin: 'top left' }}
            >
              {students.map((_, i) => {
                const isDying = dying.includes(i)
                if (!remaining.includes(i) && !isDying) return null
                const pos = restPositions[i]
                const idle = flyIdle[i]
                return (
                  <div
                    key={i}
                    style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                    className="absolute top-0 left-0"
                  >
                    <div
                      style={!isDying ? { animationDelay: `${idle.delay}s`, animationDuration: `${idle.duration}s` } : undefined}
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
