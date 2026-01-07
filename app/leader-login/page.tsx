'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import { Trophy, ChevronLeft, Lock, Loader2 } from 'lucide-react'

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

    // 1. Clean inputs to prevent "hidden space" login failures
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error) {
        // Handle specific Supabase error types
        if (error.message.includes("Email not confirmed")) {
          setErrorMsg("EMAIL NOT VERIFIED IN SUPABASE")
        } else if (error.status === 429) {
          setErrorMsg("TOO MANY ATTEMPTS - SLOW DOWN")
        } else {
          setErrorMsg("INVALID CREDENTIALS")
        }
        setLoading(false)
      } else if (data.user) {
        // 2. Using window.location.href to "force" the middleware to see the new cookie
        window.location.href = '/leader'
      }
    } catch (err) {
      setErrorMsg("CONNECTION ERROR")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-24 md:pt-40 p-6">
      <div className="w-full max-w-md bg-white p-10 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
        
        <header className="text-center mb-12">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
             <Trophy size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Leader <span className="text-amber-500">Portal</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
            ASKTC Management
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLeaderLogin} className="space-y-4">
          <div className="relative">
            <input 
              type="email" 
              value={email}
              placeholder="Admin Email" 
              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-300 focus:bg-white transition-all font-bold text-sm"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative">
            <input 
              type="password" 
              value={password}
              placeholder="Security Key" 
              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-300 focus:bg-white transition-all font-bold text-sm"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Verifying...
              </>
            ) : (
              <>
                Access Portal <Lock size={16} />
              </>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.push('/')}
          className="w-full mt-10 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Feed
        </button>
      </div>
      
      <p className="mt-12 text-slate-300 text-[9px] font-bold uppercase tracking-[0.4em]">
        ASKTC © 2026
      </p>
    </div>
  )
}