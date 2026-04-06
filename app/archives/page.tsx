'use client';

import { useState, useEffect, useMemo } from 'react';
import { getQuestions } from '@/lib/actions';
import QuestionCard from '@/components/QuestionCard';

export default function ArchivesPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getQuestions();
        const answered = data.filter((q: any) => q.status === 'answered');
        setQuestions(answered);
      } catch (err) {
        console.error("Archive Access Denied:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const search = searchTerm.toLowerCase();
      return (
        q.content?.toLowerCase().includes(search) || 
        q.guest_name?.toLowerCase().includes(search)
      );
    });
  }, [searchTerm, questions]);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 selection:bg-amber-200">
      {/* THE PUSH DOWN CONTAINER */}
      <div className="max-w-2xl mx-auto px-4 mt-20 md:mt-52">
        
        {/* COMMAND HEADER */}
        <div className="mb-16 text-center">
          <div className="inline-block bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.3em] mb-6">
            Secure Database
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
            Intel <span className="text-amber-500 underline decoration-8 underline-offset-[12px]">Vault</span>
          </h1>
        </div>

        {/* STICKY SEARCH BAR - PUSHED DOWN */}
        <div className="sticky top-10 z-50 mb-16">
          <div className="relative group">
            <input 
              type="text"
              autoFocus
              placeholder="Type keyword... (Faith, Order, Victor)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-3xl px-8 py-6 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 transition-all shadow-2xl group-hover:border-slate-300"
            />
            
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${searchTerm ? 'bg-amber-500 text-white rotate-0' : 'bg-slate-100 text-slate-400 rotate-90'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC RESULTS */}
        <div className="flex flex-col gap-8">
          {loading ? (
             <div className="flex flex-col items-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Files...</p>
             </div>
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => (
              <div key={q.id} className="transform transition-all duration-500 hover:scale-[1.01]">
                <QuestionCard 
                  studentName={q.guest_name}
                  studentEmoji={q.guest_emoji}
                  question={q.content}
                  timestamp={new Date(q.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  status={q.status}
                  answer={q.answers?.[0]?.answer_body}
                  leaderName={q.answers?.[0]?.profiles?.full_name}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dotted border-slate-100">
              <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-sm">
                Search parameter "{searchTerm}" yielded 0 results
              </p>
            </div>
          )}
        </div>

        {/* NAVIGATION FOOTER */}
        <div className="mt-24 border-t border-slate-200 pt-12 text-center">
            <a href="/" className="group inline-flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-all">
              <span className="group-hover:-translate-x-2 transition-transform">←</span> 
              Return to Live Feed
            </a>
        </div>
      </div>
    </main>
  );
}