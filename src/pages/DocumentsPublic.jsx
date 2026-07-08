import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Folder, ChevronRight, Lock, Download, GraduationCap, BookOpen, Monitor, Bot, Code2, Sparkles } from 'lucide-react'
import { fetchPublicDocuments, getDocumentSignedUrl, unlockDocumentPath } from '@/lib/queries/documents'
import { DOCUMENT_TAXONOMY, getTaxonomyNode, pathToFilters, PATH_COLUMNS } from '@/lib/documentTaxonomy'
import { accentClasses } from '@/lib/accentColors'
import { timeAgo } from '@/lib/timeAgo'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Button } from '@/components/ui/button'

const PATH_PARAMS = ['loai', 'mon', 'khoi', 'nhom']
const DOC_ACCENT = 'emerald'
const GIANG_DAY_ACCENT = 'violet'

async function handleDownload(path, filename) {
  const url = await getDocumentSignedUrl(path, filename)
  window.open(url, '_blank', 'noopener,noreferrer')
}

function matchesChild(doc, depth, key) {
  return doc[PATH_COLUMNS[depth]] === key
}

function Breadcrumb({ path, nodes, onNavigate }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <button onClick={() => onNavigate(0)} className="hover:text-foreground hover:underline">
        Tài liệu
      </button>
      {path.map((key, i) => (
        <span key={key} className="flex items-center gap-1">
          <ChevronRight className="size-3.5" />
          <button onClick={() => onNavigate(i + 1)} className="hover:text-foreground hover:underline">
            {nodes[i]?.label}
          </button>
        </span>
      ))}
    </div>
  )
}

function DecorativeBackground({ accent }) {
  const colors = accentClasses[accent]
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className={`absolute -top-16 -left-16 size-72 rounded-full bg-gradient-to-br ${colors.gradient} to-transparent opacity-20 blur-3xl`} />
      <div className="absolute top-10 right-0 size-96 rounded-full bg-gradient-to-br from-violet-500 to-transparent opacity-10 blur-3xl" />
      <Folder className={`absolute -right-8 top-4 size-56 ${colors.iconText} opacity-[0.06]`} strokeWidth={1} />
    </div>
  )
}

const SUBJECT_ICONS = {
  tin_hoc: Monitor,
  robot: Bot,
  lap_trinh: Code2,
}

function countDocs(documents, filters) {
  return documents.filter((d) => Object.entries(filters).every(([k, v]) => d[k] === v)).length
}

