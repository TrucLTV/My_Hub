import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Folder, ChevronRight } from 'lucide-react'
import { fetchPublicDocuments, getDocumentSignedUrl } from '@/lib/queries/documents'
import { DOCUMENT_TAXONOMY, getTaxonomyNode, pathToFilters, PATH_COLUMNS } from '@/lib/documentTaxonomy'
import { accentClasses } from '@/lib/accentColors'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import { Button } from '@/components/ui/button'

const PATH_PARAMS = ['loai', 'mon', 'khoi', 'nhom']
const DOC_ACCENT = 'emerald'

async function handleDownload(path) {
  const url = await getDocumentSignedUrl(path)
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

function FolderGrid({ entries, onOpen }) {
  const colors = accentClasses[DOC_ACCENT]
  if (!entries.length) return <p className="text-muted-foreground">Chưa có mục nào.</p>
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries.map(({ key, label, count }) => (
        <AccentCard
          key={key}
          accent={DOC_ACCENT}
          onClick={() => onOpen(key)}
          className="cursor-pointer flex-row items-center gap-3 p-4"
        >
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <Folder className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{count} tài liệu</p>
          </div>
        </AccentCard>
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
  const filters = pathToFilters(validPath)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', 'public', JSON.stringify(filters), isLeaf ? debouncedSearch : ''],
    queryFn: () => fetchPublicDocuments(isLeaf ? debouncedSearch : '', filters),
  })

  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(isLeaf ? documents : [])

  function openChild(key) {
    const nextPath = [...validPath, key]
    const next = new URLSearchParams()
    nextPath.forEach((v, i) => next.set(PATH_PARAMS[i], v))
    setSearchParams(next)
  }

  function navigateTo(depth) {
    const next = new URLSearchParams()
    validPath.slice(0, depth).forEach((v, i) => next.set(PATH_PARAMS[i], v))
    setSearchParams(next)
  }

  const crumbNodes = validPath.map((_, i) => getTaxonomyNode(validPath.slice(0, i + 1)))

  return (
    <div className="space-y-4">
      <PageBanner title="Tài liệu" subtitle="Giáo án, giáo trình, tài liệu học tập" />
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-destructive">Lỗi: {error.message}</p>}
      {!isLoading && !error && (
        <>
          <Breadcrumb path={validPath} nodes={crumbNodes} onNavigate={navigateTo} />

          {!isLeaf && (
            <FolderGrid
              entries={Object.entries(currentNode.children).map(([key, node]) => ({
                key,
                label: node.label,
                count: (documents ?? []).filter((d) => matchesChild(d, validPath.length, key)).length,
              }))}
              onOpen={openChild}
            />
          )}

          {isLeaf && (
            <>
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài liệu..." />
              <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
              {!filtered.length && <p className="text-muted-foreground">Chưa có tài liệu nào.</p>}
              {filtered.map((doc) => (
                <ContentCard key={doc.id} title={doc.title} description={doc.description} tags={doc.tags} accent={DOC_ACCENT}>
                  {doc.file_url && (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_url)}>
                      Tải xuống ({doc.file_type})
                    </Button>
                  )}
                </ContentCard>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
