import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import UserAvailability from "./pages/UserAvailability";
import MentorAvailability from "./pages/MentorAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminMentors from "./pages/AdminMentors";

const LOGIN_PATH = "/login";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const loginTo = location.search ? `${LOGIN_PATH}${location.search}` : LOGIN_PATH;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F8F7' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginTo} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const loginTo = location.search ? `${LOGIN_PATH}${location.search}` : LOGIN_PATH;
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F8F7' }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to={loginTo} replace />;
  if (user.role === "MENTOR") return <Navigate to="/mentor" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to="/user" replace />;
}

function NormalizePathname({ children }) {
  const location = useLocation();
  const pathname = location.pathname;
  if (pathname.startsWith("//")) {
    const fixed = pathname.replace(/\/+/g, "/") + location.search;
    return <Navigate to={fixed} replace />;
  }
  return children;
}

export default function App() {
  return (
    <NormalizePathname>
      <Routes>
        <Route path={LOGIN_PATH} element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Full-page layouts (have their own sidebar/header) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
              <UserAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor"
          element={
            <ProtectedRoute allowedRoles={["MENTOR"]}>
              <MentorAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Sub-routes that use Layout wrapper */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultRedirect />} />
          <Route
            path="admin/mentors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminMentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NormalizePathname>
  );
}
