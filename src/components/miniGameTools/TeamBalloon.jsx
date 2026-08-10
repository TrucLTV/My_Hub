import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import TeamNameEditor, { useTeams, TEAM_COLORS } from '@/components/miniGameTools/TeamCompetitionSetup'

// Ý tưởng mượn từ EDU-HUB (tools/edugame/assets/js/games/balloon.js): bóng bay lên
// khi trả lời đúng, rơi xuống khi sai, bầu trời đổi màu theo độ cao. Khác bản gốc:
// không cần ngân hàng câu hỏi số — GV hỏi miệng và bấm "Đúng"/"Sai" cho từng đội.

const TARGET = 1000 // mét
const STEP_UP = 150
const STEP_DOWN = 70
const SCENE_H = 240
const SHAKE_MS = 500

const SKY_LAYERS = [
  { min: 0, bg: 'linear-gradient(180deg,#f97316 0%,#fb923c 40%,#fbbf24 100%)' },
  { min: 300, bg: 'linear-gradient(180deg,#3b82f6 0%,#60a5fa 100%)' },
  { min: 600, bg: 'linear-gradient(180deg,#1d4ed8 0%,#1e1b4b 100%)' },
  { min: 850, bg: 'linear-gradient(180deg,#020617 0%,#1e1b4b 100%)' },
]

function skyFor(alt) {
  return [...SKY_LAYERS].reverse().find((l) => alt >= l.min)?.bg ?? SKY_LAYERS[0].bg
}

export default function TeamBalloon() {
  const { teams, addTeam, removeTeam, renameTeam } = useTeams(2)
  const [alt, setAlt] = useState({})
  const [shaking, setShaking] = useState({})
  const [finishOrder, setFinishOrder] = useState([])

  const get = (id) => alt[id] ?? 0
  const started = finishOrder.length > 0 || teams.some((t) => get(t.id) > 0)
  const maxAlt = teams.length ? Math.max(0, ...teams.map((t) => get(t.id))) : 0

  function correct(id) {
    setAlt((prev) => {
      const next = Math.min(TARGET, (prev[id] ?? 0) + STEP_UP)
      if (next >= TARGET) setFinishOrder((f) => (f.includes(id) ? f : [...f, id]))
      return { ...prev, [id]: next }
    })
  }

  function wrong(id) {
    setAlt((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - STEP_DOWN) }))
    setShaking((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setShaking((prev) => ({ ...prev, [id]: false })), SHAKE_MS)
  }

  function reset() {
    setAlt({})
    setFinishOrder([])
    setShaking({})
  }

  return (
    <div className="space-y-4">
      <TeamNameEditor teams={teams} onAdd={addTeam} onRemove={removeTeam} onRename={renameTeam} disabled={started} />

      <div
        className="relative mx-auto flex items-end justify-center gap-6 overflow-hidden rounded-2xl border-4 border-sky-300/50 px-6 pb-3 shadow-inner shadow-black/30 transition-[background] duration-700"
        style={{ height: SCENE_H, background: skyFor(maxAlt) }}
      >
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-emerald-700/50 to-emerald-900/70" />
        {teams.map((t, i) => {
          const a = get(t.id)
          const pct = Math.min(100, (a / TARGET) * 100)
          return (
            <div key={t.id} className="relative flex h-full w-20 items-end justify-center">
              <div
                className={cn(
                  'absolute flex flex-col items-center transition-[bottom] duration-700 ease-out',
                  shaking[t.id] && 'animate-team-shake'
                )}
                style={{ bottom: `${Math.max(4, pct)}%` }}
              >
                <span className="text-3xl leading-none">{a >= TARGET ? '🌟' : '🎈'}</span>
                <span className="text-lg leading-none">🧺</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {teams.map((t, i) => {
          const a = get(t.id)
          const place = finishOrder.indexOf(t.id)
          const color = TEAM_COLORS[i % TEAM_COLORS.length]
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-xl border-t-4 bg-card px-3 py-2"
              style={{ borderTopColor: color }}
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(a)}m {place === 0 && '· 🌟 Chạm đỉnh trời!'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => correct(t.id)} disabled={a >= TARGET}>Đúng ✓</Button>
                <Button size="sm" variant="outline" onClick={() => wrong(t.id)} disabled={a >= TARGET}>Sai ✗</Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" /> Chơi lại
        </Button>
      </div>
    </div>
  )
}
