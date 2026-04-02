import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";
import * as adminApi from "../api/admin";
import * as availabilityApi from "../api/availability";
import * as callsApi from "../api/calls";
import { recommendMentors } from "../utils/mentorRecommendation";
import { formatDateLocal, formatTimeRange, isPastDateTime, formatTimeLocal } from "../utils/time";

const CALL_TYPES = [
  { value: "resume_revamp", label: "Resume Revamp" },
  { value: "job_market_guidance", label: "Job Market Guidance" },
  { value: "mock_interview", label: "Mock Interview" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

export default function AdminSchedulingDashboard() {
  // Step state
  const [currentStep, setCurrentStep] = useState(1); // 1-8

  // Step 1: User selection
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  // Step 2: Call type selection
  const [selectedCallType, setSelectedCallType] = useState("");

  // Step 3: Mentor recommendations
  const [mentors, setMentors] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  // Step 4: Mentor selection (implicit in step 5)
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Step 5: Slot fetching
  const [weekStart, setWeekStart] = useState(() => {
    const today = new DateTime.now().toUTC();
    return today.toFormat("yyyy-MM-dd");
  });
  const [displayTimezone, setDisplayTimezone] = useState("UTC");
  const [overlappingSlots, setOverlappingSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Step 6: Slot selection & booking
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // General state
  const [generalError, setGeneralError] = useState("");

  // Load users on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        const [usersList, mentorsList] = await Promise.all([
          adminApi.listUsers(),
          adminApi.listMentors(),
        ]);
        setUsers(usersList);
        setMentors(mentorsList);
      } catch (e) {
        setUsersError(e.message || "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedCallType("");
    setSelectedMentor(null);
    setSelectedSlot(null);
    setCurrentStep(2);
  };

  // Handle call type selection
  const handleCallTypeSelect = (callType) => {
    setSelectedCallType(callType);
    setCurrentStep(3);
    fetchRecommendations(callType);
  };

  // Fetch recommended mentors
  const fetchRecommendations = useCallback(
    async (callType) => {
      if (!selectedUser) return;

      try {
        setLoadingRecommendations(true);
        setRecommendationsError("");
        const recommended = recommendMentors(
          selectedUser,
          mentors,
          callType,
          5 // Top 5 recommendations
        );
        // Convert to format for display
        const formatted = recommended.map((rec) => ({
          mentor: rec,
          matchPercentage: rec.matchPercentage,
          reasoning: rec.reasoning.join(" • "),
        }));
        setRecommendedMentors(formatted);
      } catch (e) {
        setRecommendationsError(e.message || "Failed to get recommendations");
      } finally {
        setLoadingRecommendations(false);
      }
    },
    [selectedUser, mentors]
  );

  // Handle mentor selection
  const handleMentorSelect = (mentor) => {
    setSelectedMentor(mentor);
    setCurrentStep(5);
    fetchOverlappingSlots(mentor);
  };

  // Fetch overlapping slots
  const fetchOverlappingSlots = useCallback(
    async (mentor) => {
      if (!selectedUser || !mentor) return;

      try {
        setLoadingSlots(true);
        setSlotsError("");

        // Get week dates
        const weekStartDt = DateTime.fromISO(weekStart, { zone: "UTC" });
        const weekEndDt = weekStartDt.plus({ days: 7 });

        // Fetch availability for both user and mentor
        const [userAvail, mentorAvail] = await Promise.all([
          availabilityApi.getWeekly({
            entity_id: selectedUser.id,
            entity_type: "USER",
            weekStart,
          }),
          availabilityApi.getWeekly({
            entity_id: mentor.id,
            entity_type: "MENTOR",
            weekStart,
          }),
        ]);

        // Find overlapping slots
        const overlaps = [];
        const userAvailMap = userAvail.availability || {};
        const mentorAvailMap = mentorAvail.availability || {};

        for (let i = 0; i < 7; i++) {
          const date = weekStartDt.plus({ days: i }).toFormat("yyyy-MM-dd");

          for (let hour = 0; hour < 24; hour++) {
            const key = `${hour}:00`;
            const userSlotKey = `${date}|${hour}`;
            const mentorSlotKey = `${date}|${hour}`;

            const userAvailable = userAvailMap[userSlotKey] === true;
            const mentorAvailable = mentorAvailMap[mentorSlotKey] === true;

            if (userAvailable && mentorAvailable) {
              const slotStart = DateTime.fromISO(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);

              // Skip past slots
              if (slotStart > DateTime.now().toUTC()) {
                overlaps.push({
                  date,
                  hour,
                  start: slotStart,
                  end: slotStart.plus({ hours: 1 }),
                });
              }
            }
          }
        }

        setOverlappingSlots(overlaps);
      } catch (e) {
        setSlotsError(e.message || "Failed to fetch slots");
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedUser, weekStart]
  );

  // Handle slot selection and booking
  const handleBookSlot = async (slot) => {
    setSelectedSlot(slot);
    setCurrentStep(7);
  };

  // Book the call
  const handleConfirmBooking = async () => {
    if (!selectedUser || !selectedMentor || !selectedSlot) {
      setBookingError("Missing required information");
      return;
    }

    try {
      setBookingInProgress(true);
      setBookingError("");
      setBookingSuccess("");

      const callData = {
        user_id: selectedUser.id,
        mentor_id: selectedMentor.id,
        call_type: selectedCallType,
        start_time: selectedSlot.start.toISO(),
        end_time: selectedSlot.end.toISO(),
        status: "scheduled",
        additional_participants: [],
      };

      await callsApi.bookCall(callData);
      setBookingSuccess("Call booked successfully!");
      setCurrentStep(8);

      // Reset after 2 seconds
      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (e) {
      setBookingError(e.message || "Failed to book call");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Reset to beginning
  const handleReset = () => {
    setCurrentStep(1);
    setSelectedUser(null);
    setSelectedCallType("");
    setSelectedMentor(null);
    setSelectedSlot(null);
    setOverlappingSlots([]);
    setRecommendedMentors([]);
    setGeneralError("");
    setSlotsError("");
    setRecommendationsError("");
    setBookingError("");
    setBookingSuccess("");
  };

  // Navigation helpers
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Scheduling Dashboard</h1>
          <p className="text-slate-400">Book calls between users and mentors</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* General Error */}
        {generalError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-300">{generalError}</p>
          </div>
        )}

        {/* Step 1: User Selection */}
        {currentStep === 1 && (
          <Step1UserSelection
            users={users}
            loadingUsers={loadingUsers}
            usersError={usersError}
            onSelectUser={handleUserSelect}
          />
        )}

        {/* Step 2: Call Type Selection */}
        {currentStep === 2 && selectedUser && (
          <Step2CallTypeSelection
            selectedUser={selectedUser}
            onSelectCallType={handleCallTypeSelect}
            onBack={goBack}
          />
        )}

        {/* Step 3: Mentor Recommendations */}
        {currentStep === 3 && selectedUser && (
          <Step3MentorRecommendations
            selectedUser={selectedUser}
            selectedCallType={selectedCallType}
            recommendedMentors={recommendedMentors}
            loadingRecommendations={loadingRecommendations}
            recommendationsError={recommendationsError}
            onSelectMentor={handleMentorSelect}
            onBack={goBack}
          />
        )}

        {/* Step 5: Available Slots */}
        {currentStep === 5 && selectedUser && selectedMentor && (
          <Step5AvailableSlots
            selectedUser={selectedUser}
            selectedMentor={selectedMentor}
            overlappingSlots={overlappingSlots}
            loadingSlots={loadingSlots}
            slotsError={slotsError}
            displayTimezone={displayTimezone}
            onTimezoneChange={setDisplayTimezone}
            onSelectSlot={handleBookSlot}
            onBack={goBack}
          />
        )}

        {/* Step 7: Confirm Booking */}
        {currentStep === 7 && selectedUser && selectedMentor && selectedSlot && (
          <Step7ConfirmBooking
            selectedUser={selectedUser}
            selectedMentor={selectedMentor}
            selectedSlot={selectedSlot}
            selectedCallType={selectedCallType}
            displayTimezone={displayTimezone}
            bookingInProgress={bookingInProgress}
            bookingError={bookingError}
            onConfirm={handleConfirmBooking}
            onBack={goBack}
          />
        )}

        {/* Step 8: Success */}
        {currentStep === 8 && bookingSuccess && (
          <Step8Success bookingSuccess={bookingSuccess} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

// Step 1: User Selection
function Step1UserSelection({ users, loadingUsers, usersError, onSelectUser }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 1: Select User</h2>
        <p className="text-slate-400">Choose the user for whom you want to schedule a call</p>
      </div>

      {usersError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{usersError}</p>
        </div>
      )}

      {loadingUsers ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 mb-6 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white group-hover:text-blue-400 transition">
                        {user.name}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition">
                      →
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Step 2: Call Type Selection
function Step2CallTypeSelection({ selectedUser, onSelectCallType, onBack }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 2: Select Call Type</h2>
        <p className="text-slate-400">What kind of call does {selectedUser.name} need?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {CALL_TYPES.map((callType) => (
          <button
            key={callType.value}
            onClick={() => onSelectCallType(callType.value)}
            className="p-6 bg-slate-900/50 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500 rounded-lg transition-all duration-200 text-center group"
          >
            <p className="font-semibold text-white group-hover:text-blue-400 transition">
              {callType.label}
            </p>
            <p className="text-xs text-slate-400 mt-2">Click to select</p>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
      >
        ← Back
      </button>
    </div>
  );
}

// Step 3: Mentor Recommendations
function Step3MentorRecommendations({
  selectedUser,
  selectedCallType,
  recommendedMentors,
  loadingRecommendations,
  recommendationsError,
  onSelectMentor,
  onBack,
}) {
  if (loadingRecommendations) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Step 3: Recommended Mentors</h2>
          <p className="text-slate-400">Finding the best mentors for this call type...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 3: Recommended Mentors</h2>
        <p className="text-slate-400">Top mentors matched for {selectedUser.name}</p>
      </div>

      {recommendationsError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{recommendationsError}</p>
        </div>
      )}

      {recommendedMentors.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No recommended mentors found</p>
      ) : (
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {recommendedMentors.map((rec, idx) => (
            <button
              key={`${rec.mentor.id}-${idx}`}
              onClick={() => onSelectMentor(rec.mentor)}
              className="w-full text-left p-5 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-green-500 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white group-hover:text-green-400 transition">
                      {rec.mentor.name}
                    </p>
                    <div className="flex-1" />
                    <div className="px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                      <p className="text-sm font-bold text-green-400">{rec.matchPercentage}% Match</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{rec.mentor.company}</p>
                  <p className="text-xs text-slate-500">{rec.mentor.domain}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/50 rounded border border-slate-700">
                <p className="text-sm text-slate-300">{rec.reasoning}</p>
              </div>

              <div className="mt-3 text-green-400 opacity-0 group-hover:opacity-100 transition text-sm flex items-center gap-1">
                Select mentor →
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
      >
        ← Back
      </button>
    </div>
  );
}

// Step 5: Available Slots
function Step5AvailableSlots({
  selectedUser,
  selectedMentor,
  overlappingSlots,
  loadingSlots,
  slotsError,
  displayTimezone,
  onTimezoneChange,
  onSelectSlot,
  onBack,
}) {
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDateExpanded = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const slotsByDate = overlappingSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();

  if (loadingSlots) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Step 5: Available Slots</h2>
          <p className="text-slate-400">Finding overlapping availability...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 5: Available Slots</h2>
        <p className="text-slate-400">
          Overlapping availability for {selectedUser.name} and {selectedMentor.name}
        </p>
      </div>

      {/* Timezone Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-slate-400">Display Timezone:</label>
        <select
          value={displayTimezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {slotsError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{slotsError}</p>
        </div>
      )}

      {sortedDates.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No overlapping slots found</p>
      ) : (
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {sortedDates.map((date) => (
            <div key={date} className="border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDateExpanded(date)}
                className="w-full px-4 py-3 bg-slate-900/50 hover:bg-slate-900 text-left font-semibold text-white transition flex items-center justify-between"
              >
                <span>{formatDateLocal(date, displayTimezone)}</span>
                <span className="text-sm text-slate-400">{slotsByDate[date].length} slots</span>
                <span className={`text-blue-400 transition ${expandedDates[date] ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {expandedDates[date] && (
                <div className="bg-slate-950/50 border-t border-slate-700 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {slotsByDate[date].map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectSlot(slot)}
                        className="p-3 bg-slate-900/50 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 rounded-lg transition text-center"
                      >
                        <p className="font-semibold text-white">
                          {formatTimeLocal(slot.start, displayTimezone, "short")}
                        </p>
                        <p className="text-xs text-slate-400">1 hour</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
      >
        ← Back
      </button>
    </div>
  );
}

// Step 7: Confirm Booking
function Step7ConfirmBooking({
  selectedUser,
  selectedMentor,
  selectedSlot,
  selectedCallType,
  displayTimezone,
  bookingInProgress,
  bookingError,
  onConfirm,
  onBack,
}) {
  const callTypeLabel = CALL_TYPES.find((ct) => ct.value === selectedCallType)?.label || selectedCallType;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 7: Confirm Booking</h2>
        <p className="text-slate-400">Review and confirm the call details</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">User</p>
          <p className="font-semibold text-white">{selectedUser.name}</p>
          <p className="text-sm text-slate-400">{selectedUser.email}</p>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">Mentor</p>
          <p className="font-semibold text-white">{selectedMentor.name}</p>
          <p className="text-sm text-slate-400">{selectedMentor.company} • {selectedMentor.domain}</p>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">Call Type</p>
          <p className="font-semibold text-white">{callTypeLabel}</p>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">Scheduled Time</p>
          <p className="font-semibold text-white">
            {formatDateLocal(selectedSlot.date, displayTimezone)}
          </p>
          <p className="text-sm text-slate-400">
            {formatTimeLocal(selectedSlot.start, displayTimezone, "short")} -{" "}
            {formatTimeLocal(selectedSlot.end, displayTimezone, "short")} {displayTimezone}
          </p>
        </div>
      </div>

      {bookingError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{bookingError}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={bookingInProgress}
          className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition font-semibold"
        >
          ← Back
        </button>
        <button
          onClick={onConfirm}
          disabled={bookingInProgress}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
        >
          {bookingInProgress ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Booking...
            </>
          ) : (
            "✓ Confirm Booking"
          )}
        </button>
      </div>
    </div>
  );
}

// Step 8: Success
function Step8Success({ bookingSuccess, onReset }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700 rounded-full flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-green-400 mb-2">Call Booked Successfully!</h2>
        <p className="text-slate-400">{bookingSuccess}</p>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
      >
        Book Another Call
      </button>
    </div>
  );
}

// Step Indicator
function StepIndicator({ currentStep }) {
  const steps = [
    "User",
    "Call Type",
    "Mentors",
    "-",
    "Slots",
    "-",
    "Confirm",
    "Complete",
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;

        if (step === "-") {
          return (
            <div key={idx} className="h-1 w-8 bg-slate-700" />
          );
        }

        return (
          <div key={idx} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isComplete
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {isComplete ? "✓" : stepNum}
            </div>
            <span className="text-xs text-slate-400 mt-1 whitespace-nowrap">{step}</span>
          </div>
        );
      })}
    </div>
  );
}
