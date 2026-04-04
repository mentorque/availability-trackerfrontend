import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/LoadingSkeleton";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      const path = user.role === "ADMIN" ? "/admin" : user.role === "MENTOR" ? "/mentor" : "/user";
      navigate(path, { replace: true });
    } catch (err) {
      setError(err.message || "Credential verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black relative">
      
      {/* Back to Home */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-10 left-10 flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all duration-500"
      >
        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-white/20 group-hover:translate-x-[-4px] transition-all duration-500">
           <ArrowLeft className="w-3 h-3" />
        </div>
        Back to Home
      </button>

      <div className="w-full max-w-[400px] space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] group transition-transform hover:scale-105 active:scale-95 duration-500 ${loading ? 'animate-pulse scale-95 opacity-80' : ''}`}>
             <div className="w-8 h-1 bg-black rounded-full rotate-45 translate-y-1" />
             <div className="w-8 h-1 bg-black rounded-full -rotate-45 -translate-y-1 -translate-x-4" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">MentorQue</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Access Only</p>
          </div>
        </div>

        {/* Authentication Wall */}
        <div className="premium-card p-10 space-y-8 backdrop-blur-3xl bg-[#050505]/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Identifier</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 text-sm text-white placeholder-slate-700 outline-none focus:border-white/20 transition-all duration-500"
                placeholder="Email Address"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 text-sm text-white placeholder-slate-700 outline-none focus:border-white/20 transition-all duration-500"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              className="group relative w-full h-12 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 overflow-hidden flex items-center justify-center"
            >
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center gap-2 text-black">
                    <div className="h-3 w-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Validating...
                  </div>
                ) : (
                  "Execute Entry"
                )}
              </span>
              <div className="absolute inset-0 bg-slate-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </form>
        </div>

        {/* Footer Nodes */}
        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="h-[1px] w-12 bg-[#1A1A1A]" />
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] hover:text-slate-500 transition cursor-default">
            Proprietary Architecture • v2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}
