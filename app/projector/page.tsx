'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { Globe, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [questions, setQuestions] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  const triggerBoom = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 50 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 80 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const fetchRoomAndQuestions = async () => {
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('slug', slug)
      .single();
    
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
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' }, 
        async (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'answered') {
            setLastAnsweredId(payload.new.id);
            triggerBoom();
            setTimeout(() => setLastAnsweredId(null), 15000);
          }
          // Refresh data on any change
          fetchRoomAndQuestions();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const activeQuestions = questions.filter(q => q.status === 'pending');
  
  // Logic: Show the "Just Answered" one if it exists, else the first pending one, else the first answered one.
  const displayQuestion = lastAnsweredId 
    ? questions.find(q => q.id === lastAnsweredId)
    : questions.find(q => q.status === 'answered') || activeQuestions[0];

  return (
    <main className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans selection:bg-white/10 relative">
      
      {/* TIGHT HEADER */}
      <div className="z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-12 py-10 flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Live Feedback Stream</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              {roomData?.name || 'Loading Session...'}
            </h1>
          </div>

          <div className="flex gap-16">
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Join the conversation</p>
              <p className="text-3xl font-bold tracking-tight text-white italic">asktc.com/{slug}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Queue</p>
              <p className="text-5xl font-black text-white tabular-nums">{activeQuestions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="flex-1 flex items-center justify-center px-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <Loader2 className="animate-spin text-zinc-800" size={48} />
             </motion.div>
          ) : displayQuestion ? (
            <motion.div 
              key={displayQuestion.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl w-full flex flex-col items-center z-10"
            >
              <div className={`mb-12 px-6 py-2 rounded-full border flex items-center gap-3 transition-all duration-700 ${
                lastAnsweredId ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10'
              }`}>
                {lastAnsweredId ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Users size={16} className="text-zinc-500" />}
                <span className={`text-[10px] font-black uppercase tracking-widest ${lastAnsweredId ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  {lastAnsweredId ? 'Just Answered' : 'Featured Question'}
                </span>
              </div>

              <h2 className="text-center text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase italic drop-shadow-2xl">
                "{displayQuestion.content}"
              </h2>
              
              <div className="mt-16 flex items-center gap-4 opacity-50">
                 <span className="h-px w-12 bg-zinc-800" />
                 <span className="text-xl font-bold uppercase tracking-[0.3em] text-zinc-400">
                   {displayQuestion.guest_name || 'Anonymous'}
                 </span>
                 <span className="h-px w-12 bg-zinc-800" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
               <Globe size={60} className="mx-auto text-zinc-900 animate-[spin_10s_linear_infinite] opacity-20" />
               <p className="text-xl font-bold uppercase tracking-[0.4em] text-zinc-800 italic">Stage is quiet...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MINIMAL FOOTER */}
      <div className="px-12 py-10 flex justify-between items-center border-t border-white/5 opacity-30 z-10">
        <p className="text-[10px] font-black uppercase tracking-widest font-mono">asktc.com // session_id: {roomData?.id?.slice(0,8)}</p>
        <p className="text-[10px] font-black uppercase tracking-widest">© 2026 ENGAGEMENT ENGINE</p>
      </div>

    </main>
  );
}