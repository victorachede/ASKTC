'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Loader2, 
  ShieldCheck,
  Zap,
  MessageCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateRoom() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a room name")
      return
    }

    setLoading(true)

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')

    const { error } = await supabase
      .from('rooms')
      .insert([{ name, slug }])

    if (error) {
      if (error.code === '23505') {
        toast.error("That name is already taken")
      } else {
        toast.error("Something went wrong. Try again.")
      }
      setLoading(false)
      return
    }

    toast.success("Room created successfully!")
    router.push(`/leader/room/${slug}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      
      {/* HEADER NAV */}
      <nav className="w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ letterSpacing: '-0.02em' }}>asktc</span>
          </Link>
          <Link href="/leader" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-semibold mb-4" style={{ letterSpacing: '-0.05em' }}>
            Create a new room
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Set up a dedicated space for your audience to ask questions. Your room will be live instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900 block">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Sunday Morning Service"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate(e)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3.5 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all outline-none"
                  />
                  <p className="text-sm text-gray-500">
                    A clear, descriptive name helps participants identify your session
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button 
                    onClick={handleCreate}
                    disabled={loading || !name.trim()}
                    className="w-full bg-black hover:bg-gray-900 text-white h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating room...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Room</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">What's included</h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Real-time Updates</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Questions appear instantly as your audience submits them</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Full Moderation</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Hide, answer, or manage questions before they go live</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Anonymous Questions</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Participants can ask without creating an account</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6">
              <p className="text-xs text-gray-600 leading-relaxed">
                Your room will be accessible via a unique shareable link. You'll be redirected to the control panel immediately after creation.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}