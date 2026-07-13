import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AuthCallback, useAuth } from './lib/auth'
import { DashboardPage } from './pages/DashboardPage'
import { EggDetailPage } from './pages/EggDetailPage'
import { EggsPage } from './pages/EggsPage'
import { LoginPage } from './pages/LoginPage'
import { PanelsPage } from './pages/PanelsPage'
import { SettingsPage } from './pages/SettingsPage'

function PageLoader() {
  return (
    <div role="status" className="flex h-screen items-center justify-center">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    sessionStorage.setItem('auth_redirect', location.pathname)
    login()
    // Depending only on the auth state keeps this from re-firing on every render
    // while the identity provider redirect is in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return <PageLoader />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route path="/callback" element={<AuthCallback />} />
      <Route
        path="/login"
        element={
          isLoading ? (
            <PageLoader />
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="eggs" element={<EggsPage />} />
        <Route path="eggs/:id" element={<EggDetailPage />} />
        <Route path="panels" element={<PanelsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
