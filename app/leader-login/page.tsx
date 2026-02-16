'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function LeaderLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  const handleLeaderLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (error) {
      // Use human-readable error messages
      setErrorMsg(error.message === "Invalid login credentials" 
        ? "We couldn't find an account with those details." 
        : error.message)
      setLoading(false)
    } else if (data.user) {
      router.push('/leader')
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-300 flex flex-col selection:bg-emerald-500/30">
      
      {/* Navigation */}
      <nav className="w-full h-16 flex items-center px-8">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-all group"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          
          {/* Header - Friendly & Clear */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
              Leader Portal
            </h1>
            <p className="text-zinc-500 text-lg">
              Sign in to manage your live session.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#111] border border-white/5 p-8 md:p-10 rounded-[2rem] shadow-2xl">
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLeaderLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  placeholder="you@example.com" 
                  className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  placeholder="Enter your password" 
                  className="w-full bg-zinc-900 border border-white/10 p-4 rounded-xl text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                disabled={loading}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-900/20"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>Continue to Dashboard</>
                )}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600">
            <ShieldCheck size={14} />
            <span className="text-xs uppercase tracking-widest font-semibold">Secure Encryption Active</span>
          </div>
        </div>
      </div>
    </main>
  )
}