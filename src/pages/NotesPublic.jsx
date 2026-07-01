import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { fetchPublicNotes } from '@/lib/queries/notes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'

export default function NotesPublic() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes', 'public', debouncedSearch],
    queryFn: () => fetchPublicNotes(debouncedSearch),
  })
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(notes)

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ghi chú</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm ghi chú..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {!filtered.length && <p className="text-muted-foreground">Không có ghi chú nào.</p>}
      {filtered.map((note) => (
        <ContentCard key={note.id} title={note.title} tags={note.tags}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        </ContentCard>
      ))}
    </div>
  )
}
