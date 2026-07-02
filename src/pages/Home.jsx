import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { NotebookPen, Link2, Clapperboard, FolderOpen, ArrowRight } from 'lucide-react'
import { fetchPublicNotes } from '@/lib/queries/notes'
import { fetchPublicResources } from '@/lib/queries/resources'
import { fetchPublicMedia } from '@/lib/queries/media'
import { fetchPublicDocuments } from '@/lib/queries/documents'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

const accentClasses = {
  sky: {
    border: 'border-t-sky-500',
    iconBg: 'bg-sky-500/10',
    iconText: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500',
  },
  violet: {
    border: 'border-t-violet-500',
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-600 dark:text-violet-400',
    gradient: 'via-violet-500',
  },
  amber: {
    border: 'border-t-amber-500',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    gradient: 'via-amber-500',
  },
  emerald: {
    border: 'border-t-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'to-emerald-500',
  },
}

const sections = [
  { key: 'notes', title: 'Ghi chú', href: '/ghi-chu', icon: NotebookPen, accent: 'sky', queryFn: fetchPublicNotes },
  { key: 'resources', title: 'Tài nguyên', href: '/tai-nguyen', icon: Link2, accent: 'violet', queryFn: fetchPublicResources },
  { key: 'media_tracker', title: 'Phim/Game', href: '/phim-game', icon: Clapperboard, accent: 'amber', queryFn: fetchPublicMedia },
  { key: 'documents', title: 'Tài liệu', href: '/tai-lieu', icon: FolderOpen, accent: 'emerald', queryFn: fetchPublicDocuments },
]

function CategoryCard({ title, href, icon: Icon, accent, queryFn }) {
  const { data, isLoading } = useQuery({ queryKey: [queryFn.name, 'public', ''], queryFn: () => queryFn() })
  const recent = (data ?? []).slice(0, 3)
  const colors = accentClasses[accent]

  return (
    <Card className={`border-t-4 ${colors.border} transition-shadow hover:shadow-md`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={`flex size-8 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
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
    <div className="-mt-4 space-y-8">
      <div className="relative flex min-h-svh w-screen mx-[calc(50%-50vw)] flex-col items-center justify-center bg-gradient-to-b from-blue-950 via-blue-950 to-slate-950 px-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">MyHub</h1>
        <p className="mx-auto mt-3 max-w-md text-blue-200/70">
          Nơi lưu tài liệu công việc, ghi chú cá nhân, theo dõi phim/game và tài nguyên hữu ích.
        </p>
        <div className="mx-auto mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-amber-500" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, ...section }) => (
          <CategoryCard key={key} {...section} />
        ))}
      </div>
    </div>
  )
}
