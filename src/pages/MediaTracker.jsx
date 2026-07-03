import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { fetchPublicMedia, unlockMediaReview } from '@/lib/queries/media'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import PasswordPrompt from '@/components/PasswordPrompt'

const statusLabel = {
  backlog: 'Chưa xem',
  in_progress: 'Đang xem',
  completed: 'Hoàn thành',
  dropped: 'Bỏ dở',
}

export default function MediaTracker() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['media_tracker', 'public', debouncedSearch],
    queryFn: () => fetchPublicMedia(debouncedSearch),
    placeholderData: keepPreviousData,
  })
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(items)

  const [promptId, setPromptId] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleUnlock(password) {
    const review = await unlockMediaReview(promptId, password)
    if (review == null) return false
    setRevealed((prev) => ({ ...prev, [promptId]: review }))
    return true
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Giải trí" subtitle="Đang xem, đã hoàn thành, đánh giá cá nhân" />
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm giải trí..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-destructive">Lỗi: {error.message}</p>}
      {!isLoading && !error && !filtered.length && <p className="text-muted-foreground">Chưa có mục nào.</p>}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <AccentCard key={item.id} accent="amber" className="cursor-default overflow-hidden">
              {item.cover_url && (
                <img src={item.cover_url} alt={item.title} className="w-full aspect-[2/3] object-cover" />
              )}
              <div className="p-2 space-y-1">
                <p className="font-medium text-sm">{item.title}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="secondary">{statusLabel[item.status] ?? item.status}</Badge>
                  {item.rating != null && <Badge variant="outline">★ {item.rating}</Badge>}
                </div>
                {item.progress && <p className="text-xs text-muted-foreground">{item.progress}</p>}
                {item.genre?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.genre.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                )}
                {item.is_locked && !revealed[item.id] && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setPromptId(item.id)}>
                    <Lock className="size-4" /> Xem đánh giá
                  </Button>
                )}
                {(revealed[item.id] || (!item.is_locked && item.review)) && (
                  <p className="text-xs text-muted-foreground">{revealed[item.id] ?? item.review}</p>
                )}
              </div>
            </AccentCard>
          ))}
        </div>
      )}
      <PasswordPrompt
        open={promptId !== null}
        onOpenChange={(v) => !v && setPromptId(null)}
        onSubmit={handleUnlock}
        title="Đánh giá bị khóa"
      />
    </div>
  )
}
