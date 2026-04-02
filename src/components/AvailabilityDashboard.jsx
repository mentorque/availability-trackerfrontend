import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as availabilityApi from "../api/availability";
import WeeklyCalendarGrid from "./WeeklyCalendarGrid";
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
  const [displayTimezone, setDisplayTimezone] = useState(user?.timezone || "UTC");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = today..today+6, 1 = +7..+13, etc.
  const [data, setData] = useState({ dates: [], availability: {} });
  const [loading, setLoading] = useState(!user); // only show loading if no user yet
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
      // DO NOT call setToggles({}) here
    } catch (e) {
      setError(e.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [weekOffset, user?.id]);

  useEffect(() => {
    setToggles({});
  }, [weekOffset]);

  useEffect(() => {
    if (user) fetchWeekly();
  }, [fetchWeekly]);

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
        slots.push({
          date: dateStr,
          startTime,
          endTime,
          enabled,
        });
      });
    });
    if (slots.length === 0) {
      setSaving(false);
      return;
    }
    try {
      // Deduplicate slots with same start/end for this entity before sending
      const dedupeSlots = (input) => {
        const m = new Map();
        for (const s of input) {
          const k = `${s.startTime}|${s.endTime}`;
          if (!m.has(k)) m.set(k, { ...s });
          else {
            const ex = m.get(k);
            ex.enabled = ex.enabled || s.enabled; // if any says enabled, keep enabled
            m.set(k, ex);
          }
        }
        return Array.from(m.values());
      };

      const payload = dedupeSlots(slots);
      const entity = { entity_id: user.id, entity_type: role === "MENTOR" ? "MENTOR" : "USER" };
      await availabilityApi.saveBatch(payload, entity);
      await fetchWeekly();
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(toggles).length > 0;

  // Visible 7-day window: always today + weekOffset * 7, forward only
  const buildGridDates = () => {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    start.setUTCDate(start.getUTCDate() + weekOffset * 7);
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  const gridDates = buildGridDates();
  const gridStart = gridDates[0];

  const prevWeek = () => {
    if (weekOffset === 0) return; // do not navigate into the past
    setWeekOffset((prev) => Math.max(0, prev - 1));
  };
  const nextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const weekMin = gridDates[0] || "";
  const weekMax = gridDates[6] || "";

  const isSelectorSlotDisabled =
    selectorDate !== "" && isSlotDisabled(selectorDate, selectorHour);

  const confirmSelectorSlot = async () => {
    if (!selectorDate || isSelectorSlotDisabled) return;

    const { startTime, endTime } = slotToUTC(selectorDate, selectorHour);

    setSaving(true);
    setError("");
    try {
      const entity = { entity_id: user.id, entity_type: role === "MENTOR" ? "MENTOR" : "USER" };
      // dedupe single slot batch is trivial but keep shape consistent
      await availabilityApi.saveBatch([
        { date: selectorDate, startTime, endTime, enabled: true },
      ], entity);
      await fetchWeekly();
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setToggles({});
  };

  const formatTimeOptionLabel = (utcHourIndex) => {
    const startISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex, 0)).toISOString();
    const endISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex + 1, 0)).toISOString();
    const start = formatTimeLocal(startISO, displayTimezone);
    const end = formatTimeLocal(endISO, displayTimezone);
    return formatTimeRange(`${start} – ${end}`);
  };

  const heading = ROLE_HEADINGS[role] ?? ROLE_HEADINGS.USER;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{heading}</h1>
        <p className="text-slate-400">Set your availability for the upcoming week.</p>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-4 text-red-300 text-sm font-medium">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">✕</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Error loading availability</p>
              <p className="text-red-200">{error}</p>
              <button
                onClick={fetchWeekly}
                className="mt-2 text-sm text-red-300 hover:text-red-100 underline transition"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-900/50 border border-slate-800 p-5">
        {/* Timezone Selector */}
        <div>
          <label htmlFor="timezone-select" className="block text-sm font-semibold text-slate-300 mb-2">
            🌍 Timezone
          </label>
          <select
            id="timezone-select"
            value={displayTimezone}
            onChange={(e) => setDisplayTimezone(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 text-white font-medium px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Week Navigation */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            📅 Week
          </label>
          <div className="flex items-center gap-2 bg-slate-950 rounded-lg border border-slate-700 p-2.5">
            <button
              type="button"
              onClick={prevWeek}
              disabled={weekOffset === 0}
              title="Previous week"
              className={`p-2 rounded-lg transition ${
                weekOffset === 0
                  ? "opacity-40 cursor-not-allowed text-slate-500"
                  : "hover:bg-slate-800 text-slate-300 hover:text-slate-100"
              }`}
              aria-label="Previous week"
            >
              ← Prev
            </button>

            <div className="flex-1 text-center text-sm font-medium text-slate-300 px-2 whitespace-nowrap">
              {formatDateLocal(gridStart, displayTimezone)} +6 days
            </div>

            <button
              type="button"
              onClick={nextWeek}
              title="Next week"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition"
              aria-label="Next week"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Calendar Grid Section */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">📅 Your Availability</h2>
            <p className="text-slate-400 text-sm mt-1">Click slots to mark availability</p>
          </div>
          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            hasChanges
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-slate-800/50 text-slate-400 border border-slate-700"
          }`}>
            {hasChanges ? `${Object.keys(toggles).length} changes` : "No changes"}
          </div>
        </div>

        <WeeklyCalendarGrid
          gridDates={gridDates}
          isSlotEnabled={isSlotEnabled}
          isSlotDisabled={isSlotDisabled}
          toggleSlot={toggleSlot}
          displayTimezone={displayTimezone}
          loading={loading}
          gridStart={gridStart}
        />
      </section>

      {/* Action Buttons */}
      {hasChanges && (
        <section className="flex gap-3 sticky bottom-0 bg-slate-950/95 border-t border-slate-800 p-4 -m-6 mt-6 pt-4 backdrop-blur-sm rounded-b-2xl">
          <button
            type="button"
            onClick={cancelChanges}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-600 bg-transparent text-slate-300 font-medium px-6 py-3 hover:bg-slate-800/50 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕ Discard Changes
          </button>
          <button
            type="button"
            onClick={saveBatch}
            disabled={saving}
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-green-400" />
                Saving...
              </>
            ) : (
              <>
                ✓ Save Availability
              </>
            )}
          </button>
        </section>
      )}

      {!hasChanges && !loading && (
        <div className="text-center py-8 text-slate-500 text-sm">
          ✓ All changes saved
        </div>
      )}
    </div>
  );
}
