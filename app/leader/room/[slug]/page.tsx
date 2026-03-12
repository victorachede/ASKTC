'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  Trash2, 
  User, 
  ExternalLink,
  Loader2,
  Play,
  Zap,
  RotateCcw,
  Users,
  Activity,
  ArrowRight,
  MonitorOff,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PanelistModerator from '@/components/PanelistModerator';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap';

export default function RoomControlPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<'control' | 'panelist'>('control');
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase.from('rooms').select('*').eq('slug', slug).single();
      if (roomError || !roomData) throw new Error("Room frequency lost");
      setRoom(roomData);

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*, upvotes(count)')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });

      if (qError) throw qError;
      setQuestions(qData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel(`room_control_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  // UNIFIED STAGING LOGIC
  const handleStageAction = async (id: string, action: 'push' | 'withdraw' | 'archive') => {
    try {
      if (action === 'push') {
        await supabase.from('questions')
          .update({ is_projected: false })
          .eq('room_id', room.id)
          .eq('is_projected', true);

        const { error } = await supabase.from('questions')
          .update({ status: 'answered', is_projected: true })
          .eq('id', id);
        
        if (error) throw error;
        toast.success("Signal Live");
      } else if (action === 'withdraw') {
        const { error } = await supabase.from('questions')
          .update({ status: 'pending', is_projected: false })
          .eq('id', id);
        
        if (error) throw error;
        toast.success("Signal Withdrawn");
      } else if (action === 'archive') {
        // MARK AS ANSWERED: Status stays 'answered', but projection is removed
        const { error } = await supabase.from('questions')
          .update({ status: 'answered', is_projected: false })
          .eq('id', id);
        
        if (error) throw error;
        toast.success("Resolved & Archived");
      }
    } catch (err) {
      toast.error("Transmission interruption");
    }
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) toast.error("Deletion failed");
  };

  if (loading) return (
    <div className="h-screen bg-[#060606] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#d4ff4e]" size={32} />
      <span style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Syncing Frequency</span>
    </div>
  );

  const activeQuestion = questions.find(q => q.is_projected === true);
  const pendingQueue = questions
    .filter(q => q.status === 'pending' && !q.is_projected)
    .sort((a, b) => (b.upvotes?.[0]?.count || 0) - (a.upvotes?.[0]?.count || 0));
  
  const nextUp = pendingQueue[0];
  const upcoming = pendingQueue.slice(1);
  const history = questions.filter(q => q.status === 'answered' && !q.is_projected).reverse();

  return (
    <main className="min-h-screen bg-[#060606] text-[#f5f0e8] selection:bg-[#d4ff4e]/30 antialiased" style={{ fontFamily: sans }}>
      <style>{`
        @import url('${fontUrl}');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,255,78,0.1); border-radius: 10px; }
        .tab-btn { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      {/* NAVIGATION */}
      <nav className="h-20 border-b border-white/5 bg-[#060606]/80 backdrop-blur-2xl sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/leader" className="text-zinc-500 hover:text-[#d4ff4e] transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontFamily: serif }} className="text-2xl font-light italic tracking-tight">{room?.name}</h1>
            <div className="flex items-center gap-2">
                <Activity size={10} className="text-[#d4ff4e] animate-pulse" />
                <p style={{ fontFamily: cond }} className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">asktc.app/{slug}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setActiveTab('control')}
              style={{ fontFamily: cond }}
              className={`px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest tab-btn ${
                activeTab === 'control' ? 'bg-[#d4ff4e] text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Control
            </button>
            <button
              onClick={() => setActiveTab('panelist')}
              style={{ fontFamily: cond }}
              className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest tab-btn ${
                activeTab === 'panelist' ? 'bg-[#d4ff4e] text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Users size={10} />
              Panelists
            </button>
          </div>
          <Link 
            href={`/projector/${slug}`} 
            target="_blank"
            style={{ fontFamily: cond }}
            className="flex items-center gap-2 px-6 py-2 bg-transparent border border-[#d4ff4e]/30 text-[#d4ff4e] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#d4ff4e] hover:text-black transition-all"
          >
            Stage View
            <ExternalLink size={12} />
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'panelist' ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="panelist">
              <PanelistModerator roomId={room.id} slug={slug} questions={questions} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="control" className="grid grid-cols-12 gap-12">
              
              {/* LEFT: THE STAGE MONITOR */}
              <div className="col-span-8 space-y-12">
                <section className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-16 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-12">
                    <div style={{ fontFamily: cond }} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#d4ff4e]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff4e] animate-ping" />
                      Live Program
                    </div>

                    <div className="flex items-center gap-3">
                      {activeQuestion && (
                        <>
                          <button 
                            onClick={() => handleStageAction(activeQuestion.id, 'withdraw')}
                            style={{ fontFamily: cond }}
                            className="group flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f5f0e8] hover:text-[#ff4e4e] hover:border-[#ff4e4e]/40 hover:bg-[#ff4e4e]/5 transition-all"
                          >
                            <MonitorOff size={14} className="group-hover:animate-pulse" />
                            Withdraw
                          </button>
                          
                          <button 
                            onClick={() => handleStageAction(activeQuestion.id, 'archive')}
                            style={{ fontFamily: cond }}
                            className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#d4ff4e] text-black text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(212,255,78,0.2)]"
                          >
                            <CheckCircle2 size={14} />
                            Mark Answered
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {activeQuestion ? (
                    <div className="space-y-10">
                      <h2 style={{ fontFamily: serif }} className="text-6xl font-light italic leading-[1.1] tracking-tight text-[#f5f0e8]">
                        "{activeQuestion.content}"
                      </h2>
                      <div className="flex items-center gap-6">
                        <div style={{ fontFamily: cond }} className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <User size={10} />
                          {activeQuestion.guest_name || 'Anonymous'}
                        </div>
                        <div style={{ fontFamily: cond }} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#d4ff4e]/50">
                          <Zap size={10} fill="currentColor" />
                          {activeQuestion.upvotes?.[0]?.count || 0} Heat Level
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center border border-dashed border-white/5 rounded-[2rem]">
                      <p style={{ fontFamily: cond }} className="text-zinc-800 font-black uppercase tracking-[0.5em] text-[10px]">Frequency Silent</p>
                    </div>
                  )}
                </section>

                {/* PREVIEW & QUEUE GRID */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-10 group">
                    <div className="flex items-center justify-between mb-8">
                      <span style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Up Next</span>
                      {nextUp && (
                        <button 
                          onClick={() => handleStageAction(nextUp.id, 'push')}
                          style={{ fontFamily: cond }}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#d4ff4e] text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                          <Play size={12} fill="currentColor" />
                          Push Live
                        </button>
                      )}
                    </div>
                    {nextUp ? (
                      <div className="space-y-4">
                        <p style={{ fontFamily: serif }} className="text-2xl text-zinc-300 italic font-light leading-snug">"{nextUp.content}"</p>
                        <p style={{ fontFamily: cond }} className="text-[9px] font-black text-[#d4ff4e] uppercase tracking-widest">{nextUp.guest_name}</p>
                      </div>
                    ) : (
                      <p style={{ fontFamily: cond }} className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Queue Empty</p>
                    )}
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10">
                    <h3 style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-8">Waiting Line ({upcoming.length})</h3>
                    <div className="space-y-6 max-h-[160px] overflow-y-auto pr-4 custom-scrollbar">
                      {upcoming.length === 0 ? (
                        <p style={{ fontFamily: cond }} className="text-[9px] font-black uppercase tracking-widest text-zinc-800 text-center">No upcoming signals</p>
                      ) : upcoming.map((q) => (
                        <div key={q.id} className="flex items-center justify-between group/item border-b border-white/5 pb-4">
                          <p style={{ fontFamily: serif }} className="text-sm text-zinc-500 italic truncate pr-4">"{q.content}"</p>
                          <button onClick={() => handleStageAction(q.id, 'push')} className="text-zinc-700 hover:text-[#d4ff4e] transition-colors">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: HISTORY LOG */}
              <div className="col-span-4 border-l border-white/5 pl-12">
                <div className="flex items-center justify-between mb-10">
                  <h2 style={{ fontFamily: cond }} className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">History Log</h2>
                  <span style={{ fontFamily: cond }} className="text-[9px] font-black text-zinc-800 uppercase">{history.length} Handled</span>
                </div>
                
                <div className="space-y-6">
                  {history.map((q) => (
                    <div key={q.id} className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl opacity-40 hover:opacity-100 transition-all group">
                      <p style={{ fontFamily: serif }} className="text-md italic text-zinc-400 mb-4 leading-relaxed">"{q.content}"</p>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: cond }} className="text-[9px] font-black uppercase tracking-widest text-zinc-700">{q.guest_name}</span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleStageAction(q.id, 'withdraw')}
                            className="text-zinc-700 hover:text-[#d4ff4e] transition-all"
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button onClick={() => deleteQuestion(q.id)} className="text-zinc-800 hover:text-[#ff4e4e] transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[2rem]">
                      <p style={{ fontFamily: cond }} className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Clear</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}