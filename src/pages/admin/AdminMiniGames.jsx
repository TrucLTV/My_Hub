import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllMiniGames,
  createMiniGame,
  updateMiniGame,
  deleteMiniGame,
  uploadMiniGameFile,
} from '@/lib/queries/miniGames'
import { MINI_GAME_CATEGORIES, DELIVERY_TYPES } from '@/lib/miniGameTaxonomy'
import { MINI_GAME_TOOLS } from '@/lib/miniGameTools'
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

const emptyForm = {
  title: '',
  description: '',
  category: '',
  delivery_type: '',
  tool_key: '',
  file_url: '',
  file_type: '',
  external_url: '',
  tags: '',
  visibility: 'private',
  sort_order: '',
}

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa tải</Badge>
  return <Badge variant="secondary">Private</Badge>
}

export default function AdminMiniGames() {
  const queryClient = useQueryClient()
  const { data: games, isLoading, error } = useQuery({ queryKey: ['mini_games', 'all'], queryFn: fetchAllMiniGames })

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mini_games'] })

  const createMutation = useMutation({ mutationFn: createMiniGame, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateMiniGame(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteMiniGame, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFile(null)
    setOpen(true)
  }

  function openEdit(game) {
    setEditingId(game.id)
    setForm({
      title: game.title,
      description: game.description ?? '',
      category: game.category ?? '',
      delivery_type: game.delivery_type ?? '',
      tool_key: game.tool_key ?? '',
      file_url: game.file_url ?? '',
      file_type: game.file_type ?? '',
      external_url: game.external_url ?? '',
      tags: (game.tags ?? []).join(', '),
      visibility: fieldsToVisibility(game),
      sort_order: game.sort_order ?? '',
    })
    setFile(null)
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let fileUrl = form.file_url
    let fileType = form.file_type
    if (form.delivery_type === 'downloadable' && file) {
      setUploading(true)
      try {
        fileUrl = await uploadMiniGameFile(file)
        fileType = file.name.split('.').pop()
      } finally {
        setUploading(false)
      }
    }
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      delivery_type: form.delivery_type,
      tool_key: form.delivery_type === 'web_tool' ? form.tool_key || null : null,
      file_url: form.delivery_type === 'downloadable' ? fileUrl || null : null,
      file_type: form.delivery_type === 'downloadable' ? fileType || null : null,
      external_url: form.delivery_type === 'external_link' ? form.external_url || null : null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...visibilityToFields(form.visibility),
      sort_order: form.sort_order === '' ? null : Number(form.sort_order),
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

  const toolEntries = Object.entries(MINI_GAME_TOOLS)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý mini game</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Mini game mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa mini game' : 'Mini game mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sort_order">Thứ tự</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    placeholder="1, 2, 3..."
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Mô tả / hướng dẫn</Label>
                <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="space-y-1">
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MINI_GAME_CATEGORIES).map(([key, node]) => (
                      <SelectItem key={key} value={key}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Dạng nội dung</Label>
                <Select
                  value={form.delivery_type}
                  onValueChange={(v) => setForm({ ...form, delivery_type: v })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn dạng nội dung" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DELIVERY_TYPES).map(([key, node]) => (
                      <SelectItem key={key} value={key}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.delivery_type === 'web_tool' && (
                <div className="space-y-1">
                  <Label>Công cụ</Label>
                  <Select value={form.tool_key} onValueChange={(v) => setForm({ ...form, tool_key: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn công cụ" /></SelectTrigger>
                    <SelectContent>
                      {toolEntries.length === 0 && (
                        <SelectItem value="__none" disabled>Chưa có công cụ nào được lập trình</SelectItem>
                      )}
                      {toolEntries.map(([key, tool]) => (
                        <SelectItem key={key} value={key}>{tool.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.delivery_type === 'downloadable' && (
                <div className="space-y-1">
                  <Label htmlFor="file">File trò chơi</Label>
                  <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  {form.file_url && !file && (
                    <p className="text-xs text-muted-foreground">Đã có file: {form.file_type}</p>
                  )}
                </div>
              )}

              {form.delivery_type === 'external_link' && (
                <div className="space-y-1">
                  <Label htmlFor="external_url">URL</Label>
                  <Input
                    id="external_url"
                    type="url"
                    placeholder="https://..."
                    value={form.external_url}
                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
                <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Hiển thị</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <div key={game.id} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {game.sort_order != null && <Badge variant="outline">#{game.sort_order}</Badge>}
              <p className="font-medium">{game.title}</p>
              <VisibilityBadge row={game} />
            </div>
            <div className="flex flex-wrap gap-1">
              {game.category && <Badge variant="secondary">{MINI_GAME_CATEGORIES[game.category]?.label}</Badge>}
              {game.delivery_type && <Badge variant="secondary">{DELIVERY_TYPES[game.delivery_type]?.label}</Badge>}
            </div>
            {game.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {game.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => openEdit(game)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(game.id)}>Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
