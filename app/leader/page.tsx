'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, MessageSquare, ArrowUpRight, Search, Trash2, ChevronLeft, Archive, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const serif = "'Cormorant Garamond', serif"
const cond = "'Barlow Condensed', sans-serif"
const sans = "'Barlow', sans-serif"
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap'

const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(date).toLocaleDateString()
}

export default function LeaderDashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*').order('created_at', { ascending: false })
      if (roomsError) throw roomsError
      const { data: qData } = await supabase.from('questions').select('room_id')
      setRooms((roomsData || []).map(r => ({ ...r, qCount: (qData || []).filter(q => q.room_id === r.id).length })))
    } catch (e: any) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchRooms)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const deleteRoom = async (id: string) => {
    if (!confirm('This will permanently delete this session and all its questions.')) return
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { toast.success('Session terminated'); fetchRooms() }
  }

  const filtered = rooms.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const totalQuestions = rooms.reduce((acc, r) => acc + (r.qCount || 0), 0)

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(245,240,232,0.08) !important; }
        .exit-link:hover { color: #f5f0e8 !important; }
        .backlog-link:hover { color: #d4ff4e !important; }
        .search-wrap:focus-within .search-icon { color: #d4ff4e !important; }
        .search-input:focus { border-color: rgba(212,255,78,0.25) !important; background: rgba(212,255,78,0.02) !important; }
        .room-card:hover { border-color: rgba(245,240,232,0.1) !important; background: #0f0f0f !important; }
        .open-btn:hover { background: #d4ff4e !important; color: #060606 !important; border-color: #d4ff4e !important; }
        .del-btn:hover { color: rgba(255,80,80,0.8) !important; border-color: rgba(255,80,80,0.15) !important; background: rgba(255,80,80,0.04) !important; }
        .new-btn:hover { background: #e8ff6a !important; }
        .new-btn:active { transform: scale(0.97); }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(245,240,232,0.04)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" className="exit-link" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(245,240,232,0.22)', textDecoration: 'none', transition: 'color 0.2s' }}>
            <ChevronLeft size={14} />
            <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Exit</span>
          </Link>
          <div style={{ width: 1, height: 16, background: 'rgba(245,240,232,0.08)' }} />
          <span style={{ fontFamily: cond, fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f5f0e8' }}>Command Center</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/leader/backlog" className="backlog-link" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(245,240,232,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}>
            <Archive size={13} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Backlog</span>
          </Link>
          <Link href="/create" className="new-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#d4ff4e', color: '#060606', borderRadius: 10, fontFamily: cond, fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s, transform 0.1s' }}>
            <Plus size={13} strokeWidth={3} /> New Session
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '52px 24px 80px' }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 1, height: 20, background: 'rgba(212,255,78,0.4)' }} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Leader Dashboard</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(2.4rem, 8vw, 3.5rem)', fontWeight: 300, lineHeight: 0.92, color: '#f5f0e8' }}>
            Your <em style={{ fontStyle: 'italic', color: '#d4ff4e' }}>sessions.</em>
          </h1>
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, marginBottom: 32, background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          {[
            { label: 'Total Sessions', value: rooms.length },
            { label: 'Total Questions', value: totalQuestions },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#060606', padding: '24px 28px' }}>
              <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)', marginBottom: 10 }}>{label}</p>
              <div style={{ fontFamily: serif, fontSize: '2.8rem', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
          <div style={{ background: '#060606', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pip" style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecf8e', display: 'block' }} />
            <div>
              <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)', marginBottom: 4 }}>System</p>
              <p style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3ecf8e' }}>Online</p>
            </div>
          </div>
        </motion.div>

        {/* SEARCH */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
          className="search-wrap" style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={15} className="search-icon" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)', transition: 'color 0.2s', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            style={{ width: '100%', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 12, padding: '14px 18px 14px 44px', outline: 'none', fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#f5f0e8', transition: 'border-color 0.25s, background 0.25s' }}
          />
        </motion.div>

        {/* ROOMS */}
        {loading ? (
          <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={22} color="rgba(245,240,232,0.15)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.12)' }}>Synchronizing</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.06)', borderRadius: 16 }}>
            <p style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>
              {search ? 'No sessions match your search' : 'No sessions yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AnimatePresence>
              {filtered.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                  className="room-card"
                  style={{ background: '#0c0c0c', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.2s, background 0.2s' }}
                >
                  {/* INFO */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: serif, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(245,240,232,0.3)' }}>/{room.slug}</span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(245,240,232,0.1)', display: 'block' }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: sans, fontSize: 11, color: 'rgba(245,240,232,0.25)', fontWeight: 500 }}>
                        <MessageSquare size={11} />{room.qCount} question{room.qCount !== 1 ? 's' : ''}
                      </span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(245,240,232,0.1)', display: 'block' }} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: 'rgba(245,240,232,0.2)', fontWeight: 500 }}>{timeAgo(room.created_at)}</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link href={`/leader/room/${room.slug}`} className="open-btn"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'transparent', border: '1px solid rgba(245,240,232,0.1)', color: '#f5f0e8', borderRadius: 10, fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s, color 0.2s, border-color 0.2s', whiteSpace: 'nowrap' }}>
                      Open Stage <ArrowUpRight size={12} />
                    </Link>
                    <button onClick={() => deleteRoom(room.id)} className="del-btn"
                      style={{ padding: '10px 12px', background: 'transparent', border: '1px solid rgba(245,240,232,0.07)', color: 'rgba(245,240,232,0.2)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s, border-color 0.2s, background 0.2s' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}