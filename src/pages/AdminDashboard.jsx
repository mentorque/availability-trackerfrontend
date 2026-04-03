import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { usersApi, mentorsApi, callsApi } from "../api/client";
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
  const [displayTimezone, setDisplayTimezone] = useState("IST");
  const [userSearch, setUserSearch] = useState("");
  
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStartHour, setScheduleStartHour] = useState("09");
  const [scheduleStartMinute, setScheduleStartMinute] = useState("00");
  const [scheduleStartAmPm, setScheduleStartAmPm] = useState("AM");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [callNotes, setCallNotes] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, m, c] = await Promise.all([usersApi.getAll(), mentorsApi.getAll(), callsApi.getCalls()]);
      setUsers(u); setMentors(m); setMeetings(c);
    } catch (err) { setError("Failed to load dashboard data"); }
  };

  const handleSelectUser = (u) => { setSelectedUser(u); setBookingStep(2); };
  
  const handleSelectCallType = (type) => {
    setSelectedCallType(type);
    const recs = recommendMentors(selectedUser, mentors, type);
    setRecommendations(recs);
    setBookingStep(3);
  };

  const handleSelectMentor = (m) => { setSelectedMentor(m); setBookingStep(4); };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await callsApi.bookCall({
        userId: selectedUser.id,
        mentorId: selectedMentor.id,
        callType: selectedCallType,
        startTime: DateTime.now().plus({ days: 1 }).toISO(),
        endTime: DateTime.now().plus({ days: 1, hours: 1 }).toISO(),
        title: scheduleTitle || `Session: ${selectedUser.name} x ${selectedMentor.name}`,
      });
      loadData();
      setBookingStep(1);
      setActiveTab("meetings");
    } catch (err) { setError("Booking failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight italic">ADMIN CONSOLE</h1>
            <p className="text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-widest px-1">Management Suite v2.0</p>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-2xl">
            {['schedule', 'meetings', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "meetings") loadData();
                }}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40 scale-105" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tab.replace('meetings', 'History').replace('users', 'Directory')}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            {['IST', 'GMT'].map(tz => (
              <button
                key={tz}
                onClick={() => setDisplayTimezone(tz)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-tighter transition-all ${
                  displayTimezone === tz ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-h-[600px]">
        {activeTab === "schedule" && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between max-w-4xl mx-auto px-10">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="flex flex-col items-center gap-3 relative group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${
                    bookingStep === s ? "bg-blue-600 text-white scale-110 shadow-2xl shadow-blue-900/60 ring-4 ring-blue-900/20" : 
                    bookingStep > s ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/20" : "bg-slate-900 border border-slate-800 text-slate-700"
                  }`}>
                    {bookingStep > s ? "✓" : s}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    bookingStep === s ? "text-blue-400" : "text-slate-600"
                  }`}>STEP 0{s}</span>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto min-h-[400px]">
              {bookingStep === 1 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white italic">SELECT TARGET USER</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 01 - Choose the profile that needs a session</p>
                  </div>
                  
                  <div className="relative group max-w-xl mx-auto">
                    <input
                      type="text"
                      placeholder="Search profiles..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="flex items-center gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group text-left shadow-xl"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all">
                          {u.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white italic">SESSION BLUEPRINT</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 02 - Defining the session focus for {selectedUser?.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: "RESUME_REVAMP", t: "Resume Revamp", i: "📄", d: "Strategic profile optimization" },
                      { id: "JOB_MARKET_GUIDANCE", t: "Market Guidance", i: "📈", d: "Career navigation & insights" },
                      { id: "MOCK_INTERVIEW", t: "Mock Interview", i: "💬", d: "Live simulation & feedback" }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectCallType(type.id)}
                        className="p-8 rounded-[40px] bg-slate-900 border border-slate-800 hover:border-blue-600/50 hover:scale-105 transition-all duration-300 group shadow-2xl relative overflow-hidden"
                      >
                        <div className="text-5xl mb-4 group-hover:scale-110 transition duration-300">{type.i}</div>
                        <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">{type.t}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">{type.d}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {bookingStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white italic">EXPERT CALIBRATION</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 03 - AI-powered mentor recommendations based on domain overlap</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.map(rec => (
                      <div key={rec.id} className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-xl">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl font-black group-hover:scale-105 transition duration-500">{rec.name[0]}</div>
                           <div>
                              <div className="flex items-center gap-3">
                                 <h3 className="font-bold text-xl text-white tracking-tight">{rec.name}</h3>
                                 <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">{Math.round(rec.score)} SCORE</span>
                              </div>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">{rec.reason.split('.')[0]}</p>
                           </div>
                        </div>
                        <button onClick={() => handleSelectMentor(rec)} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-blue-900/40 transition active:scale-95 text-xs uppercase tracking-widest">Select</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white italic">TEMPORAL ALIGNMENT</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 04 - Confirming slot accessibility with {selectedMentor?.name}</p>
                  </div>
                  <div className="p-12 rounded-[40px] bg-slate-900 border border-slate-800 inline-block shadow-2xl">
                    <p className="text-slate-400 font-medium mb-6">Simulation restricted to next available production window</p>
                    <button onClick={() => setBookingStep(5)} className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition shadow-xl shadow-blue-900/40 uppercase tracking-widest text-xs">Proceed to Validation</button>
                  </div>
                </div>
              )}

              {bookingStep === 5 && (
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white italic">FINAL VERIFICATION</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Step 05 - Deploying session to production registry</p>
                  </div>
                  <form onSubmit={handleScheduleMeeting} className="space-y-6">
                    <div className="p-8 rounded-[40px] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-6xl tracking-tighter italic">CONFIRM</div>
                       <div className="space-y-4 relative z-10">
                          <div className="flex justify-between border-b border-slate-800 pb-4">
                             <span className="text-[10px] font-black text-slate-500 uppercase">Participant</span>
                             <span className="text-sm font-bold text-white">{selectedUser?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-4">
                             <span className="text-[10px] font-black text-slate-500 uppercase">Expert</span>
                             <span className="text-sm font-bold text-white uppercase">{selectedMentor?.name}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[10px] font-black text-slate-500 uppercase">Session Type</span>
                             <span className="text-sm font-bold text-blue-400">{selectedCallType?.replace(/_/g, " ")}</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <input value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} placeholder="CUSTOM SESSION TITLE" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold text-xs focus:ring-4 focus:ring-blue-600/20 outline-none uppercase tracking-widest" />
                       <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="INTERNAL NOTES" rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-white font-medium text-xs focus:ring-4 focus:ring-blue-600/20 outline-none uppercase tracking-widest resize-none" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-500 shadow-2xl shadow-blue-900/60 transition active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs">{loading ? "PROCESSING..." : "CONFIRM & DEPLOY SESSION"}</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white italic">SESSION LOGS</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Complete history of scheduled platform calls</p>
             </div>
             <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
               {meetings.length === 0 ? (
                 <div className="p-20 text-center bg-slate-900/50 rounded-[40px] border border-slate-800 border-dashed text-slate-500 font-black uppercase tracking-widest text-[10px]">No registry entries found.</div>
               ) : (
                 meetings.map(m => (
                    <div key={m.id} className="p-8 rounded-[32px] bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group shadow-xl">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-black text-xs uppercase italic tracking-tighter">CAL</div>
                          <div>
                             <h3 className="font-bold text-white group-hover:text-blue-400 transition tracking-tight">{m.title}</h3>
                             <p className="text-[10px] text-slate-600 font-black uppercase tracking-tighter mt-1">{DateTime.fromISO(m.startTime).toFormat("MMMM dd, hh:mm a")}</p>
                          </div>
                       </div>
                       <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg">Confirmed</span>
                    </div>
                 ))
               )}
             </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">User Registry</h2>
                   <button onClick={() => setShowAddUserModal(true)} className="text-[10px] font-black text-blue-400 hover:text-white transition uppercase tracking-widest">+ New Profile</button>
                </div>
                <div className="space-y-3">
                   {users.map(u => (
                      <div key={u.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:bg-slate-800/50 transition">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs">{u.name[0]}</div>
                            <span className="text-sm font-bold text-slate-300">{u.name}</span>
                         </div>
                         <button onClick={() => { setSelectedUser(u); setShowEditUserModal(true); }} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition shadow-lg shrink-0">✎</button>
                      </div>
                   ))}
                </div>
             </div>
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Mentor Registry</h2>
                   <button onClick={() => setShowAddMentorModal(true)} className="text-[10px] font-black text-blue-400 hover:text-white transition uppercase tracking-widest">+ New Expert</button>
                </div>
                <div className="space-y-3">
                   {mentors.map(m => (
                      <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between border-l-4 border-l-blue-600 group hover:bg-slate-800/50 transition">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-black text-xs shadow-inner">{m.name[0]}</div>
                            <span className="text-sm font-bold text-slate-300">{m.name}</span>
                         </div>
                         <button onClick={() => { setSelectedMentor(m); setShowEditMentorModal(true); }} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition shadow-lg shrink-0">✎</button>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Registry Modals */}
      {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} onSuccess={loadUsers} />}
      {showAddMentorModal && <AddMentorModal onClose={() => setShowAddMentorModal(false)} onSuccess={loadUsers} />}
      {showEditUserModal && <EditProfileModal entity={selectedUser} type="USER" onClose={() => setShowEditUserModal(false)} onSuccess={loadUsers} />}
      {showEditMentorModal && <EditProfileModal entity={selectedMentor} type="MENTOR" onClose={() => setShowEditMentorModal(false)} onSuccess={loadUsers} />}
    </div>
  );
}
