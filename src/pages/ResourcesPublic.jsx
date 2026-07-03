import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { fetchPublicResources, unlockResourceUrl } from '@/lib/queries/resources'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Button } from '@/components/ui/button'

export default function ResourcesPublic() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public', debouncedSearch],
    queryFn: () => fetchPublicResources(debouncedSearch),
    placeholderData: keepPreviousData,
  })
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(resources)

  const [promptId, setPromptId] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleUnlock(password) {
    const url = await unlockResourceUrl(promptId, password)
    if (url == null) return false
    setRevealed((prev) => ({ ...prev, [promptId]: url }))
    return true
  }

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
          {resource.is_locked && !revealed[resource.id] && (
            <Button variant="outline" size="sm" onClick={() => setPromptId(resource.id)}>
              <Lock className="size-4" /> Nhập mật khẩu để xem link
            </Button>
          )}
          {(!resource.is_locked || revealed[resource.id]) && (
            <a
              href={revealed[resource.id] ?? resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              {revealed[resource.id] ?? resource.url}
            </a>
          )}
        </ContentCard>
      ))}
      <PasswordPrompt
        open={promptId !== null}
        onOpenChange={(v) => !v && setPromptId(null)}
        onSubmit={handleUnlock}
        title="Tài nguyên bị khóa"
      />
    </div>
  )
}
