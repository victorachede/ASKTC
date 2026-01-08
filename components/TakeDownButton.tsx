'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast' // Import the magic

export default function TakeDownButton({ questionId }: { questionId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleTakeDown = async () => {
    // 1. Immediate Feedback: Start the loading state
    setIsLoading(true)

    const { error } = await supabase
      .from('questions')
      .update({ status: 'hidden' })
      .eq('id', questionId)

    if (error) {
      toast.error("Takedown failed: " + error.message)
      setIsLoading(false)
    } else {
      // 2. The Professional Touch: Success Notification
      toast.success("Intelligence hidden successfully", {
        icon: '🚫',
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#fff',
        },
      }) 
      
      // 3. Smooth Exit: Brief delay before refresh so they see the toast
      setTimeout(() => window.location.reload(), 800)
    }
  }

  return (
    <button 
      onClick={handleTakeDown}
      disabled={isLoading}
      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 group"
      title="Take Down"
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Trash2 size={18} />
      )}
    </button>
  )
}