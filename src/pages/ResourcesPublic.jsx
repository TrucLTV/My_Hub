import { useQuery } from '@tanstack/react-query'
import { fetchPublicResources } from '@/lib/queries/resources'
import { useFilteredList } from '@/hooks/useFilteredList'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'

export default function ResourcesPublic() {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public'],
    queryFn: fetchPublicResources,
  })
  const { search, setSearch, allTags, selectedTags, toggleTag, filtered } = useFilteredList(
    resources,
    ['title', 'description']
  )

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tài nguyên</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài nguyên..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {!filtered.length && <p className="text-muted-foreground">Không có tài nguyên nào.</p>}
      {filtered.map((resource) => (
        <ContentCard key={resource.id} title={resource.title} description={resource.description} tags={resource.tags}>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            {resource.url}
          </a>
        </ContentCard>
      ))}
    </div>
  )
}
