'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Trophy } from 'lucide-react'

interface BottomNavProps {
  userId?: string
}

export const triggerMobileAsk = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-ask-modal'))
  }
}

function BottomNav({ userId }: BottomNavProps) {
  const pathname = usePathname()
  if (pathname === '/leader-login') return null

  const encre = '#1a1410'
  const papier = '#f7f4ef'
  const or = '#c8a96e'
  const muted = '#8a8279'

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(247,244,239,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(26,20,16,0.08)', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 40 }}
      className="md:hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&display=swap');`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 40px 6px', maxWidth: 420, margin: '0 auto' }}>

        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: pathname === '/' ? encre : muted, transition: 'color 0.2s' }}>
          <Home size={20} strokeWidth={pathname === '/' ? 2 : 1.5} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Accueil</span>
        </Link>

        <button onClick={triggerMobileAsk} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, background: encre, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
            <Plus size={22} color={papier} strokeWidth={2} />
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: encre }}>Poser</span>
        </button>

        <Link href="/leader-login" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: pathname === '/leader-login' ? encre : muted, transition: 'color 0.2s' }}>
          <Trophy size={20} strokeWidth={pathname === '/leader-login' ? 2 : 1.5} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Leader</span>
        </Link>
      </div>
    </nav>
  )
}

export { BottomNav }
