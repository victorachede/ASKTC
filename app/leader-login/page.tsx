'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, Loader2, ShieldCheck, Trophy } from 'lucide-react'
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

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMsg("EMAIL NOT VERIFIED")
        } else if (error.status === 429) {
          setErrorMsg("TOO MANY ATTEMPTS")
        } else {
          setErrorMsg("INVALID CREDENTIALS")
        }
        setLoading(false)
      } else if (data.user) {
        window.location.href = '/leader'
      }
    } catch (err) {
      setErrorMsg("CONNECTION ERROR")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Matching Navigation Bar */}
      <nav className="w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Home</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
             <ShieldCheck size={14} className="text-gray-400" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Secure Protocol</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-full max-w-md">
          
          {/* Header Section - Matching RoomPage style */}
          <header className="text-center mb-10">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-gray-200">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-3" style={{ letterSpacing: '-0.05em' }}>
              Leader Portal
            </h1>
            <p className="text-gray-500 font-medium">
              Access your sovereign dashboard
            </p>
          </header>

          {/* Form Area */}
          <div className="bg-white border border-gray-200 p-8 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center animate-in fade-in zoom-in-95">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLeaderLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Administrator</label>
                <input 
                  type="email" 
                  value={email}
                  placeholder="name@church.com" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-gray-900 placeholder:text-gray-300 outline-none focus:border-black focus:bg-white transition-all font-medium"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Access Key</label>
                <input 
                  type="password" 
                  value={password}
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-gray-900 placeholder:text-gray-300 outline-none focus:border-black focus:bg-white transition-all font-medium"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                disabled={loading}
                className="w-full h-14 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-6 shadow-xl shadow-gray-200 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Enter Dashboard <Lock size={16} /></>
                )}
              </button>
            </form>
          </div>

          <p className="mt-12 text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.4em]">
            ASKTC Protocol © 2026
          </p>
        </div>
      </div>
    </main>
  )
}