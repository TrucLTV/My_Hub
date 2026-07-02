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
    bg: 'bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/20',
    iconBg: 'bg-sky-500/15 shadow-[0_0_20px_-4px] shadow-sky-500/50',
    iconText: 'text-sky-600 dark:text-sky-400',
    hoverShadow: 'hover:shadow-sky-500/30',
    gradient: 'from-sky-500',
  },
  violet: {
    border: 'border-t-violet-500',
    bg: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/40 dark:to-violet-900/20',
    iconBg: 'bg-violet-500/15 shadow-[0_0_20px_-4px] shadow-violet-500/50',
    iconText: 'text-violet-600 dark:text-violet-400',
    hoverShadow: 'hover:shadow-violet-500/30',
    gradient: 'via-violet-500',
  },
  amber: {
    border: 'border-t-amber-500',
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20',
    iconBg: 'bg-amber-500/15 shadow-[0_0_20px_-4px] shadow-amber-500/50',
    iconText: 'text-amber-600 dark:text-amber-400',
    hoverShadow: 'hover:shadow-amber-500/30',
    gradient: 'via-amber-500',
  },
  emerald: {
    border: 'border-t-emerald-500',
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20',
    iconBg: 'bg-emerald-500/15 shadow-[0_0_20px_-4px] shadow-emerald-500/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    hoverShadow: 'hover:shadow-emerald-500/30',
    gradient: 'to-emerald-500',
  },
}

const sections = [
  { key: 'documents', title: 'Tài liệu', href: '/tai-lieu', icon: FolderOpen, accent: 'emerald', queryFn: fetchPublicDocuments },
  { key: 'notes', title: 'Ghi chú', href: '/ghi-chu', icon: NotebookPen, accent: 'sky', queryFn: fetchPublicNotes },
  { key: 'media_tracker', title: 'Phim/Game', href: '/phim-game', icon: Clapperboard, accent: 'amber', queryFn: fetchPublicMedia },
  { key: 'resources', title: 'Tài nguyên', href: '/tai-nguyen', icon: Link2, accent: 'violet', queryFn: fetchPublicResources },
]

function CategoryCard({ title, href, icon: Icon, accent, queryFn }) {
  const { data, isLoading } = useQuery({ queryKey: [queryFn.name, 'public', ''], queryFn: () => queryFn() })
  const recent = (data ?? []).slice(0, 3)
  const colors = accentClasses[accent]

  return (
    <Card
      className={`w-80 shrink-0 border-t-4 ${colors.border} ${colors.bg} ${colors.hoverShadow} cursor-default transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[1.2rem]">
          <span className={`flex size-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <Icon className="size-5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-20">
        {isLoading && <p className="text-[1.05rem] text-muted-foreground">Đang tải...</p>}
        {!isLoading && !recent.length && (
          <p className="text-[1.05rem] text-muted-foreground">Chưa có nội dung công khai.</p>
        )}
        <ul className="space-y-1.5">
          {recent.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-[1.05rem]">
              <span className="truncate">{item.title}</span>
              {(item.tags ?? item.genre ?? []).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="shrink-0 text-[0.9rem]">{tag}</Badge>
              ))}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link
          to={href}
          className="flex items-center gap-1 text-[1.05rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          Xem tất cả
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="-mt-4 space-y-8">
      <div className="relative flex w-screen mx-[calc(50%-50vw)] flex-col items-center justify-center bg-gradient-to-b from-blue-950 via-blue-950 to-slate-950 px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">MyHub</h1>
        <p className="mx-auto mt-3 max-w-md text-blue-200/70">
          Nơi lưu tài liệu công việc, ghi chú cá nhân, theo dõi phim/game và tài nguyên hữu ích.
        </p>
        <div className="mx-auto mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-amber-500" />
      </div>
      <div className="relative w-screen mx-[calc(50%-50vw)]">
        <div className="mx-auto max-w-[1400px] overflow-x-auto px-4 pb-2">
          <div className="mx-auto flex w-fit gap-4">
            {sections.map(({ key, ...section }) => (
              <CategoryCard key={key} {...section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
