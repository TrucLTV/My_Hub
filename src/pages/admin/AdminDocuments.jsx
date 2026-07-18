import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, Globe, Lock, EyeOff, FolderOpen, ShieldCheck } from 'lucide-react'
import {
  fetchAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
  getDocumentSignedUrl,
  watermarkExistingPublicDocuments,
} from '@/lib/queries/documents'
import { DOCUMENT_TAXONOMY, getTaxonomyNode, pathToFilters } from '@/lib/documentTaxonomy'
import BulkDocumentUploadDialog from '@/pages/admin/BulkDocumentUploadDialog'
import AccentCard from '@/components/AccentCard'
import SearchBar from '@/components/SearchBar'
import { cn } from '@/lib/utils'
import { VISIBILITY_OPTIONS, visibilityToFields, fieldsToVisibility } from '@/lib/visibility'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const UNCLASSIFIED_LABEL = 'Chưa phân loại'

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

function groupPathFor(doc) {
  const parts = []
  if (doc.category) parts.push(labelFor(DOCUMENT_TAXONOMY, doc.category))
  if (doc.subject) parts.push(labelFor(DOCUMENT_TAXONOMY[doc.category]?.children, doc.subject))
  if (doc.grade_level) parts.push(labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children, doc.grade_level))
  if (doc.material_type) {
    parts.push(labelFor(DOCUMENT_TAXONOMY[doc.category]?.children?.[doc.subject]?.children?.[doc.grade_level]?.children, doc.material_type))
  }
  return parts.length ? parts.join(' › ') : UNCLASSIFIED_LABEL
}

function groupDocuments(documents) {
  const map = new Map()
  for (const doc of documents) {
    const key = groupPathFor(doc)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(doc)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'))
}

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa tải</Badge>
  return <Badge variant="secondary">Private</Badge>
}

function StatPill({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
  )
}

function matchesSearch(doc, query) {
  if (!query) return true
  const q = query.toLowerCase()
  if (doc.title.toLowerCase().includes(q)) return true
  return (doc.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
}

// Danh sách môn phẳng để chọn ở dropdown duyệt tài liệu (giống trang public),
// bất kể môn đó nằm ở "Giảng dạy" hay là "Học tập".
const SUBJECT_GROUPS = [
  { value: 'tin_hoc', label: 'Tin học', path: ['giang_day', 'tin_hoc'] },
  { value: 'hdtn', label: 'HĐTN', path: ['giang_day', 'hdtn'] },
  { value: 'lap_trinh', label: 'Lập trình', path: ['giang_day', 'lap_trinh'] },
  { value: 'robot', label: 'Robot', path: ['giang_day', 'robot'] },
  { value: 'hoc_tap', label: 'Học tập', path: ['hoc_tap'] },
  { value: 'unclassified', label: UNCLASSIFIED_LABEL, path: null },
]

function docsForPath(documents, path) {
  if (!path) return documents.filter((d) => !d.category)
  const filters = pathToFilters(path)
  return documents.filter((doc) => Object.entries(filters).every(([k, v]) => doc[k] === v))
}

function DocumentCard({ doc, onEdit, onDelete, onDownload }) {
  return (
    <AccentCard accent="emerald" className="cursor-default gap-2 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {doc.sort_order != null && <Badge variant="outline">#{doc.sort_order}</Badge>}
        <p className="font-medium">{doc.title}</p>
        <VisibilityBadge row={doc} />
      </div>
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}
      {doc.file_url && (
        <Button variant="link" size="sm" className="px-0 h-auto block" onClick={() => onDownload(doc.file_url, `${doc.title}.${doc.file_type}`)}>
          Tải xuống ({doc.file_type})
        </Button>
      )}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => onEdit(doc)}>Sửa</Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id)}>Xóa</Button>
      </div>
    </AccentCard>
  )
}

