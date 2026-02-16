'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Share2, ChevronLeft, MessageCircle, Copy, Check, Zap, Sparkles, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import QuestionInput from '@/components/QuestionInput'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [localQuestionCount, setLocalQuestionCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    
    const saved = JSON.parse(localStorage.getItem('my_asked_questions') || '[]')
    setLocalQuestionCount(saved.length)

    if (!slug) { router.push('/'); return; }

    const fetchQuestions = async () => {
      // Joining upvotes to get the count for the heart buttons
      const { data } = await supabase
        .from('questions')
        .select('*, upvotes(count)')
        .eq('room_id', slug)
        .order('created_at', { ascending: false })
      
      if (data) setQuestions(data)
      setLoading(false)
    }

    fetchQuestions()

    const channel = supabase
      .channel(`room-feed-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${slug}` }, 
        () => fetchQuestions()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, () => fetchQuestions())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [slug, router])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpvote = async (questionId: string) => {
    const { error } = await supabase.from('upvotes').insert([{ question_id: questionId }])
    if (error) toast.error("Already upvoted")
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-400 selection:bg-emerald-500/30 font-sans antialiased">
      
      {/* NAV */}
      <nav className="sticky top-0 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase hover:text-white transition-colors">
          <ChevronLeft size={14} />
          <span>EXIT</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase border border-white/5 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
            {copied ? 'COPIED' : 'SHARE'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-16 pb-48">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Live Transmission</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-4 text-white">
            {slug}
          </h1>
          <p className="text-zinc-500 text-sm font-medium tracking-tight">
            Signal established. Direct communication active.
          </p>
        </header>

        {/* Question Feed */}
        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Zap className="animate-pulse text-zinc-800" size={32} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Syncing...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[2.5rem]">
              <MessageCircle size={32} className="mx-auto text-zinc-900 mb-4" />
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">No signals intercepted</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="group relative border-b border-white/5 pb-8 last:border-0">
                <div className="flex items-start gap-5">
                  <div className="text-2xl pt-1 grayscale group-hover:grayscale-0 transition-all filter drop-shadow-lg">
                    {q.user_emoji || '👤'}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{q.guest_name || 'Anonymous'}</span>
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                          {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Upvote UI */}
                      <button 
                        onClick={() => handleUpvote(q.id)}
                        className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 hover:border-emerald-500/50 transition-all group/btn"
                      >
                        <Heart size={12} className="group-hover/btn:text-emerald-500 transition-colors" />
                        <span className="text-[10px] font-mono font-bold text-zinc-500 group-hover/btn:text-white">
                          {q.upvotes?.[0]?.count || 0}
                        </span>
                      </button>
                    </div>
                    <p className="text-xl font-medium tracking-tight leading-snug text-zinc-200">
                      {q.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Claim Identity Banner */}
      {!session && localQuestionCount > 0 && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-40">
          <Link href="/signup" className="flex items-center justify-between bg-emerald-600 text-white p-5 rounded-2xl shadow-[0_20px_40px_rgba(5,150,105,0.2)] hover:bg-emerald-500 hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-3">
              <Sparkles size={18} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 leading-none mb-1">Archive Signals</span>
                <span className="text-xs font-bold">Claim {localQuestionCount} historical posts</span>
              </div>
            </div>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {/* Floating Input */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <QuestionInput />
        </div>
      </div>
    </main>
  )
}