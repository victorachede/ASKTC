'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DesktopHeader() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const controlNavbar = () => {
      // Current scroll position
      const currentScrollY = window.scrollY

      // 1. Always show at the very top
      if (currentScrollY < 10) {
        setIsVisible(true)
      } 
      // 2. Hide on scroll down, show on scroll up
      else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  return (
    <header 
      className={`
        hidden md:block fixed top-0 left-0 right-0 z-[60] 
        bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/[0.05]
        transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
        
        {/* 1. REFINED LOGO */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1D1D1F] rounded-lg flex items-center justify-center text-white font-black text-[10px] tracking-tighter italic">
            A
          </div>
          <span className="text-lg font-bold text-[#1D1D1F] tracking-tighter uppercase italic">
            ASKTC
          </span>
        </Link>

        {/* 2. SYSTEM NAVIGATION */}
        <nav className="flex items-center gap-6">
          {[
            { name: 'Live Feed', path: '/' },
            { name: 'Archives', path: '/archives' },
            { name: 'Leader Portal', path: '/leader-login' }
          ].map((item) => {
            const isActive = pathname === item.path
            
            return (
              <Link 
                key={item.path}
                href={item.path} 
                className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 relative py-1 px-3 rounded-full ${
                  isActive 
                    ? 'text-[#1D1D1F] bg-black/[0.04]' 
                    : 'text-[#8E8E93] hover:text-[#1D1D1F]'
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0071E3] rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}