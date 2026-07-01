import { Link, Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b">
        <nav className="max-w-3xl mx-auto flex items-center justify-between gap-4 p-4 text-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold">MyHub</Link>
            <Link to="/ghi-chu">Ghi chú</Link>
            <Link to="/tai-nguyen">Tài nguyên</Link>
            <Link to="/phim-game">Phim/Game</Link>
            <Link to="/tai-lieu">Tài liệu</Link>
          </div>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
