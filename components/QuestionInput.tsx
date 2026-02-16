'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Send, Loader2, MessageCircle } from 'lucide-react' 
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
  
  // Ensure we have a string slug from the URL
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
      // 1. Resolve the Slug to a real Room ID
      // This stops the 400 Bad Request error by providing a UUID instead of a string
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (roomError || !roomData) {
        toast.error("Room connection failed");
        setLoading(false);
        return;
      }

      // 2. Identify the sender
      const { data: userData } = await supabase.auth.getSession()
      const user = userData.session?.user

      // 3. Insert the question using the resolved Room ID
      const { data, error } = await supabase.from('questions').insert([{ 
        content: text.trim(), 
        guest_name: name.trim(),
        user_id: user?.id || null,
        guest_emoji: user?.user_metadata?.emoji_key || '👤', 
        status: 'pending',
        room_id: roomData.id // Official UUID from the rooms table
      }]).select()

      if (error) throw error
      
      // 4. Local tracking for the user's history banner
      if (!user && data?.[0]?.id) {
        const existing = JSON.parse(localStorage.getItem('my_asked_questions') || '[]');
        localStorage.setItem('my_asked_questions', JSON.stringify([...existing, data[0].id]));
        window.dispatchEvent(new Event('storage'));
      }

      toast.success("Sent to the stage")
      setText('') 
      setName('')
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Submission error:', err.message)
      toast.error("Submission failed")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none px-6 font-sans">
        <button 
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto bg-white text-black h-16 px-10 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 transition-all active:scale-95 group border border-white/10"
        >
          <div className="bg-black rounded-lg p-1.5 group-hover:rotate-90 transition-transform duration-300">
            <Plus size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase tracking-widest">Ask a Question</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500 font-sans">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-xl bg-[#0e0e0e] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 ease-out">
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mt-4 sm:hidden" />

        <div className="flex items-center justify-between p-10 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle size={20} className="text-emerald-500" />
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight italic uppercase">New Question</h2>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-2 space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Identity</label>
              <input 
                type="text" 
                placeholder="Your name or nickname" 
                className="w-full bg-zinc-900/50 border border-white/5 px-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-700 rounded-2xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Your Question</label>
              <textarea 
                placeholder="What would you like to ask?"
                className="w-full bg-zinc-900/50 border border-white/5 px-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-700 rounded-2xl resize-none min-h-[160px] leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!text.trim() || !name.trim() || loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white h-16 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span className="uppercase tracking-widest">Send to Stage</span>
                <Send size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}