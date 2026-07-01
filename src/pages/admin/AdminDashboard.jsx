import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const location = useLocation()
  const isRoot = location.pathname === '/admin'

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="max-w-3xl mx-auto flex items-center justify-between p-4 text-sm">
          <div className="flex gap-4">
            <Link to="/admin/ghi-chu">Ghi chú</Link>
            <Link to="/admin/tai-nguyen">Tài nguyên</Link>
            <Link to="/admin/phim-game">Phim/Game</Link>
            <Link to="/admin/tai-lieu">Tài liệu</Link>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Đăng xuất</Button>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        {isRoot ? <p className="text-muted-foreground">Chọn 1 mục để quản lý.</p> : <Outlet />}
      </main>
    </div>
  )
}
