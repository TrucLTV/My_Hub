import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import NotesPublic from '@/pages/NotesPublic'
import ResourcesPublic from '@/pages/ResourcesPublic'
import Login from '@/pages/Login'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminNotes from '@/pages/admin/AdminNotes'
import AdminResources from '@/pages/admin/AdminResources'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ghi-chu" element={<NotesPublic />} />
        <Route path="/tai-nguyen" element={<ResourcesPublic />} />
        <Route path="/login" element={<Login />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="ghi-chu" element={<AdminNotes />} />
        <Route path="tai-nguyen" element={<AdminResources />} />
      </Route>
    </Routes>
  )
}
