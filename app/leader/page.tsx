'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LayoutGrid, MessageSquare, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

export default function LeaderDashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      // Fetch rooms where the current user is the owner/admin
      const { data } = await supabase
        .from('rooms')
        .select('*, questions(count)')
        .order('created_at', { ascending: false })
      
      if (data) setRooms(data)
      setLoading(false)
    }

    fetchRooms()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}>
      
      {/* MOBILE NAV */}
      <nav className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 md:hidden">
        <div className="h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ letterSpacing: '-0.02em' }}>asktc</span>
          </Link>
          <Link 
            href="/create"
            className="h-9 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            New
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-24 pb-12">
        
        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-semibold mb-3" style={{ letterSpacing: '-0.05em' }}>Your Rooms</h1>
              <p className="text-xl text-gray-600">Manage your Q&A sessions and engage with your audience</p>
            </div>
            <Link 
              href="/create"
              className="hidden md:flex h-12 px-6 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all items-center gap-2"
            >
              <Plus size={18} />
              New Room
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                  <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>{rooms.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <LayoutGrid size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                  <p className="text-3xl font-semibold" style={{ letterSpacing: '-0.05em' }}>
                    {rooms.reduce((sum, room) => sum + (room.questions?.[0]?.count || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">All Systems Live</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ROOM GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link 
                key={room.id} 
                href={`/leader/room/${room.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <MessageSquare size={24} />
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-green-700">Active</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2" style={{ letterSpacing: '-0.02em' }}>
                      {room.name || room.slug}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Questions</p>
                      <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.05em' }}>
                        {room.questions?.[0]?.count || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* CREATE NEW ROOM CARD */}
            <Link 
              href="/create"
              className="group border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-gray-400 hover:bg-gray-50 transition-all min-h-[320px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-all">
                <Plus size={28} />
              </div>
              <h4 className="text-xl font-semibold mb-2" style={{ letterSpacing: '-0.02em' }}>Create New Room</h4>
              <p className="text-sm text-gray-500">Start a new Q&A session</p>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}