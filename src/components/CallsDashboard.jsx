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

const STATUS_COLORS = {
  SCHEDULED:   { bg: "bg-blue-900/30",   border: "border-blue-700",   text: "text-blue-300",   label: "Scheduled" },
  COMPLETED:   { bg: "bg-green-900/30",  border: "border-green-700",  text: "text-green-300",  label: "Completed" },
  CANCELLED:   { bg: "bg-red-900/30",    border: "border-red-700",    text: "text-red-300",    label: "Cancelled" },
  IN_PROGRESS: { bg: "bg-purple-900/30", border: "border-purple-700", text: "text-purple-300", label: "In Progress" },
};

export default function CallsDashboard() {
  const { user: authUser } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayTimezone, setDisplayTimezone] = useState("UTC");
  const [statusFilter, setStatusFilter] = useState("all"); // all, scheduled, completed, cancelled, in_progress
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // date-asc, date-desc, name

  // Load calls on mount
  useEffect(() => {
    loadCalls();
  }, []);

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

  // Filter calls based on role (backend already filters, this is a safety net)
  const roleFilteredCalls = useMemo(() => {
    if (!authUser || !calls.length) return [];

    if (authUser.role === "ADMIN") {
      return calls;
    } else if (authUser.role === "USER") {
      return calls.filter((call) => call.userId === authUser.id);
    } else if (authUser.role === "MENTOR") {
      return calls.filter((call) => call.mentorId === authUser.id);
    }
    return [];
  }, [calls, authUser]);

  // Apply status filter
  const statusFilteredCalls = useMemo(() => {
    if (statusFilter === "all") return roleFilteredCalls;
    return roleFilteredCalls.filter((call) => call.status === statusFilter.toUpperCase());
  }, [roleFilteredCalls, statusFilter]);

  // Apply search filter
  const searchFilteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredCalls;
    const query = searchQuery.toLowerCase();
    return statusFilteredCalls.filter((call) => {
      const userName = (call.user?.name || "").toLowerCase();
      const mentorName = (call.mentor?.name || "").toLowerCase();
      const callType = (call.callType || "").toLowerCase();
      return userName.includes(query) || mentorName.includes(query) || callType.includes(query);
    });
  }, [statusFilteredCalls, searchQuery]);

  // Apply sorting
  const sortedCalls = useMemo(() => {
    const sorted = [...searchFilteredCalls];
    if (sortBy === "date-asc") {
      sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (sortBy === "date-desc") {
      sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""));
    }
    return sorted;
  }, [searchFilteredCalls, sortBy]);

  // Derive display status
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
    return call.status || "SCHEDULED";
  };

  // Stats for header
  const stats = useMemo(() => {
    return {
      total: roleFilteredCalls.length,
      scheduled: roleFilteredCalls.filter((c) => getCallStatus(c) === "scheduled").length,
      inProgress: roleFilteredCalls.filter((c) => getCallStatus(c) === "in_progress").length,
      completed: roleFilteredCalls.filter((c) => getCallStatus(c) === "completed").length,
      cancelled: roleFilteredCalls.filter((c) => c.status === "cancelled").length,
    };
  }, [roleFilteredCalls]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          {authUser?.role === "ADMIN" ? "All Calls" : authUser?.role === "MENTOR" ? "My Mentoring Calls" : "My Calls"}
        </h1>
        <p className="text-slate-400">View and manage your scheduled calls</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} color="blue" />
        <StatCard label="Scheduled" value={stats.scheduled} color="blue" />
        <StatCard label="In Progress" value={stats.inProgress} color="purple" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Cancelled" value={stats.cancelled} color="red" />
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, mentor, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name">User Name (A-Z)</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
            <select
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-400">
            Showing {sortedCalls.length} of {roleFilteredCalls.length} calls
          </p>
          <button
            onClick={loadCalls}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : sortedCalls.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 border border-slate-700 rounded-lg">
          <p className="text-slate-400 mb-2">No calls found</p>
          <p className="text-slate-500 text-sm">
            {statusFilter !== "all" ? "Try adjusting your filters" : "No calls scheduled yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Mentor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Call Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCalls.map((call, idx) => {
                  const status = getCallStatus(call);
                  const statusConfig = STATUS_COLORS[status];

                  return (
                    <tr key={call.id || idx} className="border-b border-slate-800 hover:bg-slate-900/50 transition">
                      <td className="px-6 py-4 text-sm text-slate-200">
                        <div>
                          <p className="font-medium">{call.user?.name || "Unknown User"}</p>
                          <p className="text-xs text-slate-500">{call.user?.email || ""}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200">
                        <div>
                          <p className="font-medium">{call.mentor?.name || "Unknown Mentor"}</p>
                          <p className="text-xs text-slate-500">{call.mentor?.email || ""}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-slate-200">
                            {call.startTime ? formatDateLocal(call.startTime.split("T")[0], displayTimezone) : "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {call.startTime && call.endTime
                              ? `${formatTimeLocal(call.startTime, displayTimezone)} – ${formatTimeLocal(call.endTime, displayTimezone)}`
                              : "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {CALL_TYPE_LABELS[call.callType] || call.callType || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full border text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedCalls.map((call, idx) => {
              const status = getCallStatus(call);
              const statusConfig = STATUS_COLORS[status];
              return (
                <div key={call.id || idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{call.user?.name || "Unknown User"}</p>
                      <p className="text-xs text-slate-400">{call.user?.email || ""}</p>
                    </div>
                    <span className={`shrink-0 inline-block px-2 py-1 rounded-full border text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Mentor</p>
                    <p className="font-medium text-slate-200">{call.mentor?.name || "Unknown Mentor"}</p>
                    <p className="text-xs text-slate-500">{call.mentor?.email || ""}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Date</p>
                      <p className="text-slate-200">{call.startTime ? formatDateLocal(call.startTime.split("T")[0], displayTimezone) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Time</p>
                      <p className="text-slate-200">
                        {call.startTime && call.endTime ? `${formatTimeLocal(call.startTime, displayTimezone)} – ${formatTimeLocal(call.endTime, displayTimezone)}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Call Type</p>
                    <p className="text-slate-200">{CALL_TYPE_LABELS[call.callType] || call.callType || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }) {
  const colorClasses = {
    blue: "bg-blue-900/20 border-blue-700 text-blue-300",
    purple: "bg-purple-900/20 border-purple-700 text-purple-300",
    green: "bg-green-900/20 border-green-700 text-green-300",
    red: "bg-red-900/20 border-red-700 text-red-300",
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
