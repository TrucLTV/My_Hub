import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
  getDocumentSignedUrl,
} from '@/lib/queries/documents'
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

const emptyForm = {
  title: '',
  description: '',
  category: '',
  subject: '',
  grade_level: '',
  tags: '',
  is_public: false,
  file_url: '',
  file_type: '',
}

export default function AdminDocuments() {
  const queryClient = useQueryClient()
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: fetchAllDocuments,
  })

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['documents'] })

  const createMutation = useMutation({ mutationFn: createDocument, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateDocument(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFile(null)
    setOpen(true)
  }

  function openEdit(doc) {
    setEditingId(doc.id)
    setForm({
      title: doc.title,
      description: doc.description ?? '',
      category: doc.category ?? '',
      subject: doc.subject ?? '',
      grade_level: doc.grade_level ?? '',
      tags: (doc.tags ?? []).join(', '),
      is_public: doc.is_public,
      file_url: doc.file_url ?? '',
      file_type: doc.file_type ?? '',
    })
    setFile(null)
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let fileUrl = form.file_url
    let fileType = form.file_type
    if (file) {
      setUploading(true)
      try {
        fileUrl = await uploadDocumentFile(file)
        fileType = file.name.split('.').pop()
      } finally {
        setUploading(false)
      }
    }
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      subject: form.subject,
      grade_level: form.grade_level,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_public: form.is_public,
      file_url: fileUrl,
      file_type: fileType,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload })
    } else {
      createMutation.mutate(payload)
    }
    setOpen(false)
  }

  async function handleDownload(path) {
    const url = await getDocumentSignedUrl(path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý tài liệu</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Tài liệu mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa tài liệu' : 'Tài liệu mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="subject">Môn học</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="grade_level">Lớp</Label>
                  <Input id="grade_level" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Danh mục</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="giao_an | giao_trinh | khac" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
                <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="file">File (.docx/.pdf/.xlsx)</Label>
                <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {form.file_url && !file && (
                  <p className="text-xs text-muted-foreground">Đã có file: {form.file_type}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input id="is_public" type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                <Label htmlFor="is_public">Công khai</Label>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? 'Đang tải file...' : 'Lưu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-md p-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{doc.title}</p>
                {doc.is_public ? <Badge>Public</Badge> : <Badge variant="secondary">Private</Badge>}
              </div>
              {doc.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
              {doc.file_url && (
                <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => handleDownload(doc.file_url)}>
                  Tải xuống ({doc.file_type})
                </Button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(doc.id)}>Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
