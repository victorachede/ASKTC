'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowUpRight, Loader2, Copy } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function LeaderDashboard() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRooms = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })

    setRooms(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/join?code=${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Invite link copied')
  }

  return (
    <main className="min-h-screen bg-white text-black px-6 py-12">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-12">

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-medium tracking-tight"
        >
          Sessions
        </motion.h1>

        <p className="text-sm text-black/40 mt-2">
          Manage live rooms, questions, and engagement flow
        </p>

      </div>

      {/* ACTION BAR */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">

        <div className="text-xs uppercase tracking-widest text-black/40">
          Active rooms
        </div>

        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs hover:opacity-80 transition"
        >
          <Plus size={14} />
          New session
        </Link>

      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto space-y-3">

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center py-20 text-black/30 gap-3">
            <Loader2 className="animate-spin" />
            <span className="text-xs uppercase tracking-widest">
              Syncing sessions
            </span>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && rooms.length === 0 && (
          <div className="bg-[#fafafa] border border-black/5 rounded-2xl p-10 text-center">
            <p className="text-black/40 mb-6">
              No sessions created yet
            </p>

            <Link
              href="/create"
              className="inline-flex px-5 py-2 rounded-xl bg-black text-white text-sm hover:opacity-80 transition"
            >
              Create your first session
            </Link>
          </div>
        )}

        {/* ROOM LIST */}
        {!loading && rooms.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group flex items-center justify-between bg-[#fafafa] border border-black/5 rounded-2xl px-6 py-5 hover:bg-white transition"
          >

            {/* LEFT */}
            <div>
              <h2 className="text-base font-medium">
                {room.name}
              </h2>

              <p className="text-xs text-black/40 mt-1">
                /{room.slug}
              </p>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">

              <button
                onClick={() => copyLink(room.slug)}
                className="p-2 rounded-lg border border-black/10 text-black/40 hover:text-black hover:border-black/30 transition"
              >
                <Copy size={14} />
              </button>

              <Link
                href={`/leader/room/${room.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-xs hover:bg-black hover:text-white transition"
              >
                Open
                <ArrowUpRight size={14} />
              </Link>

            </div>

          </motion.div>
        ))}

      </div>

    </main>
  )
}