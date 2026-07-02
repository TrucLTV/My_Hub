import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Folder, ChevronRight, ChevronDown, Upload } from 'lucide-react'
import { fetchPublicDocuments, getDocumentSignedUrl, createDocument, uploadDocumentFile } from '@/lib/queries/documents'
import { DOCUMENT_TAXONOMY, getTaxonomyNode, pathToFilters, PATH_COLUMNS } from '@/lib/documentTaxonomy'
import { accentClasses } from '@/lib/accentColors'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PATH_PARAMS = ['loai', 'mon', 'khoi', 'nhom']
const DOC_ACCENT = 'emerald'

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

const emptyUploadForm = { title: '', tags: '', is_public: true }

function QuickUploadPanel({ path, crumbNodes, filters }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyUploadForm)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setForm(emptyUploadForm)
      setFile(null)
      setOpen(false)
    },
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Chọn 1 file để tải lên.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fileUrl = await uploadDocumentFile(file)
      const fileType = file.name.split('.').pop()
      createMutation.mutate({
        title: form.title,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_public: form.is_public,
        file_url: fileUrl,
        file_type: fileType,
        ...filters,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const pathLabel = crumbNodes.map((n) => n?.label).filter(Boolean).join(' / ') || 'Tài liệu'

  return (
    <div className="mb-2">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="gap-1.5">
        <Upload className="size-4" />
        Tải file lên
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <AccentCard accent={DOC_ACCENT} className="mt-2 max-w-md cursor-default p-4">
          <p className="text-xs text-muted-foreground">Tải vào: {pathLabel}</p>
          <form onSubmit={handleSubmit} className="mt-2 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="quick-title">Tiêu đề</Label>
              <Input id="quick-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quick-file">File</Label>
              <Input id="quick-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quick-tags">Tags (cách nhau bởi dấu phẩy)</Label>
              <Input id="quick-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="quick-is-public"
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              />
              <Label htmlFor="quick-is-public">Công khai</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" className="w-full" disabled={uploading}>
              {uploading ? 'Đang tải lên...' : 'Lưu'}
            </Button>
          </form>
        </AccentCard>
      )}
    </div>
  )
}

export default function DocumentsPublic() {
  const { user } = useAuth()
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
        <div className="relative">
          {!isLeaf && <DecorativeBackground accent={DOC_ACCENT} />}
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
            <div className="space-y-4">
              {user && <QuickUploadPanel path={validPath} crumbNodes={crumbNodes} filters={filters} />}
              <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài liệu..." />
              <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
              {!filtered.length && <p className="text-muted-foreground">Chưa có tài liệu nào.</p>}
              {filtered.map((doc) => (
                <ContentCard key={doc.id} title={doc.title} description={doc.description} tags={doc.tags} accent={DOC_ACCENT}>
                  {doc.file_url && (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_url, `${doc.title}.${doc.file_type}`)}>
                      Tải xuống ({doc.file_type})
                    </Button>
                  )}
                </ContentCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
