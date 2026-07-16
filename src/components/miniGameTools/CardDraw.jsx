import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { fetchRosters } from '@/lib/queries/rosters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import RosterPicker from '@/components/miniGameTools/RosterPicker'

function shuffled(n) {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function CardDraw() {
  const { data: rosters } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const [shuffleKey, setShuffleKey] = useState(0)
  const cardOrder = useMemo(() => shuffled(students.length), [roster?.id, students.length, shuffleKey])

  const [flipped, setFlipped] = useState(new Set())
  const [lastPicked, setLastPicked] = useState(null)

  useEffect(() => {
    setFlipped(new Set())
    setLastPicked(null)
    setShuffleKey((k) => k + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster?.id, students.length])

  function selectRoster(id) {
    setRosterId(id)
  }

  function pickCard(position, studentIndex) {
    if (flipped.has(position)) return
    setFlipped((prev) => new Set(prev).add(position))
    setLastPicked({ index: studentIndex, name: students[studentIndex] })
  }

  function resetDraw() {
    setFlipped(new Set())
    setLastPicked(null)
    setShuffleKey((k) => k + 1)
  }

  const allFlipped = students.length > 0 && flipped.size === students.length

  return (
    <div className="space-y-4">
      <RosterPicker rosterId={rosterId} onRosterIdChange={selectRoster} />

      {roster && students.length === 0 && (
        <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
      )}

      {roster && students.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>Còn lại: {students.length - flipped.size}/{students.length} thẻ</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 py-2">
            {cardOrder.map((studentIndex, position) => {
              const isFlipped = flipped.has(position)
              return (
                <button
                  key={position}
                  type="button"
                  disabled={isFlipped}
                  onClick={() => pickCard(position, studentIndex)}
                  className="[perspective:1000px] disabled:cursor-default"
                >
                  <div
                    className={cn(
                      'relative h-32 w-20 transition-transform duration-500 [transform-style:preserve-3d]',
                      isFlipped && '[transform:rotateY(180deg)]'
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-violet-400/60 bg-gradient-to-br from-violet-600 to-violet-950 shadow-lg shadow-black/40 transition-transform hover:scale-105 [backface-visibility:hidden]">
                      <Sparkles className="size-8 text-violet-200/70" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-amber-400 bg-card p-2 text-center shadow-lg shadow-black/40 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <span className="text-lg font-bold">{studentIndex + 1}</span>
                      <span className="line-clamp-2 text-xs font-medium">{students[studentIndex]}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-center">
            <Button variant="outline" onClick={resetDraw}>Rút lại</Button>
          </div>

          {lastPicked && (
            <div className="mx-auto flex w-fit flex-col items-center gap-2">
              <span className="flex size-16 shrink-0 animate-in items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-white shadow-lg shadow-black/40 zoom-in-50 duration-500">
                {lastPicked.index + 1}
              </span>
              <span className="animate-in rounded-xl border-t-4 border-t-orange-400 bg-card px-6 py-2 text-xl font-bold shadow-lg fade-in-0 duration-500">
                {lastPicked.name}
              </span>
            </div>
          )}

          {allFlipped && (
            <p className="text-center font-medium text-muted-foreground">
              Đã lật hết! Bấm "Rút lại" để chơi lại.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
