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
import { DOCUMENT_TAXONOMY } from '@/lib/documentTaxonomy'
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
  subject: '',
  grade_level: '',
  material_type: '',
  tags: '',
  is_public: false,
  file_url: '',
  file_type: '',
}

function labelFor(dict, key) {
  return dict?.[key]?.label ?? key
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
      material_type: doc.material_type ?? '',
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
      category: form.category || null,
      subject: form.subject || null,
      grade_level: form.grade_level || null,
      material_type: form.material_type || null,
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

  const subjectOptions = form.category ? DOCUMENT_TAXONOMY[form.category]?.children : null
  const gradeOptions = form.subject ? subjectOptions?.[form.subject]?.children : null
  const materialOptions = form.grade_level ? gradeOptions?.[form.grade_level]?.children : null

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

              <div className="space-y-1">
                <Label>Loại</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v, subject: '', grade_level: '', material_type: '' })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TAXONOMY).map(([key, node]) => (
                      <SelectItem key={key} value={key}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subjectOptions && (
                <div className="space-y-1">
                  <Label>Môn</Label>
                  <Select
                    value={form.subject}
                    onValueChange={(v) => setForm({ ...form, subject: v, grade_level: '', material_type: '' })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(subjectOptions).map(([key, node]) => (
                        <SelectItem key={key} value={key}>{node.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {gradeOptions && (
                <div className="space-y-1">
                  <Label>Khối</Label>
                  <Select
                    value={form.grade_level}
                    onValueChange={(v) => setForm({ ...form, grade_level: v, material_type: '' })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn khối" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(gradeOptions).map(([key, node]) => (
                        <SelectItem key={key} value={key}>{node.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {materialOptions && (
                <div className="space-y-1">
                  <Label>Nhóm tài liệu</Label>
                  <Select value={form.material_type} onValueChange={(v) => setForm({ ...form, material_type: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn nhóm" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(materialOptions).map(([key, node]) => (
                        <SelectItem key={key} value={key}>{node.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
              {(doc.category || doc.subject || doc.grade_level || doc.material_type) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {doc.category && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY, doc.category)}</Badge>}
                  {doc.subject && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children, doc.subject)}</Badge>}
                  {doc.grade_level && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children, doc.grade_level)}</Badge>}
                  {doc.material_type && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children?.[doc.grade_level]?.children, doc.material_type)}</Badge>}
                </div>
              )}
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
