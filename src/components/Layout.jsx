import { Link, Outlet } from 'react-router-dom'
import { Sparkles, Terminal } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export const CPP_EDU_HUB_URL = 'http://localhost:8080/frontend/'

const navTabClass =
  'rounded-lg border-t-4 border-t-orange-400 border-x border-b border-white/10 bg-white/5 px-3 py-1.5 text-sm text-blue-200/80 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-t-orange-300 hover:text-white hover:shadow-lg hover:shadow-orange-500/30'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col overflow-x-hidden">
      <header className="bg-blue-950 border-b border-white/10">
        <nav className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 p-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 px-1">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/30">
              <Sparkles className="size-4" />
            </span>
            <span className="font-semibold text-white">MyHub</span>
          </Link>
          <div className="flex flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap sm:justify-end">
            <Link to="/tai-lieu" className={navTabClass}>Tài liệu</Link>
            <Link to="/mini-game" className={navTabClass}>Mini game</Link>
            <Link to="/tai-nguyen" className={navTabClass}>Ngân hàng câu hỏi</Link>
            <Link to="/phim-game" className={navTabClass}>Giải trí</Link>
            <a
              href={CPP_EDU_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${navTabClass} flex items-center gap-1.5`}
              title="Mở CPP-EDU-HUB (cần server đang chạy trên máy bạn)"
            >
              <Terminal className="size-3.5" />
              Công cụ C++
            </a>
          </div>
          <ThemeToggle className="shrink-0 text-blue-200/80 hover:bg-white/10 hover:text-white" />
        </nav>
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
