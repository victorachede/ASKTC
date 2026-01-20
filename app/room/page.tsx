'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Share2, ChevronLeft, MessageCircle, Copy, Check, Clock, Sparkles, ArrowRight } from 'lucide-react'
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
    // 1. Check Auth Status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 2. Check Local Storage for unclaimed questions
    const saved = JSON.parse(localStorage.getItem('my_asked_questions') || '[]')
    setLocalQuestionCount(saved.length)

    if (!slug) { router.push('/'); return; }

    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', slug)
        .order('created_at', { ascending: false })
      if (data) setQuestions(data)
      setLoading(false)
    }

    fetchQuestions()

    const channel = supabase
      .channel(`room-${slug}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'questions', filter: `room_id=eq.${slug}` }, 
        (payload) => { 
          setQuestions((prev) => [payload.new, ...prev]) 
        }
      ).subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [slug, router])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-white text-black flex flex-col antialiased font-sans" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navigation */}
      <nav className="sticky top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase hover:opacity-60 transition-opacity">
          <ChevronLeft size={14} />
          <span>BACK</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase border border-gray-100 px-4 py-2 rounded-full hover:border-black transition-all"
          >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            {copied ? 'COPIED' : 'SHARE'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-16 pb-32">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Session</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase italic leading-none mb-4">
            {slug}
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-tight">
            Real-time conversation for the {slug} group.
          </p>
        </header>

        {/* Question Feed */}
        <div className="space-y-12">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-5 h-5 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Syncing...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-[2rem]">
              <p className="text-gray-300 text-xs font-black uppercase tracking-[0.2em]">No questions yet</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="group relative">
                <div className="flex items-start gap-5">
                  <div className="text-2xl pt-1 grayscale group-hover:grayscale-0 transition-all">
                    {q.user_emoji || '👤'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest">{q.guest_name || 'Anonymous'}</span>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xl font-medium tracking-tight leading-snug text-gray-800">
                      {q.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Claim Identity Banner (Only shows for Guests with questions) */}
      {!session && localQuestionCount > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-40 animate-in slide-in-from-bottom-8">
          <Link href="/signup" className="flex items-center justify-between bg-black text-white p-4 rounded-2xl shadow-2xl hover:scale-[1.02] transition-transform group">
            <div className="flex items-center gap-3 px-2">
              <Sparkles size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Save your history</span>
                <span className="text-[11px] font-bold">You've asked {localQuestionCount} questions</span>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      )}

      {/* Floating Input Component */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <QuestionInput />
        </div>
      </div>

    </main>
  )
}