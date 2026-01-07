'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      // Refresh the page to trigger the Middleware session check
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl">
        
        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Impact <span className="text-amber-500">Academy</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            Sign in to continue
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase ml-4">Email</label>
            <input 
              type="email" 
              placeholder="victor@church.com" 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-black uppercase ml-4">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-amber-500 transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-50 mt-4 shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Authenticating...' : 'Enter Academy'}
          </button>
        </form>

        <footer className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p className="text-slate-400 text-sm font-medium">
            First time? 
            <Link href="/signup" className="text-amber-500 font-bold ml-2 hover:underline">
              Create Account
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}