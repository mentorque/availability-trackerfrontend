import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as availabilityApi from "../api/availability";
import {
  getWeekStartStr,
  formatDateLocal,
  formatTimeLocal,
  slotToUTC,
  isPastDate,
  isPastDateTime,
} from "../utils/time";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (UTC+0)" },
  { value: "IST", label: "IST (UTC+5:30)" },
];

const ROLE_HEADINGS = {
  USER: "User Dashboard",
  MENTOR: "Mentor Dashboard",
};

export default function AvailabilityDashboard({ role = "USER" }) {
  const { user } = useAuth();
  const [displayTimezone, setDisplayTimezone] = useState(user?.timezone || "UTC");
  const [weekStart, setWeekStart] = useState(getWeekStartStr(new Date()));
  const [data, setData] = useState({ dates: [], availability: {} });
  const [loading, setLoading] = useState(!user); // only show loading if no user yet
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [error, setError] = useState("");

  const [selectorDate, setSelectorDate] = useState("");
  const [selectorHour, setSelectorHour] = useState(0);

  const fetchWeekly = useCallback(async () => {
    if (!user) return; // wait for auth to be ready
    setLoading(true);
    setError("");
    try {
      const res = await availabilityApi.getWeekly({ weekStart });
      setData(res);
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [weekStart, user]); // user added as dependency

  useEffect(() => {
    if (user) fetchWeekly(); // only fetch when user is available
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
    if (dateStr === new Date().toISOString().slice(0, 10)) {
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
      await availabilityApi.saveBatch(slots);
      await fetchWeekly();
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(toggles).length > 0;
  const prevWeek = () => {
    const d = new Date(weekStart + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };
  const nextWeek = () => {
    const d = new Date(weekStart + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const weekMin = data.dates[0] || "";
  const weekMax = data.dates[6] || "";

  const isSelectorSlotDisabled =
    selectorDate !== "" && isSlotDisabled(selectorDate, selectorHour);

  const confirmSelectorSlot = () => {
    if (!selectorDate || isSelectorSlotDisabled) return;
    const key = `${selectorDate}-${selectorHour}`;
    setToggles((prev) => ({ ...prev, [key]: true }));
  };

  const cancelChanges = () => {
    setToggles({});
  };

  const formatTimeOptionLabel = (utcHourIndex) => {
    const startISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex, 0)).toISOString();
    const endISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex + 1, 0)).toISOString();
    return `${formatTimeLocal(startISO, displayTimezone)} – ${formatTimeLocal(endISO, displayTimezone)}`;
  };

  const heading = ROLE_HEADINGS[role] ?? ROLE_HEADINGS.USER;

  return (
    <div className="space-y-8 bg-slate-950 min-h-screen -m-8 p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">{heading}</h1>
        <p className="text-slate-400 font-medium">Manage your availability.</p>
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Timezone</label>
          <select
            value={displayTimezone}
            onChange={(e) => setDisplayTimezone(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <section className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              value={selectorDate}
              min={weekMin}
              max={weekMax}
              onChange={(e) => setSelectorDate(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark] appearance-none"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Time</label>
            <select
              value={selectorHour}
              onChange={(e) => setSelectorHour(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[12rem] overflow-y-auto"
            >
              {HOURS.map((utcHourIndex) => {
                const disabled = selectorDate ? isSlotDisabled(selectorDate, utcHourIndex) : false;
                return (
                  <option key={utcHourIndex} value={utcHourIndex} disabled={disabled}>
                    {formatTimeOptionLabel(utcHourIndex)}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            type="button"
            onClick={confirmSelectorSlot}
            disabled={!selectorDate || isSelectorSlotDisabled}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Confirm / Save
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Your availability</h2>
          <p className="text-slate-400 font-medium text-sm mt-0.5">
            Click slots to toggle availability. Save when done.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={prevWeek}
            className="rounded-full w-9 h-9 flex items-center justify-center border border-slate-700 bg-slate-800/50 text-slate-300 font-medium hover:bg-slate-800 hover:border-slate-600 transition shrink-0"
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="text-slate-400 font-medium text-sm text-center">
            Week of {formatDateLocal(weekStart, displayTimezone)}
          </span>
          <button
            type="button"
            onClick={nextWeek}
            className="rounded-full w-9 h-9 flex items-center justify-center border border-slate-700 bg-slate-800/50 text-slate-300 font-medium hover:bg-slate-800 hover:border-slate-600 transition shrink-0"
            aria-label="Next week"
          >
            →
          </button>
        </div>

        <div className="overflow-x-auto -mx-1">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium">Loading...</div>
          ) : (
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-4 px-3 text-slate-400 font-medium text-sm w-28">Time</th>
                  {data.dates.map((d) => (
                    <th key={d} className="py-4 px-3 text-white font-medium text-sm">
                      {formatDateLocal(d, displayTimezone)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-slate-800/80">
                    <td className="py-3 px-3 text-slate-400 font-medium text-sm">
                      {formatTimeOptionLabel(hour)}
                    </td>
                    {data.dates.map((dateStr) => {
                      const enabled = isSlotEnabled(dateStr, hour);
                      const disabled = isSlotDisabled(dateStr, hour);
                      return (
                        <td key={dateStr} className="p-2">
                          <button
                            type="button"
                            onClick={() => toggleSlot(dateStr, hour)}
                            disabled={disabled}
                            className={`
                              w-full py-3 rounded-lg border font-medium text-xs uppercase tracking-wide transition
                              ${disabled
                                ? "bg-slate-800/50 border-slate-800 cursor-not-allowed opacity-40 text-slate-500"
                                : ""}
                              ${!disabled && enabled
                                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500"
                                : ""}
                              ${!disabled && !enabled
                                ? "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:bg-slate-800/80"
                                : ""}
                            `}
                          >
                            {enabled ? "AVAILABLE" : "Off"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={cancelChanges}
            disabled={!hasChanges}
            className="rounded-lg border border-slate-600 bg-transparent text-slate-300 font-medium px-5 py-2.5 hover:bg-slate-800 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveBatch}
            disabled={saving || !hasChanges}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </section>
    </div>
  );
}
