'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
<<<<<<< HEAD
import { Home, Plus, Trophy } from 'lucide-react'

interface BottomNavProps {
  userId?: string
=======
import { Home, Plus, Trophy } from 'lucide-react' 

// 1. ADD THIS INTERFACE TO STOP THE ERROR
interface BottomNavProps {
  userId?: string; 
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
}

export const triggerMobileAsk = () => {
  if (typeof window !== 'undefined') {
<<<<<<< HEAD
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
=======
    window.dispatchEvent(new Event('open-ask-modal'));
  }
};

// 2. UPDATE THE FUNCTION TO ACCEPT THE PROPS
function BottomNav({ userId }: BottomNavProps) {
  const pathname = usePathname()

  // HIDE NAV ON LOGIN ROUTE
  if (pathname === '/leader-login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-6 pt-3 px-10 md:hidden z-40">
      <div className="flex justify-between items-center max-w-md mx-auto">
        
        <Link href="/" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/' ? 'text-slate-900' : 'text-slate-400'}`}>
          <Home size={20} strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Feed</span>
        </Link>

        {/* The Action Button */}
        <button 
          onClick={triggerMobileAsk}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="bg-amber-500 text-slate-900 p-2 rounded-xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all">
            <Plus size={24} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Ask</span>
        </button>

        {/* PRO TIP: You can eventually use {userId} here to show a profile pic! */}
        <Link href="/leader-login" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/leader-login' ? 'text-slate-900' : 'text-slate-400'}`}>
          <Trophy size={20} strokeWidth={pathname === '/leader-login' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Leader</span>
        </Link>
        
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
      </div>
    </nav>
  )
}

<<<<<<< HEAD
export { BottomNav }
=======
export { BottomNav };
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
