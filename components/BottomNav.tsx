'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Trophy } from 'lucide-react' 

// 1. ADD THIS INTERFACE TO STOP THE ERROR
interface BottomNavProps {
  userId?: string; 
}

export const triggerMobileAsk = () => {
  if (typeof window !== 'undefined') {
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
        
      </div>
    </nav>
  )
}

export { BottomNav };