import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import FreelancersPage from './pages/FreelancersPage'
import ClientsPage from './pages/ClientsPage'
import CoursesPage from './pages/CoursesPage'
import ProjectsPage from './pages/ProjectsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/freelancers" element={<FreelancersPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
