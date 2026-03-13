'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Trash2, User, ExternalLink, Loader2,
  Play, Zap, RotateCcw, Users, Activity, ArrowRight,
  MonitorOff, CheckCircle2, Pin, BarChart2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PanelistModerator from '@/components/PanelistModerator';
import VoiceCommander from '@/components/VoiceCommander';
import PollCreator from '@/components/PollCreator';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap';

type Tab = 'control' | 'panelist' | 'polls';

export default function RoomControlPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('control');
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [panelists, setPanelists] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase.from('rooms').select('*').eq('slug', slug).single();
      if (roomError || !roomData) throw new Error('Room not found');
      setRoom(roomData);

      const { data: qData } = await supabase
        .from('questions').select('*, upvotes(count)')
        .eq('room_id', roomData.id).order('created_at', { ascending: true });
      setQuestions(qData || []);

      const { data: pData } = await supabase
        .from('panelists').select('*')
        .eq('room_id', roomData.id).order('created_at', { ascending: true });
      setPanelists(pData || []);

      const { data: pollData } = await supabase
        .from('polls').select('*, poll_options(*), poll_votes(*)')
        .eq('room_id', roomData.id).order('created_at', { ascending: false });
      setPolls(pollData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel(`room_control_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panelists' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const handleStageAction = async (id: string, action: 'push' | 'withdraw' | 'archive') => {
    try {
      if (action === 'push') {
        await supabase.from('questions').update({ is_projected: false }).eq('room_id', room.id).eq('is_projected', true);
        const { error } = await supabase.from('questions').update({ status: 'answered', is_projected: true }).eq('id', id);
        if (error) throw error;
        toast.success('Signal live');
      } else if (action === 'withdraw') {
        const { error } = await supabase.from('questions').update({ status: 'pending', is_projected: false }).eq('id', id);
        if (error) throw error;
        toast.success('Signal withdrawn');
      } else if (action === 'archive') {
        const { error } = await supabase.from('questions').update({ status: 'answered', is_projected: false }).eq('id', id);
        if (error) throw error;
        toast.success('Resolved and archived');
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const pinQuestion = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase.from('questions').update({ is_pinned: !currentPinned }).eq('id', id);
    if (error) toast.error('Pin failed');
    else toast.success(currentPinned ? 'Unpinned' : 'Pinned to top');
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) toast.error('Delete failed');
  };

  if (loading) return (
    <div style={{ height: '100vh', background: '#060606', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Loader2 size={28} color="#d4ff4e" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>Syncing</span>
    </div>
  );

  const activeQuestion = questions.find(q => q.is_projected === true);
  const pendingQueue = questions
    .filter(q => q.status === 'pending' && !q.is_projected)
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (b.upvotes?.[0]?.count || 0) - (a.upvotes?.[0]?.count || 0);
    });
  const nextUp = pendingQueue[0];
  const upcoming = pendingQueue.slice(1);
  const history = questions.filter(q => q.status === 'answered' && !q.is_projected).reverse();

  const TABS: { key: Tab; label: string; icon?: any }[] = [
    { key: 'control', label: 'Control' },
    { key: 'panelist', label: 'Panelists', icon: Users },
    { key: 'polls', label: 'Polls', icon: BarChart2 },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        .scrollbar::-webkit-scrollbar { width: 3px; }
        .scrollbar::-webkit-scrollbar-thumb { background: rgba(212,255,78,0.1); border-radius: 10px; }
        .tab-btn { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); border: none; cursor: pointer; }
        .withdraw-btn:hover { color: rgba(255,80,80,0.8) !important; border-color: rgba(255,80,80,0.2) !important; background: rgba(255,80,80,0.04) !important; }
        .push-btn:hover { transform: scale(1.03); }
        .push-btn:active { transform: scale(0.97); }
        .history-card { opacity: 0.35; transition: opacity 0.2s; }
        .history-card:hover { opacity: 1; }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* NAV */}
      <nav style={{ height: 64, borderBottom: '1px solid rgba(245,240,232,0.05)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 100, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <Link href="/leader" style={{ color: 'rgba(245,240,232,0.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <ChevronLeft size={20} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(1rem,3vw,1.4rem)', fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '28vw' }}>{room?.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <Activity size={9} color="#d4ff4e" className="pip" />
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>asktc.app/{slug}</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 100, padding: 4, gap: 2, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="tab-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 100, fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: activeTab === t.key ? '#060606' : 'rgba(245,240,232,0.3)', background: activeTab === t.key ? '#d4ff4e' : 'transparent' }}>
              {t.icon && <t.icon size={10} />}
              {t.label}
            </button>
          ))}
        </div>

        <Link href={`/projector/${slug}`} target="_blank"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: '1px solid rgba(212,255,78,0.25)', color: '#d4ff4e', borderRadius: 100, fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d4ff4e'; (e.currentTarget as HTMLElement).style.color = '#060606'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#d4ff4e'; }}>
          Stage View <ExternalLink size={11} />
        </Link>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 28px 80px' }}>
        <AnimatePresence mode="wait">

          {/* ── PANELIST TAB ── */}
          {activeTab === 'panelist' && (
            <motion.div key="panelist"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
              <PanelistModerator roomId={room.id} slug={slug} questions={questions} />
              <div style={{ position: 'sticky', top: 80 }}>
                <VoiceCommander roomId={room.id} slug={slug} questions={questions} panelists={panelists} onAssigned={fetchData} />
              </div>
            </motion.div>
          )}

          {/* ── POLLS TAB ── */}
          {activeTab === 'polls' && (
            <motion.div key="polls"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ maxWidth: 640 }}>
              <PollCreator roomId={room.id} polls={polls} onRefresh={fetchData} />
            </motion.div>
          )}

          {/* ── CONTROL TAB ── */}
          {activeTab === 'control' && (
            <motion.div key="control"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>

              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* LIVE STAGE */}
                <section style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 24, padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
                  {activeQuestion && <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: '70%', height: 160, background: 'radial-gradient(ellipse, rgba(212,255,78,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4ff4e' }}>Live Program</span>
                    </div>

                    {activeQuestion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => handleStageAction(activeQuestion.id, 'withdraw')} className="withdraw-btn"
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(245,240,232,0.1)', background: 'transparent', color: 'rgba(245,240,232,0.5)', fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <MonitorOff size={13} /> Withdraw
                        </button>
                        <button onClick={() => handleStageAction(activeQuestion.id, 'archive')}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, border: 'none', background: '#d4ff4e', color: '#060606', fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                          <CheckCircle2 size={13} /> Mark Answered
                        </button>
                      </div>
                    )}
                  </div>

                  {activeQuestion ? (
                    <div style={{ position: 'relative' }}>
                      <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.05, color: '#f5f0e8', marginBottom: 20 }}>
                        "{activeQuestion.content}"
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 100 }}>
                          <User size={10} color="rgba(245,240,232,0.3)" />
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)' }}>{activeQuestion.guest_name || 'Anonymous'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Zap size={10} color="rgba(212,255,78,0.5)" fill="rgba(212,255,78,0.5)" />
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,255,78,0.5)' }}>{activeQuestion.upvotes?.[0]?.count || 0} heat</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '48px 0', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.06)', borderRadius: 16 }}>
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>Frequency Silent</p>
                    </div>
                  )}
                </section>

                {/* NEXT UP + QUEUE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* NEXT UP */}
                  <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 20, padding: '28px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>Up Next</span>
                      {nextUp && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => pinQuestion(nextUp.id, nextUp.is_pinned)} title={nextUp.is_pinned ? 'Unpin' : 'Pin to top'}
                            style={{ padding: '6px 10px', background: nextUp.is_pinned ? 'rgba(212,255,78,0.1)' : 'transparent', border: `1px solid ${nextUp.is_pinned ? 'rgba(212,255,78,0.3)' : 'rgba(245,240,232,0.1)'}`, borderRadius: 8, cursor: 'pointer', color: nextUp.is_pinned ? '#d4ff4e' : 'rgba(245,240,232,0.3)', transition: 'all 0.2s' }}>
                            <Pin size={11} />
                          </button>
                          <button onClick={() => handleStageAction(nextUp.id, 'push')} className="push-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 10, fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'transform 0.15s' }}>
                            <Play size={10} fill="#060606" /> Push Live
                          </button>
                        </div>
                      )}
                    </div>
                    {nextUp ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          {nextUp.is_pinned && <Pin size={10} color="#d4ff4e" />}
                          {(nextUp.upvotes?.[0]?.count || 0) > 0 && <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(212,255,78,0.5)' }}>★ {nextUp.upvotes[0].count}</span>}
                        </div>
                        <p style={{ fontFamily: serif, fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.35, color: 'rgba(245,240,232,0.7)', marginBottom: 10 }}>"{nextUp.content}"</p>
                        <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4ff4e' }}>{nextUp.guest_name}</span>
                      </div>
                    ) : (
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.08)' }}>Queue empty</p>
                    )}
                  </div>

                  {/* WAITING LINE */}
                  <div style={{ background: 'rgba(245,240,232,0.02)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 20, padding: '28px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>Waiting Line</span>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(245,240,232,0.2)' }}>{upcoming.length}</span>
                    </div>
                    <div className="scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
                      {upcoming.length === 0 ? (
                        <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.06)', textAlign: 'center', paddingTop: 20 }}>Empty</p>
                      ) : upcoming.map(q => (
                        <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(245,240,232,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            {q.is_pinned && <Pin size={9} color="#d4ff4e" style={{ flexShrink: 0 }} />}
                            <p style={{ fontFamily: serif, fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(245,240,232,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q.content}"</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => pinQuestion(q.id, q.is_pinned)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: q.is_pinned ? '#d4ff4e' : 'rgba(245,240,232,0.15)', transition: 'color 0.2s' }}>
                              <Pin size={11} />
                            </button>
                            <button onClick={() => handleStageAction(q.id, 'push')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.2)', transition: 'color 0.2s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#d4ff4e')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.2)')}>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — HISTORY LOG */}
              <div style={{ borderLeft: '1px solid rgba(245,240,232,0.05)', paddingLeft: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>History Log</span>
                  <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(245,240,232,0.15)' }}>{history.length} handled</span>
                </div>

                <div className="scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 }}>
                  {history.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.05)', borderRadius: 16 }}>
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.08)' }}>Clear</p>
                    </div>
                  ) : history.map(q => (
                    <div key={q.id} className="history-card" style={{ padding: '18px 20px', background: 'rgba(245,240,232,0.01)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 14 }}>
                      <p style={{ fontFamily: serif, fontSize: '1rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(245,240,232,0.5)', lineHeight: 1.4, marginBottom: 12 }}>"{q.content}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>{q.guest_name}</span>
                          {q.email && (
                            <span style={{ fontFamily: cond, fontSize: 8, fontWeight: 700, color: 'rgba(212,255,78,0.5)', letterSpacing: '0.1em' }}>📧 waiting</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button onClick={() => handleStageAction(q.id, 'withdraw')} title="Return to queue"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.15)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#d4ff4e')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.15)')}>
                            <RotateCcw size={12} />
                          </button>
                          <button onClick={() => deleteQuestion(q.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.1)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,80,80,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.1)')}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}