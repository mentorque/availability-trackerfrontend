import { useState, useEffect, useCallback, useMemo } from "react";
import { DateTime } from "luxon";
import { useAuth } from "../context/AuthContext";
import * as availabilityApi from "../api/availability";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
import Button from "./Button";
import Badge, { StatusBadge } from "./Badge";
import { Spinner } from "./LoadingSkeleton";
import {
  getWeekStartStr,
  formatDateLocal,
  formatTimeLocal,
  formatTimeRange,
  slotToUTC,
  isPastDate,
  isPastDateTime,
} from "../utils/time";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

const ROLE_HEADINGS = {
  USER: "User Dashboard",
  MENTOR: "Mentor Dashboard",
};

export default function AvailabilityDashboard({ role = "USER" }) {
  const { user } = useAuth();
  const [displayTimezone, setDisplayTimezone] = useState(user?.timezone || "IST");
  const [weekOffset, setWeekOffset] = useState(0); 
  const [data, setData] = useState({ dates: [], availability: {} });
  const [loading, setLoading] = useState(!user); 
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [error, setError] = useState("");

  const fetchWeekly = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const today = new Date();
      const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      base.setUTCDate(base.getUTCDate() + weekOffset * 7);
      const weekStartStr = base.toISOString().slice(0, 10);
      const entity = { entity_id: user.id, entity_type: role === "MENTOR" ? "MENTOR" : "USER" };
      const res = await availabilityApi.getWeekly({ weekStart: weekStartStr, ...entity });
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [weekOffset, user?.id, role]);

  useEffect(() => {
    setToggles({});
  }, [weekOffset]);

  useEffect(() => {
    if (user) fetchWeekly();
  }, [fetchWeekly, user]);

  const isSlotEnabled = (dateStr, hour) => {
    const key = `${dateStr}-${hour}`;
    if (toggles[key] !== undefined) return toggles[key];
    const slots = data.availability[dateStr] || [];
    const { startTime } = slotToUTC(dateStr, hour);
    return slots.some((s) => s.startTime.slice(0, 13) === startTime.slice(0, 13));
  };

  const isSlotDisabled = (dateStr, hour) => {
    if (isPastDate(dateStr)) return true;
    const utcTodayStr = new Date().toISOString().slice(0, 10);
    if (dateStr === utcTodayStr) {
      const { startTime } = slotToUTC(dateStr, hour);
      return isPastDateTime(startTime);
    }
    return false;
  };

  const toggleSlot = (dateStr, hour) => {
    if (isSlotDisabled(dateStr, hour)) return;
    const key = `${dateStr}-${hour}`;
    setToggles((prev) => ({ ...prev, [key]: !isSlotEnabled(dateStr, hour) }));
  };

  const saveBatch = async () => {
    setSaving(true);
    setError("");
    const slots = [];
    data.dates.forEach((dateStr) => {
      HOURS.forEach((hour) => {
        const key = `${dateStr}-${hour}`;
        if (toggles[key] === undefined) return;
        const enabled = toggles[key];
        const { startTime, endTime } = slotToUTC(dateStr, hour);
        slots.push({ date: dateStr, startTime, endTime, enabled });
      });
    });
    if (slots.length === 0) {
      setSaving(false);
      return;
    }
    try {
      const entity = { entity_id: user.id, entity_type: role === "MENTOR" ? "MENTOR" : "USER" };
      await availabilityApi.saveBatch(slots, entity);
      await fetchWeekly();
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(toggles).length > 0;
  const gridDates = useMemo(() => {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    start.setUTCDate(start.getUTCDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  const gridStart = gridDates[0];
  const heading = ROLE_HEADINGS[role] ?? ROLE_HEADINGS.USER;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Availability Port</div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">{heading}</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Configure your professional bandwidth registry</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={displayTimezone}
            onChange={(e) => setDisplayTimezone(e.target.value)}
            className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-white outline-none focus:ring-1 focus:ring-white/20 transition"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#1A1A1A] p-1 rounded-lg">
            <button
              onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
              disabled={weekOffset === 0}
              className="p-1 px-2 text-xs font-bold text-slate-500 hover:text-white disabled:opacity-30 transition"
            >
              ←
            </button>
            <span className="px-2 text-[10px] font-black uppercase text-white tracking-widest">{DateTime.fromISO(gridStart).toFormat("MMM dd")}</span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1 px-2 text-xs font-bold text-slate-500 hover:text-white transition"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      <div className="premium-card p-0 overflow-hidden">
        <WeeklyCalendarGrid
          gridDates={gridDates}
          isSlotEnabled={isSlotEnabled}
          isSlotDisabled={isSlotDisabled}
          toggleSlot={toggleSlot}
          displayTimezone={displayTimezone}
          loading={loading}
          gridStart={gridStart}
        />
      </div>

      <div className="flex justify-between items-center bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-[24px]">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Status Report</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <p className="text-xs font-bold text-white uppercase">{hasChanges ? `${Object.keys(toggles).length} Unsaved Modifications` : 'Registry Synchronized'}</p>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex gap-3">
            <button onClick={() => setToggles({})} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition">Discard</button>
            <button 
              onClick={saveBatch} 
              disabled={saving}
              className="btn-primary px-8 py-2.5 text-[10px] font-black uppercase tracking-widest"
            >
              {saving ? 'Saving...' : 'Deploy Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
