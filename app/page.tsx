'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageCircle, 
  Zap, 
  Users, 
  Globe, 
  Sparkles, 
  Trophy,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * STATUS TICKER Component
 */
const StatusTicker = () => {
  const [index, setIndex] = useState(0)
  const items = [
    { icon: <Sparkles size={10} />, text: "The Modern Standard" },
    { icon: <Zap size={10} />, text: "Real-time Ready" },
    { icon: <Users size={10} />, text: "Built for Humans" }
  ]

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % items.length), 3000)
    return () => clearInterval(timer)
  }, [items.length])

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-10 h-7 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="flex items-center gap-2"
        >
          <span className="text-gray-500">{items[index].icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 whitespace-nowrap">
            {items[index].text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [topicIndex, setTopicIndex] = useState(0)
  const topics = ["Audience", "Townhall", "Keynote", "Classroom"]

  useEffect(() => {
    const timer = setInterval(() => setTopicIndex((prev) => (prev + 1) % topics.length), 2500)
    return () => clearInterval(timer)
  }, [topics.length])

  const handleJoin = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.toLowerCase()}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white antialiased font-sans selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* NAVIGATION - 360px CRASH FIX */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-7 h-7 bg-white rounded-sm flex items-center justify-center">
              <MessageCircle size={14} className="text-black fill-black" />
            </div>
            <span className="text-sm font-black uppercase tracking-tighter italic">asktc</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
            <Link 
              href="/create" 
              className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] md:tracking-[0.3em] transition-colors"
            >
              Start Session
            </Link>
            <button 
              onClick={() => router.push('/leader-login')}
              className="px-4 md:px-5 py-2 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-gray-200 transition-all active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-24 md:pt-32 pb-24 text-center">
        <StatusTicker />
        
        <h1 className="text-5xl md:text-9xl font-black tracking-tighter leading-[0.9] md:leading-[0.8] uppercase mb-10">
          Engage your <br />
          <div className="h-[1em] overflow-hidden inline-flex flex-col relative top-[0.05em]">
            <AnimatePresence mode="wait">
              <motion.span
                key={topicIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className="text-gray-600 italic font-medium lowercase tracking-tight"
              >
                {topics[topicIndex]}.
              </motion.span>
            </AnimatePresence>
          </div>
        </h1>

        <p className="text-gray-500 text-sm md:text-lg font-medium max-w-xl mx-auto mb-16 leading-relaxed">
          The simplest way to run Q&A for your events. <br className="hidden md:block" /> 
          No friction, no apps, just conversation.
        </p>

        {/* JOIN INPUT BOX - FIXED FOR 360px */}
        <div className="max-w-sm mx-auto flex items-center p-1 bg-white/5 border border-white/10 rounded-xl focus-within:border-white/30 transition-all shadow-2xl shadow-black overflow-hidden">
          <input 
            type="text" 
            placeholder="EVENT CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="flex-1 min-w-0 bg-transparent px-3 md:px-5 py-4 outline-none font-bold text-xs md:text-sm tracking-widest md:tracking-[0.4em] uppercase placeholder:text-gray-800"
          />
          <button 
            onClick={handleJoin}
            className="shrink-0 px-5 md:px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
          >
            Join
          </button>
        </div>
      </section>

      {/* BENTO GRID FEATURES - RESTORED ORIGINAL LOGIC */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-white/10 border border-white/10 rounded-sm overflow-hidden">
          
          <div className="md:col-span-8 p-12 bg-black flex flex-col justify-between min-h-[440px]">
            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center mb-12 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
               <MessageCircle size={18} className="text-black fill-black" />
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter uppercase mb-4 italic text-white">Live Q&A</h3>
              <p className="text-gray-500 text-base font-medium max-w-sm leading-relaxed">
                Let your crowd ask questions in seconds. Simple for you, seamless for them.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 p-12 bg-black flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
            <Users size={20} className="text-gray-400 mb-12" />
            <div>
              <div className="text-6xl font-black tracking-tighter mb-2 leading-none italic text-white">10M+</div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Questions Sent</p>
            </div>
          </div>

          <div className="md:col-span-4 p-12 bg-black flex flex-col justify-between border-t border-white/10 min-h-[220px]">
             <Zap size={20} className="text-white mb-8" />
             <div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-white">Upvoting</h3>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Spot the top questions</p>
             </div>
          </div>

          <div className="md:col-span-4 p-12 bg-black flex flex-col justify-between border-t md:border-l border-white/10">
             <Globe size={20} className="text-gray-400 mb-8" />
             <div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-white">Instant Sync</h3>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Zero lag interaction</p>
             </div>
          </div>

          <div className="md:col-span-4 p-12 bg-black flex flex-col justify-between border-t md:border-l border-white/10">
             <Trophy size={20} className="text-gray-400 mb-8" />
             <div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 italic text-gray-300">Simple UI</h3>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">No instructions needed</p>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-24 text-center border-t border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-800 italic">
          asktc • simple q&a • 2026
        </p>




        
      </footer>
    </main>
  )
}