'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { MessageSquare, Clock } from 'lucide-react'

export default function QuestionList() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { slug } = useParams()

  useEffect(() => {
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
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'questions',
          filter: `room_id=eq.${slug}`
        }, 
        (payload) => {
          setQuestions((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [slug])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-[#D1D1D6] border-t-[#0071E3] rounded-full animate-spin" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="py-20 bg-white rounded-[2.5rem] border border-black/[0.03] flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-[#F5F5F7] rounded-3xl flex items-center justify-center mb-6">
          <MessageSquare className="text-[#C7C7CC]" size={28} />
        </div>
        <p className="text-[#1D1D1F] font-semibold text-lg">No inquiries yet</p>
        <p className="text-[#8E8E93] text-sm mt-1 max-w-[200px]">The session is active and waiting for participants.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {questions.map((q) => (
        <div 
          key={q.id} 
          className="group relative bg-white p-6 md:p-8 rounded-[2rem] border border-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-black/[0.08] transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex flex-col gap-6">
            <p className="text-xl md:text-2xl text-[#1D1D1F] font-semibold tracking-tight leading-snug">
              {q.content}
            </p>
            
            <div className="flex items-center justify-between pt-6 border-t border-[#F5F5F7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center border border-black/5">
                  <span className="text-xs font-bold text-[#1D1D1F]">
                    {q.guest_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tight">Contributor</span>
                  <span className="text-sm font-bold text-[#1D1D1F]">{q.guest_name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F7] rounded-full">
                <Clock size={12} className="text-[#8E8E93]" />
                <span className="text-[11px] font-bold text-[#8E8E93]">
                  {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}