import { Card } from '@/components/ui/card'
import { accentClasses } from '@/lib/accentColors'
import { cn } from '@/lib/utils'

export default function AccentCard({ accent, className, children, ...props }) {
  const colors = accentClasses[accent]

  return (
    <Card
      className={cn(
        'border-t-4 border-t-orange-400 ring-1 ring-slate-300/40 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl hover:ring-slate-200/60 hover:border-t-orange-300',
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
