import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllEntertainment,
  createEntertainmentItem,
  updateEntertainmentItem,
  deleteEntertainmentItem,
  uploadEntertainmentMedia,
} from '@/lib/queries/entertainment'
import { ENTERTAINMENT_CATEGORIES, CONTENT_TYPES, getCategory, getContentType } from '@/lib/entertainmentTaxonomy'
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

const MEDIA_SOURCES = [
  { value: 'upload', label: 'Tải file lên' },
  { value: 'link', label: 'Link ngoài (YouTube, Pinterest...)' },
]

const emptyForm = {
  category: ENTERTAINMENT_CATEGORIES[0].key,
  content_type: 'article',
  title: '',
  description: '',
  body: '',
  media_kind: 'image',
  media_source: 'upload',
  media_url: '',
  cover_url: '',
  tags: '',
  visibility: 'private',
}

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa</Badge>
  return <Badge variant="secondary">Private</Badge>
}

export default function AdminEntertainment() {
  const queryClient = useQueryClient()
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['entertainment_items', 'all'],
    queryFn: fetchAllEntertainment,
  })

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [mediaFile, setMediaFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['entertainment_items'] })

  const createMutation = useMutation({ mutationFn: createEntertainmentItem, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateEntertainmentItem(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteEntertainmentItem, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setMediaFile(null)
    setCoverFile(null)
    setOpen(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      category: item.category,
      content_type: item.content_type,
      title: item.title,
      description: item.description ?? '',
      body: item.body ?? '',
      media_kind: item.media_kind ?? 'image',
      media_source: item.media_kind === 'link' ? 'link' : 'upload',
      media_url: item.media_url ?? '',
      cover_url: item.cover_url ?? '',
      tags: (item.tags ?? []).join(', '),
      visibility: fieldsToVisibility(item),
    })
    setMediaFile(null)
    setCoverFile(null)
    setOpen(true)
  }

  function handleBodyFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, body: String(reader.result ?? '') }))
    reader.readAsText(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let mediaUrl = form.media_url
    let coverUrl = form.cover_url
    setUploading(true)
    try {
      if (form.content_type === 'media') {
        if (form.media_source === 'upload' && mediaFile) {
          mediaUrl = await uploadEntertainmentMedia(mediaFile)
        }
        if (coverFile) {
          coverUrl = await uploadEntertainmentMedia(coverFile)
        }
      }
    } finally {
      setUploading(false)
    }

    const payload = {
      category: form.category,
      content_type: form.content_type,
      title: form.title,
      description: form.description,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...visibilityToFields(form.visibility),
      ...(form.content_type === 'article'
        ? { body: form.body, media_kind: null, media_url: null, cover_url: null }
        : {
            body: null,
            media_kind: form.media_source === 'link' ? 'link' : form.media_kind,
            media_url: mediaUrl,
            cover_url: coverUrl,
          }),
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

  const visibleItems = categoryFilter === 'all' ? items : items.filter((i) => i.category === categoryFilter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Quản lý Giải trí</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Mục mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa mục' : 'Mục mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Danh mục</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{() => getCategory(form.category)?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ENTERTAINMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Loại nội dung</Label>
                  <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{() => getContentType(form.content_type)?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Mô tả ngắn</Label>
                <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {form.content_type === 'article' && (
                <div className="space-y-1">
                  <Label htmlFor="body_file">Nội dung (tải file .md)</Label>
                  <Input id="body_file" type="file" accept=".md,.markdown,text/markdown" onChange={handleBodyFile} />
                  {form.body && (
                    <Textarea
                      rows={10}
                      className="mt-1"
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Nội dung đọc được từ file .md — có thể chỉnh sửa trực tiếp ở đây"
                    />
                  )}
                </div>
              )}

              {form.content_type === 'media' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Nguồn</Label>
                      <Select value={form.media_source} onValueChange={(v) => setForm({ ...form, media_source: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue>{() => MEDIA_SOURCES.find((s) => s.value === form.media_source)?.label}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.media_source === 'upload' && (
                      <div className="space-y-1">
                        <Label>Loại file</Label>
                        <Select value={form.media_kind} onValueChange={(v) => setForm({ ...form, media_kind: v })}>
                          <SelectTrigger className="w-full">
                            <SelectValue>{() => (form.media_kind === 'video' ? 'Video' : 'Ảnh')}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Ảnh</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {form.media_source === 'upload' ? (
                    <div className="space-y-1">
                      <Label htmlFor="media_file">File ({form.media_kind === 'video' ? 'video' : 'ảnh'})</Label>
                      <Input
                        id="media_file"
                        type="file"
                        accept={form.media_kind === 'video' ? 'video/*' : 'image/*'}
                        onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                      />
                      {form.media_url && !mediaFile && <p className="text-xs text-muted-foreground">Đã có file, chọn file mới nếu muốn thay.</p>}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="media_url">URL</Label>
                      <Input
                        id="media_url"
                        value={form.media_url}
                        onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                        placeholder="https://..."
                        required={form.media_source === 'link'}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="cover">Ảnh thumbnail (tuỳ chọn)</Label>
                    <Input id="cover" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                    {form.cover_url && !coverFile && (
                      <img src={form.cover_url} alt="thumbnail hiện tại" className="h-20 mt-1 rounded" />
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
                <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Đang tải file...' : 'Lưu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setCategoryFilter('all')}
        >
          Tất cả
        </Badge>
        {ENTERTAINMENT_CATEGORIES.map((cat) => (
          <Badge
            key={cat.key}
            variant={categoryFilter === cat.key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(cat.key)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="border rounded-md overflow-hidden">
            {item.content_type === 'media' && (item.cover_url || (item.media_kind === 'image' && item.media_url)) && (
              <img src={item.cover_url || item.media_url} alt={item.title} className="w-full aspect-video object-cover" />
            )}
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <VisibilityBadge row={item} />
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">{getCategory(item.category)?.label}</Badge>
                <Badge variant="secondary" className="text-xs">{getContentType(item.content_type)?.label}</Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Sửa</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Xóa</Button>
              </div>
            </div>
          </div>
        ))}
        {!visibleItems.length && <p className="text-muted-foreground">Chưa có mục nào.</p>}
      </div>
    </div>
  )
}
