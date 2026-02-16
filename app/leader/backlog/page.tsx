'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Archive, CheckCircle, User, MessageCircle, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function BacklogPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderName, setLeaderName] = useState('')

  const fetchBacklog = async () => {
    setLoading(true)
    // Fetch only questions that were NEVER answered on stage
    const { data } = await supabase
      .from('questions')
      .select('*, rooms(name)')
      .eq('status', 'pending') 
      .order('created_at', { ascending: false })
    
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchBacklog() }, [])

  const claimQuestion = async (qId: string) => {
    if (!leaderName) return toast.error("Enter your name to claim this signal")

    const { error } = await supabase
      .from('questions')
      .update({ 
        picked_by: leaderName,
        status: 'answered' // Move it out of backlog
      })
      .eq('id', qId)

    if (error) toast.error("Claim failed")
    else {
      toast.success("Signal Claimed")
      fetchBacklog()
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <Link href="/leader" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest transition-all">
            <ChevronLeft size={14} /> Back to Command
          </Link>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">The Backlog</h1>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-bold">Unanswered signals from all sessions</p>
        </div>

        <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black uppercase text-zinc-600">Claiming as:</span>
            <input 
                type="text" 
                placeholder="YOUR NAME..." 
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
            />
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : questions.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-white/5 rounded-[3rem]">
                <p className="text-zinc-800 font-black uppercase tracking-widest">No signals left behind.</p>
            </div>
        ) : questions.map(q => (
          <div key={q.id} className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 flex justify-between items-center group hover:border-emerald-500/20 transition-all">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-zinc-900 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest border border-white/5">
                        {q.rooms?.name || 'Unknown Room'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-700 uppercase italic">From: {q.guest_name}</span>
                </div>
                <h2 className="text-2xl font-bold italic">"{q.content}"</h2>
                
                {q.picked_by && (
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle size={12} /> Claimed by {q.picked_by}
                    </div>
                )}
            </div>

            {!q.picked_by && (
                <button 
                    onClick={() => claimQuestion(q.id)}
                    className="opacity-0 group-hover:opacity-100 bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all translate-x-4 group-hover:translate-x-0"
                >
                    Claim Question
                </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}