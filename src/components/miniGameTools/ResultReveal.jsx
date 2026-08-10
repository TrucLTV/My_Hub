import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { playDing } from '@/lib/gameSound'
import ConfettiBurst from '@/components/miniGameTools/ConfettiBurst'

// Thẻ hiển thị kết quả dùng chung cho mọi mini game "Gọi tên ngẫu nhiên":
// chữ to, tương phản cao (dễ nhìn từ xa khi trình chiếu), tự nổ confetti +
// phát âm thanh mỗi khi có kết quả mới (nhận biết qua `resultKey` đổi giá trị).
const ACCENTS = {
  amber: 'from-amber-400 to-amber-600',
  emerald: 'from-emerald-400 to-emerald-600',
  violet: 'from-violet-400 to-violet-600',
  sky: 'from-sky-400 to-sky-600',
}

export default function ResultReveal({ icon, name, subtitle, accent = 'amber', resultKey }) {
  const lastPlayedRef = useRef(null)

  useEffect(() => {
    if (resultKey == null || lastPlayedRef.current === resultKey) return
    lastPlayedRef.current = resultKey
    playDing()
  }, [resultKey])

  if (resultKey == null) return null

  return (
    <div className="relative mx-auto flex w-fit flex-col items-center gap-3 py-2">
      <ConfettiBurst triggerKey={resultKey} />
      <span
        className={cn(
          'flex size-20 shrink-0 animate-in items-center justify-center rounded-full bg-gradient-to-br text-3xl font-bold text-white shadow-xl shadow-black/40 zoom-in-50 slide-in-from-top-10 duration-500',
          ACCENTS[accent] ?? ACCENTS.amber
        )}
      >
        {icon}
      </span>
      <span className="animate-in rounded-2xl border-t-4 border-t-orange-400 bg-card px-8 py-3 text-center text-2xl font-bold shadow-xl fade-in-0 duration-500 sm:text-3xl">
        {subtitle && <span className="mr-2 text-muted-foreground">{subtitle}</span>}
        {name}
      </span>
    </div>
  )
}
