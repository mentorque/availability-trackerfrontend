import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserAvailability from "./pages/UserAvailability";
import MentorAvailability from "./pages/MentorAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import AdminScheduling from "./pages/AdminScheduling";
import AdminSettings from "./pages/AdminSettings";

/**
 * LoadingScreen - Show while auth state is loading
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="text-slate-400">Loading...</div>
    </div>
  );
}

/**
 * ProtectedRoute - Guard routes with auth and role checks
 * 
 * @param {ReactNode} children - Route component to render
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} fallbackPath - Path to redirect if access denied (default: /login)
 */
function ProtectedRoute({ children, allowedRoles = [], fallbackPath = "/login" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  // Authenticated but wrong role - redirect to fallback
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Authenticated and authorized - render route
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role-based Dashboards */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
            <Layout>
              <Routes>
                <Route path="/" element={<UserAvailability />} />
                <Route path="*" element={<Navigate to="/user" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mentor/*"
        element={
          <ProtectedRoute allowedRoles={["MENTOR"]}>
            <Layout>
              <Routes>
                <Route path="/" element={<MentorAvailability />} />
                <Route path="*" element={<Navigate to="/mentor" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="scheduling" element={<AdminScheduling />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all & redirects */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * RootRedirect - Handle / path by redirecting based on auth state
 */
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to role-specific dashboard
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === "MENTOR") {
    return <Navigate to="/mentor" replace />;
  }
  // USER and others
  return <Navigate to="/user" replace />;
}
