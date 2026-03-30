import { useState, useEffect } from "react";
import { ChevronLeft, Bell } from "lucide-react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui";
import "../styles/design-system.css";

const SSO_WELCOME_MODAL_KEY = "sso_show_welcome_modal";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [welcomeModal, setWelcomeModal] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SSO_WELCOME_MODAL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem(SSO_WELCOME_MODAL_KEY);
      setWelcomeModal({ email: data.email || "—", role: data.role || "—" });
      const t = setTimeout(() => setWelcomeModal(null), 2500);
      return () => clearTimeout(t);
    } catch (_) {}
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const email = user?.email ?? "";

  const navLinkStyle = (isActive) => ({
    fontSize: '13px',
    fontWeight: 500,
    color: isActive ? '#1A1A2E' : '#9CA3AF',
    padding: '5px 10px',
    borderRadius: '7px',
    background: isActive ? '#F1F0EE' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.12s',
  });

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)', overflow: 'hidden' }}>
      {welcomeModal && <WelcomeModal modal={welcomeModal} onDismiss={() => setWelcomeModal(null)} />}

      {/* Sidebar */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: 'var(--sidebar-width)', background: 'var(--color-primary)' }}>
        <div className="p-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-heading" style={{ color: '#fff', fontWeight: 500, letterSpacing: '-0.02em' }}>
            MentorQue
          </div>
          <div className="text-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>
            Admin console
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Settings
          </div>
          <NavLink
            to="/admin/mentors"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: isActive ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            })}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 7a3 3 0 11-6 0 3 3 0 016 0zM4 14a5 5 0 0110 0"/>
              <path d="M14 12a3 3 0 00-3-3"/>
            </svg>
            Mentors
          </NavLink>
          <NavLink
            to="/admin/settings"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: isActive ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            })}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3l2 2"/>
            </svg>
            Settings
          </NavLink>
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Back to
          </div>
          <NavLink
            to="/admin"
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="2" y="2" width="6" height="6" rx="1"/>
            </svg>
            Dashboard
          </NavLink>
        </nav>

        {/* User profile & Logout */}
        <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar name={user?.name} email={user?.email} size="sm" color="gray" />
            <div className="flex-1 min-w-0">
              <div className="text-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {user?.name}
              </div>
              <div className="text-mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                Program manager
              </div>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-label rounded-lg transition"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}
            onClick={handleLogout}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2L7 4M7 4L9 6M7 4H12M12 14H4a2 2 0 01-2-2V4a2 2 0 012-2h3"/>
              <path d="M14 8l-3-3M14 8l-3 3M14 8H8"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[52px] flex items-center justify-between px-5 flex-shrink-0" style={{
          background: 'var(--color-card)',
          borderBottom: '0.5px solid var(--color-border)'
        }}>
          <div className="flex items-center gap-3">
            <NavLink to="/admin" style={navLinkStyle(false)}>
              <span className="flex items-center gap-1"><ChevronLeft size={16} /> Dashboard</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]" style={{ background: 'var(--color-border-light)' }}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function WelcomeModal({ modal, onDismiss }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(248,248,247,0.95)', backdropFilter: 'blur(4px)',
        cursor: 'pointer',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: '#fff',
          border: '0.5px solid #E5E5E3',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(26, 26, 46, 0.1)',
        }}
      >
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="22" height="22" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>Signed in as</div>
        <div style={{ fontSize: '18px', fontWeight: 500, color: '#1A1A2E', marginBottom: '8px', wordBreak: 'break-all' }}>
          {modal.email}
        </div>
        <div style={{
          display: 'inline-flex',
          fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#4338CA', background: '#EEF2FF',
          padding: '4px 12px', borderRadius: '100px',
        }}>
          {modal.role}
        </div>
        <div style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '20px' }}>Click anywhere to continue</div>
      </div>
    </div>
  );
}
