'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EMOJIS = ["🔥", "🛡️", "📖", "🕊️", "⛪", "🙌", "✨", "⚓", "💡", "⚔️", "🎺", "🦁", "🐑", "🍇", "🍞", "👑", "👣", "🌱", "💎", "🎯"]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🔥') // Default selection
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          emoji_key: selectedEmoji, // This sends the emoji to the SQL function
        }
      }
    })

    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      alert("Account created! Redirecting to login...")
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Impact <span className="text-amber-500">Academy</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Create your profile & pick your symbol</p>
        </header>

        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required
            className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
            onChange={(e) => setFullName(e.target.value)}
          />
          <input 
            type="email" placeholder="Email Address" required
            className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password (min 6 chars)" required
            className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="py-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex justify-between">
              Pick Your PFP Symbol <span>{selectedEmoji}</span>
            </p>
            <div className="grid grid-cols-5 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-700">
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-xl transition-all duration-200 ${
                    selectedEmoji === emoji 
                    ? 'bg-amber-500 scale-110 shadow-lg shadow-amber-500/20' 
                    : 'hover:bg-slate-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Join Academy'}
          </button>
        </form>

        <footer className="mt-8 text-center border-t border-slate-700 pt-6">
          <p className="text-slate-400 text-sm font-medium">
            Already have an account? 
            <Link href="/login" className="text-amber-500 font-bold ml-2 hover:underline">Sign In</Link>
          </p>
        </footer>
      </div>
    </main>
  )
}