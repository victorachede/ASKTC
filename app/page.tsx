'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Copy, ShieldCheck, Zap, ChevronRight, Users, Lock, Globe, Sparkles, ArrowUpRight, Play } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LandingPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [sessionReady, setSessionReady] = useState<string | null>(null)

  const handleJoin = () => {
    if (!roomCode.trim()) return
    router.push(`/room/${roomCode.toLowerCase()}`)
  }

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setSessionReady(newRoomCode)
  }

  const handleEnterRoom = () => {
    if (sessionReady) {
      router.push(`/leader/room/${sessionReady.toLowerCase()}`)
    }
  }

  const handleCopy = () => {
    if (sessionReady) {
      navigator.clipboard.writeText(`${window.location.origin}/room/${sessionReady.toLowerCase()}`)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-black antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
      
      {/* Navigation */}
      <nav className="border-b border-gray-200/50 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold">asktc</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={handleCreateRoom}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
            >
              Create Room
            </button>
            <button className="h-9 px-4 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-all font-medium">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full border border-black/10">
            <Sparkles size={12} className="text-black" />
            <span className="text-xs font-semibold">In Beta</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-semibold leading-[0.95]" style={{ letterSpacing: '-0.05em' }}>
            Questions.<br />
            <span className="text-gray-400">Answered.</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The modern Q&A platform for presentations, meetings, and events. Real-time, secure, and beautifully simple.
          </p>

          <div className="pt-2">
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="flex-1 h-14 px-5 border border-gray-300 rounded-xl text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                />
                <button 
                  onClick={handleJoin}
                  disabled={!roomCode}
                  className="h-14 px-8 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:auto-rows-[200px]">
          
          {/* Large Feature - Security */}
          <div className="md:col-span-4 md:row-span-2 bg-white border border-gray-200 rounded-3xl p-8 md:p-10 flex flex-col justify-between overflow-hidden relative group min-h-[400px] md:min-h-0 hover:border-gray-300 transition-all">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={24} className="text-black" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-3" style={{ letterSpacing: '-0.02em' }}>End-to-end encrypted</h3>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-lg">
                Your conversations are protected with military-grade encryption. What happens in your room, stays in your room.
              </p>
            </div>
            <div className="relative z-10 flex gap-2 mt-6 md:mt-0">
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">256-bit AES</div>
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">Zero-knowledge</div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Users size={20} />
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <p className="text-gray-600 text-sm">Active users worldwide</p>
            </div>
          </div>

          {/* Real-time */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-black rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-semibold">Live</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Real-time sync</h3>
              <p className="text-gray-600 text-sm">Sub-100ms latency globally</p>
            </div>
          </div>

          {/* Collaboration */}
          <div className="md:col-span-3 md:row-span-2 bg-white border border-gray-200 rounded-3xl p-8 md:p-10 flex flex-col justify-between hover:border-gray-300 transition-all min-h-[400px] md:min-h-0">
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle size={24} className="text-black" />
              </div>
              <h3 className="text-2xl md:text-2xl font-semibold mb-3" style={{ letterSpacing: '-0.02em' }}>Built for collaboration</h3>
              <p className="text-gray-600 text-base leading-relaxed mb-4">
                Questions flow seamlessly from your audience to your screen in real-time. Moderation tools keep conversations focused and productive.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">Upvoting</div>
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">Moderation</div>
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">Analytics</div>
              </div>
            </div>
          </div>

          {/* Global */}
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Available in</p>
              <div className="text-2xl font-bold">180+</div>
              <p className="text-xs text-gray-500">countries</p>
            </div>
          </div>

          {/* No Download */}
          <div className="md:col-span-2 bg-black rounded-3xl p-8 flex flex-col justify-between text-white hover:bg-gray-900 transition-all">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ChevronRight size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Zero friction</h3>
              <p className="text-white/60 text-sm">No apps. No downloads. Just works.</p>
            </div>
          </div>

          {/* Privacy */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 flex flex-col justify-between hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Anonymous by default</h3>
              <p className="text-gray-600 text-sm">No sign-up required to participate</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4" style={{ letterSpacing: '-0.05em' }}>Ready to get started?</h2>
            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
              Create your first room in seconds. No credit card required.
            </p>
            <button 
              onClick={handleCreateRoom}
              className="h-14 px-10 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl"
            >
              Create Room Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold">asktc</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
              <a href="#" className="hover:text-black transition-colors">Security</a>
              <a href="#" className="hover:text-black transition-colors">Docs</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 asktc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {sessionReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSessionReady(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-green-700">Room Created</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Your room code</p>
                <p className="text-5xl font-bold tracking-tight select-all">{sessionReady}</p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleEnterRoom} 
                  className="w-full h-12 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all"
                >
                  Enter Room
                </button>
                <button 
                  onClick={handleCopy} 
                  className="w-full h-12 border-2 border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Copy Invite Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}