'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Hash, ChevronLeft, MessageSquare, Copy, Check, Zap, CheckCircle2, Heart } from 'lucide-react'
import Link from 'next/link'
import QuestionInput from '@/components/QuestionInput'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  
  const [room, setRoom] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchData = async () => {
    try {
      // 1. Resolve Room ID from Slug
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('slug', slug)
        .single()

      if (!roomData) return
      setRoom(roomData)

      // 2. Fetch questions with status 'answered' and include upvote counts
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*, upvotes(count)')
        .eq('room_id', roomData.id)
        .eq('status', 'answered')
        .order('created_at', { ascending: false })

      // 3. Fetch answers to link them
      const { data: answersData } = await supabase.from('answers').select('*')

      if (questionsData) {
        const questionsWithAnswers = questionsData.map(q => ({
          ...q,
          answer_body: answersData?.find(a => a.question_id === q.id)?.answer_body || null
        }))
        setQuestions(questionsWithAnswers)
      }
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!slug) { router.push('/'); return; }
    fetchData()

    const setupSubscription = async () => {
        const { data: roomData } = await supabase.from('rooms').select('id').eq('slug', slug).single()
        if (!roomData) return

        const channel = supabase
            .channel(`room-view-${slug}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'questions', 
                filter: `room_id=eq.${roomData.id}` 
            }, () => fetchData())
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'upvotes' 
            }, () => fetchData())
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'answers' 
            }, () => fetchData())
            .subscribe()

        return channel
    }

    const channelPromise = setupSubscription()
    return () => { 
      channelPromise.then(channel => channel && supabase.removeChannel(channel)) 
    }
  }, [slug])

  const handleUpvote = async (questionId: string) => {
    const { error } = await supabase.from('upvotes').insert([{ question_id: questionId }])
    if (error) {
      toast.error("Signal already boosted")
    } else {
      toast.success("Signal boosted")
    }
  }

  const copyCodeOnly = () => {
    navigator.clipboard.writeText(slug)
    setCopied(true)
    toast.success("Code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-400 selection:bg-emerald-500/30 font-sans antialiased">
      
      {/* NAV */}
      <nav className="sticky top-0 h-14 border-b border-white/5 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{slug}</span>
        </div>

        <button onClick={copyCodeOnly} className="p-2 hover:text-white transition-colors">
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-40">
        
        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Active Stage</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter uppercase italic leading-none">
            {room?.name || slug}
          </h1>
          <p className="text-sm text-zinc-500 mt-2 italic">Intercepted signals and official responses.</p>
        </header>

        {/* FEED SECTION */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Resolved Queries</h2>
            <span className="text-[10px] font-mono text-emerald-500">{questions.length} Total</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Zap className="animate-pulse text-zinc-800" size={32} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">Syncing Stream</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
              <MessageSquare size={32} className="mx-auto text-zinc-900 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">No signals found in this frequency</p>
            </div>
          ) : (
            <div className="space-y-12">
              {questions.map((q) => (
                <div key={q.id} className="group relative">
                  <div className="flex items-start gap-4 mb-4">
                    {/* User Avatar Placeholder */}
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xl">
                      {q.guest_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {q.guest_name || 'Anonymous'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-700">
                            {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* UPVOTE ACTION */}
                        <button 
                          onClick={() => handleUpvote(q.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/upvote"
                        >
                          <Heart size={10} className="text-zinc-600 group-hover/upvote:text-emerald-500 transition-colors" />
                          <span className="text-[10px] font-mono font-bold text-zinc-600 group-hover/upvote:text-white">
                            {q.upvotes?.[0]?.count || 0}
                          </span>
                        </button>
                      </div>
                      <p className="text-lg font-medium text-zinc-200 tracking-tight leading-snug">
                        {q.content}
                      </p>
                    </div>
                  </div>

                  {/* MODERATOR ANSWER BLOCK */}
                  {q.answer_body && (
                    <div className="ml-12 p-6 bg-[#0a0a0a] border border-emerald-500/10 rounded-2xl relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Official Response</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        {q.answer_body}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* STICKY INPUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
        <div className="max-w-2xl mx-auto">
          <QuestionInput/>
        </div>
      </div>
    </main>
  )
}