import { useState, useEffect, useCallback, useMemo } from "react";
import { DateTime } from "luxon";
import { useAuth } from "../context/AuthContext";
import * as callsApi from "../api/calls";
import { formatDateLocal, formatTimeLocal, isPastDateTime } from "../utils/time";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

const CALL_TYPE_LABELS = {
  RESUME_REVAMP: "Resume Revamp",
  JOB_MARKET_GUIDANCE: "Job Market Guidance",
  MOCK_INTERVIEW: "Mock Interview",
};

const STATUS_CONFIGS = {
  SCHEDULED:   { bg: "bg-blue-600/10",   border: "border-blue-600/20",   text: "text-blue-400",   label: "Scheduled" },
  COMPLETED:   { bg: "bg-emerald-600/10",  border: "border-emerald-600/20",  text: "text-emerald-400",  label: "Completed" },
  CANCELLED:   { bg: "bg-rose-600/10",    border: "border-rose-600/20",    text: "text-rose-400",    label: "Cancelled" },
  IN_PROGRESS: { bg: "bg-amber-600/10", border: "border-amber-600/20", text: "text-amber-400", label: "In Progress" },
};

const DEFAULT_STATUS = { bg: "bg-slate-600/10", border: "border-slate-600/20", text: "text-slate-400", label: "Unknown" };

export default function CallsDashboard() {
  const { user: authUser } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayTimezone, setDisplayTimezone] = useState("IST");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => { loadCalls(); }, []);

  const loadCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await callsApi.listCalls();
      setCalls(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCallStatus = (call) => {
    if (call.status === "CANCELLED") return "CANCELLED";
    if (call.status === "COMPLETED") return "COMPLETED";
    if (call.startTime && call.endTime) {
      const now = DateTime.now().toUTC();
      const startTime = DateTime.fromISO(call.startTime, { zone: "utc" });
      const endTime = DateTime.fromISO(call.endTime, { zone: "utc" });
      if (now < startTime) return "SCHEDULED";
      if (now >= startTime && now < endTime) return "IN_PROGRESS";
      if (now >= endTime) return "COMPLETED";
    }
    return call.status?.toUpperCase() || "SCHEDULED";
  };

  const filteredCalls = useMemo(() => {
    let result = [...calls];
    
    // Role filter
    if (authUser?.role === "USER") {
      result = result.filter(c => c.userId === authUser.id);
    } else if (authUser?.role === "MENTOR") {
      result = result.filter(c => c.mentorId === authUser.id);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(c => getCallStatus(c) === statusFilter.toUpperCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.user?.name || "").toLowerCase().includes(q) || 
        (c.mentor?.name || "").toLowerCase().includes(q) || 
        (c.title || "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }
    
    return result;
  }, [calls, authUser, statusFilter, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: filteredCalls.length,
    scheduled: filteredCalls.filter(c => getCallStatus(c) === "SCHEDULED").length,
    completed: filteredCalls.filter(c => getCallStatus(c) === "COMPLETED").length,
  }), [filteredCalls]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Activity Registry</div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            {authUser?.role === "MENTOR" ? "Session Log" : "My Calls"}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Historical archive of platform interactions</p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#1A1A1A] p-1 rounded-lg">
             <button onClick={loadCalls} className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition">Refresh Registry</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Aggregate Sessions", value: stats.total, icon: "📊" },
          { label: "Upcoming Syncs", value: stats.scheduled, icon: "🗓️" },
          { label: "Successful Rounds", value: stats.completed, icon: "✅" }
        ].map(s => (
          <div key={s.label} className="premium-card p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
            <div className="text-2xl opacity-50">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-4 border-b border-[#1A1A1A] bg-[#0A0A0A] flex flex-wrap items-center gap-4">
          <input 
            type="text" 
            placeholder="Search identifier..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-2 text-xs text-white focus:border-white/20 outline-none flex-1 min-w-[200px]"
          />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-2 text-xs text-white outline-none"
          >
            <option value="all">All States</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
              <p className="text-[9px] font-black text-slate-600 tracking-widest uppercase">Fetching Records...</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <p className="text-xs font-black uppercase tracking-widest">Registry Empty</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#1A1A1A]">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Participant Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Chronology</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Verification</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map(call => {
                  const status = getCallStatus(call);
                  const config = STATUS_CONFIGS[status] || DEFAULT_STATUS;
                  return (
                    <tr key={call.id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#1A1A1A] flex items-center justify-center font-black text-xs text-slate-500 group-hover:text-white transition">
                            {authUser?.role === "MENTOR" ? call.user?.name?.[0] : call.mentor?.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{authUser?.role === "MENTOR" ? call.user?.name : call.mentor?.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{authUser?.role === "MENTOR" ? call.user?.email : call.mentor?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-300">{DateTime.fromISO(call.startTime).toFormat("LLL dd")}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{DateTime.fromISO(call.startTime).toFormat("hh:mm a")} - {DateTime.fromISO(call.endTime).toFormat("hh:mm a")}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{call.callType?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.border} ${config.text}`}>
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
