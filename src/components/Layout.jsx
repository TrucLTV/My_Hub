import { Link, Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col overflow-x-hidden">
      <header className="bg-blue-950">
        <nav className="max-w-3xl mx-auto flex items-center justify-between gap-4 p-4 text-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold text-white">MyHub</Link>
            <Link to="/ghi-chu" className="text-blue-200/80 hover:text-white">Ghi chú</Link>
            <Link to="/tai-nguyen" className="text-blue-200/80 hover:text-white">Tài nguyên</Link>
            <Link to="/phim-game" className="text-blue-200/80 hover:text-white">Phim/Game</Link>
            <Link to="/tai-lieu" className="text-blue-200/80 hover:text-white">Tài liệu</Link>
          </div>
          <ThemeToggle className="text-blue-200/80 hover:bg-white/10 hover:text-white" />
        </nav>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
