'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getQuestions } from '@/lib/actions';
import confetti from 'canvas-confetti';

export default function ProjectorPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  const triggerBoom = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  useEffect(() => {
    async function initProjector() {
      const data = await getQuestions();
      setQuestions(data || []);
      setLoading(false);
    }
    
    initProjector();

    const channel = supabase
      .channel('projector_feed')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' }, 
        async (payload: any) => {
          // If a question is updated to 'answered', trigger the spotlight
          if (payload.eventType === 'UPDATE' && payload.new.status === 'answered') {
            setLastAnsweredId(payload.new.id);
            triggerBoom();
            
            // Show the answer for 20 seconds, then return to queue
            setTimeout(() => setLastAnsweredId(null), 20000);
          }

          // Always fetch fresh data to get the joined 'answers' table content
          const freshData = await getQuestions();
          setQuestions(freshData || []);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // LOGIC: Priority 1: The question that was JUST answered
  // Priority 2: The oldest 'pending' question (First In, First Out)
  const displayQuestion = lastAnsweredId 
    ? questions.find(q => q.id === lastAnsweredId)
    : questions
        .filter(q => q.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  return (
    <main className="h-screen bg-slate-950 text-white overflow-hidden flex flex-col p-16 font-sans">
      
      {/* HEADER HUD */}
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping absolute" />
            <div className="w-4 h-4 bg-amber-500 rounded-full relative" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black uppercase italic tracking-widest leading-none mt-8">
              Live <span className="text-amber-500">{lastAnsweredId ? 'Response' : 'Briefing'}</span>
            </h1>
            <span className="text-slate-500 text-[10px] font-bold tracking-[0.5em] uppercase mt-2">
              {lastAnsweredId ? 'Intelligence Verified' : 'Command Center Active'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Queue Status</div>
          <div className="text-5xl font-black text-white italic">
            {questions.filter(q => q.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 w-1/2 animate-pulse" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Uplink...</p>
          </div>
        ) : displayQuestion ? (
          <div className="max-w-7xl animate-in fade-in zoom-in-95 duration-700">
            {/* GUEST INFO */}
            <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-12">
              <span className="text-5xl">
                {displayQuestion.profiles?.emoji_key || "👤"}
              </span>
              <span className="text-2xl font-black text-amber-500 uppercase tracking-tighter">
                {displayQuestion.profiles?.full_name || "Anonymous Guest"}
              </span>
            </div>
            
            {/* THE QUESTION CONTENT */}
            <h2 className={`font-black leading-[1.05] tracking-tighter text-white drop-shadow-2xl transition-all duration-500 ${lastAnsweredId ? 'text-5xl md:text-7xl mb-12' : 'text-7xl md:text-9xl'}`}>
              "{displayQuestion.content}"
            </h2>

            {/* THE ANSWER BOX - Pulling from the answers table join */}
            {lastAnsweredId && displayQuestion.answers && displayQuestion.answers.length > 0 && (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/50 p-12 rounded-[40px] animate-in slide-in-from-bottom-10 duration-1000 text-left">
                <div className="flex items-center gap-3 mb-6">
                   <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xl">Verified Response</span>
                   <span className="text-slate-500 font-bold text-sm uppercase tracking-widest border-l border-slate-700 pl-3">
                     Leader: {displayQuestion.answers[0].profiles?.full_name || "Official"}
                   </span>
                </div>
                <p className="text-4xl md:text-6xl font-bold text-white leading-tight italic">
                  {displayQuestion.answers[0].answer_body}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 opacity-30">
            <p className="text-5xl font-black text-slate-500 uppercase italic tracking-tighter">Waiting for Next Intel...</p>
            <div className="h-1 w-64 bg-slate-800 mx-auto rounded-full" />
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="h-32 border-t-2 border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Submit Your Intelligence</span>
          <div className="text-4xl font-black text-slate-200 uppercase italic">AskTC.<span className="text-white">Live</span></div>
        </div>
        <div className="text-right flex flex-col items-end">
           <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Verified Briefing System</span>
           <div className="flex gap-1">
             {[...Array(5)].map((_, i) => <div key={i} className="w-6 h-1 bg-amber-500/20" />)}
           </div>
        </div>
      </div>
    </main>
  );
}