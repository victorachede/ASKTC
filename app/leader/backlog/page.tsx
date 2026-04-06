'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, ChevronLeft, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const serif = "'Cormorant Garamond', serif"
const cond = "'Barlow Condensed', sans-serif"
const sans = "'Barlow', sans-serif"
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap'

export default function BacklogPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderName, setLeaderName] = useState('')

  const fetchBacklog = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*, rooms(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchBacklog() }, [])

  const claimQuestion = async (qId: string) => {
    if (!leaderName.trim()) return toast.error('Enter your name first')
    const { error } = await supabase
      .from('questions')
      .update({ picked_by: leaderName, status: 'answered' })
      .eq('id', qId)
    if (error) toast.error('Claim failed')
    else { toast.success('Question claimed'); fetchBacklog() }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(245,240,232,0.08) !important; }
        .back-link:hover { color: #f5f0e8 !important; }
        .name-input:focus { border-color: rgba(212,255,78,0.35) !important; background: rgba(212,255,78,0.02) !important; }
        .q-card:hover { border-color: rgba(245,240,232,0.1) !important; }
        .claim-btn:hover { background: #e8ff6a !important; }
        .claim-btn:active { transform: scale(0.97); }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(245,240,232,0.04)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)' }}>
        <Link href="/leader" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(245,240,232,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}>
          <ChevronLeft size={14} />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Command</span>
        </Link>
        <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>
          Backlog — {questions.length} signal{questions.length !== 1 ? 's' : ''}
        </span>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 1, height: 20, background: 'rgba(212,255,78,0.4)' }} />
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Unanswered Signals</span>
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.4rem, 8vw, 3.8rem)', fontWeight: 300, lineHeight: 0.92, color: '#f5f0e8' }}>
              The <em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>Backlog.</em>
            </h1>
          </div>

          {/* CLAIMER INPUT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>Claiming as</span>
            <input
              type="text"
              placeholder="Your name"
              value={leaderName}
              onChange={e => setLeaderName(e.target.value)}
              className="name-input"
              style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 10, padding: '10px 16px', outline: 'none', fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#f5f0e8', width: 200, transition: 'border-color 0.25s, background 0.25s' }}
            />
          </div>
        </motion.div>

        {/* LIST */}
        {loading ? (
          <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="rgba(245,240,232,0.2)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '80px 24px', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.06)', borderRadius: 16 }}
          >
            <p style={{ fontFamily: cond, fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>
              No signals left behind
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AnimatePresence>
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                  className="q-card"
                  style={{ background: '#0c0c0c', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 16, padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, transition: 'border-color 0.2s' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* ROOM + ASKER */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 6, padding: '3px 10px' }}>
                        {q.rooms?.name || 'Unknown Room'}
                      </span>
                      {q.guest_name && (
                        <span style={{ fontFamily: sans, fontSize: 10, color: 'rgba(245,240,232,0.2)', fontWeight: 500 }}>
                          — {q.guest_name}
                        </span>
                      )}
                    </div>

                    {/* QUESTION */}
                    <p style={{ fontFamily: serif, fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.35, color: '#f5f0e8' }}>
                      "{q.content}"
                    </p>

                    {/* CLAIMED */}
                    {q.picked_by && (
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={11} color="#3ecf8e" />
                        <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3ecf8e' }}>
                          Claimed by {q.picked_by}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CLAIM BTN */}
                  {!q.picked_by && (
                    <button
                      onClick={() => claimQuestion(q.id)}
                      className="claim-btn"
                      style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 10, fontFamily: cond, fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s', whiteSpace: 'nowrap' }}
                    >
                      Claim <ArrowRight size={11} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}