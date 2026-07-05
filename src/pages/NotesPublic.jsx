import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Lock, NotebookPen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { fetchPublicNotes, unlockNoteContent } from '@/lib/queries/notes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Button } from '@/components/ui/button'

export default function NotesPublic() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes', 'public', debouncedSearch],
    queryFn: () => fetchPublicNotes(debouncedSearch),
    placeholderData: keepPreviousData,
  })
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(notes)

  const [promptId, setPromptId] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleUnlock(password) {
    const content = await unlockNoteContent(promptId, password)
    if (content == null) return false
    setRevealed((prev) => ({ ...prev, [promptId]: content }))
    return true
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Mini game" subtitle="Hỗ trợ dạy học, tương tác với học sinh" />
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm mini game..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {isLoading && <p>Đang tải...</p>}
      {error && <p className="text-destructive">Lỗi: {error.message}</p>}
      {!isLoading && !error && !filtered.length && <p className="text-muted-foreground">Không có ghi chú nào.</p>}
      {!isLoading && !error && filtered.map((note) => (
        <ContentCard key={note.id} title={note.title} tags={note.tags} accent="sky" icon={NotebookPen}>
          {note.is_locked && !revealed[note.id] && (
            <Button className="w-full" onClick={() => setPromptId(note.id)}>
              <Lock className="size-4" /> Nhập mật khẩu để xem
            </Button>
          )}
          {(!note.is_locked || revealed[note.id]) && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{revealed[note.id] ?? note.content}</ReactMarkdown>
            </div>
          )}
        </ContentCard>
      ))}
      <PasswordPrompt
        open={promptId !== null}
        onOpenChange={(v) => !v && setPromptId(null)}
        onSubmit={handleUnlock}
        title="Mini game bị khóa"
      />
    </div>
  )
}
