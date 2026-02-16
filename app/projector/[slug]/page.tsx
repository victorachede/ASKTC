'use client';

import { useState, useEffect, use as useReact } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle2, Users, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function ProjectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = useReact(params);
  const [questions, setQuestions] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  const joinUrl = `https://asktc.com/room/${slug}`;

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

  const fetchData = async () => {
    const { data: room } = await supabase.from('rooms').select('*').eq('slug', slug).single();
    if (room) {
      setRoomData(room);
      const { data: qs } = await supabase
        .from('questions')
        .select('*, upvotes(count)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
      setQuestions(qs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`projector_realtime_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'answered') {
          setLastAnsweredId(payload.new.id);
          triggerBoom();
          setTimeout(() => setLastAnsweredId(null), 10000);
        }
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const displayQuestion = questions.find(q => q.id === lastAnsweredId) || questions.find(q => q.status === 'answered');

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500/20" size={40} />
    </div>
  );

  return (
    <main className="h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans selection:bg-white/10 relative">
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      {/* HEADER */}
      <div className="z-20 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-12 py-10 flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Live Broadcast</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
              {roomData?.name || 'Session'}
            </h1>
          </div>

          <div className="flex gap-16 items-center">
            {/* MINI QR IN HEADER WHEN QUESTION IS LIVE */}
            {displayQuestion && (
              <div className="flex items-center gap-4 bg-white/5 p-2 pr-4 rounded-2xl border border-white/5">
                <div className="bg-white p-1 rounded-lg">
                  <QRCodeCanvas value={joinUrl} size={60} />
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Join Session</p>
                   <p className="text-lg font-bold tracking-tighter text-white italic">asktc.com/{slug}</p>
                </div>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Queue</p>
              <p className="text-5xl font-black text-white tabular-nums">{pendingQuestions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="flex-1 flex items-center justify-center px-12 z-10">
        <AnimatePresence mode="wait">
          {displayQuestion ? (
            <motion.div
              key={displayQuestion.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl w-full flex flex-col items-center"
            >
              <div className={`mb-12 px-6 py-2 rounded-full border flex items-center gap-3 transition-all duration-700 ${
                lastAnsweredId === displayQuestion.id ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10'
              }`}>
                {lastAnsweredId === displayQuestion.id ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Users size={16} className="text-zinc-500" />}
                <span className={`text-[10px] font-black uppercase tracking-widest ${lastAnsweredId === displayQuestion.id ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  {lastAnsweredId === displayQuestion.id ? 'New Question' : 'On Stage'}
                </span>
              </div>

              <h2 className="text-center text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] uppercase italic drop-shadow-2xl">
                "{displayQuestion.content}"
              </h2>
              
              <div className="mt-16 flex items-center gap-4 opacity-50">
                 <span className="h-px w-12 bg-zinc-800" />
                 <span className="text-2xl font-bold uppercase tracking-[0.3em] text-zinc-400">
                   {displayQuestion.guest_name}
                 </span>
                 <span className="h-px w-12 bg-zinc-800" />
              </div>
            </motion.div>
          ) : (
            /* EMPTY STAGE: GIANT QR MODE */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="text-center space-y-12"
            >
               <div className="space-y-4">
                  <Globe size={40} className="mx-auto text-emerald-500 animate-[spin_10s_linear_infinite]" />
                  <p className="text-xl font-black uppercase tracking-[0.6em] text-zinc-500 italic">Waiting for connection...</p>
               </div>

               <div className="bg-white p-10 rounded-[3rem] inline-block shadow-[0_0_100px_rgba(16,185,129,0.1)] border-[16px] border-zinc-900">
                  <QRCodeCanvas value={joinUrl} size={350} level="H" />
               </div>

               <div className="space-y-2">
                  <p className="text-xl font-mono text-zinc-600 uppercase tracking-[0.2em]">Scan to intercept the stage</p>
                  <p className="text-5xl font-black text-white tracking-tighter uppercase italic">asktc.com/{slug}</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="px-12 py-10 flex justify-between items-center border-t border-white/5 opacity-20 z-20">
        <p className="text-[10px] font-black uppercase tracking-widest font-mono">asktc.com // sid: {roomData?.id?.slice(0,8)}</p>
        <p className="text-[10px] font-black uppercase tracking-widest">© 2026 ENGAGEMENT ENGINE</p>
      </div>

    </main>
  );
}