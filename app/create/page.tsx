
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, ArrowRight, Hash } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const serif = "'Cormorant Garamond', serif"
const cond = "'Barlow Condensed', sans-serif"
const sans = "'Barlow', sans-serif"
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap'

export default function CreateRoom() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const [slug, setSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNameChange = (val: string) => {
    setRoomName(val)
    setSlug(val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))

  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalSlug = slug.trim() || Math.random().toString(36).substring(2, 8)
    setIsLoading(true)
    const { error } = await supabase.from('rooms').insert([{ name: roomName, slug: finalSlug }])
    if (error) {
      toast.error(error.code === '23505' ? 'Code already taken' : 'Something went wrong')
      setIsLoading(false)
    } else {
      toast.success('Stage is ready')
      router.push(`/leader/room/${finalSlug}`)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(245,240,232,0.08) !important; }
        .back-link:hover { color: #f5f0e8 !important; }
        .name-input:focus { border-color: rgba(212,255,78,0.4) !important; }
        .slug-input:focus { border-color: rgba(212,255,78,0.3) !important; background: rgba(212,255,78,0.03) !important; }
        .submit-btn:not(:disabled):hover { background: #e8ff6a !important; box-shadow: 0 0 40px rgba(212,255,78,0.15) !important; }
        .submit-btn:not(:disabled):active { transform: scale(0.98); }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* GLOW */}
      <div style={{ position: 'fixed', top: '-20vh', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(212,255,78,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(245,240,232,0.04)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)' }}>
        <Link href="/" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(245,240,232,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}>
          <ArrowLeft size={14} />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Back</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>New Session</span>

        </div>
      </nav>

      {/* CONTENT */}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '120px 24px 80px', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 56 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 1, height: 24, background: 'rgba(212,255,78,0.4)' }} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Create Session</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.8rem, 10vw, 4.5rem)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#f5f0e8' }}>
            Launch your<br /><em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>session.</em>
          </h1>

        </motion.div>

        {/* FORM */}
        <motion.form
          onSubmit={handleCreate}

          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
        >

          {/* SESSION NAME */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>
              Session Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. GCK Youth Seminar"
              value={roomName}
              onChange={e => handleNameChange(e.target.value)}
              className="name-input"
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderBottom: '1px solid rgba(245,240,232,0.1)',
                padding: '12px 0', outline: 'none',
                fontFamily: serif, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
                fontWeight: 300, color: '#f5f0e8',
                transition: 'border-color 0.25s'
              }}
            />
          </div>

          {/* ACCESS CODE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>
              Access Code
            </label>
            <input
              type="text"
              placeholder="auto-generated"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="slug-input"
              style={{
                width: '100%',
                background: 'rgba(245,240,232,0.03)',
                border: '1px solid rgba(245,240,232,0.08)',
                borderRadius: 12, padding: '14px 18px',
                outline: 'none',
                fontFamily: cond, fontSize: 15, fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase',
                color: '#d4ff4e',
                transition: 'border-color 0.25s, background 0.25s'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
              <Hash size={11} color="rgba(245,240,232,0.2)" />
              <span style={{ fontFamily: sans, fontSize: 11, color: 'rgba(245,240,232,0.25)', fontWeight: 500 }}>
                Audience joins at{' '}
                <span style={{ fontFamily: cond, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(245,240,232,0.5)' }}>
                  asktc.vercel.app/room/{slug || '···'}

                </span>
              </span>
            </div>
          </div>


          {/* SUBMIT */}
          <button
            type="submit"
            disabled={!roomName || isLoading}
            className="submit-btn"
            style={{
              width: '100%', height: 60,
              background: '#d4ff4e', color: '#060606',
              border: 'none', borderRadius: 14,
              fontFamily: cond, fontSize: 13, fontWeight: 900,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              cursor: roomName && !isLoading ? 'pointer' : 'not-allowed',
              opacity: !roomName || isLoading ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s, opacity 0.2s'
            }}
          >
            {isLoading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Initialize Stage

                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.form>


        {/* FOOTER NOTE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ marginTop: 32, fontFamily: sans, fontSize: 11, color: 'rgba(245,240,232,0.15)', textAlign: 'center', lineHeight: 1.6 }}
        >
          After creating, you'll be taken to the control panel.
        </motion.p>

      </div>
    </main>
  )
}