import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b">
        <nav className="max-w-3xl mx-auto flex gap-4 p-4 text-sm">
          <Link to="/" className="font-semibold">MyHub</Link>
          <Link to="/ghi-chu">Ghi chú</Link>
          <Link to="/tai-nguyen">Tài nguyên</Link>
          <Link to="/phim-game">Phim/Game</Link>
          <Link to="/tai-lieu">Tài liệu</Link>
        </nav>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
