import { useQuery } from '@tanstack/react-query'
import { fetchPublicMedia } from '@/lib/queries/media'
import { useFilteredList } from '@/hooks/useFilteredList'
import { Badge } from '@/components/ui/badge'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'

const statusLabel = {
  backlog: 'Chưa xem',
  in_progress: 'Đang xem',
  completed: 'Hoàn thành',
  dropped: 'Bỏ dở',
}

export default function MediaTracker() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['media_tracker', 'public'],
    queryFn: fetchPublicMedia,
  })
  const { search, setSearch, allTags, selectedTags, toggleTag, filtered } = useFilteredList(
    items,
    ['title', 'review']
  )

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Phim/Game</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm phim/game..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {!filtered.length && <p className="text-muted-foreground">Chưa có mục nào.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="border rounded-md overflow-hidden">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
