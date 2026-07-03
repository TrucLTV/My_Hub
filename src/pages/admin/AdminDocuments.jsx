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
  subject: '',
  grade_level: '',
  material_type: '',
  tags: '',
  visibility: 'private',
  file_url: '',
  file_type: '',
  sort_order: '',
}

function labelFor(dict, key) {
  return dict?.[key]?.label ?? key
}

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa tải</Badge>
  return <Badge variant="secondary">Private</Badge>
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
      visibility: fieldsToVisibility(doc),
      file_url: doc.file_url ?? '',
      file_type: doc.file_type ?? '',
      sort_order: doc.sort_order ?? '',
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
      ...visibilityToFields(form.visibility),
      file_url: fileUrl,
      file_type: fileType,
      sort_order: form.sort_order === '' ? null : Number(form.sort_order),
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload })
    } else {
      createMutation.mutate(payload)
    }
    setOpen(false)
  }

  async function handleDownload(path, filename) {
    const url = await getDocumentSignedUrl(path, filename)
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
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {doc.sort_order != null && <Badge variant="outline">#{doc.sort_order}</Badge>}
              <p className="font-medium">{doc.title}</p>
              <VisibilityBadge row={doc} />
            </div>
            {(doc.category || doc.subject || doc.grade_level || doc.material_type) && (
              <div className="flex flex-wrap gap-1">
                {doc.category && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY, doc.category)}</Badge>}
                {doc.subject && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children, doc.subject)}</Badge>}
                {doc.grade_level && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children, doc.grade_level)}</Badge>}
                {doc.material_type && <Badge variant="secondary">{labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children?.[doc.grade_level]?.children, doc.material_type)}</Badge>}
              </div>
            )}
            {doc.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
            {doc.file_url && (
              <Button variant="link" size="sm" className="px-0 h-auto block" onClick={() => handleDownload(doc.file_url, `${doc.title}.${doc.file_type}`)}>
                Tải xuống ({doc.file_type})
              </Button>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(doc.id)}>Xóa</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
