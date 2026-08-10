import { useState } from 'react'
import { Flag, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import TeamNameEditor, { useTeams, TEAM_COLORS } from '@/components/miniGameTools/TeamCompetitionSetup'

// Ý tưởng mượn từ EDU-HUB (tools/edugame/assets/js/games/racing.js): xe chạy nhanh hơn
// mỗi khi trả lời đúng. Khác bản gốc: không cần ngân hàng câu hỏi số — GV tự hỏi
// miệng/trên bảng và bấm "Đúng"/"Sai" cho từng đội.

const STEP = 20 // % quãng đường mỗi câu đúng
const SHAKE_MS = 400

export default function TeamRace() {
  const { teams, addTeam, removeTeam, renameTeam } = useTeams(2)
  const [progress, setProgress] = useState({})
  const [shaking, setShaking] = useState({})
  const [finishOrder, setFinishOrder] = useState([])

  const get = (id) => progress[id] ?? 0
  const started = finishOrder.length > 0 || teams.some((t) => get(t.id) > 0)

  function correct(id) {
    setProgress((prev) => {
      const next = Math.min(100, (prev[id] ?? 0) + STEP)
      if (next >= 100) {
        setFinishOrder((f) => (f.includes(id) ? f : [...f, id]))
      }
      return { ...prev, [id]: next }
    })
  }

  function wrong(id) {
    setShaking((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setShaking((prev) => ({ ...prev, [id]: false })), SHAKE_MS)
  }

  function reset() {
    setProgress({})
    setFinishOrder([])
    setShaking({})
  }

  return (
    <div className="space-y-4">
      <TeamNameEditor teams={teams} onAdd={addTeam} onRemove={removeTeam} onRename={renameTeam} disabled={started} />

      <div className="space-y-4 rounded-2xl border-4 border-sky-300/50 bg-gradient-to-b from-sky-400/10 via-sky-500/5 to-transparent p-4 shadow-inner shadow-black/20">
        {teams.map((t, i) => {
          const pct = get(t.id)
          const place = finishOrder.indexOf(t.id)
          const color = TEAM_COLORS[i % TEAM_COLORS.length]
          return (
            <div key={t.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold" style={{ color }}>{t.name}</span>
                {place === 0 && <span className="font-bold text-amber-400">🏆 Về nhất!</span>}
                {place > 0 && <span className="text-muted-foreground">Về thứ {place + 1}</span>}
              </div>
              <div className="relative h-8 overflow-hidden rounded-full bg-black/15 dark:bg-black/30">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(6, pct)}%`, background: color }}
                />
                <span
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-xl leading-none transition-all duration-500 ease-out',
                    shaking[t.id] && 'animate-team-shake'
                  )}
                  style={{ left: `calc(${pct}% - 16px)` }}
                >
                  🏎️
                </span>
                <Flag className="absolute top-1/2 right-1.5 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" onClick={() => correct(t.id)} disabled={pct >= 100}>Đúng ✓</Button>
                <Button size="sm" variant="outline" onClick={() => wrong(t.id)} disabled={pct >= 100}>Sai ✗</Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" /> Đua lại từ đầu
        </Button>
      </div>
    </div>
  )
}
