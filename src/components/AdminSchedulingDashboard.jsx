import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";
import { usersApi, mentorsApi } from "../api/client";
import * as availabilityApi from "../api/availability";
import * as callsApi from "../api/calls";
import { recommendMentors } from "../utils/mentorRecommendation";
import { formatDateLocal, formatTimeRange, isPastDateTime, formatTimeLocal } from "../utils/time";
import Toast, { useToasts, ToastContainer } from "./Toast";

const CALL_TYPES = [
  { value: "RESUME_REVAMP", label: "Resume Revamp" },
  { value: "JOB_MARKET_GUIDANCE", label: "Job Market Guidance" },
  { value: "MOCK_INTERVIEW", label: "Mock Interview" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

export default function AdminSchedulingDashboard() {
  // Toast notifications
  const { toasts, addToast, removeToast } = useToasts();

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
  const [noMentorsFound, setNoMentorsFound] = useState(false);

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
  const [noSlotsFound, setNoSlotsFound] = useState(false);

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
        setUsersError("");
        const [usersList, mentorsList] = await Promise.all([
          usersApi.getAll(),
          mentorsApi.getAll(),
        ]);
        
        // Edge case: No users found
        if (!usersList || usersList.length === 0) {
          setUsersError("No users found in system. Please create users first.");
          addToast("No users found", "warning", 5000);
        } else {
          setUsers(usersList);
          setMentors(mentorsList || []);
        }
      } catch (e) {
        const errorMsg = e.message || "Failed to load users";
        setUsersError(errorMsg);
        addToast(errorMsg, "error", 0); // Manual dismiss for errors
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
        setNoMentorsFound(false);

        const recommended = recommendMentors(
          selectedUser,
          mentors,
          callType,
          5 // Top 5 recommendations
        );
        
        // Edge case: No mentors found
        if (!recommended || recommended.length === 0) {
          setNoMentorsFound(true);
          setRecommendationsError(
            "No mentors available for this call type. Try a different call type or add more mentors."
          );
          addToast("No mentors found for this call type", "warning", 5000);
          setRecommendedMentors([]);
          return;
        }

        // Convert to format for display
        const formatted = recommended.map((rec) => ({
          mentor: rec,
          matchPercentage: rec.match_percentage,
          reasoning: rec.reasoning.join(" • "),
        }));
        setRecommendedMentors(formatted);
      } catch (e) {
        const errorMsg = e.message || "Failed to get recommendations";
        setRecommendationsError(errorMsg);
        addToast(errorMsg, "error", 0);
      } finally {
        setLoadingRecommendations(false);
      }
    },
    [selectedUser, mentors, addToast]
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
        // API returns: { availability: { "YYYY-MM-DD": [{id, startTime, endTime}, ...] } }
        const overlaps = [];
        const userAvailMap = userAvail.availability || {};
        const mentorAvailMap = mentorAvail.availability || {};

        for (let i = 0; i < 7; i++) {
          const date = weekStartDt.plus({ days: i }).toFormat("yyyy-MM-dd");

          const userSlots = userAvailMap[date] || [];
          const mentorSlots = mentorAvailMap[date] || [];

          // Build sets of start times for quick lookup
          const userStartTimes = new Set(userSlots.map((s) => new Date(s.startTime).getTime()));
          const mentorStartTimes = new Set(mentorSlots.map((s) => new Date(s.startTime).getTime()));

          // Find start times present in both
          for (const userSlot of userSlots) {
            const slotStartMs = new Date(userSlot.startTime).getTime();
            if (mentorStartTimes.has(slotStartMs)) {
              const slotStartDt = DateTime.fromISO(userSlot.startTime, { zone: "utc" });

              // Skip past slots
              if (slotStartDt > DateTime.now().toUTC()) {
                overlaps.push({
                  date,
                  start: slotStartDt,
                  end: slotStartDt.plus({ hours: 1 }),
                  userSlotId: userSlot.id,
                });
              }
            }
          }
        }

        // Edge case: No overlapping slots found
        if (overlaps.length === 0) {
          setNoSlotsFound(true);
          setSlotsError(
            `No overlapping availability found for ${selectedUser.name} and ${mentor.name}. Try selecting a different mentor or changing the week.`
          );
          addToast("No overlapping time slots found", "warning", 5000);
        } else {
          setNoSlotsFound(false);
        }

        setOverlappingSlots(overlaps);
      } catch (e) {
        const errorMsg = e.message || "Failed to fetch slots";
        setSlotsError(errorMsg);
        addToast(errorMsg, "error", 0);
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedUser, weekStart, addToast]
  );

  // Handle slot selection and booking
  const handleBookSlot = async (slot) => {
    setSelectedSlot(slot);
    setCurrentStep(7);
  };

  // Book the call
  const handleConfirmBooking = async () => {
    if (!selectedUser || !selectedMentor || !selectedSlot || !selectedCallType) {
      const errorMsg = "Missing required information (User, Mentor, Slot, or Call Type)";
      setBookingError(errorMsg);
      addToast(errorMsg, "error", 0);
      return;
    }

    try {
      setBookingInProgress(true);
      setBookingError("");
      setBookingSuccess("");

      const callData = {
        userId: selectedUser.id,
        mentorId: selectedMentor.mentor?.id || selectedMentor.id,
        callType: selectedCallType,
        startTime: selectedSlot.start.toISO(),
        endTime: selectedSlot.end.toISO(),
      };

      await callsApi.bookCall(callData);
      const successMsg = "Call booked successfully!";
      setBookingSuccess(successMsg);
      addToast(successMsg, "success", 3000);
      setCurrentStep(8);

      // Reset after 2 seconds
      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (e) {
      const errorMsg = e.message || "Failed to book call";
      setBookingError(errorMsg);
      addToast(errorMsg, "error", 0);
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
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

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
          <p className="text-red-300 font-medium mb-2">⚠ No Users Available</p>
          <p className="text-red-200 text-sm">{usersError}</p>
          <div className="mt-4">
            <p className="text-sm text-slate-300">
              Please create users in the system before scheduling calls.
            </p>
          </div>
        </div>
      )}

      {loadingUsers ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
          <p className="text-slate-400">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-700 rounded-lg">
          <p className="text-slate-300 mb-2">📭 No users found</p>
          <p className="text-sm text-slate-400">Create users first before scheduling calls.</p>
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
              <div className="text-center py-8 bg-slate-900/30 border border-slate-700 rounded-lg">
                <p className="text-slate-400">🔍 No users match your search</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms</p>
              </div>
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
          <p className="text-red-300 font-medium mb-2">⚠ No Mentors Available</p>
          <p className="text-red-200 text-sm">{recommendationsError}</p>
          <div className="mt-4">
            <p className="text-sm text-slate-300 mb-2">Try:</p>
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              <li>Select a different call type</li>
              <li>Wait for more mentors to join the platform</li>
              <li>Contact support to add more mentors</li>
            </ul>
          </div>
        </div>
      )}

      {recommendedMentors.length === 0 && !recommendationsError ? (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-700 rounded-lg">
          <p className="text-slate-400 mb-2">🔄 Loading mentors...</p>
          <p className="text-sm text-slate-500">This should only take a moment</p>
        </div>
      ) : recommendedMentors.length > 0 ? (
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
      ) : null}

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
          <p className="text-red-300 font-medium mb-2">⚠ No Overlapping Times</p>
          <p className="text-red-200 text-sm">{slotsError}</p>
          <div className="mt-4">
            <p className="text-sm text-slate-300 mb-2">Try:</p>
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              <li>Select a different mentor who has more availability</li>
              <li>Check or update the user's availability settings</li>
              <li>Try a different week</li>
            </ul>
          </div>
        </div>
      )}

      {sortedDates.length === 0 && !slotsError ? (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-700 rounded-lg">
          <p className="text-slate-400 mb-2">🔄 Checking availability...</p>
          <p className="text-sm text-slate-500">This should only take a moment</p>
        </div>
      ) : sortedDates.length > 0 ? (
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
      ) : null}

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
