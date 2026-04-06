'use client';

import { useState, useEffect, use as useReact } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle2, Monitor } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import ReactionOverlay from '@/components/ReactionOverlay';
import PollResults from '@/components/PollResults';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";

export default function ProjectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = useReact(params);
  const [questions, setQuestions] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);

  const joinUrl = `https://asktc.vercel.app/room/${slug}`;

  const triggerBoom = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 50, colors: ['#d4ff4e', '#ffffff', '#111111'] };
    const interval: any = setInterval(() => {
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
      const { data: qs } = await supabase.from('questions').select('*').eq('room_id', room.id);
      setQuestions(qs || []);

      const { data: poll } = await supabase
        .from('polls').select('*, poll_options(*), poll_votes(*)')
        .eq('room_id', room.id).eq('is_active', true).single();
      setActivePoll(poll || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel(`projector_realtime_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'answered' && payload.old.status !== 'answered') {
          setLastAnsweredId(payload.new.id);
          triggerBoom();
          setTimeout(() => setLastAnsweredId(null), 10000);
        }
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const projectedQuestion = questions.find(q => q.is_projected === true);
  const displayQuestion = lastAnsweredId ? questions.find(q => q.id === lastAnsweredId) : projectedQuestion;
  const pendingCount = questions.filter(q => q.status === 'pending').length;

  if (loading) return (
    <div style={{ height: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} color="rgba(212,255,78,0.2)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <main style={{ fontFamily: sans, height: '100vh', background: '#050505', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* REACTION OVERLAY */}
      {roomData && <ReactionOverlay roomId={roomData.id} enabled={reactionsEnabled} />}

      {/* HEADER */}
      <div style={{ zIndex: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)' }}>
        <div style={{ maxWidth: 1800, margin: '0 auto', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4ff4e', boxShadow: '0 0 15px #d4ff4e', animation: 'pip 2s ease infinite' }} />
              <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4ff4e' }}>Broadcast Active</span>
            </div>
            <h1 style={{ fontFamily: cond, fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic', lineHeight: 1 }}>
              {roomData?.name || 'Live Session'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
            {/* REACTIONS TOGGLE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Reactions</span>
              <button onClick={() => setReactionsEnabled(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 100, background: reactionsEnabled ? '#d4ff4e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: reactionsEnabled ? '#060606' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 3, left: reactionsEnabled ? 23 : 3, transition: 'left 0.2s' }} />
              </button>
            </div>

            {displayQuestion && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.05)', padding: '8px 20px 8px 8px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ background: 'white', padding: 6, borderRadius: 10 }}>
                  <QRCodeCanvas value={joinUrl} size={56} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Join Stage</p>
                  <p style={{ fontFamily: cond, fontSize: '1.3rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', fontStyle: 'italic' }}>asktc.vercel.app/{slug}</p>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Queue</p>
              <p style={{ fontFamily: cond, fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 900, color: '#d4ff4e', lineHeight: 1 }}>{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 64px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, background: 'radial-gradient(ellipse, rgba(212,255,78,0.05) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        <AnimatePresence mode="wait">
          {/* ACTIVE POLL */}
          {activePoll && !displayQuestion ? (
            <motion.div key={`poll-${activePoll.id}`}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              style={{ maxWidth: 900, width: '100%' }}>
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4ff4e', display: 'block', animation: 'pip 2s ease infinite' }} />
                <span style={{ fontFamily: cond, fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4ff4e' }}>Live Poll</span>
              </div>
              <PollResults poll={activePoll} />
            </motion.div>
          ) : displayQuestion ? (
            <motion.div key={displayQuestion.id}
              initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -40, scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              style={{ maxWidth: 1400, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              <div style={{ marginBottom: 48, padding: '12px 28px', borderRadius: 100, border: `1px solid ${lastAnsweredId === displayQuestion.id ? 'rgba(212,255,78,0.3)' : 'rgba(255,255,255,0.1)'}`, background: lastAnsweredId === displayQuestion.id ? 'rgba(212,255,78,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.7s' }}>
                {lastAnsweredId === displayQuestion.id ? <CheckCircle2 size={16} color="#d4ff4e" /> : <Monitor size={16} color="rgba(255,255,255,0.3)" />}
                <span style={{ fontFamily: cond, fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: lastAnsweredId === displayQuestion.id ? '#d4ff4e' : 'rgba(255,255,255,0.4)' }}>
                  {lastAnsweredId === displayQuestion.id ? 'Response Shared' : 'Featured Question'}
                </span>
              </div>

              <h2 style={{ fontFamily: serif, fontSize: 'clamp(3rem,8vw,7rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 0.9, textAlign: 'center', color: 'rgba(245,240,232,0.95)' }}>
                "{displayQuestion.content}"
              </h2>

              <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 20, opacity: 0.5 }}>
                <div style={{ height: 1, width: 60, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2))' }} />
                <span style={{ fontFamily: cond, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                  {displayQuestion.guest_name || 'Anonymous'}
                </span>
                <div style={{ height: 1, width: 60, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.2))' }} />
              </div>
            </motion.div>
          ) : (
            /* EMPTY — QR CODE */
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
              <Globe size={40} color="#d4ff4e" style={{ animation: 'spin 10s linear infinite' }} />
              <p style={{ fontFamily: cond, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Waiting for signal...</p>
              <div style={{ background: 'white', padding: 40, borderRadius: 48, border: '16px solid rgba(255,255,255,0.05)', boxShadow: '0 0 100px rgba(212,255,78,0.1)' }}>
                <QRCodeCanvas value={joinUrl} size={320} level="H" />
              </div>
              <div>
                <p style={{ fontFamily: cond, fontSize: '1rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Scan to join</p>
                <p style={{ fontFamily: cond, fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic' }}>asktc.vercel.app/{slug}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', opacity: 0.2, zIndex: 20 }}>
        <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Session: {roomData?.id?.slice(0, 8)}</p>
        <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>ASKTC — Powered by Black Sheep Co.</p>
      </div>

      <style>{`
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </main>
  );
}