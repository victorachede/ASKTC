'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DesktopHeader() {
  const pathname = usePathname()

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-5xl mx-auto px-8 h-20 flex items-center justify-between">
        
        {/* Mature Logo Block */}
        <Link href="/" className="group flex items-center gap-3">
          <div className=" bg-slate-900  flex items-center justify-center text-white font-black italic text-base transition-colors">
            
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">
            ASKTC
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-10">
          {[
            { name: 'Live Feed', path: '/' },
            { name: 'Archives', path: '/archives' },
            { name: 'Leader Portal', path: '/leader-login' }
          ].map((item) => (
            <Link 
              key={item.path}
              href={item.path} 
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${
                pathname === item.path ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.name}
              {pathname === item.path && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 animate-in fade-in slide-in-from-left-2" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}