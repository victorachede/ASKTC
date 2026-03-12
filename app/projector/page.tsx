'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { Globe, CheckCircle2, Users, Loader2, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [questions, setQuestions] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  // FONT STACKS
  const serif = "'Cormorant Garamond', serif";
  const cond = "'Barlow Condensed', sans-serif";
  const sans = "'Barlow', sans-serif";

  // Confetti in the "Volt" brand color
  const triggerBoom = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 45, spread: 360, ticks: 100, zIndex: 50,
      colors: ['#d4ff4e', '#ffffff', '#111111'] 
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 80 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4, y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.6, y: Math.random() - 0.2 } });
    }, 250);
  };

  const fetchRoomAndQuestions = async () => {
    const { data: room } = await supabase.from('rooms').select('*').eq('slug', slug).single();
    if (room) {
      setRoomData(room);
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
      setQuestions(qs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoomAndQuestions();

    const channel = supabase
      .channel(`projector_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'answered' && payload.old.status !== 'answered') {
          setLastAnsweredId(payload.new.id);
          triggerBoom();
          setTimeout(() => setLastAnsweredId(null), 8000); // Reset after 8 seconds
        }
        fetchRoomAndQuestions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  
  // LOGIC: Show the specific projected question, or the one we just answered, or the next in line.
  const displayQuestion = lastAnsweredId 
    ? questions.find(q => q.id === lastAnsweredId)
    : questions.find(q => q.is_projected === true) || pendingQuestions[0];

  return (
    <main style={{ fontFamily: sans }} className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col relative">
      
      {/* HEADER SECTION */}
      <div className="z-10 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-[1800px] mx-auto px-12 py-10 flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-[#d4ff4e] rounded-full animate-pulse shadow-[0_0_15px_#d4ff4e]" />
               <span style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4ff4e]">Stage Protocol Active</span>
            </div>
            <h1 style={{ fontFamily: cond }} className="text-6xl font-black tracking-tighter uppercase italic leading-none">
              {roomData?.name || 'Loading Session...'}
            </h1>
          </div>

          <div className="flex gap-20">
            <div className="text-right">
              <p style={{ fontFamily: cond }} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Scan or Visit</p>
              <p className="text-4xl font-black tracking-tighter italic">asktc.com/{slug}</p>
            </div>
            <div className="text-right">
              <p style={{ fontFamily: cond }} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Queue</p>
              <p style={{ color: '#d4ff4e' }} className="text-6xl font-black tabular-nums tracking-tighter">
                {pendingQuestions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN STAGE */}
      <div className="flex-1 flex items-center justify-center px-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4ff4e]/5 blur-[180px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div key="loader">
               <Loader2 className="animate-spin text-zinc-800" size={48} />
             </motion.div>
          ) : displayQuestion ? (
            <motion.div 
              key={displayQuestion.id}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.02 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
              className="max-w-7xl w-full flex flex-col items-center z-10"
            >
              {/* STATUS INDICATOR */}
              <div className={`mb-14 px-8 py-3 rounded-full border flex items-center gap-3 transition-all duration-500 ${
                lastAnsweredId ? 'bg-[#d4ff4e]/10 border-[#d4ff4e]/30' : 'bg-white/5 border-white/10'
              }`}>
                {lastAnsweredId ? <CheckCircle2 size={16} color="#d4ff4e" /> : <Monitor size={16} className="text-zinc-500" />}
                <span style={{ fontFamily: cond }} className={`text-xs font-black uppercase tracking-[0.25em] ${lastAnsweredId ? 'text-[#d4ff4e]' : 'text-zinc-500'}`}>
                  {lastAnsweredId ? 'Broadcasted Live' : 'Now Featured'}
                </span>
              </div>

              {/* THE CORE TEXT */}
              <h2 
                style={{ fontFamily: serif }}
                className="text-center text-8xl md:text-9xl font-light italic leading-[0.9] text-zinc-100 drop-shadow-2xl"
              >
                "{displayQuestion.content}"
              </h2>
              
              {/* GUEST ATTRIBUTION */}
              <div className="mt-20 flex items-center gap-6">
                 <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-800" />
                 <span style={{ fontFamily: cond }} className="text-2xl font-bold uppercase tracking-[0.5em] text-zinc-500">
                   {displayQuestion.guest_name || 'Anonymous Guest'}
                 </span>
                 <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-800" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="text-center opacity-20">
               <Globe size={100} className="mx-auto mb-6 animate-pulse" />
               <p style={{ fontFamily: cond }} className="text-2xl font-bold uppercase tracking-[0.8em]">Waiting for Voice</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="px-12 py-10 flex justify-between items-center border-t border-white/5 opacity-40">
        <p style={{ fontFamily: cond }} className="text-[10px] font-bold uppercase tracking-[0.3em]">
          SESSION_ID: {roomData?.id?.slice(0,8)}
        </p>
        <p style={{ fontFamily: cond }} className="text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2026 ASKTC // BUILT FOR SCALE
        </p>
      </div>

    </main>
  );
}