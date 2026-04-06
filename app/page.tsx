
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Zap, Globe, Users, Monitor, ArrowRight, BarChart2, Mic } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ── FONT IMPORT (inject once) ─────────────────────────────────────────────────
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap'

// ── TOPIC ROTATOR ─────────────────────────────────────────────────────────────
const topics = ['audience.', 'townhall.', 'keynote.', 'church.', 'classroom.']

function TopicRotator() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % topics.length), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: '0.97em', verticalAlign: 'bottom' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -26, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'block', fontStyle: 'italic', color: '#d4ff4e', lineHeight: 0.97 }}
        >
          {topics[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ── MOCK Q&A CARD ─────────────────────────────────────────────────────────────
const mockQs = [
  { init: 'TE', name: 'Tunde E.', text: 'How do we balance grace with accountability in leadership?', votes: 24, featured: true },
  { init: 'SA', name: 'Sister Ada', text: "What's the biblical framework for community service?", votes: 11, featured: false },
]

function MockCard() {
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.7)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(245,240,232,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#d4ff4e', fontFamily: 'Barlow, sans-serif' }}>Impact Academy — Live</span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(245,240,232,0.2)', fontWeight: 700 }}>14 questions</span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mockQs.map((q, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14,
            background: q.featured ? 'rgba(212,255,78,0.06)' : 'rgba(245,240,232,0.02)',
            border: `1px solid ${q.featured ? 'rgba(212,255,78,0.18)' : 'rgba(245,240,232,0.05)'}`,
            borderRadius: 12
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: q.featured ? '#d4ff4e' : '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: q.featured ? '#060606' : '#555', flexShrink: 0, fontFamily: 'Barlow Condensed, sans-serif' }}>
              {q.init}
            </div>
            <div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(245,240,232,0.85)', marginBottom: 8 }}>{q.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>{q.name}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: q.featured ? '#d4ff4e' : 'rgba(245,240,232,0.2)' }}>★ {q.votes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 12, padding: '12px 16px' }}>
          <input readOnly style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(245,240,232,0.2)', fontFamily: 'Barlow, sans-serif' }} placeholder="Ask your question..." />
          <button style={{ padding: '7px 14px', background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif' }}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ── STATS — honest value props, no fake numbers ───────────────────────────────
const stats = [
  { num: 'Real-time', label: 'Zero lag sync' },
  { num: 'No app', label: 'Nothing to install' },
  { num: 'Voice', label: 'Command your session' },
  { num: 'Free', label: 'To attend, always' },
]

// ── FEATURES ──────────────────────────────────────────────────────────────────
const features = [
  { icon: <Zap size={16} color="rgba(212,255,78,0.5)" />, title: 'Upvoting', desc: 'Surface the best questions by heat' },
  { icon: <Globe size={16} color="rgba(245,240,232,0.18)" />, title: 'Instant sync', desc: 'Zero lag across all devices' },
  { icon: <Monitor size={16} color="rgba(245,240,232,0.18)" />, title: 'Projector mode', desc: 'One click to the big screen' },
  { icon: <BarChart2 size={16} color="rgba(245,240,232,0.18)" />, title: 'Live polls', desc: 'Launch a poll mid-session, results live' },
  { icon: <span style={{ fontSize: 14 }}>🔥</span>, title: 'Reaction wall', desc: 'Audience reacts, emojis float on screen' },
]

const steps = [
  { num: '01', title: 'Leader creates a session', body: 'Sign in, create a room, get a short event code. Takes less than a minute.' },
  { num: '02', title: 'Crowd joins with the code', body: 'No app download, no account needed. Just open the link and start asking.' },
  { num: '03', title: 'Questions flow in live', body: 'Upvote, assign to panelists, push to the projector. Full control in real time.' },
]

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  const handleJoin = async () => {
    const slug = code.toLowerCase().trim()
    if (!slug) return
    setChecking(true)
    const { data, error } = await supabase.from('rooms').select('id').eq('slug', slug).single()
    setChecking(false)
    if (error || !data) {
      toast.error('Session not found. Check your code.')
      return
    }
    router.push(`/room/${slug}`)
  }

  const serif = "'Cormorant Garamond', serif"
  const cond = "'Barlow Condensed', sans-serif"
  const sans = "'Barlow', sans-serif"

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>

      {/* FONTS */}
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(245,240,232,0.1) !important; }
        @keyframes pip {
          0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(212,255,78,0.4); }
          50% { opacity:0.6; box-shadow: 0 0 0 5px rgba(212,255,78,0); }
        }
        @keyframes scrollPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .live-pip { animation: pip 2s ease infinite; }
        .scroll-line { animation: scrollPulse 2s ease infinite; }
        .join-btn:hover { background: #e8ff6a !important; }
        .join-btn:active { transform: scale(0.97); }
        .join-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cta-btn:hover { background: #e8ff6a !important; box-shadow: 0 0 40px rgba(212,255,78,0.2) !important; }
        .cta-btn:active { transform: scale(0.97); }
        .nav-link:hover { color: #f5f0e8 !important; }
        .stats-strip { scrollbar-width: none; }
        .stats-strip::-webkit-scrollbar { display: none; }
        .p-queue-inner { scrollbar-width: none; }
        .p-queue-inner::-webkit-scrollbar { display: none; }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* AMBIENT GLOW */}
      <div style={{ position: 'fixed', top: '-30vh', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(212,255,78,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(245,240,232,0.04)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{ width: 28, height: 28, background: '#d4ff4e', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={13} color="#060606" fill="#060606" strokeWidth={0} />
          </div>
          <span style={{ fontFamily: cond, fontWeight: 900, fontSize: 15, letterSpacing: '0.12em', color: '#f5f0e8' }}>ASKTC</span>
        </div>
        <Link href="/create" className="nav-link" style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', textDecoration: 'none', transition: 'color 0.2s' }}>
          Start Session
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 24px 60px' }}>

        {/* Left content */}
        <div className="hero-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span className="live-pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
            <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#d4ff4e' }}>Real-time Q&amp;A Platform</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{ fontFamily: serif, fontSize: 'clamp(3.6rem, 14vw, 7rem)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#f5f0e8', marginBottom: 24 }}>
            The voice<br />of your<br />
            <TopicRotator />
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(245,240,232,0.28)', maxWidth: '36ch', marginBottom: 36, fontWeight: 400 }}>
            Run powerful live Q&amp;A sessions. Your crowd asks, you answer — no apps, no friction, just real conversation happening right now.
          </motion.p>

          {/* JOIN BOX */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
            style={{ display: 'flex', alignItems: 'stretch', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 14, overflow: 'hidden', maxWidth: 400 }}>
            <input
              type="text" value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Event Code"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '16px 18px', fontFamily: cond, fontSize: 13, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f5f0e8', minWidth: 0 }}
            />
            <button onClick={handleJoin} disabled={checking} className="join-btn"
              style={{ flexShrink: 0, padding: '0 22px', background: '#d4ff4e', color: '#060606', border: 'none', fontFamily: cond, fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: checking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s, transform 0.1s', whiteSpace: 'nowrap', opacity: checking ? 0.6 : 1 }}>
              {checking ? 'Checking...' : <> Join <ArrowRight size={12} /></>}
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
            {['Real-time sync', 'No sign-up to join', 'Free to attend'].map(label => (
              <span key={label} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>· {label}</span>
            ))}
          </motion.div>
        </div>

        {/* Hero right - desktop only */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="hidden lg:block"
          style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)', width: '45%', maxWidth: 560 }}
        >
          {/* Floating badge — honest copy */}
          <div style={{ position: 'absolute', top: -20, right: -16, zIndex: 2, background: '#111', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: serif, fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1, color: '#f5f0e8' }}>Live</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', marginTop: 4 }}>Right now</div>
          </div>
          <MockCard />
        </motion.div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }} className="lg:hidden">
          <div className="scroll-line" style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, rgba(212,255,78,0.4), transparent)' }} />
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>Scroll</span>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip" style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(245,240,232,0.05)', borderBottom: '1px solid rgba(245,240,232,0.05)', padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ flexShrink: 0, padding: '24px 32px 24px 0', display: 'flex', flexDirection: 'column', gap: 4, borderRight: i < stats.length - 1 ? '1px solid rgba(245,240,232,0.05)' : 'none', marginRight: 32 }}>
            <div style={{ fontFamily: serif, fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '72px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.18)', whiteSpace: 'nowrap' }}>What makes it work</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(245,240,232,0.06)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 4, overflow: 'hidden' }}
          className="lg:grid-cols-12-bento">

          {/* Big cell */}
          <div style={{ background: '#060606', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280 }} className="lg:col-span-7">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <MessageCircle size={17} color="rgba(245,240,232,0.2)" />
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: '2.2rem', fontWeight: 300, lineHeight: 1, marginBottom: 10, color: '#f5f0e8' }}><em>Live</em> Q&amp;A</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,240,232,0.22)', maxWidth: '28ch' }}>Your crowd asks. You see it in real time. No refresh, no delay, no friction.</div>
            </div>
          </div>

          {/* Voice Commander cell — your differentiator */}
          <div style={{ background: '#060606', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200, borderTop: '1px solid rgba(245,240,232,0.05)' }} className="lg:col-span-5 lg:border-t-0 lg:border-l">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212,255,78,0.06)', border: '1px solid rgba(212,255,78,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={17} color="#d4ff4e" />
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: '2.2rem', fontWeight: 300, lineHeight: 1, marginBottom: 10, color: '#f5f0e8' }}><em>Voice</em> control</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,240,232,0.22)', maxWidth: '24ch' }}>Say a name, question gets assigned. Say "done", queue advances. Nobody else has this.</div>
            </div>
          </div>

          {/* Small cells */}
          {features.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: '#060606', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200, borderTop: '1px solid rgba(245,240,232,0.05)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              <div>
                <div style={{ fontFamily: cond, fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f5f0e8', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.18)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PANELIST CALLOUT ── */}
      <section style={{ position: 'relative', zIndex: 1, background: '#0e0e0e', borderTop: '1px solid rgba(245,240,232,0.05)', borderBottom: '1px solid rgba(245,240,232,0.05)', padding: '72px 24px' }}>
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div style={{ marginBottom: 40 }} className="lg:mb-0">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', border: '1px solid rgba(212,255,78,0.18)', borderRadius: 100, marginBottom: 24 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#d4ff4e' }}>Panelist Mode</span>
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(2.4rem, 10vw, 4rem)', fontWeight: 300, lineHeight: 1.02, marginBottom: 20, color: '#f5f0e8' }}>
              Questions go<br />to the <em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>right person.</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(245,240,232,0.25)', maxWidth: '42ch' }}>
              The moderator assigns each incoming question to a named panelist. A shared display shows it live. No passing notes, no mic confusion — just a clean handoff every time.
            </p>
          </div>

          {/* Panelist mock */}
          <div style={{ background: '#060606', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(245,240,232,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', display: 'block' }} />
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#3ecf8e' }}>Panelist Display</span>
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>Impact Academy</span>
            </div>
            <div style={{ padding: '40px 28px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 100, marginBottom: 24 }}>
                <Users size={10} color="rgba(245,240,232,0.22)" />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.22)' }}>Pastor Emmanuel</span>
              </div>
              <p style={{ fontFamily: serif, fontSize: 'clamp(1.3rem, 5vw, 1.7rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.3, color: '#f5f0e8', marginBottom: 16 }}>
                "How do we balance grace with accountability in leadership?"
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>— Tunde Eze</p>
            </div>
            <div className="p-queue-inner" style={{ padding: '14px 20px', borderTop: '1px solid rgba(245,240,232,0.05)', display: 'flex', gap: 8, overflowX: 'auto' }}>
              {['→ Mrs. Linde · next', '→ Dr. Okon · queued', '→ Bro. James'].map(label => (
                <span key={label} style={{ flexShrink: 0, padding: '6px 12px', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 8, fontSize: 9, fontWeight: 600, color: 'rgba(245,240,232,0.18)', whiteSpace: 'nowrap' }}>{label}</span>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '72px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.18)', whiteSpace: 'nowrap' }}>How it works</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(245,240,232,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 4, overflow: 'hidden' }}
          className="lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} style={{ background: '#060606', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 16, borderLeft: i > 0 ? '1px solid rgba(245,240,232,0.05)' : 'none' }}>
              <div style={{ fontFamily: serif, fontSize: '3rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(245,240,232,0.06)', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: cond, fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f5f0e8' }}>{s.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,240,232,0.22)' }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 100px', textAlign: 'center', borderTop: '1px solid rgba(245,240,232,0.05)' }}>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(3rem, 13vw, 7rem)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#f5f0e8', marginBottom: 40 }}>
          Start your<br /><em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>session now.</em>
        </h2>
        <Link href="/create" className="cta-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 36px', background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 12, fontFamily: cond, fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s' }}>
          Create a Session <ArrowRight size={14} />
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(245,240,232,0.04)', padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>ASKTC · 2026</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>@AskTheChurch · Built in Nigeria by Black Sheep Co.</span>
      </footer>

    </main>
  )
}