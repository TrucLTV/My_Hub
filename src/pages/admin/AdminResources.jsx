import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllResources, createResource, updateResource, deleteResource } from '@/lib/queries/resources'
import { updateQuestionInResource, deleteQuestionFromResource } from '@/lib/queries/quizQuestions'
import { RESOURCE_SUBJECTS, RESOURCE_GRADES, QUESTION_TYPE_OPTIONS, DIFFICULTY_LEVEL_OPTIONS } from '@/lib/resourceTaxonomy'
import { isSelfHostedHtml, openSelfHostedHtml } from '@/lib/openSelfHostedHtml'
import { VISIBILITY_OPTIONS, visibilityToFields, fieldsToVisibility } from '@/lib/visibility'
import QuestionBank from '@/components/QuestionBank'
import EditQuestionDialog from '@/components/EditQuestionDialog'
import SearchBar from '@/components/SearchBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  url: '',
  description: '',
  subject: '',
  grade_level: '',
  topic: '',
  lesson: '',
  question_types: [],
  difficulty_levels: [],
  tags: '',
  visibility: 'private',
}

function VisibilityBadge({ row }) {
  const v = fieldsToVisibility(row)
  if (v === 'public') return <Badge>Public</Badge>
  if (v === 'locked') return <Badge variant="outline">Khóa tải</Badge>
  return <Badge variant="secondary">Private</Badge>
}

function CheckboxGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-1.5 text-sm select-none">
          <Checkbox checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} />
          {option}
        </label>
      ))}
    </div>
  )
}

function groupPathFor(resource) {
  const subjectLabel = resource.subject ? RESOURCE_SUBJECTS[resource.subject]?.label ?? resource.subject : null
  const gradeLabel = resource.grade_level ? RESOURCE_GRADES[resource.grade_level]?.label ?? resource.grade_level : null
  const parts = [subjectLabel, gradeLabel].filter(Boolean)
  return parts.length ? parts.join(' › ') : UNCLASSIFIED_LABEL
}

