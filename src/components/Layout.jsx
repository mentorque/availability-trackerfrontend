import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  console.log("Layout user:", user);
  const email = user?.email ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
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
