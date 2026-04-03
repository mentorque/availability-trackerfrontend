import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LogOut, 
  Calendar, 
  Users, 
  History, 
  LayoutDashboard, 
  Clock, 
  ShieldCheck,
  User as UserIcon
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * Layout - Shared layout wrapper for authenticated pages
 * 
 * @param {ReactNode} children - Page content to render
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isMentorRoute = location.pathname.startsWith("/mentor");
  const email = user?.email ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col selection:bg-white selection:text-black">
      <header className="border-b border-white/[0.08] bg-black/50 backdrop-blur-2xl sticky top-0 z-40">
        <div className="w-full px-8 h-16 flex items-center justify-between max-w-7xl mx-auto">
          {/* Admin Header */}
          {isAdminRoute && user?.role === "ADMIN" ? (
            <>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/admin")}>
                  <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <ShieldCheck className="w-5 h-5 text-black" strokeWidth={2.5} />
                  </div>
                  <span className="text-white font-black text-xs uppercase tracking-[0.2em] hidden md:block">
                    Mentorque <span className="text-slate-500 font-medium">Platform</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <nav className="flex items-center gap-2">
                  <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                        isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div 
                            layoutId="nav-pill-admin"
                            className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                          />
                        )}
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                      </>
                    )}
                  </NavLink>
                  <NavLink
                    to="/admin/calls"
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                        isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div 
                            layoutId="nav-pill-admin"
                            className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                          />
                        )}
                        <History className="w-3.5 h-3.5" />
                        Archive
                      </>
                    )}
                  </NavLink>
                </nav>
                <div className="h-6 w-[1px] bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  Exit
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
                   <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <span className="text-black font-black text-sm">M</span>
                  </div>
                  <span className="text-white font-black text-xs uppercase tracking-[0.2em] hidden sm:block">
                    Mentorque
                  </span>
                </div>
                <nav className="flex items-center gap-2">
                  {/* User Links */}
                  {(user?.role === "USER") && (
                    <>
                      <NavLink
                        to="/user"
                        end
                        className={({ isActive }) =>
                          `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                            isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.div 
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                              />
                            )}
                            <Clock className="w-3.5 h-3.5" />
                            Availability
                          </>
                        )}
                      </NavLink>
                      <NavLink
                        to="/user/calls"
                        className={({ isActive }) =>
                          `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                            isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                          }`
                        }
                      >
                         {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.div 
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                              />
                            )}
                            <Calendar className="w-3.5 h-3.5" />
                            Sessions
                          </>
                        )}
                      </NavLink>
                    </>
                  )}
                  
                  {/* Mentor Links */}
                  {user?.role === "MENTOR" && (
                    <>
                      <NavLink
                        to="/mentor"
                        end
                        className={({ isActive }) =>
                          `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                            isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.div 
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                              />
                            )}
                            <Clock className="w-3.5 h-3.5" />
                            Availability
                          </>
                        )}
                      </NavLink>
                      <NavLink
                        to="/mentor/calls"
                        className={({ isActive }) =>
                          `relative flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl group ${
                            isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.div 
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white/10 rounded-xl -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                              />
                            )}
                            <Calendar className="w-3.5 h-3.5" />
                            Sessions
                          </>
                        )}
                      </NavLink>
                    </>
                  )}
                </nav>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden md:flex">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest">{user?.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">{user?.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-[#0A0A0A] border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 rounded-xl hover:bg-[#151515] hover:text-white hover:border-white/10 transition-all active:scale-95 shadow-xl shadow-black"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-12">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>
      
      <footer className="border-t border-white/[0.05] bg-black">
        <div className="w-full max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                <span className="text-[8px] font-black text-white">M</span>
             </div>
             <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
               © 2026 MENTORQUE. BUILT FOR SCALE & INTERACTION.
             </div>
          </div>
          <div className="flex items-center gap-10 text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-all">SYSTEM STATUS</a>
            <a href="#" className="hover:text-white transition-all">LEGAL PROTOCOLS</a>
            <a href="#" className="hover:text-white transition-all">SECURITY WALL</a>
          </div>
        </div>
      </footer>
    </div>
  );
}