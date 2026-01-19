'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getQuestions } from '@/lib/actions';
import confetti from 'canvas-confetti';
import { MessageCircle, CheckCircle2 } from 'lucide-react';

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
          if (payload.eventType === 'UPDATE' && payload.new.status === 'answered') {
            setLastAnsweredId(payload.new.id);
            triggerBoom();
            setTimeout(() => setLastAnsweredId(null), 20000);
          }

          const freshData = await getQuestions();
          setQuestions(freshData || []);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const displayQuestion = lastAnsweredId 
    ? questions.find(q => q.id === lastAnsweredId)
    : questions
        .filter(q => q.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  return (
    <main className="h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      
      {/* HEADER */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-[1800px] mx-auto px-16 py-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" style={{ letterSpacing: '-0.05em' }}>
                {lastAnsweredId ? 'Live Answer' : 'Question Queue'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Real-time display</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">Questions Waiting</p>
            <p className="text-6xl font-semibold" style={{ letterSpacing: '-0.05em' }}>
              {questions.filter(q => q.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY */}
      <div className="flex-1 flex items-center justify-center p-16">
        {loading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-500 text-xl font-medium">Loading questions...</p>
          </div>
        ) : displayQuestion ? (
          <div className="max-w-[1600px] w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">
            
            {/* GUEST INFO */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm border border-white/20">
                {displayQuestion.profiles?.emoji_key || "👤"}
              </div>
              <div className="text-left">
                <p className="text-gray-400 text-sm mb-1">Asked by</p>
                <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
                  {displayQuestion.profiles?.full_name || displayQuestion.guest_name || "Anonymous"}
                </p>
              </div>
            </div>
            
            {/* QUESTION */}
            <div className="text-center">
              <h2 className={`font-semibold text-white leading-tight transition-all duration-500 ${
                lastAnsweredId ? 'text-6xl md:text-7xl' : 'text-7xl md:text-8xl'
              }`} style={{ letterSpacing: '-0.05em' }}>
                {displayQuestion.content}
              </h2>
            </div>

            {/* ANSWER */}
            {lastAnsweredId && displayQuestion.answers && displayQuestion.answers.length > 0 && (
              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-3xl p-12 animate-in slide-in-from-bottom-10 duration-700 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-green-500 font-semibold text-xl">Answer</p>
                    <p className="text-gray-400 text-sm">
                      from {displayQuestion.answers[0].profiles?.full_name || "Moderator"}
                    </p>
                  </div>
                </div>
                <p className="text-5xl md:text-6xl font-medium text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  {displayQuestion.answers[0].answer_body}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center opacity-40">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <MessageCircle size={48} className="text-gray-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-600" style={{ letterSpacing: '-0.02em' }}>
              Waiting for questions...
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-[1800px] mx-auto px-16 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <MessageCircle size={24} className="text-black" />
            </div>
            <div>
              <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.02em' }}>asktc</p>
              <p className="text-gray-400 text-sm">Live Q&A Display</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-gray-400 text-sm">System Active</p>
          </div>
        </div>
      </div>
    </main>
  );
}