function groupResources(resources) {
  const map = new Map()
  for (const resource of resources) {
    const key = groupPathFor(resource)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(resource)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'))
}

function matchesSearch(resource, query) {
  if (!query) return true
  const q = query.toLowerCase()
  if (resource.title.toLowerCase().includes(q)) return true
  if (resource.topic?.toLowerCase().includes(q)) return true
  if (resource.lesson?.toLowerCase().includes(q)) return true
  return (resource.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
}

function ResourceRow({ resource, onEdit, onDelete }) {
  const [openError, setOpenError] = useState(null)
  const selfHosted = isSelfHostedHtml(resource.url)

  async function handleOpen(e) {
    if (!selfHosted) return
    e.preventDefault()
    setOpenError(null)
    try {
      await openSelfHostedHtml(resource.url)
    } catch (err) {
      setOpenError(err.message)
    }
  }

  return (
    <div className="rounded-md border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{resource.title}</p>
            <VisibilityBadge row={resource} />
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpen}
            className="text-sm text-primary underline break-all"
          >
            {resource.url}
          </a>
          {openError && <p className="text-xs text-destructive">{openError}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onEdit(resource)}>Sửa</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(resource.id)}>Xóa</Button>
        </div>
      </div>
      {(resource.topic || resource.lesson) && (
        <p className="text-sm text-muted-foreground">
          {[resource.topic, resource.lesson].filter(Boolean).join(' › ')}
        </p>
      )}
      {(resource.question_types?.length > 0 || resource.difficulty_levels?.length > 0 || resource.tags?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {resource.question_types?.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          {resource.difficulty_levels?.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
          {resource.tags?.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>
      )}
    </div>
  )
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
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState([])
  const [view, setView] = useState('questions')
  const [editingQuestion, setEditingQuestion] = useState(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['resources'] })

  const createMutation = useMutation({ mutationFn: createResource, onSuccess: invalidate })
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateResource(id, updates),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({ mutationFn: deleteResource, onSuccess: invalidate })

  const deleteQuestionMutation = useMutation({
    mutationFn: ({ resource, questionIndex }) => deleteQuestionFromResource(resource, questionIndex),
    onSuccess: invalidate,
  })

  function handleDeleteQuestion(q) {
    const resource = (resources ?? []).find((r) => r.id === q.resourceId)
    if (!resource) return
    if (!window.confirm(`Xóa câu hỏi "${(q.question ?? q.textWithBlanks ?? '').slice(0, 80)}"?`)) return
    deleteQuestionMutation.mutate({ resource, questionIndex: q.questionIndex })
  }

  async function handleSaveQuestion(newQuestionData) {
    const resource = (resources ?? []).find((r) => r.id === editingQuestion.resourceId)
    if (!resource) throw new Error('Không tìm thấy đề chứa câu hỏi này.')
    await updateQuestionInResource(resource, editingQuestion.questionIndex, newQuestionData)
    invalidate()
  }

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
      subject: resource.subject ?? '',
      grade_level: resource.grade_level ?? '',
      topic: resource.topic ?? '',
      lesson: resource.lesson ?? '',
      question_types: resource.question_types ?? [],
      difficulty_levels: resource.difficulty_levels ?? [],
      tags: (resource.tags ?? []).join(', '),
      visibility: fieldsToVisibility(resource),
    })
    setOpen(true)
  }

  function toggleQuestionType(t) {
    setForm((prev) => ({
      ...prev,
      question_types: prev.question_types.includes(t)
        ? prev.question_types.filter((x) => x !== t)
        : [...prev.question_types, t],
    }))
  }

  function toggleDifficultyLevel(l) {
    setForm((prev) => ({
      ...prev,
      difficulty_levels: prev.difficulty_levels.includes(l)
        ? prev.difficulty_levels.filter((x) => x !== l)
        : [...prev.difficulty_levels, l],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      url: form.url,
      description: form.description,
      subject: form.subject || null,
      grade_level: form.grade_level || null,
      topic: form.topic || null,
      lesson: form.lesson || null,
      question_types: form.question_types,
      difficulty_levels: form.difficulty_levels,
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

  const gradeOptions = form.subject ? RESOURCE_GRADES : null
  const filteredResources = resources.filter((r) => matchesSearch(r, search.trim()))
  const groups = groupResources(filteredResources)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý ngân hàng câu hỏi</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            + Thêm mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Sửa mục' : 'Thêm mục mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
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
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Môn</Label>
                  <Select
                    value={form.subject}
                    onValueChange={(v) => setForm({ ...form, subject: v, grade_level: '' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn môn">
                        {() => RESOURCE_SUBJECTS[form.subject]?.label ?? 'Chọn môn'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESOURCE_SUBJECTS).map(([key, node]) => (
                        <SelectItem key={key} value={key}>{node.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {gradeOptions && (
                  <div className="space-y-1">
                    <Label>Khối</Label>
                    <Select value={form.grade_level} onValueChange={(v) => setForm({ ...form, grade_level: v })}>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="topic">Chủ đề</Label>
                  <Input id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lesson">Bài</Label>
                  <Input id="lesson" value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Dạng câu trắc nghiệm</Label>
                <CheckboxGroup options={QUESTION_TYPE_OPTIONS} selected={form.question_types} onToggle={toggleQuestionType} />
              </div>
              <div className="space-y-1">
                <Label>Mức độ</Label>
                <CheckboxGroup options={DIFFICULTY_LEVEL_OPTIONS} selected={form.difficulty_levels} onToggle={toggleDifficultyLevel} />
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

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="questions">Xem theo câu hỏi</TabsTrigger>
          <TabsTrigger value="resources">Xem theo đề (quản lý file)</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="pt-3">
          <QuestionBank
            resources={resources}
            editable
            onEditQuestion={setEditingQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 pt-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, chủ đề, bài hoặc tag..." />

          {groups.length === 0 && (
            <p className="text-muted-foreground">Không tìm thấy mục nào khớp với "{search}".</p>
          )}

          <Accordion value={openGroups} onValueChange={setOpenGroups} className="space-y-3">
            {groups.map(([groupLabel, items]) => (
              <AccordionItem
                key={groupLabel}
                value={groupLabel}
                className={`rounded-lg border px-4 shadow-sm ${
                  groupLabel === UNCLASSIFIED_LABEL ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'
                }`}
              >
                <AccordionTrigger>
                  <span className="flex flex-1 items-baseline justify-between gap-2">
                    <span className={groupLabel === UNCLASSIFIED_LABEL ? 'text-amber-500' : undefined}>{groupLabel}</span>
                    <span className="text-xs font-normal text-muted-foreground">{items.length} mục</span>
                  </span>
                </AccordionTrigger>
                <AccordionPanel className="space-y-2">
                  {items.map((resource) => (
                    <ResourceRow
                      key={resource.id}
                      resource={resource}
                      onEdit={openEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>

      <EditQuestionDialog
        question={editingQuestion}
        open={editingQuestion !== null}
        onOpenChange={(v) => !v && setEditingQuestion(null)}
        onSubmit={handleSaveQuestion}
      />
    </div>
  )
}
