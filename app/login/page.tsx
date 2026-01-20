'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 antialiased font-sans" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Top Navigation - Logo Removed */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center px-8">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase hover:opacity-60 transition-opacity">
          <ArrowLeft size={14} />
          <span>BACK</span>
        </Link>
      </div>

      <div className="w-full max-w-[340px]">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter uppercase italic leading-none">
            Sign In
          </h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            Enter your credentials to continue
          </p>
        </header>

        {errorMsg && (
          <div className="mb-8 p-4 border border-black text-[11px] font-bold uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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

          <button 
            disabled={loading}
            className="w-full bg-black text-white font-bold py-5 text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all disabled:opacity-50 mt-6 rounded-xl"
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>

        <footer className="mt-12 space-y-4">
          <Link href="/signup" className="block text-center text-[10px] font-black uppercase tracking-widest border border-gray-100 py-4 rounded-xl hover:border-black transition-colors">
            Create an account
          </Link>
          <div className="text-center">
             <button className="text-[9px] font-bold text-gray-300 uppercase tracking-widest hover:text-black transition-colors">
               Forgot password?
             </button>
          </div>
        </footer>
      </div>

      <p className="fixed bottom-8 text-[9px] font-medium text-gray-300 uppercase tracking-[0.3em]">
        © 2026 asktc platform
      </p>
    </div>
  )
}