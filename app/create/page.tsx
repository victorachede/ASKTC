'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronRight, Hash, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateRoom() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const [slug, setSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNameChange = (val: string) => {
    setRoomName(val)
    // Generates the slug automatically from name
    const autoSlug = val.toLowerCase().trim().replace(/\s+/g, '-')
    setSlug(autoSlug.replace(/[^a-z0-9-]/g, ''))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    // Fallback to random 6-char code if slug is empty
    const finalSlug = slug.trim() || Math.random().toString(36).substring(2, 8)
    
    setIsLoading(true)
    const { error } = await supabase
      .from('rooms')
      .insert([{ name: roomName, slug: finalSlug }])

    if (error) {
      toast.error(error.code === '23505' ? 'Code already taken' : 'Error')
      setIsLoading(false)
    } else {
      toast.success("Stage Ready")
      router.push(`/leader/room/${finalSlug}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white/20">
      {/* MINIMAL NAV */}
      <nav className="h-12 border-b border-white/5 flex items-center px-4 bg-black/50 backdrop-blur-xl">
        <Link href="/leader" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
        </Link>
      </nav>

      <div className="max-w-xl mx-auto pt-32 px-6">
        <header className="mb-12">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-2">Internal Setup</span>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Launch Session</h1>
        </header>

        <form onSubmit={handleCreate} className="space-y-10">
          {/* NAME INPUT */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Display Name</label>
            <input 
              autoFocus
              type="text"
              placeholder="e.g. Q3 Town Hall"
              value={roomName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-800 py-2 outline-none text-xl focus:border-white transition-colors placeholder:text-zinc-900 font-medium"
            />
          </div>

          {/* CODE INPUT */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Access Code</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="event-code"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full bg-zinc-900/30 border border-white/5 rounded-lg px-4 py-4 outline-none focus:border-emerald-500/50 transition-all font-mono text-sm uppercase tracking-widest text-emerald-500"
              />
            </div>
            
            {/* FOCUS ON JUST THE CODE */}
            <div className="flex items-center gap-2 px-1">
              <Hash size={12} className="text-zinc-700" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                Audience Code: <span className="text-zinc-100 font-mono">{slug || '...'}</span>
              </p>
            </div>
          </div>

          <button 
            disabled={!roomName || isLoading}
            className="group w-full bg-white text-black h-14 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-10 disabled:grayscale shadow-xl shadow-white/5"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Initialize Stage</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}