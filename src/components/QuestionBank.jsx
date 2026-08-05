import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Folder, ChevronRight, Lock, ExternalLink, Layers, Pencil, Trash2 } from 'lucide-react'
import {
  RESOURCE_SUBJECTS,
  RESOURCE_GRADES,
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_LEVEL_OPTIONS,
  QUESTION_TYPE_LABELS,
  BLOOM_LABELS,
} from '@/lib/resourceTaxonomy'
import { isSelfHostedHtml, openSelfHostedHtml } from '@/lib/openSelfHostedHtml'
import { classifyResource, fetchQuestionPool } from '@/lib/queries/quizQuestions'
import { accentClasses } from '@/lib/accentColors'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import AccentCard from '@/components/AccentCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ACCENT = 'violet'
const ALL_VALUE = '__all__'

function distinctSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'))
}

// Theo yeu cau: chi can noi dung cau hoi, khong dap an, khong nhan muc do — gop
// chung 1 khung, van loc duoc qua bo loc phia tren.
function questionText(q) {
  return q.type === 'fillblank' ? q.textWithBlanks ?? '' : q.question ?? ''
}

function Breadcrumb({ subject, grade, onNavigate }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <button onClick={() => onNavigate(0)} className="hover:text-foreground hover:underline">
        Ngân hàng câu hỏi
      </button>
      {subject && (
        <span className="flex items-center gap-1">
          <ChevronRight className="size-3.5" />
          <button onClick={() => onNavigate(1)} className="hover:text-foreground hover:underline">
            {RESOURCE_SUBJECTS[subject]?.label}
          </button>
        </span>
      )}
      {grade && (
        <span className="flex items-center gap-1">
          <ChevronRight className="size-3.5" />
          <button onClick={() => onNavigate(2)} className="hover:text-foreground hover:underline">
            {RESOURCE_GRADES[grade]?.label}
          </button>
        </span>
      )}
    </div>
  )
}

