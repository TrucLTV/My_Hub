import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import NotesPublic from '@/pages/NotesPublic'
import ResourcesPublic from '@/pages/ResourcesPublic'
import MediaTracker from '@/pages/MediaTracker'
import DocumentsPublic from '@/pages/DocumentsPublic'
import Login from '@/pages/Login'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminNotes from '@/pages/admin/AdminNotes'
import AdminResources from '@/pages/admin/AdminResources'
import AdminMedia from '@/pages/admin/AdminMedia'
import AdminDocuments from '@/pages/admin/AdminDocuments'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ghi-chu" element={<NotesPublic />} />
        <Route path="/tai-nguyen" element={<ResourcesPublic />} />
        <Route path="/phim-game" element={<MediaTracker />} />
        <Route path="/tai-lieu" element={<DocumentsPublic />} />
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
        <Route path="phim-game" element={<AdminMedia />} />
        <Route path="tai-lieu" element={<AdminDocuments />} />
      </Route>
    </Routes>
  )
}
