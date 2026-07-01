import { Badge } from '@/components/ui/badge'

export default function TagFilter({ tags, selected, onToggle }) {
  if (!tags?.length) return null

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant={selected.includes(tag) ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onToggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
