'use client';

import { useState, useEffect, use as useReact } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle2, Monitor } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function ProjectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = useReact(params);
  const [questions, setQuestions] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  const joinUrl = `https://asktc.com/room/${slug}`;

  // Design System Stacks
  const serif = "'Cormorant Garamond', serif";
  const cond = "'Barlow Condensed', sans-serif";
  const sans = "'Barlow', sans-serif";

  const triggerBoom = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 45, 
      spread: 360, 
      ticks: 100, 
      zIndex: 50,
      colors: ['#d4ff4e', '#ffffff', '#111111'] 
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 80 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3, y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 } });
    }, 250);
  };

  const fetchData = async () => {
    const { data: room } = await supabase.from('rooms').select('*').eq('slug', slug).single();
    if (room) {
      setRoomData(room);
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', room.id);
      setQuestions(qs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`projector_realtime_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, (payload: any) => {
        // Trigger confetti only if a question was newly answered
        if (payload.eventType === 'UPDATE' && payload.new.status === 'answered' && payload.old.status !== 'answered') {
          setLastAnsweredId(payload.new.id);
          triggerBoom();
          setTimeout(() => setLastAnsweredId(null), 10000);
        }
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  // STAGE LOGIC
  // 1. Show the question being celebrated (confetti state)
  // 2. Otherwise, show ONLY what the moderator has marked as 'is_projected'
  // 3. If neither, the stage is empty (Show QR Code)
  const projectedQuestion = questions.find(q => q.is_projected === true);
  const displayQuestion = lastAnsweredId 
    ? questions.find(q => q.id === lastAnsweredId) 
    : projectedQuestion;

  const pendingCount = questions.filter(q => q.status === 'pending').length;

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#d4ff4e]/20" size={40} />
    </div>
  );

  return (
    <main style={{ fontFamily: sans }} className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col selection:bg-[#d4ff4e]/20 relative">
      
      {/* HEADER */}
      <div className="z-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1800px] mx-auto px-12 py-10 flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-[#d4ff4e] rounded-full animate-pulse shadow-[0_0_15px_#d4ff4e]" />
               <span style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4ff4e]">Protocol: Broadcast Active</span>
            </div>
            <h1 style={{ fontFamily: cond }} className="text-6xl font-black tracking-tighter uppercase italic leading-none">
              {roomData?.name || 'Live Session'}
            </h1>
          </div>

          <div className="flex gap-16 items-center">
            {displayQuestion && (
              <div className="flex items-center gap-5 bg-white/5 p-2 pr-6 rounded-2xl border border-white/5">
                <div className="bg-white p-1.5 rounded-xl">
                  <QRCodeCanvas value={joinUrl} size={60} />
                </div>
                <div className="text-right">
                   <p style={{ fontFamily: cond }} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Join Stage</p>
                   <p className="text-2xl font-black tracking-tighter text-white italic leading-none mt-1">asktc.com/{slug}</p>
                </div>
              </div>
            )}
            <div className="text-right">
              <p style={{ fontFamily: cond }} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Queue</p>
              <p style={{ color: '#d4ff4e' }} className="text-6xl font-black tabular-nums tracking-tighter">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="flex-1 flex items-center justify-center px-16 z-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4ff4e]/5 blur-[180px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {displayQuestion ? (
            <motion.div
              key={displayQuestion.id}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="max-w-7xl w-full flex flex-col items-center"
            >
              <div className={`mb-12 px-8 py-3 rounded-full border flex items-center gap-3 transition-all duration-700 ${
                lastAnsweredId === displayQuestion.id ? 'bg-[#d4ff4e]/10 border-[#d4ff4e]/30 shadow-[0_0_40px_rgba(212,255,78,0.1)]' : 'bg-white/5 border-white/10'
              }`}>
                {lastAnsweredId === displayQuestion.id ? <CheckCircle2 size={16} color="#d4ff4e" /> : <Monitor size={16} className="text-zinc-500" />}
                <span style={{ fontFamily: cond }} className={`text-[11px] font-black uppercase tracking-[0.25em] ${lastAnsweredId === displayQuestion.id ? 'text-[#d4ff4e]' : 'text-zinc-500'}`}>
                  {lastAnsweredId === displayQuestion.id ? 'Response Shared' : 'Featured Question'}
                </span>
              </div>

              <h2 style={{ fontFamily: serif }} className="text-center text-8xl md:text-9xl font-light italic leading-[0.9] text-zinc-100 drop-shadow-2xl">
                "{displayQuestion.content}"
              </h2>
              
              <div className="mt-20 flex items-center gap-6 opacity-60">
                 <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-800" />
                 <span style={{ fontFamily: cond }} className="text-2xl font-bold uppercase tracking-[0.5em] text-zinc-400">
                   {displayQuestion.guest_name || 'Anonymous Guest'}
                 </span>
                 <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-800" />
              </div>
            </motion.div>
          ) : (
            /* EMPTY STAGE: WELCOME MODE */
            <motion.div 
              key="empty-stage"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-12"
            >
               <div className="space-y-4">
                  <Globe size={40} className="mx-auto text-[#d4ff4e] animate-[spin_10s_linear_infinite]" />
                  <p style={{ fontFamily: cond }} className="text-xl font-black uppercase tracking-[0.6em] text-zinc-700 italic">Waiting for connection...</p>
               </div>

               <div className="bg-white p-10 rounded-[3rem] inline-block shadow-[0_0_100px_rgba(212,255,78,0.1)] border-[16px] border-zinc-900">
                  <QRCodeCanvas value={joinUrl} size={350} level="H" />
               </div>

               <div className="space-y-2">
                  <p style={{ fontFamily: cond }} className="text-xl text-zinc-600 uppercase tracking-[0.2em]">Scan to intercept the stage</p>
                  <p className="text-6xl font-black text-white tracking-tighter uppercase italic">asktc.com/{slug}</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="px-12 py-10 flex justify-between items-center border-t border-white/5 opacity-30 z-20">
        <p style={{ fontFamily: cond }} className="text-[10px] font-bold uppercase tracking-[0.3em]">Session: {roomData?.id?.slice(0,8)}</p>
        <p style={{ fontFamily: cond }} className="text-[10px] font-bold uppercase tracking-[0.3em]">© 2026 ENGAGEMENT ENGINE</p>
      </div>

    </main>
  );
}