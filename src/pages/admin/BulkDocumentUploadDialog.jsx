import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileArchive } from 'lucide-react'
import { uploadDocumentFile, bulkCreateDocuments } from '@/lib/queries/documents'
import { extractZipEntries } from '@/lib/parseZipFile'
import { DOCUMENT_TAXONOMY } from '@/lib/documentTaxonomy'
import { VISIBILITY_OPTIONS, visibilityToFields } from '@/lib/visibility'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const emptyForm = { category: '', subject: '', grade_level: '', material_type: '', tags: '', visibility: 'private' }

export default function BulkDocumentUploadDialog() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [zipEntries, setZipEntries] = useState(null)
  const [parseError, setParseError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const subjectOptions = form.category ? DOCUMENT_TAXONOMY[form.category]?.children : null
  const gradeOptions = form.subject ? subjectOptions?.[form.subject]?.children : null
  const materialOptions = form.grade_level ? gradeOptions?.[form.grade_level]?.children : null

  function resetState() {
    setForm(emptyForm)
    setZipEntries(null)
    setParseError('')
    setProgress({ done: 0, total: 0 })
  }

  async function handleZipPick(e) {
    const zipFile = e.target.files?.[0]
    if (!zipFile) return
    setParseError('')
    setZipEntries(null)
    setParsing(true)
    try {
      const entries = await extractZipEntries(zipFile)
      if (entries.length === 0) setParseError('Không tìm thấy file nào trong zip này.')
      setZipEntries(entries)
    } catch {
      setParseError('Không đọc được file zip. Kiểm tra lại file.')
    } finally {
      setParsing(false)
      e.target.value = ''
    }
  }

  async function handleBulkUpload() {
    if (!zipEntries || zipEntries.length === 0) return
    setUploading(true)
    setProgress({ done: 0, total: zipEntries.length })
    try {
      const payloads = []
      for (const entry of zipEntries) {
        const path = await uploadDocumentFile(entry.file)
        payloads.push({
          title: entry.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category: form.category || null,
          subject: form.subject || null,
          grade_level: form.grade_level || null,
          material_type: form.material_type || null,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          ...visibilityToFields(form.visibility),
          file_url: path,
          file_type: entry.name.split('.').pop(),
          sort_order: null,
        })
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
      await bulkCreateDocuments(payloads)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setOpen(false)
      resetState()
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v && !uploading) resetState()
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <FileArchive className="size-4" /> Tải zip nhiều file
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tải lên nhiều file (zip)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label htmlFor="zip-file">Chọn file zip</Label>
            <Input id="zip-file" type="file" accept=".zip" onChange={handleZipPick} disabled={parsing || uploading} />
            {parsing && <p className="text-xs text-muted-foreground">Đang đọc file zip...</p>}
            {parseError && <p className="text-xs text-destructive">{parseError}</p>}
          </div>

          {zipEntries && zipEntries.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{zipEntries.length} file sẽ được tải lên:</p>
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
                {zipEntries.map((entry, i) => (
                  <li key={i} className="truncate">{entry.name}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Tiêu đề mỗi tài liệu lấy theo tên file. Các thông tin bên dưới sẽ áp dụng chung cho tất cả file.
          </p>

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
              <Select value={form.grade_level} onValueChange={(v) => setForm({ ...form, grade_level: v, material_type: '' })}>
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
            <Label htmlFor="bulk-tags">Tags (cách nhau bởi dấu phẩy)</Label>
            <Input id="bulk-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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

          <Button
            className="w-full"
            disabled={!zipEntries || zipEntries.length === 0 || uploading}
            onClick={handleBulkUpload}
          >
            {uploading
              ? `Đang tải lên... (${progress.done}/${progress.total})`
              : `Tải lên tất cả${zipEntries?.length ? ` (${zipEntries.length} file)` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
