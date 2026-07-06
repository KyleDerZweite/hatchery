import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthCallback, useAuth } from "./lib/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { EggDetailPage } from "./pages/EggDetailPage";
import { EggsPage } from "./pages/EggsPage";
import { LoginPage } from "./pages/LoginPage";
import { PanelsPage } from "./pages/PanelsPage";
import { SettingsPage } from "./pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();
  // Guard so signinRedirect fires once, not on every re-render while unauthenticated
  const redirecting = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      // Store the intended destination for redirect after login
      sessionStorage.setItem("auth_redirect", location.pathname);
      login();
    }
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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
      <Route path="/callback" element={<AuthCallback />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
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
  );
}

export default App;
