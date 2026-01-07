'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react' 
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const EMOJIS = ['🚀', '🦁', '🛡️', '⚔️', '🦅', '🔥', '💎', '🏆', '📈', '🎯'];

export default function QuestionInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('👤')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) 
  const router = useRouter()

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
      const { error } = await supabase.from('questions').insert([{ 
        content: text.trim(), 
        guest_name: name.trim(),
        guest_emoji: selectedEmoji,
        status: 'pending' 
      }])
      if (error) throw error
      toast.success("Question Sent")
      setText(''); setStep(1); setIsOpen(false)
      router.refresh()
    } catch (err) {
      toast.error("Error sending question")
    } finally {
      setLoading(false)
    }
  }

  // CLOSED STATE: Transparent background, White Button
  if (!isOpen) {
    return (
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 flex-col items-center">
        {/* Subtle gradient so button remains legible over content */}
        <div className="w-full h-32 bg-gradient-to-t from-slate-50/80 to-transparent pointer-events-none" />
        
        {/* Transparent container with a White Button */}
        <div className="w-full bg-transparent pb-10 px-6 flex justify-center">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full max-w-2xl bg-white border border-slate-200 h-16 rounded-2xl flex items-center px-6 shadow-xl shadow-slate-200/50 hover:border-slate-400 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-amber-500 transition-colors">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <span className="text-slate-900 font-bold uppercase tracking-tight text-sm">
                Ask a question...
              </span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // OPEN STATE (The Modal remains white as requested)
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      <form 
        onSubmit={handleSubmit} 
        className="relative w-full max-w-xl bg-white h-[85vh] md:h-auto rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl border-t border-slate-200 overflow-hidden animate-in slide-in-from-bottom-full duration-400 ease-out"
      >
        <button 
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12">
          {step === 1 ? (
            <div className="space-y-8 mt-4">
              <div className="space-y-4">
                <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Select Icon</h2>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-xl w-11 h-11 flex items-center justify-center rounded-xl transition-all ${selectedEmoji === emoji ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Your Name" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-slate-900 outline-none focus:border-slate-300 font-bold placeholder:text-slate-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button 
                  type="button" 
                  disabled={!name} 
                  onClick={() => setStep(2)} 
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
               <div className="flex items-center gap-2 bg-slate-50 w-fit px-3 py-1.5 rounded-lg">
                  <span>{selectedEmoji}</span>
                  <span className="text-slate-900 text-xs font-bold uppercase tracking-tight">{name}</span>
               </div>
               <textarea 
                autoFocus
                placeholder="Write your question..."
                className="w-full bg-transparent text-slate-900 text-2xl md:text-3xl font-medium outline-none min-h-[200px] resize-none placeholder:text-slate-200"
                value={text}
                onChange={(e) => setText(e.target.value)}
               />
               <button 
                 type="submit" 
                 disabled={!text || loading} 
                 className="w-full bg-slate-900 text-white py-5 rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-20"
               >
                 {loading ? 'Sending...' : 'Post Question'}
               </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}