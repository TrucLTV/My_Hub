import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllResources, createResource, updateResource, deleteResource } from '@/lib/queries/resources'
import { VISIBILITY_OPTIONS, visibilityToFields, fieldsToVisibility } from '@/lib/visibility'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const emptyForm = { title: '', url: '', description: '', category: '', tags: '', visibility: 'private' }

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa tải</Badge>
  return <Badge variant="secondary">Private</Badge>
}

export default function AdminResources() {
  const queryClient = useQueryClient()
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'all'],
    queryFn: fetchAllResources,
  })

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resources'] })

  const createMutation = useMutation({ mutationFn: createResource, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateResource(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteResource, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(resource) {
    setEditingId(resource.id)
    setForm({
      title: resource.title,
      url: resource.url,
      description: resource.description ?? '',
      category: resource.category ?? '',
      tags: (resource.tags ?? []).join(', '),
      visibility: fieldsToVisibility(resource),
    })
    setOpen(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      url: form.url,
      description: form.description,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...visibilityToFields(form.visibility),
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
        <h1 className="text-xl font-semibold">Quản lý tài nguyên</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Tài nguyên mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa tài nguyên' : 'Tài nguyên mới'}</DialogTitle>
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
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Danh mục</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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
              <div className="space-y-1">
                <Label>Hiển thị</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {() => VISIBILITY_OPTIONS.find((opt) => opt.value === form.visibility)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Lưu</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {resources.map((resource) => (
          <div key={resource.id} className="border rounded-md p-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{resource.title}</p>
                <VisibilityBadge row={resource} />
              </div>
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                {resource.url}
              </a>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(resource)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(resource.id)}>Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
