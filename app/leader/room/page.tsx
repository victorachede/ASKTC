'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Terminal
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AnswerBox from '@/components/AnswerBox' // Assuming you save your snippet as AnswerBox.tsx

export default function RoomModeration() {
  const { slug } = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    const initRoom = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!roomData) {
        toast.error("Room not found")
        router.push('/leader')
        return
      }

      setRoom(roomData)
      fetchQuestions(roomData.id)
      setLoading(false)
    }

    const fetchQuestions = async (roomId: string) => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      setQuestions(data || [])
    }

    initRoom()

    // REAL-TIME SYNC
    const channel = supabase
      .channel(`room-mod-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' }, 
        () => initRoom() 
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [slug])

  const pendingQuestions = questions.filter(q => q.status === 'pending')
  const answeredQuestions = questions.filter(q => q.status === 'answered')
  const activeQuestion = questions.find(q => q.id === activeId)

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* HEADER */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-4">
          <Link href="/leader" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-zinc-500" />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xs font-black uppercase tracking-[0.3em] italic">{room?.name || 'Loading...'}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href={`/projector/${slug}`} 
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            <span>Launch Projector</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden text-zinc-400">
        {/* LEFT: QUEUE */}
        <aside className="w-80 md:w-96 border-r border-white/5 flex flex-col bg-zinc-950/50 overflow-y-auto">
          <div className="p-6 border-b border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-1 font-mono">Status: Live</p>
            <h2 className="text-white text-lg font-bold">Incoming Queue ({pendingQuestions.length})</h2>
          </div>

          <div className="flex-1">
            {pendingQuestions.length === 0 ? (
              <div className="p-12 text-center opacity-20 italic text-sm">Waiting for audience...</div>
            ) : (
              pendingQuestions.map((q, i) => (
                <button 
                  key={q.id}
                  onClick={() => setActiveId(q.id)}
                  className={`w-full text-left p-6 border-b border-white/5 transition-all hover:bg-white/[0.02] relative group ${activeId === q.id ? 'bg-white/[0.04] text-white' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-zinc-600">0{i + 1}</span>
                    <Clock size={12} className="text-zinc-800" />
                  </div>
                  <p className={`text-sm leading-relaxed font-medium mb-3 ${activeId === q.id ? 'text-white' : 'text-zinc-300'}`}>
                    {q.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{q.guest_name || 'Anonymous'}</span>
                    <ChevronRight size={14} className={`transition-transform group-hover:translate-x-1 ${activeId === q.id ? 'text-white' : 'text-zinc-800'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT: WORKSPACE */}
        <section className="flex-1 bg-black p-8 md:p-16 overflow-y-auto">
          {activeQuestion ? (
            <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <Terminal size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Active Stage Control</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-12">
                {activeQuestion.content}
              </h2>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                <AnswerBox 
                  questionId={activeQuestion.id} 
                  onComplete={() => setActiveId(null)} 
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <MessageSquare size={48} className="mb-6" />
              <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-tight">
                Select a question <br /> to respond
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}