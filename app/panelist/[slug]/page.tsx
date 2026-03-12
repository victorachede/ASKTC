'use client';

import { useState, useEffect, useRef, use as useReact } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Users, Loader2 } from 'lucide-react';

// ─── TTS via OpenAI ───────────────────────────────────────────────────────────
async function speakQuestion(text: string, speakerName: string) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Question for ${speakerName}: ${text}` }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch (e) {
    console.error('TTS failed:', e);
  }
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono tabular-nums">{time}</span>;
}

// ─── QUEUE ITEM ───────────────────────────────────────────────────────────────
function QueueItem({ assignment, index }: { assignment: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5"
    >
      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[9px] font-black text-zinc-600">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 italic leading-relaxed truncate">"{assignment.questions?.content}"</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-1">
          → {assignment.panelists?.name}
        </p>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PanelistDisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = useReact(params);
  const [roomData, setRoomData] = useState<any>(null);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const lastSpokenId = useRef<string | null>(null);

  const fetchData = async () => {
    const { data: room } = await supabase.from('rooms').select('*').eq('slug', slug).single();
    if (!room) return;
    setRoomData(room);

    const { data: assignments } = await supabase
      .from('question_assignments')
      .select(`
        *,
        panelists(id, name, title),
        questions(id, content, guest_name)
      `)
      .eq('room_id', room.id)
      .neq('status', 'done')
      .order('queue_position', { ascending: true });

    const active = assignments?.find(a => a.status === 'active') || null;
    const queued = assignments?.filter(a => a.status === 'queued') || [];

    setActiveAssignment(active);
    setQueue(queued);

    // Auto-TTS when a new active question comes in
    if (active && active.id !== lastSpokenId.current && ttsEnabled) {
      lastSpokenId.current = active.id;
      speakQuestion(active.questions?.content, active.panelists?.name);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`panelist_display_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_assignments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panelists' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug, ttsEnabled]);

  if (loading) return (
    <div className="h-screen bg-[#030303] flex items-center justify-center">
      <Loader2 className="animate-spin text-white/10" size={32} />
    </div>
  );

  const panelist = activeAssignment?.panelists;
  const question = activeAssignment?.questions;

  return (
    <main className="h-screen bg-[#030303] text-white overflow-hidden flex flex-col font-sans antialiased select-none relative">

      {/* NOISE TEXTURE */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />

      {/* AMBIENT GLOW — changes based on active state */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: activeAssignment ? 0.15 : 0.05 }}
          transition={{ duration: 2 }}
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-white blur-[200px] rounded-full"
        />
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600">
            {roomData?.name || 'Live Session'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setTtsEnabled(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
              ttsEnabled
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                : 'border-white/5 text-zinc-700 bg-white/[0.02]'
            }`}
          >
            {ttsEnabled ? <Mic size={10} /> : <MicOff size={10} />}
            {ttsEnabled ? 'Voice On' : 'Voice Off'}
          </button>

          <span className="text-[10px] font-mono text-zinc-700">
            <LiveClock />
          </span>
        </div>
      </header>

      {/* MAIN STAGE */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-16">
        <AnimatePresence mode="wait">
          {activeAssignment ? (
            <motion.div
              key={activeAssignment.id}
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.02 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-6xl text-center"
            >
              {/* ASSIGNED TO BADGE */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-3 mb-14"
              >
                <div className="h-px w-12 bg-white/10" />
                <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/[0.03]">
                  <Users size={11} className="text-zinc-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    {panelist?.title ? `${panelist.title} ` : ''}{panelist?.name}
                  </span>
                </div>
                <div className="h-px w-12 bg-white/10" />
              </motion.div>

              {/* THE QUESTION */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-[clamp(2.5rem,7vw,8rem)] font-black leading-[0.88] tracking-tighter uppercase italic text-white drop-shadow-2xl"
              >
                "{question?.content}"
              </motion.h2>

              {/* ASKED BY */}
              {question?.guest_name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 text-sm font-bold uppercase tracking-[0.4em] text-zinc-700"
                >
                  — {question.guest_name}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-8">
                <Users size={28} className="text-white/10" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-800">
                Awaiting Assignment
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUEUE SIDEBAR */}
      {queue.length > 0 && (
        <div className="relative z-10 border-t border-white/[0.04] px-10 py-6">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-800 mb-4">
            Up Next — {queue.length} queued
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            <AnimatePresence>
              {queue.slice(0, 5).map((a, i) => (
                <div key={a.id} className="shrink-0 w-64">
                  <QueueItem assignment={a} index={i} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="relative z-10 px-10 py-4 border-t border-white/[0.03]">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-900 text-center">
          asktc • panelist display • {slug}
        </p>
      </div>
    </main>
  );
}
