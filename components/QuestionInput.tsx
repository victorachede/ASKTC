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
      const { error } = await supabase.from('questions').insert([{ 
        content: text.trim(), 
        guest_name: name.trim(),
        guest_emoji: '👤', 
        status: 'pending',
        room_id: slug 
      }])

      if (error) throw error
      
      toast.success("Question submitted successfully!")
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
          className="pointer-events-auto bg-black text-white h-14 px-8 rounded-full flex items-center gap-2 shadow-2xl hover:bg-gray-900 transition-all"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}
        >
          <Plus size={20} />
          <span className="font-semibold text-sm">Ask a Question</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
            Ask a Question
          </h2>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="space-y-5">
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900 block">
                Your Name
              </label>
              <input 
                type="text" 
                autoFocus
                placeholder="e.g. John Doe" 
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                This will be shown with your question
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900 block">
                Your Question
              </label>
              <textarea 
                placeholder="What would you like to ask?"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all resize-none min-h-[120px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                {text.length} characters
              </p>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!text.trim() || !name.trim() || loading} 
              className="w-full bg-black text-white h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Question</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}