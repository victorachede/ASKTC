'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  MessageSquare, 
  ArrowUpRight, 
  Search,
  Layout,
  Trash2,
  ChevronLeft,
  Archive,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LeaderDashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRooms = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch Rooms ONLY (Flat select)
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (roomsError) throw roomsError

      // 2. Fetch Questions separately (to count manually)
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('room_id')

      if (qError) throw qError

      // 3. Map the counts locally to bypass the "relationship" error
      const normalizedRooms = (roomsData || []).map(room => ({
        ...room,
        qCount: (qData || []).filter(q => q.room_id === room.id).length
      }))

      setRooms(normalizedRooms)
    } catch (error: any) {
      console.error('Fetch error:', error.message)
      toast.error("Schema sync failed: check console")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()

    // Real-time listener: refresh when questions are added anywhere
    const channel = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' }, 
        () => fetchRooms()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const deleteRoom = async (id: string) => {
    if (!confirm("This will permanently delete this session and all its questions.")) return;
    
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Session terminated");
      fetchRooms();
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredRooms = rooms.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalQuestions = rooms.reduce((acc, r) => acc + (r.qCount || 0), 0)

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-emerald-500/30">
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Exit</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <Layout size={16} className="text-emerald-500" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Command Center</span>
          </div>
        </div>
        
        <Link href="/create" className="flex items-center gap-3 bg-white text-black px-5 py-2 rounded-xl hover:bg-zinc-200 transition-all active:scale-95">
          <Plus size={16} strokeWidth={3} />
          <span className="text-[11px] font-black uppercase tracking-widest">New Session</span>
        </Link>
        <Link href="/leader/backlog" className="flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all">
  <Archive size={16} />
  <span className="text-[10px] font-black uppercase tracking-widest">Unanswered Backlog</span>
</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Active Sessions</p>
            <h2 className="text-4xl font-black text-white italic tracking-tighter">{rooms.length}</h2>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Total Queries</p>
            <h2 className="text-4xl font-black text-white italic tracking-tighter">{totalQuestions}</h2>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">System Gate</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
              </div>
            </div>
            <div className="opacity-10">
                <MessageSquare size={40} />
            </div>
          </div>
        </header>

        <div className="relative mb-10 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME OR SLUG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-5 text-sm font-bold tracking-widest outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all text-white placeholder:text-zinc-800"
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-zinc-800" size={32} />
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-800">Synchronizing...</div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-32 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">No active logs matching query</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div 
                key={room.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] hover:border-emerald-500/20 hover:bg-[#111] transition-all duration-300"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{room.name}</h3>
                  <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-zinc-600 mt-2">
                    <span className="text-zinc-400 font-mono">/{room.slug}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span className="flex items-center gap-1.5 text-zinc-400">
                        <MessageSquare size={12} />
                        {room.qCount} Questions
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span>{timeAgo(room.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 md:mt-0">
                  <Link 
                    href={`/leader/room/${room.slug}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-zinc-900 border border-white/5 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    Open Stage
                    <ArrowUpRight size={14} />
                  </Link>
                  <button 
                    onClick={() => deleteRoom(room.id)}
                    className="p-3.5 bg-zinc-900/50 border border-white/5 text-zinc-700 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}