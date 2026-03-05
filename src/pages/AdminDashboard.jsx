import { useState, useEffect, useCallback, useMemo } from "react";
import { DateTime } from "luxon";
import { useAuth } from "../context/AuthContext";
import * as adminApi from "../api/admin";
import * as availabilityApi from "../api/availability";
import * as meetingsApi from "../api/meetings";
import {
  formatDateLocal,
  formatSlotLabel,
  isPastDateTime,
} from "../utils/time";
import AddUserModal from "../components/AddUserModal";
import AddMentorModal from "../components/AddMentorModal";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (UTC+0)" },
  { value: "IST", label: "IST (UTC+5:30)" },
];

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [displayTimezone, setDisplayTimezone] = useState("UTC");
  const [weekStart, setWeekStart] = useState(() =>
    DateTime.now().setZone("UTC").startOf("week").set({ weekday: 1 }).toFormat("yyyy-MM-dd")
  );
  const emptyAvailability = useMemo(() => ({ dates: [], availability: {} }), []);
  const [userAvailability, setUserAvailability] = useState(() => ({ dates: [], availability: {} }));
  const [mentorAvailability, setMentorAvailability] = useState(() => ({ dates: [], availability: {} }));
  const [loadingUserAvail, setLoadingUserAvail] = useState(false);
  const [loadingMentorAvail, setLoadingMentorAvail] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [additionalEmails, setAdditionalEmails] = useState([""]);
  const [overlapSlots, setOverlapSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const [u, m] = await Promise.all([adminApi.listUsers(), adminApi.listMentors()]);
      setUsers(u);
      setMentors(m);
    } catch (e) {
      setError(e.message || "Failed to load users");
    }
  }, []);

  const availabilityTarget = selectedUser || selectedMentor;

  const loadUserAvailability = useCallback(async () => {
    if (!selectedUser) {
      setUserAvailability(emptyAvailability);
      return;
    }
    setLoadingUserAvail(true);
    setError("");
    try {
      const data = await availabilityApi.getWeekly({ userId: selectedUser.id, weekStart });
      setUserAvailability(data);
    } catch (e) {
      setError(e.message || "Failed to load user availability");
      setUserAvailability(emptyAvailability);
    } finally {
      setLoadingUserAvail(false);
    }
  }, [selectedUser, weekStart, emptyAvailability]);

  const loadMentorAvailability = useCallback(async () => {
    if (!selectedMentor) {
      setMentorAvailability(emptyAvailability);
      return;
    }
    setLoadingMentorAvail(true);
    setError("");
    try {
      const data = await availabilityApi.getWeekly({ mentorId: selectedMentor.id, weekStart });
      setMentorAvailability(data);
    } catch (e) {
      setError(e.message || "Failed to load mentor availability");
      setMentorAvailability(emptyAvailability);
    } finally {
      setLoadingMentorAvail(false);
    }
  }, [selectedMentor, weekStart, emptyAvailability]);

  const loadMeetings = useCallback(async () => {
    try {
      const list = await meetingsApi.listMeetings();
      setMeetings(list);
    } catch {
      setMeetings([]);
    }
  }, []);

  // Initialize admin email from localStorage (SSO) or auth user on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setAdminEmail(storedEmail);
    } else if (authUser?.email) {
      setAdminEmail(authUser.email);
    }
  }, [authUser?.email]);

  useEffect(() => {
    loadUsers();
    loadMeetings();
  }, [loadUsers, loadMeetings]);

  useEffect(() => {
    if (!selectedUser) {
      setUserAvailability(emptyAvailability);
    }
  }, [selectedUser, emptyAvailability]);
  useEffect(() => {
    if (!selectedMentor) {
      setMentorAvailability(emptyAvailability);
    }
  }, [selectedMentor, emptyAvailability]);

  useEffect(() => {
    loadUserAvailability();
  }, [loadUserAvailability]);
  useEffect(() => {
    loadMentorAvailability();
  }, [loadMentorAvailability]);

  useEffect(() => {
    if (selectedUser) setUserEmail(selectedUser.email);
  }, [selectedUser]);
  useEffect(() => {
    if (selectedMentor) setMentorEmail(selectedMentor.email);
  }, [selectedMentor]);

  const checkOverlap = useCallback(async () => {
    if (!availabilityTarget || !scheduleStart || !scheduleEnd) return;
    try {
      const slots = await adminApi.getOverlappingSlots(availabilityTarget.id, scheduleStart, scheduleEnd);
      setOverlapSlots(slots);
    } catch {
      setOverlapSlots([]);
    }
  }, [availabilityTarget, scheduleStart, scheduleEnd]);

  useEffect(() => {
    if (scheduleStart && scheduleEnd && availabilityTarget?.id) checkOverlap();
    else setOverlapSlots([]);
  }, [scheduleStart, scheduleEnd, availabilityTarget?.id, checkOverlap]);

  const getParticipantEmails = () => {
    const list = [userEmail.trim(), mentorEmail.trim(), ...additionalEmails.map((e) => e.trim())].filter(Boolean);
    return list;
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!scheduleTitle.trim() || !scheduleStart || !scheduleEnd) {
      setError("Meeting name, date and time are required.");
      return;
    }
    if (new Date(scheduleStart) >= new Date(scheduleEnd)) {
      setError("End time must be after start time.");
      return;
    }
    if (isPastDateTime(scheduleStart)) {
      setError("Cannot schedule in the past.");
      return;
    }
    setLoading(true);
    try {
      const dateStr = scheduleStart ? scheduleStart.slice(0, 10) : "";
      const [y, m, d] = dateStr ? dateStr.split("-") : ["", "", ""];
      const date = dateStr ? `${d}-${m}-${y}` : "";
      const startTime = scheduleStart ? scheduleStart.slice(11, 16) : "";
      const endTime = scheduleEnd ? scheduleEnd.slice(11, 16) : "";
      const timezone = displayTimezone === "IST" ? "Asia/Kolkata" : "UTC";
      await adminApi.scheduleMeeting({
        title: scheduleTitle.trim(),
        date,
        startTime,
        endTime,
        timezone,
        participantEmails: getParticipantEmails(),
      });
      setSuccess("Meeting scheduled. Meet link will appear if Google is connected.");
      setScheduleTitle("");
      setScheduleStart("");
      setScheduleEnd("");
      setUserEmail("");
      setMentorEmail("");
      setAdditionalEmails([""]);
      setOverlapSlots([]);
      loadMeetings();
    } catch (e) {
      setError(e.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalEmail = () => setAdditionalEmails((p) => [...p, ""]);
  const setAdditionalEmail = (i, v) => {
    setAdditionalEmails((p) => {
      const n = [...p];
      n[i] = v;
      return n;
    });
  };
  const removeAdditionalEmail = (i) => setAdditionalEmails((p) => p.filter((_, idx) => idx !== i));

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    setDeletingMeetingId(meetingToDelete);
    setError("");
    try {
      await meetingsApi.deleteMeeting(meetingToDelete);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingToDelete));
      setMeetingToDelete(null);
    } catch (e) {
      setError(e.message || "Failed to delete meeting");
      console.error("Delete failed:", e);
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const selectedTimezone = displayTimezone === "IST" ? "Asia/Kolkata" : "UTC";

  /** Display week: Monday start in selected timezone (Luxon, weekday 1 = Monday). */
  const displayWeekInfo = useMemo(() => {
    const weekStartDt = DateTime.fromISO(weekStart + "T00:00:00", { zone: selectedTimezone })
      .startOf("week")
      .set({ weekday: 1 });
    const dayKeys = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      weekStartDt.plus({ days: i }).toFormat("yyyy-MM-dd")
    );
    return {
      weekStartDt,
      dayKeys,
      weekLabel: weekStartDt.toFormat("ccc, dd LLL"),
    };
  }, [weekStart, selectedTimezone]);

  const prevWeek = () => {
    const weekStartDt = DateTime.fromISO(weekStart + "T00:00:00", { zone: selectedTimezone })
      .startOf("week")
      .set({ weekday: 1 });
    setWeekStart(weekStartDt.minus({ weeks: 1 }).toFormat("yyyy-MM-dd"));
  };
  const nextWeek = () => {
    const weekStartDt = DateTime.fromISO(weekStart + "T00:00:00", { zone: selectedTimezone })
      .startOf("week")
      .set({ weekday: 1 });
    setWeekStart(weekStartDt.plus({ weeks: 1 }).toFormat("yyyy-MM-dd"));
  };

  /** Group slots by backend date key; only time display converts to tz. Keeps cross-midnight slots on original day. */
  const groupSlotsByLocalDate = useCallback((data, tz) => {
    if (!data || !data.availability) return { dates: [], byDate: {} };

    const byDate = {};

    for (const [dateKey, slots] of Object.entries(data.availability)) {
      for (const slot of slots || []) {
        const localStart = DateTime.fromISO(slot.startTime, { zone: "utc" }).setZone(tz);
        const localEnd = DateTime.fromISO(slot.endTime, { zone: "utc" }).setZone(tz);

        const convertedStart = localStart.toFormat("HH:mm");
        const convertedEnd = localEnd.toFormat("HH:mm");

        if (!byDate[dateKey]) {
          const label = DateTime.fromISO(dateKey + "T00:00:00", { zone: tz }).toFormat("ccc, dd LLL");
          byDate[dateKey] = { dayLabel: label, slots: [] };
        }

        byDate[dateKey].slots.push({
          ...slot,
          convertedStart,
          convertedEnd,
        });
      }
    }

    return { dates: Object.keys(byDate).sort(), byDate };
  }, []);

  /** Group flat slots (with startTime/endTime) by local date in selected timezone. */
  const groupFlatSlotsByLocalDate = useCallback((slots, tz) => {
    if (!Array.isArray(slots) || slots.length === 0) return { dates: [], byDate: {} };
    const byDate = {};
    for (const slot of slots) {
      const localStart = DateTime.fromISO(slot.startTime, { zone: "utc" }).setZone(tz);
      const localEnd = DateTime.fromISO(slot.endTime, { zone: "utc" }).setZone(tz);
      const localDateKey = localStart.toFormat("yyyy-MM-dd");
      const dayLabel = localStart.toFormat("ccc, dd LLL");
      const convertedStart = localStart.toFormat("HH:mm");
      const convertedEnd = localEnd.toFormat("HH:mm");
      if (!byDate[localDateKey]) byDate[localDateKey] = { dayLabel, slots: [] };
      byDate[localDateKey].slots.push({ ...slot, convertedStart, convertedEnd });
    }
    return { dates: Object.keys(byDate).sort(), byDate };
  }, []);

  const flattenSlots = (data) =>
    !data
      ? []
      : Object.entries(data.availability || {}).flatMap(([dateStr, slots]) =>
          (slots || []).map((s) => ({ ...s, dateStr }))
        );

  const userSlotsFlat = flattenSlots(userAvailability);
  const mentorSlotsFlat = flattenSlots(mentorAvailability);

  const userGroupedByWeek = useMemo(
    () => groupSlotsByLocalDate(userAvailability, selectedTimezone),
    [userAvailability, selectedTimezone, groupSlotsByLocalDate]
  );
  const mentorGroupedByWeek = useMemo(
    () => groupSlotsByLocalDate(mentorAvailability, selectedTimezone),
    [mentorAvailability, selectedTimezone, groupSlotsByLocalDate]
  );

  const matchingSlots = selectedUser && selectedMentor
    ? userSlotsFlat.filter((userSlot) =>
        mentorSlotsFlat.some((mentorSlot) => mentorSlot.startTime === userSlot.startTime)
      )
    : [];

  const matchingByLocalDate = useMemo(
    () => groupFlatSlotsByLocalDate(matchingSlots, selectedTimezone),
    [matchingSlots, selectedTimezone, groupFlatSlotsByLocalDate]
  );

  const renderUserWeeklyList = () => {
    if (loadingUserAvail) {
      return <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>;
    }
    const { byDate } = userGroupedByWeek;
    const { dayKeys } = displayWeekInfo;
    return (
      <ul className="space-y-4">
        {dayKeys.map((dateKey) => {
          const dayLabel = DateTime.fromISO(dateKey + "T00:00:00", { zone: selectedTimezone }).toFormat("ccc, dd LLL");
          const dayData = byDate[dateKey];
          const slots = dayData?.slots ?? [];
          return (
            <li key={dateKey} className="border-b border-slate-800 pb-3 last:border-0">
              <div className="font-medium text-white text-sm mb-2">{dayLabel}</div>
              {slots.length === 0 ? (
                <div className="text-slate-500 text-sm pl-2">No availability</div>
              ) : (
                <ul className="space-y-1 pl-2">
                  {slots.map((slot) => (
                    <li key={slot.startTime} className="text-slate-300 text-sm">
                      {slot.convertedStart} – {slot.convertedEnd}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderMentorWeeklyList = () => {
    if (loadingMentorAvail) {
      return <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>;
    }
    const { byDate } = mentorGroupedByWeek;
    const { dayKeys } = displayWeekInfo;
    return (
      <ul className="space-y-4">
        {dayKeys.map((dateKey) => {
          const dayLabel = DateTime.fromISO(dateKey + "T00:00:00", { zone: selectedTimezone }).toFormat("ccc, dd LLL");
          const dayData = byDate[dateKey];
          const slots = dayData?.slots ?? [];
          return (
            <li key={dateKey} className="border-b border-slate-800 pb-3 last:border-0">
              <div className="font-medium text-white text-sm mb-2">{dayLabel}</div>
              {slots.length === 0 ? (
                <div className="text-slate-500 text-sm pl-2">No availability</div>
              ) : (
                <ul className="space-y-1 pl-2">
                  {slots.map((slot) => (
                    <li key={slot.startTime} className="text-slate-300 text-sm">
                      {slot.convertedStart} – {slot.convertedEnd}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderMatchingList = () => {
    if (!selectedUser || !selectedMentor) {
      return <div className="text-slate-500 text-sm pl-2">Select both User and Mentor to see matching slots</div>;
    }
    if (loadingUserAvail) {
      return <div className="p-4 text-center text-slate-400 text-sm">Loading user availability...</div>;
    }
    if (loadingMentorAvail) {
      return <div className="p-4 text-center text-slate-400 text-sm">Loading mentor availability...</div>;
    }
    const { byDate } = matchingByLocalDate;
    const { dayKeys } = displayWeekInfo;
    return (
      <ul className="space-y-4">
        {dayKeys.map((dateKey) => {
          const dayLabel = DateTime.fromISO(dateKey + "T00:00:00", { zone: selectedTimezone }).toFormat("ccc, dd LLL");
          const dayData = byDate[dateKey];
          const slots = dayData?.slots ?? [];
          if (slots.length === 0) return null;
          return (
            <li key={dateKey} className="border-b border-slate-800 pb-3 last:border-0">
              <div className="font-medium text-white text-sm mb-2">{dayLabel}</div>
              <ul className="space-y-1 pl-2">
                {slots.map((slot) => (
                  <li key={slot.startTime} className="text-slate-300 text-sm">
                    {slot.convertedStart} – {slot.convertedEnd}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-400 text-sm font-medium bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Availability Viewer */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 font-medium mt-1">
              View user/mentor availability, find overlaps, and schedule meetings.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-slate-400 mb-1">Timezone</label>
              <select
                value={displayTimezone}
                onChange={(e) => setDisplayTimezone(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-slate-400 mb-1">User</label>
              <div className="flex gap-2">
                <select
                  value={selectedUser ? selectedUser.id : ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedUser(id ? users.find((u) => u.id === id) || null : null);
                  }}
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-400 hover:bg-slate-700"
                  title="Add user"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-slate-400 mb-1">Mentor</label>
              <div className="flex gap-2">
                <select
                  value={selectedMentor ? selectedMentor.id : ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMentor(id ? mentors.find((m) => m.id === id) || null : null);
                  }}
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select mentor</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddMentorModal(true)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-400 hover:bg-slate-700"
                  title="Add mentor"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden p-4 min-h-[320px]">
            {!availabilityTarget ? (
              <div className="flex items-center justify-center h-64 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed">
                <p className="text-slate-400 font-medium">
                  Select a User and/or Mentor to view availability.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedUser && (
                      <span className="text-slate-300 text-sm">
                        User: {selectedUser.name}
                      </span>
                    )}
                    {selectedUser && selectedMentor && <span className="text-slate-500">|</span>}
                    {selectedMentor && (
                      <span className="text-slate-300 text-sm">
                        Mentor: {selectedMentor.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevWeek}
                      className="rounded-full w-8 h-8 flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
                    >
                      ←
                    </button>
                    <span className="text-slate-400 text-sm">
                      Week of {displayWeekInfo.weekLabel}
                    </span>
                    <button
                      type="button"
                      onClick={nextWeek}
                      className="rounded-full w-8 h-8 flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
                    >
                      →
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[400px] space-y-6">
                  {selectedUser && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2">User Availability</h3>
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                        {renderUserWeeklyList()}
                      </div>
                    </section>
                  )}
                  {selectedMentor && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2">Mentor Availability</h3>
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                        {renderMentorWeeklyList()}
                      </div>
                    </section>
                  )}
                  {selectedUser && selectedMentor && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2">Matching Availability</h3>
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                        {renderMatchingList()}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Schedule Meeting card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-white mb-4">Schedule Meeting</h2>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Admin email</label>
                <input
                  type="email"
                  value={adminEmail}
                  disabled
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-400 px-4 py-2 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">User email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mentor email</label>
                <input
                  type="email"
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mentor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Additional emails</label>
                {additionalEmails.map((email, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setAdditionalEmail(i, e.target.value)}
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdditionalEmail(i)}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-400 hover:text-white text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAdditionalEmail}
                  className="text-sm text-blue-400 hover:underline"
                >
                  + Add email
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Meeting name</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleStart ? scheduleStart.slice(0, 10) : ""}
                  onChange={(e) => {
                    const d = e.target.value;
                    const startT = scheduleStart ? scheduleStart.slice(11) : "09:00:00.000Z";
                    const endT = scheduleEnd ? scheduleEnd.slice(11) : "10:00:00.000Z";
                    setScheduleStart(`${d}T${startT}`);
                    setScheduleEnd(`${d}T${endT}`);
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Start time</label>
                <input
                  type="time"
                  value={scheduleStart ? scheduleStart.slice(11, 16) : ""}
                  onChange={(e) => {
                    const t = e.target.value;
                    const d = scheduleStart ? scheduleStart.slice(0, 10) : new Date().toISOString().slice(0, 10);
                    setScheduleStart(`${d}T${t}:00.000Z`);
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">End time</label>
                <input
                  type="time"
                  value={scheduleEnd ? scheduleEnd.slice(11, 16) : ""}
                  onChange={(e) => {
                    const t = e.target.value;
                    const d = scheduleEnd ? scheduleEnd.slice(0, 10) : scheduleStart?.slice(0, 10) || new Date().toISOString().slice(0, 10);
                    setScheduleEnd(`${d}T${t}:00.000Z`);
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {overlapSlots.length > 0 && availabilityTarget && (
                <p className="text-amber-400 text-xs">
                  Overlaps with {availabilityTarget.name}:{" "}
                  {overlapSlots.map((s) => formatSlotLabel(s.startTime, s.endTime, displayTimezone)).join(", ")}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm / Save"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Meetings list - full width below */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Meetings</h2>
        <div>
          <div className="hidden md:grid grid-cols-5 gap-4 text-xs font-semibold text-slate-400 px-4 pt-1 pb-2 border-b border-slate-800">
            <span>Date</span>
            <span>Meeting Title</span>
            <span>Attendees</span>
            <span>Meet Link</span>
            <span className="text-right">Delete</span>
          </div>
          <ul className="mt-2 space-y-3 max-h-80 overflow-y-auto">
            {meetings.map((m) => (
              <li key={m.id}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3 shadow-sm hover:shadow-md hover:bg-slate-900 transition-transform hover:-translate-y-0.5">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      {m.startTime
                        ? new Date(m.startTime).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                    
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white truncate">{m.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatSlotLabel(m.startTime, m.endTime, displayTimezone)}
                    </p>
                  </div>
                  <div className="text-xs text-slate-300">
                    {m.participants?.length > 0 ? (
                      <div className="space-y-0.5">
                        {m.participants.map((p) => (
                          <div key={p.email} className="truncate">
                            {p.email}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">No attendees listed</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    {m.meetLink ? (
                      <>
                        <p className="font-medium text-slate-100">
                          {m.startTime &&
                            new Date(m.startTime).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              timeZone: displayTimezone,
                            })}
                          {m.startTime &&
                            m.endTime &&
                            ` · ${new Date(m.startTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: displayTimezone,
                            })} – ${new Date(m.endTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: displayTimezone,
                            })}`}
                        </p>
                        <p className="text-slate-400">
                          Time zone: {displayTimezone === "IST" ? "Asia/Kolkata" : "UTC"}
                        </p>
                        <div className="pt-1 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">Google Meet joining info</p>
                            <p className="text-slate-400">Video call link:</p>
                            <a
                              href={m.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {m.meetLink}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              const datePart = m.startTime
                                ? new Date(m.startTime).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    timeZone: displayTimezone,
                                  })
                                : "";
                              const startPart = m.startTime
                                ? new Date(m.startTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                    timeZone: displayTimezone,
                                  })
                                : "";
                              const endPart = m.endTime
                                ? new Date(m.endTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                    timeZone: displayTimezone,
                                  })
                                : "";
                              const lineTwo =
                                datePart && startPart && endPart
                                  ? `${datePart} · ${startPart} – ${endPart}`
                                  : "";
                              const formattedText = `${m.title}\n${lineTwo}\nTime zone: ${displayTimezone}\nGoogle Meet joining info\nVideo call link: ${
                                m.meetLink ?? "Link pending"
                              }`;
                              navigator.clipboard.writeText(formattedText);

                              const button = e.currentTarget;
                              const originalLabel = button.innerHTML;
                              button.innerHTML = "✓ Copied";
                              button.classList.add("text-emerald-400");
                              setTimeout(() => {
                                button.innerHTML = originalLabel;
                                button.classList.remove("text-emerald-400");
                              }, 1500);
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-medium p-2 mt-0.5 transform active:scale-95 transition-all duration-200"
                            aria-label="Copy meeting details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path d="M6 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3V2Zm2 4h4a2 2 0 0 1 2 2v3h1V2H8v4Zm4 2H3v8h9V8Z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Link pending</span>
                    )}
                  </div>
                  <div className="flex items-center md:justify-end">
                    <button
                      type="button"
                      onClick={() => setMeetingToDelete(m.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/70 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium px-3 py-1.5 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {meetings.length === 0 && (
              <li>
                <p className="text-slate-500 text-sm px-1 py-2">No meetings</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Delete meeting confirmation modal */}
      {meetingToDelete !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingMeetingId && setMeetingToDelete(null)}
        >
          <div
            className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete Meeting?</h3>
            <p className="text-slate-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                disabled={!!deletingMeetingId}
                className="rounded-lg border border-slate-600 bg-slate-800 text-slate-300 font-medium px-4 py-2 hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMeeting}
                disabled={!!deletingMeetingId}
                className="rounded-lg border border-red-500 bg-red-600 text-white font-medium px-4 py-2 hover:bg-red-500 transition disabled:opacity-50"
              >
                {deletingMeetingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={(user) => {
            setSelectedUser(user);
            loadUsers();
          }}
        />
      )}
      {showAddMentorModal && (
        <AddMentorModal
          onClose={() => setShowAddMentorModal(false)}
          onSuccess={(mentor) => {
            setSelectedMentor(mentor);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
