import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllNotes, createNote, updateNote, deleteNote } from '@/lib/queries/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const emptyForm = { title: '', content: '', tags: '', is_public: false }

export default function AdminNotes() {
  const queryClient = useQueryClient()
  const { data: notes, isLoading, error } = useQuery({ queryKey: ['notes', 'all'], queryFn: fetchAllNotes })

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notes'] })

  const createMutation = useMutation({ mutationFn: createNote, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateNote(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteNote, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(note) {
    setEditingId(note.id)
    setForm({
      title: note.title,
      content: note.content ?? '',
      tags: (note.tags ?? []).join(', '),
      is_public: note.is_public,
    })
    setOpen(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_public: form.is_public,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload })
    } else {
      createMutation.mutate(payload)
    }
    setOpen(false)
  }

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý ghi chú</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Ghi chú mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa ghi chú' : 'Ghi chú mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="content">Nội dung (markdown)</Label>
                <Textarea
                  id="content"
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_public"
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                />
                <Label htmlFor="is_public">Công khai</Label>
              </div>
              <Button type="submit" className="w-full">Lưu</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="border rounded-md p-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{note.title}</p>
                {note.is_public ? (
                  <Badge>Public</Badge>
                ) : (
                  <Badge variant="secondary">Private</Badge>
                )}
              </div>
              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(note)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(note.id)}>Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
