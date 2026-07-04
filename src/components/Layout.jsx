import { Link, Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'

const navTabClass =
  'rounded-lg border-t-4 border-t-orange-400 border-x border-b border-white/10 bg-white/5 px-3 py-1.5 text-blue-200/80 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-t-orange-300 hover:text-white hover:shadow-lg hover:shadow-orange-500/30'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col overflow-x-hidden">
      <header className="bg-blue-950">
        <nav className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 p-4 text-sm sm:text-[1.3125rem]">
          <div className="flex flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap sm:justify-between sm:gap-3 sm:overflow-visible">
            <Link to="/" className="font-semibold text-white px-2">MyHub</Link>
            <Link to="/tai-lieu" className={navTabClass}>Tài liệu</Link>
            <Link to="/ghi-chu" className={navTabClass}>Mini game</Link>
            <Link to="/tai-nguyen" className={navTabClass}>Tài nguyên</Link>
            <Link to="/phim-game" className={navTabClass}>Giải trí</Link>
          </div>
          <ThemeToggle className="text-blue-200/80 hover:bg-white/10 hover:text-white" />
        </nav>
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
