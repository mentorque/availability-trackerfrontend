import { useState, useMemo } from "react";
import { DateTime } from "luxon";
import {
  formatDateLocal,
  formatTimeLocal,
  formatTimeRange,
} from "../utils/time";

/**
 * WeeklyCalendarGrid - Displays a 7-day calendar with hourly time slots
 * 
 * @param {string[]} gridDates - Array of 7 date strings (YYYY-MM-DD)
 * @param {function} isSlotEnabled - Check if slot is available (dateStr, hour) => boolean
 * @param {function} isSlotDisabled - Check if slot is disabled (dateStr, hour) => boolean
 * @param {function} toggleSlot - Toggle slot availability (dateStr, hour) => void
 * @param {string} displayTimezone - Timezone for display (UTC, IST, etc.)
 * @param {boolean} loading - Loading state
 * @param {string} gridStart - First day for week label formatting
 */
export default function WeeklyCalendarGrid({
  gridDates = [],
  isSlotEnabled,
  isSlotDisabled,
  toggleSlot,
  displayTimezone,
  loading,
  gridStart,
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Syncing Calendar...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto text-left">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0A0A0A] border-b border-[#1A1A1A]">
            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[120px]">Timeline</th>
            {gridDates.map((date) => (
              <th key={date} className="px-4 py-5 text-center border-l border-[#1A1A1A] min-w-[120px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{DateTime.fromISO(date).toFormat("ccc")}</p>
                <p className="text-sm font-black text-white">{DateTime.fromISO(date).toFormat("dd")}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour} className="border-b border-[#1A1A1A] group">
              <td className="px-6 py-4 bg-[#0A0A0A] border-r border-[#1A1A1A]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {DateTime.fromObject({ hour }).toFormat("hh:mm a")}
                </p>
              </td>
              {gridDates.map((date) => {
                const enabled = isSlotEnabled(date, hour);
                const disabled = isSlotDisabled(date, hour);
                return (
                  <td key={date} className={`p-1 border-l border-[#1A1A1A] transition-colors ${disabled ? 'bg-[#050505]/40' : 'hover:bg-[#0A0A0A]'}`}>
                    <button
                      onClick={() => !disabled && toggleSlot(date, hour)}
                      disabled={disabled}
                      className={`
                        w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200
                        ${disabled 
                          ? 'opacity-10 cursor-not-allowed' 
                          : enabled 
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95' 
                            : 'text-slate-600 hover:text-white hover:bg-white/5 active:bg-white/10'
                        }
                      `}
                    >
                      {enabled ? 'Active' : disabled ? '' : 'Vacant'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
