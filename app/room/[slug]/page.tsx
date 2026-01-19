'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Share2, ChevronLeft, MessageCircle, Copy, Check, Clock, CheckCircle2 } from 'lucide-react'
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

  useEffect(() => {
    if (!slug) { router.push('/'); return; }

    const fetchData = async () => {
      // Fetch answered questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('room_id', slug)
        .eq('status', 'answered')
        .order('created_at', { ascending: false })

      // Fetch all answers
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')

      if (questionsData && answersData) {
        // Attach answers to questions
        const questionsWithAnswers = questionsData.map(q => {
          const answer = answersData.find(a => a.question_id === q.id)
          return {
            ...q,
            answer_body: answer?.answer_body || null
          }
        })
        setQuestions(questionsWithAnswers)
      }
      
      setLoading(false)
    }

    fetchData()

    // Real-time listener
    const channel = supabase
      .channel(`room-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${slug}` }, 
        () => fetchData()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers' },
        () => fetchData()
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [slug, router])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!slug) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-32" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      
      {/* Navigation */}
      <nav className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold" style={{ letterSpacing: '-0.02em' }}>{slug}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={copyLink}
            className={`h-10 px-5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              copied ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-12">
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-600">Live Room</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-3" style={{ letterSpacing: '-0.05em' }}>
                {slug}
              </h1>
              <p className="text-lg text-gray-600">
                Questions and answers appear here in real-time
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Answered</p>
              <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{questions.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold">Live</p>
              </div>
            </div>
          </div>
        </header>

        {/* Questions Feed */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>Questions & Answers</h2>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ letterSpacing: '-0.02em' }}>
                No answered questions yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Be the first to ask a question! Answered questions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div 
                  key={q.id} 
                  className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-all"
                >
                  {/* Question */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold">
                        {q.guest_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{q.guest_name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xl font-medium leading-relaxed" style={{ letterSpacing: '-0.02em' }}>
                        {q.content}
                      </p>
                    </div>
                  </div>

                  {/* Answer */}
                  {q.answer_body && (
                    <div className="pt-6 border-t border-gray-100">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Answer from moderator</p>
                            <p className="text-base text-green-900 leading-relaxed">{q.answer_body}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <QuestionInput />
    </main>
  )
}