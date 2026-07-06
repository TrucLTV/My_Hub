import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchRosters, createRoster, updateRoster, deleteRoster } from '@/lib/queries/rosters'
import { parseRosterFile } from '@/lib/parseRosterFile'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const emptyForm = { name: '', studentsText: '' }

// Dùng chung cho các mini game "Gọi tên ngẫu nhiên": chọn/quản lý danh sách lớp.
// Bản thân component không biết gì về trò chơi cụ thể — chỉ điều khiển rosterId.
export default function RosterPicker({ rosterId, onRosterIdChange }) {
  const { session } = useAuth()
  const isAdmin = !!session
  const queryClient = useQueryClient()

  const { data: rosters, isLoading } = useQuery({ queryKey: ['student_rosters'], queryFn: fetchRosters })
  const roster = rosters?.find((r) => r.id === rosterId)

  const [managing, setManaging] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [mode, setMode] = useState('manual')
  const [parsing, setParsing] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['student_rosters'] })
  const createMutation = useMutation({ mutationFn: createRoster, onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, updates }) => updateRoster(id, updates), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: deleteRoster, onSuccess: invalidate })

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
    if (id === rosterId) onRosterIdChange('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1">
          <Label>Danh sách lớp</Label>
          <Select value={rosterId} onValueChange={onRosterIdChange}>
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

      {!managing && !roster && (
        <p className="text-muted-foreground">
          {isLoading ? 'Đang tải...' : 'Chọn 1 danh sách lớp để bắt đầu.'}
        </p>
      )}
    </div>
  )
}
