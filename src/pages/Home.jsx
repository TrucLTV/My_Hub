import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { NotebookPen, Link2, Clapperboard, FolderOpen, ArrowRight, Sparkles } from 'lucide-react'
import { fetchPublicNotes } from '@/lib/queries/notes'
import { fetchPublicResources } from '@/lib/queries/resources'
import { fetchPublicMedia } from '@/lib/queries/media'
import { fetchPublicDocuments } from '@/lib/queries/documents'
import { accentClasses } from '@/lib/accentColors'
import { timeAgo } from '@/lib/timeAgo'
import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import AccentCard from '@/components/AccentCard'

const textColor = {
  sky: 'text-sky-400',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
}

const sections = [
  { key: 'documents', title: 'Tài liệu', href: '/tai-lieu', icon: FolderOpen, accent: 'emerald', queryFn: fetchPublicDocuments },
  { key: 'notes', title: 'Mini game', href: '/ghi-chu', icon: NotebookPen, accent: 'sky', queryFn: fetchPublicNotes },
  { key: 'resources', title: 'Tài nguyên', href: '/tai-nguyen', icon: Link2, accent: 'violet', queryFn: fetchPublicResources },
  { key: 'media_tracker', title: 'Giải trí', href: '/phim-game', icon: Clapperboard, accent: 'amber', queryFn: fetchPublicMedia },
]

function useSectionData(section) {
  const { data, isLoading } = useQuery({ queryKey: [section.queryFn.name, 'public', ''], queryFn: () => section.queryFn() })
  return { data: data ?? [], isLoading }
}

function CategoryCard({ title, href, icon: Icon, accent, data, isLoading }) {
  const recent = data.slice(0, 3)
  const colors = accentClasses[accent]

  return (
    <AccentCard accent={accent} className="w-80 shrink-0 cursor-default">
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
    </AccentCard>
  )
}

function StatTile({ label, value, accent = 'sky', highlight = false }) {
  return (
    <AccentCard accent={accent} className="cursor-default items-center gap-1 px-6 py-4 text-center">
      <p className={`text-3xl font-bold ${highlight ? 'text-white' : textColor[accent]}`}>{value}</p>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
    </AccentCard>
  )
}

export default function Home() {
  const bySection = sections.map((section) => ({ ...section, ...useSectionData(section) }))
  const total = bySection.reduce((sum, s) => sum + s.data.length, 0)

  const recentItems = bySection
    .flatMap((s) => s.data.map((item) => ({ ...item, __section: s })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  return (
    <div className="-mt-4 space-y-8">
      <div className="relative flex w-screen mx-[calc(50%-50vw)] flex-col items-center justify-center bg-gradient-to-b from-blue-950 via-blue-950 to-slate-950 px-6 py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">MyHub</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-blue-200/70">
          Nơi lưu tài liệu công việc, ghi chú cá nhân, theo dõi phim/game và tài nguyên hữu ích.
        </p>
        <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-amber-500" />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <StatTile label="Tổng cộng" value={total} highlight />
        {bySection.map((s) => (
          <StatTile key={s.key} label={s.title} value={s.data.length} accent={s.accent} />
        ))}
      </div>

      {recentItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Sparkles className="size-4" /> Cập nhật gần đây
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentItems.map((item) => {
              const colors = accentClasses[item.__section.accent]
              const Icon = item.__section.icon
              return (
                <Link
                  key={`${item.__section.key}-${item.id}`}
                  to={item.__section.href}
                  className={`flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20`}
                >
                  <span className={`flex size-5 items-center justify-center rounded-full ${colors.iconBg} ${colors.iconText}`}>
                    <Icon className="size-3" />
                  </span>
                  <span className="max-w-40 truncate font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="relative w-screen mx-[calc(50%-50vw)]">
        <div className="mx-auto max-w-[1400px] overflow-x-auto px-4 pb-2">
          <div className="mx-auto flex w-fit gap-4">
            {bySection.map(({ key, ...section }) => (
              <CategoryCard key={key} {...section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
