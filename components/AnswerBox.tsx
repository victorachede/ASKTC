'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Added onSuccess prop to tell the parent to re-fetch
export default function AnswerBox({ 
  questionId, 
  leaderId,
  onSuccess 
}: { 
  questionId: string, 
  leaderId: string,
  onSuccess?: () => void 
}) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px'
    }
  }, [answer])

  const handleAnswer = async () => {
    if (!answer.trim() || loading) return

    if (!leaderId) {
      toast.error("AUTH ERROR: NO LEADER ID DETECTED")
      return
    }

    setLoading(true)
    try {
      // 1. Insert Answer - Triple check column names in Supabase!
      const { error: answerError } = await supabase
        .from('answers')
        .insert([{ 
          question_id: questionId, 
          answer_body: answer.trim(), // Is this 'content' in your DB?
          leader_id: leaderId 
        }])

      if (answerError) throw answerError

      // 2. Update Question Status
      const { error: statusError } = await supabase
        .from('questions')
        .update({ status: 'answered' }) 
        .eq('id', questionId)

      if (statusError) throw statusError

      toast.success("INTELLIGENCE DISPATCHED", { 
        style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } 
      })
      
      setAnswer('')
      
      // 3. Trigger updates
      if (onSuccess) onSuccess() 
      router.refresh()

    } catch (err: any) {
      console.error("SUBMISSION ERROR:", err)
      toast.error(err.message || "TRANSMISSION FAILURE")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t border-slate-800/50 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Leader Response Terminal
        </span>
      </div>
      
      <textarea
        ref={textAreaRef}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type the verified briefing..."
        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-slate-100 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none min-h-[120px] transition-all resize-none leading-relaxed text-base placeholder:text-slate-700"
      />
      
      <button
        onClick={handleAnswer}
        disabled={loading || !answer.trim()}
        className="mt-4 w-full bg-slate-100 text-slate-900 font-black py-4 rounded-2xl hover:bg-white active:scale-[0.98] transition-all disabled:opacity-10 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Encrypting...
          </span>
        ) : (
          'Authorize & Dispatch'
        )}
      </button>
    </div>
  )
}