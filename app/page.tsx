'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle, 
  Copy, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Users, 
  Lock, 
  Globe, 
  Sparkles, 
  Trophy 
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function LandingPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [sessionReady, setSessionReady] = useState<string | null>(null)
  const [showSignOptions, setShowSignOptions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSignOptions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleJoin = () => {
    if (!roomCode.trim()) return
    router.push(`/room/${roomCode.toLowerCase()}`)
  }

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setSessionReady(newRoomCode)
  }

  const handleEnterRoom = () => {
    if (sessionReady) router.push(`/leader/room/${sessionReady.toLowerCase()}`)
  }

  const handleCopy = () => {
    if (sessionReady) {
      navigator.clipboard.writeText(`${window.location.origin}/room/${sessionReady.toLowerCase()}`)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleLoginRedirect = () => {
    setShowSignOptions(false)
    router.push('/leader-login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-black antialiased overflow-x-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navigation */}
      <nav className="border-b border-gray-200/50 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-black">asktc</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6 relative">
            <button 
              onClick={handleCreateRoom}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium hidden xs:block"
            >
              Create Room
            </button>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowSignOptions(!showSignOptions)}
                className="h-9 px-4 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-all font-medium whitespace-nowrap"
              >
                Sign In
              </button>

              {showSignOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Portal</p>
                  </div>
                  <button onClick={handleLoginRedirect} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-black group-hover:text-white transition-all">
                      <Trophy size={14} />
                    </div>
                    <p className="font-bold">Leader Portal</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-12">
        <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full border border-black/10">
            <Sparkles size={12} className="text-black" />
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">In Beta</span>
          </div>
          
          <h1 className="text-[13vw] sm:text-7xl md:text-8xl font-bold leading-[0.95] tracking-tighter">
            Questions.<br />
            <span className="text-gray-400">Answered.</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium px-2">
            The modern Q&A platform for presentations and events. Real-time, secure, and beautifully simple.
          </p>

          <div className="pt-2 px-2">
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full h-14 px-5 border border-gray-300 rounded-xl text-base outline-none focus:border-black transition-all font-bold"
              />
              <button onClick={handleJoin} disabled={!roomCode} className="h-14 px-8 bg-black text-white text-base font-bold rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50">
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Full Bento Grid Restored */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:auto-rows-[200px]">
          
          {/* Encryption Card */}
          <div className="md:col-span-4 md:row-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative group overflow-hidden hover:shadow-xl transition-all">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/20">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-black">End-to-end encrypted</h3>
              <p className="text-gray-500 text-lg font-medium max-w-md">Military-grade protection. What happens in your room, stays in your room.</p>
            </div>
          </div>

          {/* User Count Card */}
          <div className="md:col-span-2 bg-black rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col justify-between min-h-[200px] hover:scale-[1.02] transition-transform">
            <Users size={24} />
            <div>
              <div className="text-5xl md:text-6xl font-black mb-2 tracking-tighter italic">10K+</div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Active users</p>
            </div>
          </div>

          {/* Sync Card */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-gray-300 transition-all">
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-black rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
            <Zap size={20} className="text-black" />
            <div>
              <h3 className="text-2xl font-bold mb-1 tracking-tight text-black">Real-time sync</h3>
              <p className="text-gray-500 text-sm font-medium">Sub-100ms latency globally</p>
            </div>
          </div>

          {/* Collaboration Quote Card */}
          <div className="md:col-span-3 md:row-span-2 bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 flex flex-col justify-between hover:bg-white transition-all">
            <div>
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 border border-gray-100">
                <MessageCircle size={28} className="text-black" />
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight text-black">Built for collaboration</h3>
              <p className="text-gray-500 text-lg leading-relaxed italic font-medium">"Questions flow seamlessly from your audience to your screen in real-time."</p>
            </div>
          </div>

          {/* Globe Card */}
          <div className="md:col-span-1 bg-black rounded-[2rem] p-6 flex flex-col justify-between text-white">
            <Globe size={20} className="text-gray-400" />
            <div className="text-3xl font-black tracking-tight italic">180+</div>
          </div>

          {/* Zero Friction Card */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-black transition-all">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white group-hover:translate-x-2 transition-transform">
              <ChevronRight size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1 tracking-tight text-black">Zero friction</h3>
              <p className="text-gray-500 text-sm font-medium">No apps. Just works.</p>
            </div>
          </div>

          {/* Anonymous Card */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-gray-50 transition-all">
            <Lock size={20} className="text-black" />
            <div>
              <h3 className="text-2xl font-bold mb-1 tracking-tight text-black">Anonymous</h3>
              <p className="text-gray-500 text-sm font-medium">No sign-up required to participate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leader CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="bg-black rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 lg:p-24 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <Trophy size={12} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Host a session</span>
              </div>
              
              <h2 className="text-[10vw] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[1.1]">
                Ready to lead the <br className="hidden sm:block" /> 
                <span className="text-gray-500 italic">conversation?</span>
              </h2>
              
              <p className="text-gray-400 text-sm md:text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0">
                Create a secure space for your audience to ask questions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
              <button onClick={handleCreateRoom} className="w-full sm:w-auto h-16 px-8 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 group whitespace-nowrap text-base">
                Create Free Room
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => router.push('/leader/login')} className="w-full sm:w-auto h-16 px-8 bg-black text-white border border-white/20 font-black rounded-2xl flex items-center justify-center whitespace-nowrap text-base">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 flex flex-col items-center gap-6">
          <p className="text-xs text-gray-400 font-medium italic text-center">© 2026 asktc platform. Modern Q&A for the church.</p>
      </footer>

      {/* Modal */}
      {sessionReady && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSessionReady(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 md:p-12 text-center animate-in zoom-in-95">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your room code</p>
            <p className="text-4xl md:text-5xl font-bold tracking-tighter italic mb-8">{sessionReady}</p>
            <div className="space-y-3">
              <button onClick={handleEnterRoom} className="w-full h-14 bg-black text-white text-sm font-bold rounded-xl">Enter Room</button>
              <button onClick={handleCopy} className="w-full h-14 border border-gray-100 text-sm font-bold rounded-xl flex items-center justify-center gap-2"><Copy size={16} /> Copy Link</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}