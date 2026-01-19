'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  EyeOff, 
  Eye,
  CheckCircle2, 
  Share2,
  Settings2,
  Loader2,
  MessageCircle,
  Globe,
  Target,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AnswerBox from '@/components/AnswerBox'
import toast from 'react-hot-toast'

export default function LeaderRoomControl() {
  const { slug } = useParams()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // LIVE METRICS CALCULATION
  const metrics = useMemo(() => {
    const total = questions.length
    const answered = questions.filter(q => q.status === 'answered').length
    const hidden = questions.filter(q => q.status === 'hidden').length
    const resolutionRate = total > 0 ? Math.round((answered / total) * 100) : 0
    
    return { total, answered, hidden, resolutionRate }
  }, [questions])

  useEffect(() => {
    setMounted(true)
    fetchQuestions()

    const channel = supabase
      .channel(`room-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions', filter: `room_id=eq.${slug}` }, 
        () => fetchQuestions()
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [slug])

  const getCleanLink = () => {
    if (typeof window === 'undefined') return ''
    const fullUrl = `${window.location.origin}/room/${slug}`
    return fullUrl.replace(/^https?:\/\//, '')
  }

  const fetchQuestions = async () => {
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('room_id', slug)
      .order('created_at', { ascending: false })
    
    if (questionsData) {
      // Fetch answers for all questions
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')
      
      // Attach answers to their questions
      const questionsWithAnswers = questionsData.map(q => {
        const answer = answersData?.find(a => a.question_id === q.id)
        return {
          ...q,
          answer_body: answer?.answer_body || null
        }
      })
      
      setQuestions(questionsWithAnswers)
    }
    setLoading(false)
  }

  const copyLink = () => {
    const linkToCopy = getCleanLink()
    if (!linkToCopy) return
    navigator.clipboard.writeText(linkToCopy)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleVisibility = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'hidden' ? 'visible' : 'hidden'
    await supabase.from('questions').update({ status: newStatus }).eq('id', id)
    toast.success(`Question ${newStatus}`)
  }

  const visibleQuestions = questions.filter(q => q.status !== 'hidden')
  const hiddenQuestions = questions.filter(q => q.status === 'hidden')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white antialiased" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      
      {/* HEADER */}
      <nav className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} strokeWidth={2} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Room</span>
                <span className="font-semibold text-sm" style={{ letterSpacing: '-0.02em' }}>{slug}</span>
              </div>
            </div>
          </div>
          
          <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
            <Settings2 size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* SHARE CARD */}
        <section className="mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe size={20} />
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-xs text-gray-500 font-medium mb-1">Share Link</span>
                  <span className="text-sm font-semibold truncate" suppressHydrationWarning>
                    {mounted ? getCleanLink() : 'Generating link...'}
                  </span>
                </div>
              </div>
              <button 
                onClick={copyLink}
                className={`h-11 px-6 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 ${
                  copied ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </section>

        {/* ANALYTICS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Live</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{metrics.total}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Answered</p>
            <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{metrics.answered}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Target size={20} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Resolution</p>
            <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{metrics.resolutionRate}%</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <EyeOff size={20} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Hidden</p>
            <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{metrics.hidden}</p>
          </div>
        </section>

        {/* ACTIVE QUESTIONS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold" style={{ letterSpacing: '-0.05em' }}>Active Questions</h2>
            <div className="text-sm text-gray-500">{visibleQuestions.length} visible</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : visibleQuestions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ letterSpacing: '-0.02em' }}>No questions yet</h3>
              <p className="text-gray-500 mb-6">Questions from your audience will appear here in real-time</p>
              <button 
                onClick={copyLink}
                className="h-12 px-6 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all inline-flex items-center gap-2"
              >
                <Copy size={16} />
                Copy Room Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold">{q.guest_name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{q.guest_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-medium leading-relaxed" style={{ letterSpacing: '-0.02em' }}>
                        {q.content}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => toggleVisibility(q.id, q.status)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 ml-4"
                      title="Hide question"
                    >
                      <EyeOff size={18} />
                    </button>
                  </div>

                  {q.status !== 'answered' ? (
                    <div className="pt-6 border-t border-gray-100">
                      <AnswerBox 
                        questionId={q.id}
                        onComplete={fetchQuestions}
                      />
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">Answered</p>
                          <p className="text-sm text-green-900 leading-relaxed">This question has been answered and sent to the participant.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* HIDDEN QUESTIONS */}
          {hiddenQuestions.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
                  Hidden Questions
                </h3>
                <span className="text-sm text-gray-500">{hiddenQuestions.length} hidden</span>
              </div>
              <div className="space-y-3">
                {hiddenQuestions.map((q) => (
                  <div 
                    key={q.id} 
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-600">{q.guest_name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">Hidden</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{q.content}</p>
                      </div>
                      <button 
                        onClick={() => toggleVisibility(q.id, q.status)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-900 text-white hover:bg-black transition-all ml-4 opacity-0 group-hover:opacity-100"
                        title="Show question"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}