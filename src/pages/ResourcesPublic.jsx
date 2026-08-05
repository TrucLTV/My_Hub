import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Folder, ChevronRight, Lock, ExternalLink, Layers } from 'lucide-react'
import { fetchPublicResources, unlockResourceUrl } from '@/lib/queries/resources'
import { RESOURCE_SUBJECTS, RESOURCE_GRADES, QUESTION_TYPE_OPTIONS, DIFFICULTY_LEVEL_OPTIONS } from '@/lib/resourceTaxonomy'
import { isSelfHostedHtml, openSelfHostedHtml } from '@/lib/openSelfHostedHtml'
import { accentClasses } from '@/lib/accentColors'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ACCENT = 'violet'
const ALL_VALUE = '__all__'

function matchesSearch(resource, query) {
  if (!query) return true
  const q = query.toLowerCase()
  if (resource.title.toLowerCase().includes(q)) return true
  if (resource.lesson?.toLowerCase().includes(q)) return true
  return (resource.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
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

function SubjectPicker({ resources, onSelect }) {
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
              {node.label} — {resources.filter((r) => r.subject === key).length} câu hỏi
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function GradeGrid({ resources, subject, onSelect }) {
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
            {resources.filter((r) => r.subject === subject && r.grade_level === key).length} câu hỏi
          </p>
        </AccentCard>
      ))}
    </div>
  )
}

function PublicResourceCard({ resource, onLockedClick, revealedUrl }) {
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
      {(resource.question_types?.length > 0 || resource.difficulty_levels?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {resource.question_types?.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
          {resource.difficulty_levels?.map((l) => (
            <Badge key={l} variant="outline">{l}</Badge>
          ))}
        </div>
      )}
      {resource.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}
      {resource.is_locked && !revealedUrl && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => onLockedClick(resource)}>
          <Lock className="size-3.5" /> Nhập mật khẩu để xem
        </Button>
      )}
      {(!resource.is_locked || revealedUrl) && (
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

function ResourceFilters({ resources, topic, setTopic, lesson, setLesson, types, toggleType, levels, toggleLevel }) {
  const topics = useMemo(() => {
    const set = new Set()
    for (const r of resources) if (r.topic) set.add(r.topic)
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [resources])

  const lessons = useMemo(() => {
    const set = new Set()
    for (const r of resources) {
      if (topic && r.topic !== topic) continue
      if (r.lesson) set.add(r.lesson)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [resources, topic])

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

export default function ResourcesPublic() {
  const [searchParams, setSearchParams] = useSearchParams()
  const subject = searchParams.get('mon')
  const grade = searchParams.get('khoi')
  const validSubject = subject && RESOURCE_SUBJECTS[subject] ? subject : null
  const validGrade = validSubject && grade && RESOURCE_GRADES[grade] ? grade : null

  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public'],
    queryFn: fetchPublicResources,
  })
  const allResources = resources ?? []

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

  const gradeResources = allResources.filter((r) => r.subject === validSubject && r.grade_level === validGrade)

  const filtered = gradeResources.filter((r) => {
    if (topic && r.topic !== topic) return false
    if (lesson && r.lesson !== lesson) return false
    if (types.length && !types.some((t) => r.question_types?.includes(t))) return false
    if (levels.length && !levels.some((l) => r.difficulty_levels?.includes(l))) return false
    return matchesSearch(r, search.trim().toLowerCase())
  })

  const [lockedResource, setLockedResource] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleUnlock(password) {
    const url = await unlockResourceUrl(lockedResource.id, password)
    if (url == null) return false
    setRevealed((prev) => ({ ...prev, [lockedResource.id]: url }))
    return true
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Ngân hàng câu hỏi" subtitle="Đề trắc nghiệm theo môn, khối, chủ đề và mức độ" />

      <Breadcrumb subject={validSubject} grade={validGrade} onNavigate={navigateTo} />

      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-destructive">Lỗi: {error.message}</p>}

      {!isLoading && !error && !validSubject && (
        <SubjectPicker resources={allResources} onSelect={openSubject} />
      )}

      {!isLoading && !error && validSubject && !validGrade && (
        <GradeGrid resources={allResources} subject={validSubject} onSelect={openGrade} />
      )}

      {!isLoading && !error && validSubject && validGrade && (
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc bài..." />
          <ResourceFilters
            resources={gradeResources}
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
            <Layers className="size-4" /> {filtered.length} câu hỏi
          </p>

          {!filtered.length && <p className="text-muted-foreground">Chưa có câu hỏi nào khớp bộ lọc.</p>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((resource) => (
              <PublicResourceCard
                key={resource.id}
                resource={resource}
                onLockedClick={setLockedResource}
                revealedUrl={revealed[resource.id]}
              />
            ))}
          </div>
        </div>
      )}

      <PasswordPrompt
        open={lockedResource !== null}
        onOpenChange={(v) => !v && setLockedResource(null)}
        onSubmit={handleUnlock}
        title="Mục bị khóa"
      />
    </div>
  )
}
