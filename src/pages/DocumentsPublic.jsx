import { useQuery } from '@tanstack/react-query'
import { fetchPublicDocuments, getDocumentSignedUrl } from '@/lib/queries/documents'
import { useFilteredList } from '@/hooks/useFilteredList'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import { Button } from '@/components/ui/button'

async function handleDownload(path) {
  const url = await getDocumentSignedUrl(path)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function DocumentsPublic() {
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', 'public'],
    queryFn: fetchPublicDocuments,
  })
  const { search, setSearch, allTags, selectedTags, toggleTag, filtered } = useFilteredList(
    documents,
    ['title', 'description', 'subject']
  )

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tài liệu</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài liệu..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {!filtered.length && <p className="text-muted-foreground">Chưa có tài liệu nào.</p>}
      {filtered.map((doc) => (
        <ContentCard key={doc.id} title={doc.title} description={doc.description} tags={doc.tags}>
          {doc.file_url && (
            <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_url)}>
              Tải xuống ({doc.file_type})
            </Button>
          )}
        </ContentCard>
      ))}
    </div>
  )
}
