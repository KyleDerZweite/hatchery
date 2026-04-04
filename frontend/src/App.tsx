import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthCallback, useAuth } from "./lib/auth";
import { MockupIndex } from "./mockups/projects";
import { DashboardPage } from "./pages/DashboardPage";
import { EggDetailPage } from "./pages/EggDetailPage";
import { EggsPage } from "./pages/EggsPage";
import { LoginPage } from "./pages/LoginPage";
import { PanelsPage } from "./pages/PanelsPage";
import { SettingsPage } from "./pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the intended destination for redirect after login
    sessionStorage.setItem("auth_redirect", location.pathname);
    login();
    return null;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* OIDC Callback */}
      <Route path="/callback" element={<AuthCallback />} />

      {/* Mockup routes (public, no auth) */}
      <Route path="/mockups" element={<MockupIndex />} />
      <Route path="/mockups/:version" element={<MockupIndex />} />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
