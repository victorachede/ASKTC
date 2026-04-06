'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const EMOJIS = ["👤", "🚀", "💡", "🛡️", "🔑", "🎯", "💎", "🌈", "⚡", "🔥"]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('👤')
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
          emoji_key: selectedEmoji,
        }
      }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success("Account created!")
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased font-sans" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navigation - Fixed to prevent overlap */}
      <nav className="h-20 flex items-center px-8 shrink-0">
        <Link href="/login" className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase hover:opacity-60 transition-opacity">
          <ArrowLeft size={14} />
          <span>BACK TO LOGIN</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-[380px]">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic leading-none">
              Register
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
              Join the conversation platform
            </p>
          </header>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
              <input 
                type="text" 
                placeholder="Victor Church" 
                className="w-full border border-gray-100 bg-gray-50/50 px-4 py-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300 rounded-xl"
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                className="w-full border border-gray-100 bg-gray-50/50 px-4 py-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300 rounded-xl"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full border border-gray-100 bg-gray-50/50 px-4 py-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300 rounded-xl"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Emoji Selection */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                Select Avatar Symbol: <span className="text-black ml-1">{selectedEmoji}</span>
              </p>
              <div className="grid grid-cols-5 gap-2 border border-gray-100 p-2 rounded-2xl">
                {EMOJIS.map(emoji => (
                  <button 
                    key={emoji} type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-lg p-2 rounded-xl transition-all ${
                      selectedEmoji === emoji 
                      ? 'bg-black text-white scale-105 shadow-lg' 
                      : 'hover:bg-gray-50 opacity-40'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-black text-white font-bold py-5 text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all disabled:opacity-50 mt-4 rounded-xl"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <footer className="mt-10 text-center pb-8">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              Already have an account? 
              <Link href="/login" className="text-black ml-2 hover:underline tracking-normal">Sign In</Link>
            </p>
          </footer>
        </div>
      </div>

      <p className="w-full text-center pb-8 text-[9px] font-medium text-gray-300 uppercase tracking-[0.3em] shrink-0">
        © 2026 asktc platform
      </p>
    </div>
  )
}