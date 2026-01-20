'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Send, Loader2 } from 'lucide-react' 
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function QuestionInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : ''

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ask-modal', handleOpen);
    return () => window.removeEventListener('open-ask-modal', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !name.trim() || loading) return
    setLoading(true)
    
    try {
      const { data: userData } = await supabase.auth.getSession()
      const user = userData.session?.user

      const { data, error } = await supabase.from('questions').insert([{ 
        content: text.trim(), 
        guest_name: name.trim(),
        user_id: user?.id || null, // Link to user if logged in
        guest_emoji: user?.user_metadata?.emoji_key || '👤', 
        status: 'pending',
        room_id: slug 
      }]).select()

      if (error) throw error
      
      // TRACKING LOGIC: Store ID for guest-to-user conversion later
      if (!user && data?.[0]?.id) {
        const existing = JSON.parse(localStorage.getItem('my_asked_questions') || '[]');
        localStorage.setItem('my_asked_questions', JSON.stringify([...existing, data[0].id]));
        // Dispatch event to update the RoomPage banner immediately
        window.dispatchEvent(new Event('storage'));
      }

      toast.success("Question sent")
      setText('') 
      setName('')
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      toast.error("Failed to send question")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto bg-black text-white h-14 px-8 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-all active:scale-95"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          <Plus size={18} strokeWidth={3} />
          <span className="font-black text-[10px] uppercase tracking-[0.2em]">Ask a Question</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/20 backdrop-blur-sm" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
        
        <div className="flex items-center justify-between p-8 pb-4">
          <h2 className="text-2xl font-bold tracking-tighter uppercase italic">
            New Question
          </h2>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Identity</label>
            <input 
              type="text" 
              placeholder="Your Name" 
              className="w-full border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300 rounded-2xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Question</label>
            <textarea 
              placeholder="What's on your mind?"
              className="w-full border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300 rounded-2xl resize-none min-h-[140px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={!text.trim() || !name.trim() || loading} 
            className="w-full bg-black text-white h-16 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Send to Room</span>
                <Send size={14} strokeWidth={3} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}