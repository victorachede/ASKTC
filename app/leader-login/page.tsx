
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const serif = "'Cormorant Garamond', serif"
const cond = "'Barlow Condensed', sans-serif"
const sans = "'Barlow', sans-serif"
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap'

export default function LeaderLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })
    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials'
        ? "We couldn't find an account with those details."
        : error.message)
      setLoading(false)
    } else if (data.user) {
      router.push('/leader')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(245,240,232,0.08) !important; }
        .back-link:hover { color: #f5f0e8 !important; }
        .field-input:focus { border-color: rgba(212,255,78,0.35) !important; background: rgba(212,255,78,0.02) !important; }
        .submit-btn:not(:disabled):hover { background: #e8ff6a !important; box-shadow: 0 0 40px rgba(212,255,78,0.15) !important; }
        .submit-btn:not(:disabled):active { transform: scale(0.98); }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* GLOW */}
      <div style={{ position: 'fixed', top: '-20vh', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(212,255,78,0.025) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(245,240,232,0.04)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)' }}>
        <Link href="/" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(245,240,232,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}>
          <ArrowLeft size={14} />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Home</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Leader Portal</span>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: 48 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 1, height: 24, background: 'rgba(212,255,78,0.4)' }} />
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Leader Access</span>
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.8rem, 10vw, 4rem)', fontWeight: 300, lineHeight: 0.92, color: '#f5f0e8', marginBottom: 16 }}>
              Welcome<br /><em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>back.</em>
            </h1>
            <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(245,240,232,0.25)', fontWeight: 400, lineHeight: 1.6 }}>
              Sign in to manage your live session.
            </p>
          </motion.div>

          {/* FORM CARD */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            {/* ERROR */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: 12 }}
              >
                <p style={{ fontFamily: sans, fontSize: 12, color: 'rgba(255,120,120,0.9)', fontWeight: 500, lineHeight: 1.5 }}>{errorMsg}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* EMAIL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="field-input"
                  style={{ width: '100%', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 12, padding: '14px 18px', outline: 'none', fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#f5f0e8', transition: 'border-color 0.25s, background 0.25s' }}
                />
              </div>

              {/* PASSWORD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="field-input"
                  style={{ width: '100%', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 12, padding: '14px 18px', outline: 'none', fontFamily: sans, fontSize: 14, fontWeight: 400, color: '#f5f0e8', transition: 'border-color 0.25s, background 0.25s' }}
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="submit-btn"
                style={{ width: '100%', height: 58, background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 12, fontFamily: cond, fontSize: 13, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading || !email || !password ? 'not-allowed' : 'pointer', opacity: loading || !email || !password ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s, opacity 0.25s', marginTop: 8 }}
              >
                {loading
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : 'Continue to Dashboard'
                }
              </button>
            </form>
          </motion.div>

          {/* FOOTER */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <ShieldCheck size={12} color="rgba(245,240,232,0.15)" />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>
              Secure Encryption Active
            </span>
          </motion.div>

        </div>
      </div>
    </main>
  )

}