import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from '@/store/themeStore'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import MiniGamesPublic from '@/pages/MiniGamesPublic'
import ResourcesPublic from '@/pages/ResourcesPublic'
import Entertainment from '@/pages/Entertainment'
import DocumentsPublic from '@/pages/DocumentsPublic'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminMiniGames from '@/pages/admin/AdminMiniGames'
import AdminResources from '@/pages/admin/AdminResources'
import AdminEntertainment from '@/pages/admin/AdminEntertainment'
import AdminDocuments from '@/pages/admin/AdminDocuments'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mini-game" element={<MiniGamesPublic />} />
        <Route path="/tai-nguyen" element={<ResourcesPublic />} />
        <Route path="/giai-tri" element={<Entertainment />} />
        <Route path="/tai-lieu" element={<DocumentsPublic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPassword />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="mini-game" element={<AdminMiniGames />} />
        <Route path="tai-nguyen" element={<AdminResources />} />
        <Route path="giai-tri" element={<AdminEntertainment />} />
        <Route path="tai-lieu" element={<AdminDocuments />} />
        <Route path="cai-dat" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}