function RecentDocuments({ documents }) {
  const recent = [...documents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)
  if (!recent.length) return null

  return (
    <div className="space-y-2 pb-2">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground uppercase tracking-wide">
        <Sparkles className="size-4" /> Cập nhật gần đây
      </h2>
      <div className="flex flex-wrap gap-2">
        {recent.map((doc) => {
          const accent = doc.category === 'hoc_tap' ? 'sky' : GIANG_DAY_ACCENT
          const colors = accentClasses[accent]
          const Icon = doc.category === 'hoc_tap' ? BookOpen : GraduationCap
          return (
            <span
              key={doc.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span className={`flex size-5 items-center justify-center rounded-full ${colors.iconBg} ${colors.iconText}`}>
                <Icon className="size-3" />
              </span>
              <span className="max-w-40 truncate font-medium">{doc.title}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(doc.created_at)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function RootColumns({ documents, onOpenPath }) {
  const colors = accentClasses[GIANG_DAY_ACCENT]
  const giangDaySubjects = DOCUMENT_TAXONOMY.giang_day.children
  const hocTapCount = countDocs(documents, { category: 'hoc_tap' })

  return (
    <div className="grid gap-4 py-6 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border-t-4 border-t-orange-400 shadow-lg shadow-black/20 ring-1 ring-slate-300/40">
        <div className="flex items-center gap-2 bg-gradient-to-r from-violet-800 to-violet-950 px-4 py-3 font-semibold text-white">
          <GraduationCap className="size-5" /> Giảng dạy
        </div>
        <div className="flex flex-wrap justify-center gap-3 bg-card p-4">
          {Object.entries(giangDaySubjects).map(([key, node]) => {
            const Icon = SUBJECT_ICONS[key] ?? Folder
            return (
              <button
                key={key}
                onClick={() => onOpenPath(['giang_day', key])}
                className="flex w-28 cursor-pointer flex-col items-center gap-2 rounded-lg p-3 text-center transition-all duration-200 hover:-translate-y-1 hover:bg-accent"
              >
                <span className={`flex size-11 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
                  <Icon className="size-5" />
                </span>
                <p className="w-full truncate text-sm font-medium">{node.label}</p>
                <p className="text-xs text-muted-foreground">
                  {countDocs(documents, { category: 'giang_day', subject: key })} tài liệu
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onOpenPath(['hoc_tap'])}
        className="overflow-hidden rounded-xl border-t-4 border-t-orange-400 text-left shadow-lg shadow-black/20 ring-1 ring-slate-300/40 transition-all duration-200 hover:-translate-y-1"
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-sky-800 to-sky-950 px-4 py-3 font-semibold text-white">
          <BookOpen className="size-5" /> Học tập
        </div>
        <div className="flex flex-col items-center justify-center gap-2 bg-card p-8 text-center">
          <span className={`flex size-14 items-center justify-center rounded-lg ${accentClasses.sky.iconBg} ${accentClasses.sky.iconText}`}>
            <BookOpen className="size-7" />
          </span>
          <p className="text-muted-foreground">{hocTapCount} tài liệu</p>
        </div>
      </button>
    </div>
  )
}

function FolderGrid({ entries, onOpen }) {
  const colors = accentClasses[DOC_ACCENT]
  if (!entries.length) return <p className="text-muted-foreground">Chưa có mục nào.</p>
  return (
    <div className="flex flex-wrap justify-center gap-4 py-6">
      {entries.map(({ key, label, count }) => (
        <AccentCard
          key={key}
          accent={DOC_ACCENT}
          onClick={() => onOpen(key)}
          className="w-36 cursor-pointer items-center gap-2 p-4 text-center sm:w-40"
        >
          <span className={`flex size-12 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <Folder className="size-6" />
          </span>
          <p className="w-full truncate font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{count} tài liệu</p>
        </AccentCard>
      ))}
    </div>
  )
}

// Khi các mục con (VD: Khối 6-9) lại có thêm 1 lớp con riêng (VD: 2 nhóm tài liệu),
// gộp cả 2 lớp vào chung 1 trang thay vì bắt bấm thêm 1 lần nữa mới thấy nhóm con.
function TwoLevelGrid({ groups, onOpen }) {
  const colors = accentClasses[DOC_ACCENT]
  if (!groups.length) return <p className="text-muted-foreground">Chưa có mục nào.</p>
  return (
    <div className="flex flex-wrap justify-center gap-6 py-6">
      {groups.map(({ key: parentKey, label: parentLabel, children }) => (
        <div key={parentKey} className="w-36 space-y-3 sm:w-40">
          <h3 className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">{parentLabel}</h3>
          <div className="flex flex-col gap-3">
            {children.map(({ key: childKey, label: childLabel, count }) => (
              <AccentCard
                key={childKey}
                accent={DOC_ACCENT}
                onClick={() => onOpen([parentKey, childKey])}
                className="cursor-pointer items-center gap-2 p-4 text-center"
              >
                <span className={`flex size-12 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
                  <Folder className="size-6" />
                </span>
                <p className="w-full truncate font-medium text-sm">{childLabel}</p>
                <p className="text-xs text-muted-foreground">{count} tài liệu</p>
              </AccentCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DocumentsPublic() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawPath = PATH_PARAMS.map((p) => searchParams.get(p)).filter(Boolean)
  const validPath = []
  for (const key of rawPath) {
    if (!getTaxonomyNode([...validPath, key])) break
    validPath.push(key)
  }

  const currentNode = validPath.length === 0 ? { children: DOCUMENT_TAXONOMY } : getTaxonomyNode(validPath)
  const isLeaf = !currentNode?.children
  const childNodes = isLeaf ? [] : Object.values(currentNode.children)
  const childrenAreTwoLevel = childNodes.length > 0 && childNodes.every((node) => node.children)
  const filters = pathToFilters(validPath)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', 'public', JSON.stringify(filters), isLeaf ? debouncedSearch : ''],
    queryFn: () => fetchPublicDocuments(isLeaf ? debouncedSearch : '', filters),
    placeholderData: keepPreviousData,
  })

  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(isLeaf ? documents : [])

  function openChild(key) {
    openPath([...validPath, key])
  }

  function openChildPath(keys) {
    openPath([...validPath, ...keys])
  }

  function openPath(path) {
    const next = new URLSearchParams()
    path.forEach((v, i) => next.set(PATH_PARAMS[i], v))
    setSearchParams(next)
  }

  function navigateTo(depth) {
    const next = new URLSearchParams()
    validPath.slice(0, depth).forEach((v, i) => next.set(PATH_PARAMS[i], v))
    setSearchParams(next)
  }

  const crumbNodes = validPath.map((_, i) => getTaxonomyNode(validPath.slice(0, i + 1)))

  const [lockedDoc, setLockedDoc] = useState(null)

  async function handleUnlockAndDownload(password) {
    const path = await unlockDocumentPath(lockedDoc.id, password)
    if (path == null) return false
    await handleDownload(path, `${lockedDoc.title}.${lockedDoc.file_type}`)
    return true
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Tài liệu" subtitle="Giáo án, giáo trình, tài liệu học tập" />
      <div className="relative">
        {!isLeaf && <DecorativeBackground accent={DOC_ACCENT} />}
        <Breadcrumb path={validPath} nodes={crumbNodes} onNavigate={navigateTo} />

        {error && <p className="text-destructive">Lỗi: {error.message}</p>}

        {!error && !isLeaf && (
          <>
            {isLoading && <p>Đang tải...</p>}
            {!isLoading && validPath.length === 0 && (
              <>
                <RecentDocuments documents={documents ?? []} />
                <RootColumns documents={documents ?? []} onOpenPath={openPath} />
              </>
            )}
            {!isLoading && validPath.length > 0 && childrenAreTwoLevel && (
              <TwoLevelGrid
                groups={Object.entries(currentNode.children).map(([parentKey, parentNode]) => ({
                  key: parentKey,
                  label: parentNode.label,
                  children: Object.entries(parentNode.children).map(([childKey, childNode]) => ({
                    key: childKey,
                    label: childNode.label,
                    count: (documents ?? []).filter(
                      (d) => matchesChild(d, validPath.length, parentKey) && matchesChild(d, validPath.length + 1, childKey)
                    ).length,
                  })),
                }))}
                onOpen={openChildPath}
              />
            )}
            {!isLoading && validPath.length > 0 && !childrenAreTwoLevel && (
              <FolderGrid
                entries={Object.entries(currentNode.children).map(([key, node]) => ({
                  key,
                  label: node.label,
                  count: (documents ?? []).filter((d) => matchesChild(d, validPath.length, key)).length,
                }))}
                onOpen={openChild}
              />
            )}
          </>
        )}

        {!error && isLeaf && (
          <div className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài liệu..." />
            <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
            {isLoading && <p>Đang tải...</p>}
            {!isLoading && !filtered.length && <p className="text-muted-foreground">Chưa có tài liệu nào.</p>}
            {!isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((doc) => (
                  <ContentCard key={doc.id} title={doc.title} description={doc.description} tags={doc.tags} accent={DOC_ACCENT} icon={Folder}>
                    {doc.file_url && (
                      <Button className="w-full" onClick={() => handleDownload(doc.file_url, `${doc.title}.${doc.file_type}`)}>
                        <Download className="size-4" /> Tải xuống ({doc.file_type})
                      </Button>
                    )}
                    {doc.is_locked && !doc.file_url && (
                      <Button className="w-full" onClick={() => setLockedDoc(doc)}>
                        <Lock className="size-4" /> Nhập mật khẩu để tải ({doc.file_type})
                      </Button>
                    )}
                  </ContentCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <PasswordPrompt
        open={lockedDoc !== null}
        onOpenChange={(v) => !v && setLockedDoc(null)}
        onSubmit={handleUnlockAndDownload}
        title="Tài liệu bị khóa"
      />
    </div>
  )
}
