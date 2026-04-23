import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  BarChart3,
  Layers,
  ChevronDown,
  Menu,
  X,
  Calendar,
  Users,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Style Constants
const STYLES = {
  bg: 'bg-[#0A0A0A]',
  textPrimary: 'text-white',
  textSecondary: 'text-[#A1A1A1]',
  accent: 'bg-[#9E9EFF]',
  accentText: 'text-[#9E9EFF]',
  border: 'border-white/10',
  glass: 'backdrop-blur-md bg-black/70',
  cardRadius: 'rounded-[32px]',
};

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 }
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCTA = () => {
    if (user) {
      const path = user.role === 'ADMIN' ? '/admin' : user.role === 'MENTOR' ? '/mentor' : '/user';
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={`min-h-screen ${STYLES.bg} ${STYLES.textPrimary} selection:bg-[#9E9EFF] selection:text-black font-['Inter',_sans-serif] overflow-x-hidden`}>
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#2D1F5A]/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#1A103D]/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-7xl px-6 py-4 ${STYLES.glass} border ${STYLES.border} rounded-full flex justify-between items-center transition-all duration-500`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <div className="w-4 h-0.5 bg-black rotate-45 translate-y-0.5" />
            <div className="w-4 h-0.5 bg-black -rotate-45 -translate-y-0.5 -translate-x-2" />
          </div>
          <span className="text-lg font-bold tracking-tighter uppercase italic">MentorQue</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {['Features', 'Engine', 'Pricing', 'Testimonials'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] font-medium text-[#A1A1A1] hover:text-white transition-colors uppercase tracking-[0.1em]">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleCTA}
            className={`hidden md:block px-6 py-2.5 ${STYLES.accent} text-black rounded-full text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all outline-none`}
          >
            {user ? 'Go to Dashboard' : 'Execute Entry'}
          </button>
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute top-full left-0 right-0 mt-4 p-8 ${STYLES.glass} border ${STYLES.border} rounded-[32px] flex flex-col gap-6 md:hidden shadow-2xl`}
            >
              {['Features', 'Engine', 'Pricing', 'Testimonials'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white uppercase tracking-wider">
                  {item}
                </a>
              ))}
              <button 
                onClick={handleCTA}
                className={`w-full py-4 ${STYLES.accent} text-black rounded-full text-sm font-bold uppercase tracking-wider`}
              >
                {user ? 'Dashboard' : 'Sign In'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-48 pb-32 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Social Proof Pill */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-6 py-2 mb-10"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-[#FACC15] text-[#FACC15]" />)}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#A1A1A1]">Trusted by 2,400+ Mentors & Candidates</span>
            </div>
          </motion.div>

          <motion.h1 
            {...fadeInUp}
            className="text-[54px] md:text-[80px] font-medium leading-[1.05] tracking-[-0.04em] mb-8 uppercase italic"
          >
            Orchestrate your <br className="hidden md:block" />
            <span className="text-[#9E9EFF]">availability</span> with precision.
          </motion.h1>

          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#A1A1A1] max-w-2xl mb-12 leading-relaxed font-medium"
          >
            MentorQue is the unified platform for enterprise-grade mentorship logistics. 
            Automated recommendations, conflict-free scheduling, and real-time tracking.
          </motion.p>

          <motion.button 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            onClick={handleCTA}
            className={`px-12 py-6 ${STYLES.accent} text-black rounded-full text-sm font-black uppercase tracking-[0.2em] hover:scale-105 hover:shadow-[0_0_50px_rgba(158,158,255,0.4)] transition-all active:scale-95`}
          >
            {user ? 'Enter Dashboard' : 'Request Access'}
          </motion.button>
        </section>

        {/* Marquee Loop */}
        <section className="py-12 bg-white/5 border-y border-white/5 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-20 animate-marquee">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-8 text-2xl font-bold uppercase italic opacity-30 select-none">
                <span className="text-[#9E9EFF]">✦</span>
                <span>AI Recommendations</span>
                <span className="text-[#9E9EFF]">✦</span>
                <span>Unified Calendar</span>
                <span className="text-[#9E9EFF]">✦</span>
                <span>Conflict Resolution</span>
                <span className="text-[#9E9EFF]">✦</span>
                <span>Real-time Sync</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className={`inline-block text-[11px] font-black uppercase tracking-[0.4em] ${STYLES.accentText} bg-[#9E9EFF]/10 px-6 py-2 rounded-full mb-6`}>
              Logitech Infrastructure
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic mb-6">Designed for Scale.</h2>
          </div>

          <motion.div 
            {...stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { title: "Smart Recommendations", desc: "Our engine uses domain expertise and score breakdowns to find the perfect mentor match.", icon: <Cpu className="w-6 h-6" /> },
              { title: "Unified Dashboard", desc: "One interface for Admins, Mentors, and Users. Every availability slot, perfectly tracked.", icon: <LayoutDashboard className="w-6 h-6" /> },
              { title: "Conflict Resolution", desc: "Say goodbye to double bookings. Our system validates every timestamp in real-time.", icon: <Clock className="w-6 h-6" /> },
              { title: "Enterprise RBAC", desc: "Military-grade role-based access control. Secure your institutional scheduling data.", icon: <Shield className="w-6 h-6" /> },
              { title: "Global Sync", desc: "Timezone-aware scheduling that ensures everyone is on the same page, regardless of location.", icon: <Globe className="w-6 h-6" /> },
              { title: "Live Analytics", desc: "Track call volume, mentor engagement, and availability trends with high-fidelity reports.", icon: <BarChart3 className="w-6 h-6" /> },
            ].map((f, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                className={`p-10 bg-white/5 border ${STYLES.border} ${STYLES.cardRadius} hover:border-[#9E9EFF]/50 transition-all duration-500 group`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-[#9E9EFF]/10 ${STYLES.accentText} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight mb-4">{f.title}</h3>
                <p className="text-[#A1A1A1] font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Stats Section - DARK MODE FIXED */}
        <section id="engine" className={`py-40 px-6 ${STYLES.bg} relative overflow-hidden border-y border-white/5`}>
          {/* Subtle Backglow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-24 relative z-10">
             <div className="flex-1 space-y-12">
                <div className="space-y-6">
                  <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${STYLES.accentText} bg-[#9E9EFF]/10 px-6 py-2 rounded-full`}>Engine Efficiency</span>
                  <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic uppercase">Check out <br/> the metrics.</h2>
                  <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">We optimize for milliseconds. Our recommendation engine processes thousands of data points to ensure zero friction.</p>
                </div>
                
                <div className="space-y-10">
                   {[
                     { label: "Recommendation Latency", value: 98, suffix: "ms" },
                     { label: "Conflict Detection Rate", value: 100, suffix: "%" },
                     { label: "Sync Accuracy", value: 99.9, suffix: "%" },
                   ].map(stat => (
                     <div key={stat.label} className="space-y-3">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-[#A1A1A1]">
                           <span>{stat.label}</span>
                           <span>{stat.value}{stat.suffix}</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(stat.value, 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full bg-gradient-to-r from-[#9E9EFF] via-blue-500 to-[#9E9EFF]`}
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="flex-1 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#9E9EFF] to-blue-600 rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[#050505] p-2 rounded-[40px] border border-white/5">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                    alt="System Metrics" 
                    className={`w-full ${STYLES.cardRadius} shadow-2xl opacity-80 group-hover:opacity-100 transition duration-500`}
                  />
                </div>
             </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-40 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className={`inline-block text-[11px] font-black uppercase tracking-[0.4em] ${STYLES.accentText} mb-6`}>Network Feedback</span>
            <h2 className="text-4xl md:text-7xl font-black tracking-tight uppercase italic leading-none">Voices in the <br/> ecosystem.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: "Ashutosh Singh", role: "Program Manager", quote: "MentorQue transformed how we handle candidate-mentor matching. The recommendation engine is a game changer.", img: 11 },
              { name: "Priya Sharma", role: "Senior Mentor", quote: "Finally, a platform that respects my timezone and availability. I spend zero time worrying about scheduling conflicts now.", img: 12 },
              { name: "David Miller", role: "Admin Lead", quote: "The role-based dashboard gives me exactly what I need to manage 200+ active mentorship calls without breaking a sweat.", img: 13 },
              { name: "Siddharth Verma", role: "Software Engineer", quote: "The interface is sleek, fast, and remarkably intuitive. Booking a slot takes literally 10 seconds.", img: 14 },
            ].map((t, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                className={`p-12 bg-white/5 border ${STYLES.border} ${STYLES.cardRadius} backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-500`}
              >
                <div className="flex items-center gap-5 mb-10">
                  <img src={`https://i.pravatar.cc/100?img=${t.img + 20}`} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
                  <div>
                    <p className="text-lg font-black uppercase tracking-tight italic">{t.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A1A1A1]">{t.role}</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-medium leading-[1.6] italic text-slate-300">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing - DARK MODE UNIFIED */}
        <section id="pricing" className="py-40 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-20">
              <span className={`inline-block text-[11px] font-black uppercase tracking-[0.4em] ${STYLES.accentText} mb-6`}>Institutional Access</span>
              <h2 className="text-4xl md:text-7xl font-black tracking-tight uppercase italic mb-12">Scalable Solutions.</h2>
              
              <div className="inline-flex items-center gap-4 bg-white/5 p-1.5 rounded-full border border-white/10">
                <button 
                  onClick={() => setIsYearly(false)}
                  className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${!isYearly ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setIsYearly(true)}
                  className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isYearly ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}
                >
                  Yearly
                </button>
                {isYearly && <span className="mr-6 text-[9px] font-black text-[#9E9EFF] uppercase tracking-[0.2em] animate-pulse">Save 40%</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {[
                { type: "Standard", price: isYearly ? "1,999" : "199", features: ["1 Admin Account", "Up to 50 Users", "Unlimited Mentor Slots", "Standard Matching Engine"], delay: 0 },
                { type: "Enterprise", price: isYearly ? "5,999" : "599", features: ["Unlimited Dashboards", "Priority Matching Engine", "White-label Interface", "24/7 Security Protocol"], featured: true, delay: 0.1 },
              ].map((plan, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: plan.delay, duration: 0.8 }}
                  className={`p-12 relative flex flex-col h-full bg-white/5 border ${plan.featured ? 'border-[#9E9EFF]/50 shadow-[0_0_80px_rgba(158,158,255,0.1)]' : STYLES.border} ${STYLES.cardRadius} overflow-hidden group`}
                >
                  {plan.featured && <div className="absolute top-0 right-0 p-4 bg-[#9E9EFF] text-black font-black text-[9px] uppercase tracking-widest rounded-bl-2xl">Premium Control</div>}
                  
                  <div className="mb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">{plan.type} Hub</p>
                    <p className="text-6xl font-black italic tracking-tighter">
                      ${plan.price}
                      <span className="text-xl not-italic opacity-30 ml-2 font-medium">/{isYearly ? 'yr' : 'mo'}</span>
                    </p>
                  </div>

                  <div className="space-y-5 mb-14 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-4">
                        <Check className={`w-4 h-4 ${plan.featured ? STYLES.accentText : 'text-slate-500'}`} />
                        <span className="text-[13px] font-bold uppercase tracking-tight text-slate-400">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleCTA}
                    className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${plan.featured ? STYLES.accent + ' text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                  >
                    Authorize {plan.type}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-48 px-6 text-center max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-16"
          >
            <h2 className="text-5xl md:text-[90px] font-black tracking-tighter uppercase italic leading-[0.9]">Start your <br/> next session.</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={handleCTA}
                className="px-16 py-8 bg-white text-black rounded-3xl text-xs font-black uppercase tracking-[0.4em] hover:shadow-[0_0_80px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-700 active:scale-95"
              >
                Access Platform
              </button>
              <button className="px-16 py-8 bg-white/5 border border-white/10 text-white rounded-3xl text-xs font-black uppercase tracking-[0.4em] hover:bg-white/10 transition-all duration-700">
                Contact Ops
              </button>
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.6em] pt-10">Institutional Access Only. System Version 1.0.42</p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-black">M</div>
            <span className="text-lg font-black tracking-tighter uppercase italic">MentorQue</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-6">
             {['Terms of Protocol', 'Privacy Encryption', 'Support Hub', 'API Documentation'].map(item => (
               <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-white transition-all duration-500">{item}</a>
             ))}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-medium text-slate-700 uppercase tracking-[0.4em]">© 2026 MentorQue Labs. All proprietary assets encrypted.</p>
            <div className="flex justify-center gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-[#9E9EFF] animate-pulse" />
               <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1A1]" />
               <div className="w-1.5 h-1.5 rounded-full bg-[#A1A1A1]" />
            </div>
          </div>
        </div>
      </footer>

      {/* Marquee Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #1A1A1A;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #252525;
        }
      `}} />
    </div>
  );
}
