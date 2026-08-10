import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Dùng chung cho các mini game "Thi đua nhóm" (đua xe, khinh khí cầu, xây tháp...):
// quản lý danh sách đội thi (tên + màu). Không gắn với roster/học sinh — GV đặt tên
// đội ngay tại chỗ (VD: "Tổ 1", "Tổ 2"...).

export const TEAM_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4']
export const MIN_TEAMS = 2
export const MAX_TEAMS = 6

let uidCounter = 0
function nextId() {
  uidCounter += 1
  return `team-${uidCounter}`
}

export function useTeams(defaultCount = 2) {
  const [teams, setTeams] = useState(() =>
    Array.from({ length: defaultCount }, (_, i) => ({ id: nextId(), name: `Đội ${i + 1}` }))
  )

  function addTeam() {
    setTeams((prev) => (prev.length >= MAX_TEAMS ? prev : [...prev, { id: nextId(), name: `Đội ${prev.length + 1}` }]))
  }

  function removeTeam(id) {
    setTeams((prev) => (prev.length <= MIN_TEAMS ? prev : prev.filter((t) => t.id !== id)))
  }

  function renameTeam(id, name) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }

  return { teams, addTeam, removeTeam, renameTeam }
}

export default function TeamNameEditor({ teams, onAdd, onRemove, onRename, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {teams.map((t, i) => (
        <div key={t.id} className="flex items-center gap-1">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
          />
          <Input
            value={t.name}
            disabled={disabled}
            onChange={(e) => onRename(t.id, e.target.value)}
            className="h-8 w-28"
          />
          {teams.length > MIN_TEAMS && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => onRemove(t.id)}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
      {teams.length < MAX_TEAMS && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          <Plus className="size-3.5" /> Thêm đội
        </Button>
      )}
    </div>
  )
}
