import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dices, Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchRosters, createRoster, updateRoster, deleteRoster } from '@/lib/queries/rosters'
import { parseRosterFile } from '@/lib/parseRosterFile'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LottoCageStand, LottoCageSphere } from '@/components/miniGameTools/LottoCageFrame'

const BALL_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500']
const CAGE_CENTER = { x: 130, y: 105 }
const CAGE_SCATTER_RADIUS = 66
const SPIN_DURATION_MS = 2200
const MIN_CAGE_BALLS = 26

function randomPointInDisk(radius) {
  const angle = Math.random() * Math.PI * 2
  const r = radius * Math.sqrt(Math.random())
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
}

const emptyForm = { name: '', studentsText: '' }

export default function LottoPicker() {
  const { session } = useAuth()
  const isAdmin = !!session
  const queryClient = useQueryClient()

  const { data: rosters, isLoading } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })

  const [rosterId, setRosterId] = useState('')
  const roster = rosters?.find((r) => r.id === rosterId)
  const students = roster?.students ?? []

  const ballPositions = useMemo(() => {
    return students.map(() => randomPointInDisk(CAGE_SCATTER_RADIUS))
  }, [roster?.id, students.length])

  const fillerCount = Math.max(0, MIN_CAGE_BALLS - students.length)
  const fillerPositions = useMemo(() => {
    return Array.from({ length: fillerCount }, () => randomPointInDisk(CAGE_SCATTER_RADIUS))
  }, [roster?.id, fillerCount])

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true)
  const [drawn, setDrawn] = useState(new Set())
  const [spinning, setSpinning] = useState(false)
  const [spinRound, setSpinRound] = useState(0)
  const [result, setResult] = useState(null)

  const [managing, setManaging] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [mode, setMode] = useState('manual')
  const [parsing, setParsing] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['student_rosters'] })
  const createMutation = useMutation({ mutationFn: createRoster, onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, updates }) => updateRoster(id, updates), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: deleteRoster, onSuccess: invalidate })

  function selectRoster(id) {
    setRosterId(id)
    setDrawn(new Set())
    setResult(null)
  }

  function resetDraw() {
    setDrawn(new Set())
    setResult(null)
  }

  function spin() {
    if (spinning || students.length === 0) return
    const pool = students.map((_, i) => i).filter((i) => (removeAfterDraw ? !drawn.has(i) : true))
    if (pool.length === 0) return
    setSpinning(true)
    setResult(null)
    setSpinRound((r) => r + 1)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    setTimeout(() => {
      setResult({ index: idx, name: students[idx] })
      if (removeAfterDraw) setDrawn((prev) => new Set(prev).add(idx))
      setSpinning(false)
    }, SPIN_DURATION_MS)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setMode('manual')
    setManaging(true)
  }

  function openEdit(r) {
    setEditingId(r.id)
    setForm({ name: r.name, studentsText: r.students.join('\n') })
    setMode('manual')
    setManaging(true)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    try {
      const names = await parseRosterFile(file)
      setForm((f) => ({ ...f, studentsText: names.join('\n') }))
    } finally {
      setParsing(false)
      e.target.value = ''
    }
  }

  function handleSave(e) {
    e.preventDefault()
    const studentsList = form.studentsText.split('\n').map((s) => s.trim()).filter(Boolean)
    const payload = { name: form.name, students: studentsList }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload })
    } else {
      createMutation.mutate(payload)
    }
    setManaging(false)
  }

  function handleDelete(id) {
    deleteMutation.mutate(id)
    if (id === rosterId) selectRoster('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1">
          <Label>Danh sách lớp</Label>
          <Select value={rosterId} onValueChange={selectRoster}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn danh sách...">
                {() => (roster ? `${roster.name} (${roster.students.length})` : 'Chọn danh sách...')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(rosters ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.students.length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <>
            <Button type="button" variant="outline" onClick={openCreate}>
              <Plus className="size-4" /> Danh sách mới
            </Button>
            {roster && (
              <>
                <Button type="button" variant="outline" size="icon" onClick={() => openEdit(roster)}>
                  <Pencil className="size-4" />
                </Button>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(roster.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {managing && (
        <form onSubmit={handleSave} className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="roster-name">Tên danh sách</Label>
            <Input
              id="roster-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: 8A1"
              required
            />
          </div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
              <TabsTrigger value="file">Tải file lên</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="pt-2">
              <Input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFile} disabled={parsing} />
              <p className="mt-1 text-xs text-muted-foreground">
                {parsing ? 'Đang đọc file...' : 'Lấy cột đầu tiên của mỗi dòng làm tên học sinh. Kiểm tra/sửa lại danh sách bên dưới trước khi lưu.'}
              </p>
            </TabsContent>
          </Tabs>
          <div className="space-y-1">
            <Label htmlFor="roster-students">Danh sách học sinh (mỗi tên 1 dòng)</Label>
            <Textarea
              id="roster-students"
              rows={8}
              value={form.studentsText}
              onChange={(e) => setForm({ ...form, studentsText: e.target.value })}
              placeholder={'Nguyễn Văn A\nTrần Thị B\n...'}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Lưu danh sách</Button>
            <Button type="button" variant="outline" onClick={() => setManaging(false)}>Huỷ</Button>
          </div>
        </form>
      )}

      {!managing && (
        <>
          {!roster && (
            <p className="text-muted-foreground">
              {isLoading ? 'Đang tải...' : 'Chọn 1 danh sách lớp để bắt đầu quay.'}
            </p>
          )}

          {roster && students.length === 0 && (
            <p className="text-muted-foreground">Danh sách này chưa có học sinh nào.</p>
          )}

          {roster && students.length > 0 && (
            <div className="space-y-4">
              <label className="flex w-fit items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={removeAfterDraw}
                  onChange={(e) => setRemoveAfterDraw(e.target.checked)}
                />
                Loại tên đã gọi khỏi lượt quay tiếp theo
              </label>

              <div className="relative mx-auto h-[250px] w-[300px]">
                <LottoCageStand />
                <div
                  key={spinRound}
                  style={{ transformOrigin: `${CAGE_CENTER.x}px ${CAGE_CENTER.y}px` }}
                  className={cn('absolute inset-0', spinning && 'animate-lotto-spin')}
                >
                  <LottoCageSphere />
                  {fillerPositions.map((pos, i) => (
                    <span
                      key={`filler-${i}`}
                      style={{
                        left: CAGE_CENTER.x + pos.x,
                        top: CAGE_CENTER.y + pos.y,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute size-4 shrink-0 rounded-full bg-white/10"
                    />
                  ))}
                  {students.map((_, i) => {
                    if (result?.index === i) return null
                    const isDrawn = drawn.has(i)
                    const pos = ballPositions[i] ?? { x: 0, y: 0 }
                    return (
                      <span
                        key={i}
                        style={{
                          left: CAGE_CENTER.x + pos.x,
                          top: CAGE_CENTER.y + pos.y,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={cn(
                          'absolute flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md shadow-black/30',
                          isDrawn ? 'bg-white/10 text-white/30' : BALL_COLORS[i % BALL_COLORS.length]
                        )}
                      >
                        {i + 1}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-center gap-2">
                <Button onClick={spin} disabled={spinning}>
                  <Dices className="size-4" /> {spinning ? 'Đang quay...' : 'Quay số'}
                </Button>
                <Button variant="outline" onClick={resetDraw}>Reset</Button>
              </div>

              {result && (
                <div className="mx-auto flex w-fit flex-col items-center gap-2">
                  <span
                    className={cn(
                      'flex size-16 shrink-0 animate-in items-center justify-center rounded-full text-xl font-bold text-white shadow-lg shadow-black/40 zoom-in-50 slide-in-from-top-10 duration-500',
                      BALL_COLORS[result.index % BALL_COLORS.length]
                    )}
                  >
                    {result.index + 1}
                  </span>
                  <span className="animate-in rounded-xl border-t-4 border-t-orange-400 bg-card px-6 py-2 text-xl font-bold shadow-lg fade-in-0 duration-500">
                    {result.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
