import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AccentCard from '@/components/AccentCard'

export default function ContentCard({ title, description, tags, accent = 'sky', children }) {
  return (
    <AccentCard accent={accent} className="cursor-default">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
