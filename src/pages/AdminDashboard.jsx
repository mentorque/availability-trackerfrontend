import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateTime } from "luxon";
import { usersApi, mentorsApi, callsApi, adminSchedulingApi } from "../api/client";
import EditProfileModal from "../components/EditProfileModal";
import AddUserModal from "../components/AddUserModal";
import AddMentorModal from "../components/AddMentorModal";
import { recommendMentors } from "../utils/mentorRecommendation";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCallType, setSelectedCallType] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [overlaps, setOverlaps] = useState([]);
  const [selectedOverlap, setSelectedOverlap] = useState(null);
  const [displayTimezone, setDisplayTimezone] = useState("IST");
  const [userSearch, setUserSearch] = useState("");
  
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [callNotes, setCallNotes] = useState("");
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditMentorModal, setShowEditMentorModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, m, c] = await Promise.all([
        usersApi.getAll(), 
        mentorsApi.getAll(), 
        callsApi.getCalls()
      ]);
      setUsers(u); 
      setMentors(m); 
      setMeetings(Array.isArray(c) ? c : []);
    } catch (err) { 
      setError("Failed to load dashboard data"); 
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u) => { 
    setSelectedUser(u); 
    setBookingStep(2); 
    setUserSearch("");
  };
  
  const handleSelectCallType = (type) => {
    setSelectedCallType(type);
    const recs = recommendMentors(selectedUser, mentors, type);
    setRecommendations(recs);
    setBookingStep(3);
  };

  const handleSelectMentor = async (m) => { 
    setSelectedMentor(m); 
    setLoading(true);
    try {
      const res = await adminSchedulingApi.getOverlaps({
        user_id: selectedUser.id,
        mentor_id: m.id
      });
      setOverlaps(res.overlaps || []);
      setBookingStep(4);
    } catch (err) {
      setError("No common availability found for this pair.");
      setOverlaps([]);
      setBookingStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOverlap) return;
    
    setLoading(true);
    try {
      await adminSchedulingApi.bookScheduledCall({
        user_id: selectedUser.id,
        mentor_id: selectedMentor.id,
        user_slot_id: selectedOverlap.userSlot.id,
        mentor_slot_id: selectedOverlap.mentorSlot.id,
        start_time: selectedOverlap.overlapPeriod.startTime,
        end_time: selectedOverlap.overlapPeriod.endTime,
        call_type: selectedCallType,
        title: scheduleTitle || `Session: ${selectedUser.name} x ${selectedMentor.name}`,
      });
      await loadData();
      setBookingStep(1);
      setActiveTab("history");
      // Reset form
      setSelectedUser(null);
      setSelectedMentor(null);
      setSelectedOverlap(null);
      setScheduleTitle("");
      setCallNotes("");
    } catch (err) { 
      setError(err.message || "Booking failed"); 
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedUser(null);
    setSelectedMentor(null);
    setSelectedOverlap(null);
    setSelectedCallType("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{activeTab.replace('history', 'Call History').replace('schedule', 'Scheduler')}</h1>
          <p className="text-slate-500 text-sm font-medium">Mentorque Management Interface</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#1A1A1A] p-1 rounded-lg">
          {['schedule', 'history', 'directory'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "history") loadData();
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-[#1A1A1A] text-white shadow-sm ring-1 ring-white/10" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-between animate-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-white transition-colors">✕</button>
        </div>
      )}

      <div className="min-h-[500px]">
        {activeTab === "schedule" && (
          <div className="space-y-8 animate-in">
            {/* Stepper */}
            <div className="flex items-center justify-between max-w-4xl mx-auto px-10">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="flex flex-col items-center gap-3 relative group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 border ${
                    bookingStep === s ? "bg-white border-white text-black scale-110 shadow-xl" : 
                    bookingStep > s ? "bg-[#1A1A1A] border-[#2A2A2A] text-emerald-400" : "bg-transparent border-[#1A1A1A] text-slate-700"
                  }`}>
                    {bookingStep > s ? "✓" : s}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    bookingStep === s ? "text-white" : "text-slate-600"
                  }`}>
                    {s === 1 && "User"}
                    {s === 2 && "Call"}
                    {s === 3 && "Match"}
                    {s === 4 && "Slot"}
                    {s === 5 && "Review"}
                  </span>
                </div>
              ))}
            </div>
            <div className="premium-card min-h-[500px] flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {bookingStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="p-10 space-y-8 flex-1"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">Select User Profile</h2>
                      <p className="text-slate-500 text-sm">Identifying the candidate for the scheduling event.</p>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Search name or domain..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-[#030303] border border-[#141414] rounded-xl px-6 py-4 text-white text-sm outline-none focus:border-white/30 transition-all"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                      {users
                        .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className="flex items-center gap-5 p-5 rounded-2xl border border-[#141414] bg-[#030303] hover:bg-[#080808] hover:border-white/10 transition-all text-left group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-slate-400 group-hover:scale-105 transition duration-500">
                              {u.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] truncate mt-1">{u.domain || "No domain metadata"}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}

                {bookingStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="p-10 space-y-12 text-center flex flex-col items-center justify-center flex-1"
                  >
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Selected Candidate: {selectedUser?.name}</div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic italic">Session Blueprint</h2>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto">Categorize the professional engagement type.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                      {["RESUME_REVAMP", "JOB_MARKET_GUIDANCE", "MOCK_INTERVIEW"].map(type => (
                        <button
                          key={type}
                          onClick={() => handleSelectCallType(type)}
                          className="p-10 rounded-[32px] border border-[#141414] bg-[#030303] hover:border-white/20 hover:-translate-y-2 transition-all duration-700 group flex flex-col items-center shadow-lg"
                        >
                          <div className="text-4xl mb-6 group-hover:scale-125 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            {type === "RESUME_REVAMP" ? "📄" : type === "JOB_MARKET_GUIDANCE" ? "🌍" : "💡"}
                          </div>
                          <h3 className="font-black text-white text-[10px] uppercase tracking-[0.25em]">{type.replace(/_/g, ' ')}</h3>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setBookingStep(1)} className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors mt-4">← Return to identification</button>
                  </motion.div>
                )}

                {bookingStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="p-10 space-y-10 flex-1"
                  >
                    <div className="flex items-center justify-between border-b border-[#141414] pb-8">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Expert Validation</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Neural matching for {selectedCallType.replace(/_/g, ' ')}</p>
                      </div>
                      <button onClick={() => setBookingStep(2)} className="text-[10px] font-black uppercase tracking-widest bg-[#111111] border border-[#222222] px-4 py-2 rounded-lg hover:text-white transition-colors">Adjust Type</button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {recommendations.map(r => (
                        <div key={r.mentor.id} className="p-8 rounded-[28px] border border-[#141414] bg-[#030303] hover:border-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group">
                          <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[22px] bg-[#080808] border border-[#141414] flex items-center justify-center font-black text-3xl group-hover:scale-110 transition-transform duration-700 shadow-2xl text-slate-500">
                              {r.mentor.name[0]}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                <h3 className="font-bold text-xl text-white tracking-tight">{r.mentor.name}</h3>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black border border-emerald-500/10 uppercase tracking-widest">{Math.round(r.score * 10) / 10} Score</span>
                              </div>
                              <p className="text-[13px] text-slate-500 leading-relaxed font-medium max-w-xl">{r.reasoning?.[0]}</p>
                            </div>
                          </div>
                          <button onClick={() => handleSelectMentor(r.mentor)} className="btn-primary w-full md:w-auto text-[10px] py-4">Select Authority</button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {bookingStep === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="p-10 space-y-12 text-center flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-white/10 underline-offset-8">Temporal Alignment</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">Finding common availability between internal nodes</p>
                    </div>
                    
                    {loading ? (
                      <div className="py-20 flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                        <p className="text-[9px] font-black text-slate-500 tracking-[0.5em] animate-pulse">SYNCHRONIZING DATA...</p>
                      </div>
                    ) : overlaps.length === 0 ? (
                      <div className="p-16 rounded-[40px] bg-[#030303] border border-[#141414] border-dashed max-w-md">
                        <p className="text-rose-500 font-bold uppercase tracking-widest text-xs mb-8">No overlapping windows found in the current system state.</p>
                        <button onClick={() => setBookingStep(3)} className="btn-secondary text-[10px]">Back to Network</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
                        {overlaps.map((ov, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setSelectedOverlap(ov); setBookingStep(5); }}
                            className="p-8 rounded-[32px] border border-[#141414] bg-[#030303] hover:bg-[#070707] hover:border-white/20 transition-all text-left group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-4xl font-black italic">SLOT</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-[0.2em]">{DateTime.fromISO(ov.userSlot.startTime).toFormat("EEEE, MMM dd")}</div>
                            <div className="text-xl font-black text-white tracking-tighter">
                              {DateTime.fromISO(ov.overlapPeriod.startTime).toFormat("hh:mm a")}
                              <span className="text-slate-600 mx-2">—</span>
                              {DateTime.fromISO(ov.overlapPeriod.endTime).toFormat("hh:mm a")}
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Available now</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {bookingStep === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="p-10 flex flex-col flex-1 items-center justify-center max-w-4xl mx-auto w-full"
                  >
                    <div className="text-center space-y-4 mb-12">
                      <h2 className="text-4xl font-black tracking-tighter italic uppercase leading-none">Deployment Gateway</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">Verify session telemetry before finalization</p>
                    </div>
                    
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-2">
                        {[
                          { l: "Primary Candidate", v: selectedUser?.name },
                          { l: "Subject Authority", v: selectedMentor?.name },
                          { l: "Service Protocol", v: selectedCallType.replace(/_/g, ' ') },
                          { l: "Synchronized Window", v: DateTime.fromISO(selectedOverlap?.overlapPeriod.startTime).toFormat("MMM dd, hh:mm a") }
                        ].map(item => (
                          <div key={item.l} className="group p-6 rounded-2xl bg-[#030303] border border-[#141414] hover:border-white/10 transition-all">
                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{item.l}</span>
                            <span className="text-lg font-black text-white uppercase tracking-tight">{item.v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-8 h-full flex flex-col justify-center bg-white/[0.02] border border-[#141414] p-10 rounded-[40px] backdrop-blur-xl">
                        <div className="space-y-4">
                          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-center">Ready for Deployment?</h4>
                          <p className="text-slate-500 text-xs text-center leading-relaxed">This action will synchronize the internal registries and send notifications to both participants.</p>
                        </div>
                        <div className="space-y-4">
                          <button 
                            onClick={handleScheduleMeeting} 
                            disabled={loading} 
                            className="btn-primary w-full py-6 text-xs"
                          >
                            {loading ? "PROCESSING..." : "CONFIRM DEPLOYMENT"}
                          </button>
                          <button onClick={resetBooking} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors py-2">Discard session draft</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="animate-in space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Platform History Log</h2>
                <button onClick={loadData} className="text-xs text-slate-400 hover:text-white transition-colors">Refresh Registry</button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {meetings.length === 0 ? (
                  <div className="py-20 text-center border border-[#1A1A1A] border-dashed rounded-2xl opacity-50">
                    <p className="text-xs font-bold uppercase tracking-widest">No session logs discovered.</p>
                  </div>
                ) : (
                  meetings.map(m => (
                    <div key={m.id} className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#1A1A1A] hover:border-white/5 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#1A1A1A] flex items-center justify-center font-bold text-xs text-slate-500">
                          {m.callType?.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-white transition-colors tracking-tight">{m.title}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{DateTime.fromISO(m.startTime).toFormat("LLL dd, hh:mm a")}</p>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">Confirmed</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "directory" && (
            <motion.div 
                key="directory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-[#1A1A1A]">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.1em]">User Profiles</h3>
                  <button onClick={() => setShowAddUserModal(true)} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase">+ New Entry</button>
                </div>
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className="p-4 rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] hover:bg-[#111111] transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1A1A1A] flex items-center justify-center text-xs font-bold text-slate-600">{u.name[0]}</div>
                        <span className="text-sm font-medium text-slate-300">{u.name}</span>
                      </div>
                      <button onClick={() => { setSelectedUser(u); setShowEditUserModal(true); }} className="text-[10px] font-bold text-slate-600 hover:text-white transition">EDIT</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-[#1A1A1A]">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.1em]">Expert Network</h3>
                  <button onClick={() => setShowAddMentorModal(true)} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase">+ New Entry</button>
                </div>
                <div className="space-y-2">
                  {mentors.map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-l-2 border-l-white border-white/5 bg-[#0A0A0A] hover:bg-[#111111] transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-white">{m.name[0]}</div>
                        <span className="text-sm font-medium text-slate-300">{m.name}</span>
                      </div>
                      <button onClick={() => { setSelectedMentor(m); setShowEditMentorModal(true); }} className="text-[10px] font-bold text-slate-600 hover:text-white transition">EDIT</button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Registry Modals */}
      {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} onSuccess={loadData} />}
      {showAddMentorModal && <AddMentorModal onClose={() => setShowAddMentorModal(false)} onSuccess={loadData} />}
      {showEditUserModal && <EditProfileModal entity={selectedUser} type="USER" onClose={() => setShowEditUserModal(false)} onSuccess={loadData} />}
      {showEditMentorModal && <EditProfileModal entity={selectedMentor} type="MENTOR" onClose={() => setShowEditMentorModal(false)} onSuccess={loadData} />}
    </div>
  );
}