// Duyệt tài liệu theo môn -> khối -> nhóm bài, giống cách trang public tổ chức thư mục.
function SubjectBrowser({ documents, onEdit, onDelete, onDownload }) {
  const [path, setPath] = useState(null)

  if (path === null) {
    return (
      <div className="max-w-sm space-y-1">
        <Label>Chọn môn để xem tài liệu</Label>
        <Select
          value=""
          onValueChange={(v) => {
            const group = SUBJECT_GROUPS.find((g) => g.value === v)
            setPath(group.path ?? 'unclassified')
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn môn..." />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_GROUPS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label} — {docsForPath(documents, g.path).length} tài liệu
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (path === 'unclassified') {
    const docs = docsForPath(documents, null)
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setPath(null)}>← Đổi môn khác</Button>
        <p className="text-sm font-medium text-muted-foreground">{UNCLASSIFIED_LABEL} — {docs.length} tài liệu</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onEdit={onEdit} onDelete={onDelete} onDownload={onDownload} />
          ))}
        </div>
      </div>
    )
  }

  const node = getTaxonomyNode(path)
  const isLeaf = !node?.children
  const crumbLabel = path.map((_, i) => getTaxonomyNode(path.slice(0, i + 1))?.label).join(' › ')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setPath(null)}>← Đổi môn khác</Button>
        {path.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setPath(path.slice(0, -1))}>
            ← Quay lại {getTaxonomyNode(path.slice(0, -1))?.label}
          </Button>
        )}
        <span className="text-sm text-muted-foreground">{crumbLabel}</span>
      </div>

      {isLeaf ? (
        <>
          <p className="text-sm font-medium text-muted-foreground">{docsForPath(documents, path).length} tài liệu</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {docsForPath(documents, path).map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onEdit={onEdit} onDelete={onDelete} onDownload={onDownload} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 py-2">
          {Object.entries(node.children).map(([gradeKey, gradeNode]) => (
            <div key={gradeKey} className="w-40 space-y-3">
              <h3 className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">{gradeNode.label}</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(gradeNode.children).map(([materialKey, materialNode]) => (
                  <AccentCard
                    key={materialKey}
                    accent="emerald"
                    onClick={() => setPath([...path, gradeKey, materialKey])}
                    className="cursor-pointer items-center gap-2 p-4 text-center"
                  >
                    <FolderOpen className="size-8 text-emerald-300" />
                    <p className="text-sm font-medium">{materialNode.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {docsForPath(documents, [...path, gradeKey, materialKey]).length} tài liệu
                    </p>
                  </AccentCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminDocuments() {
  const navigate = useNavigate()
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
  const [search, setSearch] = useState('')
  const [manualOpenGroups, setManualOpenGroups] = useState([])
  const [watermarking, setWatermarking] = useState(false)
  const [watermarkResult, setWatermarkResult] = useState(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['documents'] })

  async function handleWatermarkExisting() {
    setWatermarking(true)
    setWatermarkResult(null)
    try {
      const result = await watermarkExistingPublicDocuments((progress) => setWatermarkResult(progress))
      setWatermarkResult(result)
    } finally {
      setWatermarking(false)
    }
  }

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

  const publicCount = documents.filter((d) => d.is_public).length
  const lockedCount = documents.filter((d) => d.is_locked).length
  const privateCount = documents.length - publicCount - lockedCount
  const unclassifiedCount = documents.filter((d) => !d.category).length

  const isSearching = search.trim().length > 0
  const filteredDocuments = documents.filter((doc) => matchesSearch(doc, search.trim()))
  const groups = groupDocuments(filteredDocuments)
  const openGroups = isSearching ? groups.map(([label]) => label) : manualOpenGroups

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={() => navigate('/')}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý tài liệu</h1>
        <div className="flex gap-2">
          <BulkDocumentUploadDialog />
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại">
                      {() => DOCUMENT_TAXONOMY[form.category]?.label ?? 'Chọn loại'}
                    </SelectValue>
                  </SelectTrigger>
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn môn">
                        {() => subjectOptions[form.subject]?.label ?? 'Chọn môn'}
                      </SelectValue>
                    </SelectTrigger>
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn khối">
                        {() => gradeOptions[form.grade_level]?.label ?? 'Chọn khối'}
                      </SelectValue>
                    </SelectTrigger>
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn nhóm">
                        {() => materialOptions[form.material_type]?.label ?? 'Chọn nhóm'}
                      </SelectValue>
                    </SelectTrigger>
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
      </div>

      <div className="flex flex-wrap gap-2">
        <StatPill icon={FileText} label="Tổng số" count={documents.length} />
        <StatPill icon={Globe} label="Công khai" count={publicCount} />
        <StatPill icon={Lock} label="Khóa tải" count={lockedCount} />
        <StatPill icon={EyeOff} label="Ẩn hoàn toàn" count={privateCount} />
        {unclassifiedCount > 0 && (
          <StatPill icon={FolderOpen} label="Chưa phân loại" count={unclassifiedCount} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleWatermarkExisting} disabled={watermarking}>
          <ShieldCheck className="size-4" />
          {watermarking
            ? `Đang đánh dấu... (${watermarkResult?.done ?? 0}/${watermarkResult?.total ?? '?'})`
            : 'Đánh dấu ẩn cho DOCX/XLSX/PPTX/HTML công khai hiện có'}
        </Button>
        {!watermarking && watermarkResult && (
          <span className="text-sm text-muted-foreground">
            Xong: {watermarkResult.done} vừa đánh dấu, {watermarkResult.skipped} đã có sẵn, {watermarkResult.failed} lỗi
            (tổng {watermarkResult.total}).
          </span>
        )}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên tài liệu hoặc tag..." />

      {isSearching ? (
        <>
          {groups.length === 0 && (
            <p className="text-muted-foreground">Không tìm thấy tài liệu nào khớp với "{search}".</p>
          )}
          <Accordion value={openGroups} onValueChange={setManualOpenGroups} className="space-y-3">
            {groups.map(([groupLabel, docs]) => (
              <AccordionItem
                key={groupLabel}
                value={groupLabel}
                className={cn(
                  'rounded-lg border px-4 shadow-sm',
                  groupLabel === UNCLASSIFIED_LABEL ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'
                )}
              >
                <AccordionTrigger>
                  <span className="flex flex-1 items-baseline justify-between gap-2">
                    <span className={cn(groupLabel === UNCLASSIFIED_LABEL && 'text-amber-500')}>{groupLabel}</span>
                    <span className="text-xs font-normal text-muted-foreground">{docs.length} tài liệu</span>
                  </span>
                </AccordionTrigger>
                <AccordionPanel>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {docs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onEdit={openEdit}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      ) : (
        <SubjectBrowser
          documents={documents}
          onEdit={openEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
