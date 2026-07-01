import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchPublicNotes } from '@/lib/queries/notes'
import { fetchPublicResources } from '@/lib/queries/resources'
import { fetchPublicMedia } from '@/lib/queries/media'
import { fetchPublicDocuments } from '@/lib/queries/documents'
import { Badge } from '@/components/ui/badge'

const sections = [
  { key: 'notes', title: 'Ghi chú', href: '/ghi-chu', queryFn: fetchPublicNotes },
  { key: 'resources', title: 'Tài nguyên', href: '/tai-nguyen', queryFn: fetchPublicResources },
  { key: 'media_tracker', title: 'Phim/Game', href: '/phim-game', queryFn: fetchPublicMedia },
  { key: 'documents', title: 'Tài liệu', href: '/tai-lieu', queryFn: fetchPublicDocuments },
]

function RecentSection({ title, href, queryFn }) {
  const { data, isLoading } = useQuery({ queryKey: [queryFn.name, 'public', ''], queryFn: () => queryFn() })
  const recent = (data ?? []).slice(0, 3)

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <Link to={href} className="text-sm text-primary underline">Xem tất cả</Link>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {!isLoading && !recent.length && (
        <p className="text-sm text-muted-foreground">Chưa có nội dung công khai.</p>
      )}
      <ul className="space-y-1">
        {recent.map((item) => (
          <li key={item.id} className="text-sm flex items-center gap-2">
            <span>{item.title}</span>
            {(item.tags ?? item.genre ?? []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">MyHub</h1>
        <p className="text-muted-foreground">
          Nơi lưu tài liệu công việc, ghi chú cá nhân, theo dõi phim/game và tài nguyên hữu ích.
        </p>
      </div>
      {sections.map(({ key, ...section }) => (
        <RecentSection key={key} {...section} />
      ))}
    </div>
  )
}
