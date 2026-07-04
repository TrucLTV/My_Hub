import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AccentCard from '@/components/AccentCard'
import { accentClasses } from '@/lib/accentColors'

export default function ContentCard({ title, description, tags, accent = 'sky', icon: Icon, children }) {
  const colors = accentClasses[accent]
  return (
    <AccentCard accent={accent} className="cursor-default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && (
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
              <Icon className="size-4" />
            </span>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        {children}
      </CardContent>
    </AccentCard>
  )
}
