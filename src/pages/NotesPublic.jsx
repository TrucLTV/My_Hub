import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { fetchPublicNotes } from '@/lib/queries/notes'
import ContentCard from '@/components/ContentCard'

export default function NotesPublic() {
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes', 'public'],
    queryFn: fetchPublicNotes,
  })

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>
  if (!notes?.length) return <p className="text-muted-foreground">Chưa có ghi chú công khai.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ghi chú</h1>
      {notes.map((note) => (
        <ContentCard key={note.id} title={note.title} tags={note.tags}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        </ContentCard>
      ))}
    </div>
  )
}
