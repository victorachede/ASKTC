'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Trash2, 
  User, 
  ExternalLink,
  Loader2,
  Play,
  Zap,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RoomControlPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH: Syncs Room and Question state
  const fetchData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .single();

      if (roomError || !roomData) throw new Error("Room frequency lost");
      setRoom(roomData);

      // Fetch questions with upvote counts for priority sorting
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
    
    // REAL-TIME: Listen for any audience interaction (new questions or upvotes)
    const channel = supabase
      .channel(`room_control_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  // ACTION: Move a question to 'answered' (Projector) or back to 'pending' (Queue)
  const updateStatus = async (id: string, status: 'answered' | 'pending') => {
    // Optional: Auto-clear other "answered" questions to ensure only one is live
    if (status === 'answered') {
        await supabase.from('questions').update({ status: 'pending' }).eq('room_id', room.id).eq('status', 'answered');
    }

    const { error } = await supabase
      .from('questions')
      .update({ status })
      .eq('id', id);

    if (error) toast.error("Transmission failed");
    else toast.success(status === 'answered' ? "Pushed to Stage" : "Returned to Queue");
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) toast.error("Deletion failed");
  };

  if (loading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Syncing Frequency...</span>
    </div>
  );

  // DATA MAPPING: Segmenting the questions for the 3-column layout
  const activeQuestion = questions.find(q => q.status === 'answered');
  const pendingQueue = questions
    .filter(q => q.status === 'pending')
    // Sort queue by upvotes (Heat) first, then by time
    .sort((a, b) => (b.upvotes?.[0]?.count || 0) - (a.upvotes?.[0]?.count || 0));
  
  const nextUp = pendingQueue[0];
  const upcoming = pendingQueue.slice(1);
  const history = questions.filter(q => q.status === 'answered' && q.id !== activeQuestion?.id).reverse();

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 antialiased">
      
      {/* CONTROL NAV */}
      <nav className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/leader" className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">{room?.name}</h1>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Stream: /{slug}</p>
            </div>
          </div>
        </div>

        <Link 
          href={`/projector/${slug}`} 
          target="_blank"
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          Open Projector
          <ExternalLink size={14} />
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CENTER COLUMN: THE STAGE & PREVIEW */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* PROGRAM MONITOR (LIVE ON PROJECTOR) */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-black border-2 border-emerald-500/30 rounded-[3rem] p-12 shadow-[0_0_60px_rgba(16,185,129,0.05)]">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Program Monitor</span>
                </div>
                {activeQuestion && (
                    <button 
                        onClick={() => updateStatus(activeQuestion.id, 'pending')}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                    >
                        <RotateCcw size={12} />
                        Withdraw Signal
                    </button>
                )}
            </div>

            {activeQuestion ? (
              <div className="space-y-8">
                <h2 className="text-5xl font-bold italic leading-[1.1] text-white tracking-tight">"{activeQuestion.content}"</h2>
                <div className="flex items-center gap-4 text-zinc-400">
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <User size={12} />
                        {activeQuestion.guest_name || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-700">
                        <Zap size={12} fill="currentColor" />
                        {activeQuestion.upvotes?.[0]?.count || 0} Votes
                    </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-zinc-800 font-black uppercase tracking-[0.5em] text-[10px]">Frequency Silent</p>
              </div>
            )}
          </section>

          {/* PREVIEW MONITOR (NEXT UP BY HEAT) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-8 relative group">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Preview (Highest Heat)</span>
                    {nextUp && (
                        <button 
                            onClick={() => updateStatus(nextUp.id, 'answered')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                        >
                            <Play size={10} fill="currentColor" />
                            Push Live
                        </button>
                    )}
                </div>
                {nextUp ? (
                    <>
                        <p className="text-lg text-zinc-300 italic font-medium leading-snug">"{nextUp.content}"</p>
                        <p className="mt-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest">{nextUp.guest_name}</p>
                    </>
                ) : (
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Queue Empty</p>
                )}
            </div>

            {/* QUEUE QUICK LIST */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-6">Waiting Line ({upcoming.length})</h3>
                <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {upcoming.length === 0 ? (
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800">No upcoming signals</p>
                    ) : upcoming.map((q) => (
                        <div key={q.id} className="flex items-center justify-between group/item">
                            <p className="text-[11px] text-zinc-500 italic truncate pr-4">"{q.content}"</p>
                            <button onClick={() => updateStatus(q.id, 'answered')} className="text-zinc-700 hover:text-emerald-500 transition-colors">
                                <Play size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FULL QUEUE & LOGS */}
        <div className="lg:col-span-4 space-y-10 lg:border-l lg:border-white/5 lg:pl-10">
          <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Full Archive</h2>
                <span className="text-[9px] font-mono text-zinc-800">{history.length} Resolved</span>
            </div>
            
            <div className="space-y-4">
                {history.map((q) => (
                <div key={q.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl opacity-40 hover:opacity-100 transition-all group">
                    <p className="text-xs italic text-zinc-400 mb-4 leading-relaxed">"{q.content}"</p>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">{q.guest_name}</span>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => updateStatus(q.id, 'pending')}
                                className="text-[8px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                            >
                                <RotateCcw size={10} />
                                Re-Queue
                            </button>
                            <button onClick={() => deleteQuestion(q.id)} className="text-zinc-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                </div>
                ))}
                {history.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800">No history logged</p>
                    </div>
                )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}