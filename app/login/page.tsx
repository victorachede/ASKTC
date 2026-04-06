'use client'

import { useState } from 'react'
<<<<<<< HEAD
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap'
=======
import { supabase } from '@/lib/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
<<<<<<< HEAD
  const [errorMsg, setErrorMsg] = useState('')
=======
  const [errorMsg, setErrorMsg] = useState("")
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
<<<<<<< HEAD
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErrorMsg(error.message); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  const serif = "'Playfair Display', serif"
  const sans = "'DM Sans', sans-serif"
  const encre = '#1a1410'
  const papier = '#f7f4ef'
  const creme = '#ede9e1'
  const or = '#c8a96e'
  const muted = '#8a8279'

  return (
    <div style={{ minHeight: '100vh', background: papier, display: 'flex', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>

      <style>{`
        @import url('${FONT_URL}');
        * { box-sizing: border-box; }
        ::placeholder { color: ${muted} !important; opacity: 0.5; }
        input:focus { border-color: ${encre} !important; outline: none; }
        .submit-btn:hover { background: ${or} !important; }
        .back-link:hover { color: ${encre} !important; }
        .signup-link:hover { color: ${or} !important; }
      `}</style>

      {/* Left panel — decorative */}
      <div className="hidden lg:flex" style={{ width: '45%', background: encre, flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        {/* Large ghost letter */}
        <div style={{ position: 'absolute', bottom: -40, right: -20, fontFamily: serif, fontSize: '22rem', fontWeight: 900, fontStyle: 'italic', color: 'rgba(247,244,239,0.03)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          A
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 1, height: 24, background: or }} />
          <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', color: papier }}>ASK THE CHURCH</span>
        </div>
        <div>
          <div style={{ fontFamily: sans, fontSize: 8, fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', color: or, marginBottom: 20 }}>Pour les leaders</div>
          <blockquote style={{ fontFamily: serif, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontStyle: 'italic', fontWeight: 400, color: papier, lineHeight: 1.35, marginBottom: 20 }}>
            "Intelligence in every inquiry."
          </blockquote>
          <p style={{ fontFamily: sans, fontSize: 12, color: 'rgba(247,244,239,0.3)', lineHeight: 1.7, fontWeight: 300, maxWidth: '30ch' }}>
            The professional standard for live Q&A. Create sessions, manage questions, control your stage.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px' }}>

        {/* Back link */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, display: 'flex', alignItems: 'center', padding: '0 40px', borderBottom: `1px solid rgba(26,20,16,0.06)` }}>
          <Link href="/" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, textDecoration: 'none', transition: 'color 0.2s' }}>
            <ArrowLeft size={13} />
            Retour
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>

          <div style={{ marginBottom: 48 }}>
            <div style={{ width: 32, height: 2, background: or, marginBottom: 20 }} />
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.4rem, 6vw, 3.2rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 0.95, color: encre, marginBottom: 12 }}>
              Sign In
            </h1>
            <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted }}>
              Espace leaders
            </p>
          </div>

          {errorMsg && (
            <div style={{ marginBottom: 24, padding: '12px 16px', border: `1px solid rgba(192,57,43,0.3)`, background: 'rgba(192,57,43,0.04)', fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontFamily: sans, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: muted, marginBottom: 8 }}>
                Adresse email
              </label>
              <input
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', border: `1px solid rgba(26,20,16,0.15)`, background: papier, padding: '14px 16px', fontFamily: sans, fontSize: 14, color: encre, transition: 'border-color 0.2s' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: sans, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: muted, marginBottom: 8 }}>
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', border: `1px solid rgba(26,20,16,0.15)`, background: papier, padding: '14px 16px', fontFamily: sans, fontSize: 14, color: encre, transition: 'border-color 0.2s' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{ width: '100%', padding: '15px 24px', background: encre, color: papier, border: 'none', fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.6 : 1, transition: 'background 0.25s', marginTop: 8 }}>
              {loading ? 'Connexion...' : <> Se connecter <ArrowRight size={13} /></>}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid rgba(26,20,16,0.08)`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/signup" className="signup-link" style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, textDecoration: 'none', transition: 'color 0.2s' }}>
              Créer un compte →
            </Link>
            <button style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(138,130,121,0.5)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              Mot de passe oublié?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
=======
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
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
