import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { NotebookPen, Link2, Clapperboard, FolderOpen, ArrowRight } from 'lucide-react'
import { fetchPublicNotes } from '@/lib/queries/notes'
import { fetchPublicResources } from '@/lib/queries/resources'
import { fetchPublicMedia } from '@/lib/queries/media'
import { fetchPublicDocuments } from '@/lib/queries/documents'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

const sections = [
  { key: 'notes', title: 'Ghi chú', href: '/ghi-chu', icon: NotebookPen, queryFn: fetchPublicNotes },
  { key: 'resources', title: 'Tài nguyên', href: '/tai-nguyen', icon: Link2, queryFn: fetchPublicResources },
  { key: 'media_tracker', title: 'Phim/Game', href: '/phim-game', icon: Clapperboard, queryFn: fetchPublicMedia },
  { key: 'documents', title: 'Tài liệu', href: '/tai-lieu', icon: FolderOpen, queryFn: fetchPublicDocuments },
]

function CategoryCard({ title, href, icon: Icon, queryFn }) {
  const { data, isLoading } = useQuery({ queryKey: [queryFn.name, 'public', ''], queryFn: () => queryFn() })
  const recent = (data ?? []).slice(0, 3)

  return (
    <Card className="transition-colors hover:ring-foreground/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-16">
        {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!isLoading && !recent.length && (
          <p className="text-sm text-muted-foreground">Chưa có nội dung công khai.</p>
        )}
        <ul className="space-y-1.5">
          {recent.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <span className="truncate">{item.title}</span>
              {(item.tags ?? item.genre ?? []).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="shrink-0 text-xs">{tag}</Badge>
              ))}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link
          to={href}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Xem tất cả
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 py-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">MyHub</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Nơi lưu tài liệu công việc, ghi chú cá nhân, theo dõi phim/game và tài nguyên hữu ích.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, ...section }) => (
          <CategoryCard key={key} {...section} />
        ))}
      </div>
    </div>
  )
}
