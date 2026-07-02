import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const location = useLocation()
  const isRoot = location.pathname === '/admin'

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="max-w-[1600px] mx-auto flex items-center justify-between p-4 text-sm">
          <div className="flex gap-4">
            <Link to="/admin/ghi-chu">Ghi chú</Link>
            <Link to="/admin/tai-nguyen">Tài nguyên</Link>
            <Link to="/admin/phim-game">Phim/Game</Link>
            <Link to="/admin/tai-lieu">Tài liệu</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut}>Đăng xuất</Button>
          </div>
        </nav>
      </header>
      <main className="max-w-[1600px] mx-auto p-4">
        {isRoot ? <p className="text-muted-foreground">Chọn 1 mục để quản lý.</p> : <Outlet />}
      </main>
    </div>
  )
}