function SubjectPicker({ questions, onSelect }) {
  return (
    <div className="mx-auto max-w-sm space-y-1 py-8">
      <Label>Chọn môn để xem ngân hàng câu hỏi</Label>
      <Select value="" onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chọn môn..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RESOURCE_SUBJECTS).map(([key, node]) => (
            <SelectItem key={key} value={key}>
              {node.label} — {questions.filter((q) => q.subject === key).length} câu hỏi
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function GradeGrid({ questions, subject, onSelect }) {
  const colors = accentClasses[ACCENT]
  return (
    <div className="flex flex-wrap justify-center gap-4 py-6">
      {Object.entries(RESOURCE_GRADES).map(([key, node]) => (
        <AccentCard
          key={key}
          accent={ACCENT}
          onClick={() => onSelect(key)}
          className="w-36 cursor-pointer items-center gap-2 p-4 text-center sm:w-40"
        >
          <span className={`flex size-12 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <Folder className="size-6" />
          </span>
          <p className="w-full font-medium text-sm">{node.label}</p>
          <p className="text-xs text-muted-foreground">
            {questions.filter((q) => q.subject === subject && q.grade_level === key).length} câu hỏi
          </p>
        </AccentCard>
      ))}
    </div>
  )
}

function OtherResourceCard({ resource, onLockedClick, revealedUrl }) {
  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState(null)
  const url = revealedUrl ?? resource.url

  async function handleOpen() {
    setOpenError(null)
    setOpening(true)
    try {
      await openSelfHostedHtml(url)
    } catch (err) {
      setOpenError(err.message)
    } finally {
      setOpening(false)
    }
  }

  return (
    <AccentCard accent={ACCENT} className="cursor-default gap-2 p-4">
      <p className="font-medium">{resource.title}</p>
      {(resource.topic || resource.lesson) && (
        <p className="text-sm text-muted-foreground">
          {[resource.topic, resource.lesson].filter(Boolean).join(' › ')}
        </p>
      )}
      {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
      {resource.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}
      {resource.is_locked && !revealedUrl && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => onLockedClick?.(resource)}>
          <Lock className="size-3.5" /> Nhập mật khẩu để xem
        </Button>
      )}
      {(!resource.is_locked || revealedUrl) && url && (
        isSelfHostedHtml(url) ? (
          <Button variant="outline" size="sm" className="w-fit" onClick={handleOpen} disabled={opening}>
            <ExternalLink className="size-3.5" /> {opening ? 'Đang mở...' : 'Mở link'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-3.5" /> Mở link
          </Button>
        )
      )}
      {openError && <p className="text-xs text-destructive">{openError}</p>}
    </AccentCard>
  )
}

function QuestionFilters({ questions, topic, setTopic, lesson, setLesson, types, toggleType, levels, toggleLevel }) {
  const topics = useMemo(() => distinctSorted(questions.map((q) => q.topic)), [questions])
  const lessons = useMemo(
    () => distinctSorted(questions.filter((q) => !topic || q.topic === topic).map((q) => q.lesson)),
    [questions, topic]
  )

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Chủ đề</Label>
          <Select
            value={topic || ALL_VALUE}
            onValueChange={(v) => {
              setTopic(v === ALL_VALUE ? '' : v)
              setLesson('')
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{() => topic || 'Tất cả chủ đề'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả chủ đề</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Bài</Label>
          <Select value={lesson || ALL_VALUE} onValueChange={(v) => setLesson(v === ALL_VALUE ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{() => lesson || 'Tất cả bài'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tất cả bài</SelectItem>
              {lessons.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Dạng câu trắc nghiệm</Label>
        <TagFilter tags={QUESTION_TYPE_OPTIONS} selected={types} onToggle={toggleType} />
      </div>
      <div className="space-y-1">
        <Label>Mức độ</Label>
        <TagFilter tags={DIFFICULTY_LEVEL_OPTIONS} selected={levels} onToggle={toggleLevel} />
      </div>
    </div>
  )
}

function QuestionRow({ q, index, editable, onEditQuestion, onDeleteQuestion }) {
  return (
    <div className="flex items-start justify-between gap-2 px-4 py-2.5">
      <p className="text-sm">{index + 1}. {questionText(q)}</p>
      {editable && (
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEditQuestion(q)} aria-label="Sửa câu hỏi">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDeleteQuestion(q)} aria-label="Xóa câu hỏi">
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Component dung chung cho ca trang public (ResourcesPublic) va trang admin
// (AdminResources): duyet Mon -> Khoi -> danh sach cau hoi (loc theo chu de/
// bai/dang cau/muc do). Ben admin them editable=true de co nut Sua/Xoa tren
// tung dong cau hoi.
export default function QuestionBank({
  resources,
  resourcesLoading,
  resourcesError,
  editable = false,
  onEditQuestion,
  onDeleteQuestion,
  onLockedClick,
  revealedUrls = {},
  poolQueryKeyPrefix = 'resources',
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const subject = searchParams.get('mon')
  const grade = searchParams.get('khoi')
  const validSubject = subject && RESOURCE_SUBJECTS[subject] ? subject : null
  const validGrade = validSubject && grade && RESOURCE_GRADES[grade] ? grade : null

  const allResources = resources ?? []

  const { data: pool, isLoading: poolLoading } = useQuery({
    queryKey: [poolQueryKeyPrefix, 'questionPool', allResources.map((r) => r.id).join(',')],
    queryFn: () => fetchQuestionPool(allResources),
    enabled: allResources.length > 0,
  })
  const allQuestions = pool?.questions ?? []
  const parsedIds = pool?.parsedIds ?? new Set()

  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [lesson, setLesson] = useState('')
  const [types, setTypes] = useState([])
  const [levels, setLevels] = useState([])

  function toggleType(t) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }
  function toggleLevel(l) {
    setLevels((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]))
  }

  function openSubject(key) {
    setSearchParams({ mon: key })
  }
  function openGrade(key) {
    setSearchParams({ mon: validSubject, khoi: key })
  }
  function navigateTo(depth) {
    setTopic('')
    setLesson('')
    setTypes([])
    setLevels([])
    if (depth === 0) setSearchParams({})
    else if (depth === 1) setSearchParams({ mon: validSubject })
  }

  const gradeQuestions = allQuestions.filter((q) => q.subject === validSubject && q.grade_level === validGrade)

  const filteredQuestions = gradeQuestions.filter((q) => {
    if (topic && q.topic !== topic) return false
    if (lesson && q.lesson !== lesson) return false
    if (types.length && !types.includes(QUESTION_TYPE_LABELS[q.type])) return false
    if (levels.length && !levels.includes(BLOOM_LABELS[q.bloom])) return false
    if (!search.trim()) return true
    const s = search.trim().toLowerCase()
    return q.question?.toLowerCase().includes(s) || q.resourceTitle?.toLowerCase().includes(s)
  })

  // Tai nguyen khac trong cung mon/khoi nhung khong tach duoc thanh cau hoi rieng
  // (dang khoa chua mo, hoac link ngoai khong phai file cua tool) — van hien de
  // khong mat du lieu, chi khong loc/hien theo tung cau duoc.
  const otherResources = allResources.filter((r) => {
    if (parsedIds.has(r.id)) return false
    const c = classifyResource(r)
    return c.subject === validSubject && c.grade_level === validGrade
  })

  return (
    <div className="space-y-4">
      <Breadcrumb subject={validSubject} grade={validGrade} onNavigate={navigateTo} />

      {resourcesLoading && <p>Đang tải...</p>}
      {resourcesError && <p className="text-destructive">Lỗi: {resourcesError.message}</p>}

      {!resourcesLoading && !resourcesError && !validSubject && (
        <SubjectPicker questions={allQuestions} onSelect={openSubject} />
      )}

      {!resourcesLoading && !resourcesError && validSubject && !validGrade && (
        <GradeGrid questions={allQuestions} subject={validSubject} onSelect={openGrade} />
      )}

      {!resourcesError && validSubject && validGrade && (
        <div className="space-y-4">
          {poolLoading && <p className="text-muted-foreground">Đang tải câu hỏi...</p>}
          {!poolLoading && (
            <>
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo nội dung câu hỏi..." />
              <QuestionFilters
                questions={gradeQuestions}
                topic={topic}
                setTopic={setTopic}
                lesson={lesson}
                setLesson={setLesson}
                types={types}
                toggleType={toggleType}
                levels={levels}
                toggleLevel={toggleLevel}
              />

              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Layers className="size-4" /> {filteredQuestions.length} câu hỏi
              </p>

              {!filteredQuestions.length && !otherResources.length && (
                <p className="text-muted-foreground">Chưa có câu hỏi nào khớp bộ lọc.</p>
              )}
              {filteredQuestions.length > 0 && (
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {filteredQuestions.map((q, i) => (
                    <QuestionRow
                      key={q.id}
                      q={q}
                      index={i}
                      editable={editable}
                      onEditQuestion={onEditQuestion}
                      onDeleteQuestion={onDeleteQuestion}
                    />
                  ))}
                </div>
              )}

              {otherResources.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium text-muted-foreground">Tài liệu khác trong mục này</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {otherResources.map((resource) => (
                      <OtherResourceCard
                        key={resource.id}
                        resource={resource}
                        onLockedClick={onLockedClick}
                        revealedUrl={revealedUrls[resource.id]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
