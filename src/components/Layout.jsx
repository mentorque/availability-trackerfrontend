import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SSO_WELCOME_MODAL_KEY = "sso_show_welcome_modal";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const email = user?.email ?? "";

  const [welcomeModal, setWelcomeModal] = useState(null);
  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem(SSO_WELCOME_MODAL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem(SSO_WELCOME_MODAL_KEY);
      setWelcomeModal({ email: data.email || user.email || "—", role: data.role || user.role || "—" });
      const t = setTimeout(() => setWelcomeModal(null), 2500);
      return () => clearTimeout(t);
    } catch (_) {}
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {welcomeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-sm p-4">
          <div
            className="bg-navy-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
          >
            <div className="flex justify-center mb-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400" aria-hidden>
                <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </div>
            <p id="welcome-modal-title" className="text-slate-400 text-lg mb-6">
              Logged in as
            </p>
            <p className="text-white text-xl sm:text-2xl mb-3 break-all">
              {welcomeModal.email}
            </p>
            <p className="text-blue-400 text-xl sm:text-2xl font-semibold">
              {welcomeModal.role}
            </p>
          </div>
        </div>
      )}
      <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {isAdminRoute && user?.role === "ADMIN" ? (
            <>
              <div className="flex items-center gap-3">
  <button
    type="button"
    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800"
    aria-label="Menu"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <div className="flex items-center gap-2">
    <img
      src="/mentorque-logo.png.jpeg"
      alt="MentorQue"
      className="h-8 w-8 object-contain"
    />
    <span className="text-white font-medium">
      Mentorque Availability Tracker
    </span>
  </div>
</div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-slate-300">ADMIN</span>
                {email && (
                  <span className="text-slate-400 text-sm mr-2">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
  <div className="flex items-center gap-4">
    <img
      src="/mentorque-logo.png.jpeg"
      alt="MentorQue"
      className="h-8 w-8 object-contain"
    />
    <nav className="flex items-center gap-6">
                <NavLink
                  to={user?.role === "MENTOR" ? "/mentor" : "/availability"}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"}`
                  }
                >
                  My Availability
                </NavLink>
                {user?.role === "ADMIN" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `text-sm font-medium ${isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"}`
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </nav>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-slate-300">{user?.role}</span>
                {email && (
                  <span className="text-slate-400 text-sm mr-2">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
