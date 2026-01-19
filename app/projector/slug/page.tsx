'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { MessageCircle, CheckCircle2 } from 'lucide-react';

export default function ProjectorPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  
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
    if (!slug) return;

    async function fetchData() {
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*, answers(*)')
        .eq('room_id', slug)
        .order('created_at', { ascending: true });
      
      setQuestions(questionsData || []);
      setLoading(false);
    }
    
    fetchData();

    const channel = supabase
      .channel(`projector-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${slug}` }, 
        async (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'answered') {
            setLastAnsweredId(payload.new.id);
            triggerBoom();
            setTimeout(() => setLastAnsweredId(null), 20000);
          }

          await fetchData();
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers' },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

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
              <p className="text-gray-400 text-sm mt-1">Room: {slug}</p>
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
      <div className="flex-1 overflow-y-auto p-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-500 text-xl font-medium">Loading questions...</p>
          </div>
        ) : questions.filter(q => q.status === 'pending').length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <MessageCircle size={48} className="text-gray-600" />
            </div>
            <p className="text-4xl font-semibold text-gray-600" style={{ letterSpacing: '-0.02em' }}>
              No questions yet
            </p>
            <p className="text-gray-500 text-xl mt-4">Questions will appear here as they come in</p>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto space-y-6">
            {questions
              .filter(q => q.status === 'pending')
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((q, index) => (
                <div 
                  key={q.id} 
                  className="bg-white/5 border border-white/10 rounded-2xl p-10 hover:bg-white/10 transition-all backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-6">
                    {/* Number Badge */}
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                      <span className="text-3xl font-bold">{index + 1}</span>
                    </div>

                    <div className="flex-1">
                      {/* Guest Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl border border-white/20">
                          {q.profiles?.emoji_key || "👤"}
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Asked by</p>
                          <p className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
                            {q.profiles?.full_name || q.guest_name || "Anonymous"}
                          </p>
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="text-4xl font-medium leading-tight text-white" style={{ letterSpacing: '-0.02em' }}>
                        {q.content}
                      </p>

                      {/* Timestamp */}
                      <p className="text-gray-500 text-sm mt-4">
                        {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            }

            {/* Answered Questions (Optional - show last 3) */}
            {lastAnsweredId && questions.filter(q => q.status === 'answered').length > 0 && (
              <div className="mt-16 pt-16 border-t border-white/10">
                <h3 className="text-3xl font-semibold mb-8 text-gray-400" style={{ letterSpacing: '-0.02em' }}>
                  Recently Answered
                </h3>
                {questions
                  .filter(q => q.status === 'answered')
                  .slice(0, 3)
                  .map((q) => (
                    <div 
                      key={q.id} 
                      className="bg-green-500/10 border border-green-500/30 rounded-2xl p-10 mb-6 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={24} className="text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-medium text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                            {q.content}
                          </p>
                          {q.answers && q.answers.length > 0 && (
                            <div className="bg-green-500/10 rounded-xl p-6 mt-4">
                              <p className="text-green-500 text-sm font-semibold mb-2">Answer:</p>
                              <p className="text-xl text-white/90 leading-relaxed">
                                {q.answers[0].answer_body}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
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