"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  ChevronRight,
  Terminal,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

import PanelistPanel from "@/components/PanelistPanel"
import AnswerBox from "@/components/AnswerBox"

export default function RoomModeration() {
  const { slug } = useParams()
  const router = useRouter()

  const [room, setRoom] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ---------------- FETCH ROOM ----------------
  const fetchRoom = useCallback(async () => {
    if (!slug) return

    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("slug", slug)
      .single()

    if (!data) {
      toast.error("Room not found")
      router.push("/leader")
      return
    }

    setRoom(data)
    return data
  }, [slug, router])

  // ---------------- FETCH QUESTIONS ----------------
  const fetchQuestions = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })

    setQuestions(data || [])
  }, [])

  // ---------------- INIT ----------------
  useEffect(() => {
    const init = async () => {
      setLoading(true)

      const roomData = await fetchRoom()
      if (roomData?.id) {
        await fetchQuestions(roomData.id)
      }

      setLoading(false)
    }

    init()
  }, [fetchRoom, fetchQuestions])

  // ---------------- REALTIME ----------------
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`room-mod-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        (payload) => {
          const q: any = payload.new
          if (!q?.room_id || q.room_id !== room.id) return

          setQuestions(prev => {
            const exists = prev.find(p => p.id === q.id)

            if (!exists) return [...prev, q]

            return prev.map(p =>
              p.id === q.id ? { ...p, ...q } : p
            )
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  const pendingQuestions = questions.filter(q => q.status === "pending")
  const activeQuestion = questions.find(q => q.id === activeId)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.3em] opacity-40">
          Booting moderation layer...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">

      {/* HEADER */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-4">
          <Link href="/leader" className="p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft size={18} className="text-zinc-500" />
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <h1 className="text-xs font-black uppercase tracking-[0.3em] italic">
            {room?.name}
          </h1>
        </div>

        <Link
          href={`/projector/${slug}`}
          target="_blank"
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition"
        >
          Launch Projector <ExternalLink size={12} />
        </Link>
      </nav>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* PANELISTS (NEW COLUMN) */}
        <aside className="w-72 border-r border-white/5 bg-black p-4 overflow-y-auto">
          {room && <PanelistPanel roomId={room.id} />}
        </aside>

        {/* QUESTION QUEUE */}
        <aside className="w-96 border-r border-white/5 bg-zinc-950 overflow-y-auto">

          <div className="p-6 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
              Live Queue
            </p>
            <h2 className="text-lg font-bold">
              Incoming ({pendingQuestions.length})
            </h2>
          </div>

          {pendingQuestions.length === 0 ? (
            <div className="p-10 text-xs opacity-30 italic">
              Waiting for audience...
            </div>
          ) : (
            pendingQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setActiveId(q.id)}
                className={`w-full text-left p-6 border-b border-white/5 hover:bg-white/[0.03] ${
                  activeId === q.id ? "bg-white/[0.05]" : ""
                }`}
              >
                <div className="flex justify-between text-[10px] text-zinc-600 mb-2">
                  <span>0{i + 1}</span>
                  <Clock size={12} />
                </div>

                <p className="text-sm text-zinc-300 mb-3">
                  {q.content}
                </p>

                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {q.guest_name || "Anonymous"}
                </span>
              </button>
            ))
          )}
        </aside>

        {/* WORKSPACE */}
        <section className="flex-1 bg-black p-12 overflow-y-auto">
          {activeQuestion ? (
            <div className="max-w-3xl">

              <div className="flex items-center gap-2 mb-6 text-emerald-500 text-[10px] uppercase tracking-[0.4em]">
                <Terminal size={14} />
                Active Control
              </div>

              <h2 className="text-4xl font-black mb-10">
                {activeQuestion.content}
              </h2>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <AnswerBox
                  questionId={activeQuestion.id}
                  onComplete={() => setActiveId(null)}
                />
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center opacity-20">
              <MessageSquare size={40} />
            </div>
          )}
        </section>

      </div>
    </main>
  )
}