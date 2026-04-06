'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const EMOJIS = ["🔥", "🛡️", "📖", "🕊️", "⛪", "🙌", "✨", "⚓", "💡", "⚔️", "🎺", "🦁", "🐑", "🍇", "🍞", "👑", "👣", "🌱", "💎", "🎯"]

export default function EmojiPicker({ currentEmoji, userId }: { currentEmoji: string, userId: string }) {
  const [selected, setSelected] = useState(currentEmoji)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (emoji: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ emoji_key: emoji })
      .eq('id', userId)

    if (!error) {
      setSelected(emoji)
      alert("Profile Identity Updated!")
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-sm">
      <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-4">Choose Your Symbol</h3>
      <div className="grid grid-cols-5 gap-2">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleUpdate(emoji)}
            disabled={loading}
            className={`text-2xl p-2 rounded-xl transition-all ${
              selected === emoji ? 'bg-amber-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}