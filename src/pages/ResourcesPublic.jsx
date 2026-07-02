import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchPublicResources } from '@/lib/queries/resources'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'

export default function ResourcesPublic() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public', debouncedSearch],
    queryFn: () => fetchPublicResources(debouncedSearch),
    placeholderData: keepPreviousData,
  })
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(resources)

  return (
    <div className="space-y-4">
      <PageBanner title="Tài nguyên" subtitle="Bài viết, sách nên đọc, link hữu ích" />
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm tài nguyên..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-destructive">Lỗi: {error.message}</p>}
      {!isLoading && !error && !filtered.length && <p className="text-muted-foreground">Không có tài nguyên nào.</p>}
      {!isLoading && !error && filtered.map((resource) => (
        <ContentCard key={resource.id} title={resource.title} description={resource.description} tags={resource.tags} accent="violet">
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
