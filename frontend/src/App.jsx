import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const EventList = lazy(() => import('./pages/EventList'))
const EventLive = lazy(() => import('./pages/EventLive'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function RouteLoader() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)' }}>
      Loading...
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/events" replace />
  return children
}

function Layout({ children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Navbar />
      <main style={{ flex:1 }}>{children}</main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/events" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/events" /> : <Register />} />
        <Route path="/events" element={
          <ProtectedRoute><Layout><EventList /></Layout></ProtectedRoute>
        } />
        <Route path="/events/:id/live" element={
          <ProtectedRoute><Layout><EventLive /></Layout></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? '/events' : '/login'} />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
