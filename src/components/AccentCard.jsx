import { Card } from '@/components/ui/card'
import { accentClasses } from '@/lib/accentColors'
import { cn } from '@/lib/utils'

export default function AccentCard({ accent, className, children, ...props }) {
  const colors = accentClasses[accent]

  return (
    <Card
      className={cn(
        'border-t-4 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl',
        colors.border,
        colors.bg,
        colors.hoverShadow,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
