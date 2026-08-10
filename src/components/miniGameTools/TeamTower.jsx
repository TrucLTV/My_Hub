import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import TeamNameEditor, { useTeams, TEAM_COLORS } from '@/components/miniGameTools/TeamCompetitionSetup'

// Ý tưởng mượn từ EDU-HUB (tools/edugame/assets/js/games/tower.js): mỗi câu trả lời
// đúng xây thêm 1 tầng, sai làm tháp rung lắc. Khác bản gốc: không cần ngân hàng câu
// hỏi số — GV hỏi miệng và bấm "Đúng"/"Sai" cho từng đội.

const TARGET_FLOORS = 8
const BLOCK_EMOJIS = ['🧱', '🧱', '🧱', '🏠', '🏛️', '🏰', '🗼', '🚀']
const SHAKE_MS = 500

export default function TeamTower() {
  const { teams, addTeam, removeTeam, renameTeam } = useTeams(2)
  const [floors, setFloors] = useState({})
  const [wobbling, setWobbling] = useState({})
  const [finishOrder, setFinishOrder] = useState([])

  const get = (id) => floors[id] ?? 0
  const started = finishOrder.length > 0 || teams.some((t) => get(t.id) > 0)

  function correct(id) {
    setFloors((prev) => {
      const next = Math.min(TARGET_FLOORS, (prev[id] ?? 0) + 1)
      if (next >= TARGET_FLOORS) setFinishOrder((f) => (f.includes(id) ? f : [...f, id]))
      return { ...prev, [id]: next }
    })
  }

  function wrong(id) {
    setWobbling((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setWobbling((prev) => ({ ...prev, [id]: false })), SHAKE_MS)
  }

  function reset() {
    setFloors({})
    setFinishOrder([])
    setWobbling({})
  }

  return (
    <div className="space-y-4">
      <TeamNameEditor teams={teams} onAdd={addTeam} onRemove={removeTeam} onRename={renameTeam} disabled={started} />

      <div className="flex flex-wrap items-end justify-center gap-6 rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-500/10 to-transparent p-4 shadow-inner shadow-black/20">
        {teams.map((t, i) => {
          const f = get(t.id)
          const place = finishOrder.indexOf(t.id)
          const color = TEAM_COLORS[i % TEAM_COLORS.length]
          return (
            <div key={t.id} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex min-h-44 w-16 flex-col-reverse items-center justify-start gap-0.5',
                  wobbling[t.id] && 'animate-team-shake'
                )}
              >
                {Array.from({ length: f }, (_, fi) => (
                  <span key={fi} className="animate-in text-xl leading-none zoom-in-50 duration-300">
                    {BLOCK_EMOJIS[Math.min(fi, BLOCK_EMOJIS.length - 1)]}
                  </span>
                ))}
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color }}>{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f}/{TARGET_FLOORS} tầng {place === 0 && '· 🏆'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => correct(t.id)} disabled={f >= TARGET_FLOORS}>Đúng ✓</Button>
                <Button size="sm" variant="outline" onClick={() => wrong(t.id)} disabled={f >= TARGET_FLOORS}>Sai ✗</Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" /> Xây lại
        </Button>
      </div>
    </div>
  )
}
