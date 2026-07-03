import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllMedia, createMedia, updateMedia, deleteMedia, uploadCoverImage } from '@/lib/queries/media'
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

const emptyForm = {
  title: '',
  type: 'movie',
  status: 'backlog',
  rating: '',
  review: '',
  progress: '',
  genre: '',
  is_public: false,
  cover_url: '',
}

export default function AdminMedia() {
  const queryClient = useQueryClient()
  const { data: items, isLoading, error } = useQuery({ queryKey: ['media_tracker', 'all'], queryFn: fetchAllMedia })

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['media_tracker'] })

  const createMutation = useMutation({ mutationFn: createMedia, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateMedia(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteMedia, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setCoverFile(null)
    setOpen(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      type: item.type ?? 'movie',
      status: item.status ?? 'backlog',
      rating: item.rating ?? '',
      review: item.review ?? '',
      progress: item.progress ?? '',
      genre: (item.genre ?? []).join(', '),
      is_public: item.is_public,
      cover_url: item.cover_url ?? '',
    })
    setCoverFile(null)
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let coverUrl = form.cover_url
    if (coverFile) {
      setUploading(true)
      try {
        coverUrl = await uploadCoverImage(coverFile)
      } finally {
        setUploading(false)
      }
    }
    const payload = {
      title: form.title,
      type: form.type,
      status: form.status,
      rating: form.rating === '' ? null : Number(form.rating),
      review: form.review,
      progress: form.progress,
      genre: form.genre.split(',').map((t) => t.trim()).filter(Boolean),
      is_public: form.is_public,
      cover_url: coverUrl,
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
        <h1 className="text-xl font-semibold">Quản lý giải trí</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Mục mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa mục' : 'Mục mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Loại</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Phim</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Chưa xem</SelectItem>
                      <SelectItem value="in_progress">Đang xem</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="dropped">Bỏ dở</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rating">Rating (1-10)</Label>
                  <Input id="rating" type="number" min="1" max="10" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="progress">Tiến độ</Label>
                  <Input id="progress" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} placeholder="vd: Chapter 5 hoặc 60%" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="review">Review</Label>
                <Textarea id="review" rows={3} value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="genre">Thể loại (cách nhau bởi dấu phẩy)</Label>
                <Input id="genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cover">Ảnh cover</Label>
                <Input id="cover" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                {form.cover_url && !coverFile && (
                  <img src={form.cover_url} alt="cover hiện tại" className="h-24 mt-1 rounded" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input id="is_public" type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                <Label htmlFor="is_public">Công khai</Label>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Đang tải ảnh...' : 'Lưu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="border rounded-md overflow-hidden">
            {item.cover_url && <img src={item.cover_url} alt={item.title} className="w-full aspect-[2/3] object-cover" />}
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {item.is_public ? <Badge>Public</Badge> : <Badge variant="secondary">Private</Badge>}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Sửa</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Xóa</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
