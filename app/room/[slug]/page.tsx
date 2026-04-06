"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"
import QuestionInput from "@/components/QuestionInput"
import { Copy } from "lucide-react"

type Question = {
  id: string
  content: string
  guest_name: string | null
  created_at: string
  votes: number
}

export default function RoomPage() {
  const { slug } = useParams()

  const [room, setRoom] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // -------------------------
  // INIT ROOM
  // -------------------------
  useEffect(() => {
    if (!slug) return

    const init = async () => {
      setLoading(true)

      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("slug", slug)
        .single()

      setRoom(roomData)

      if (roomData?.id) {
        await fetchQuestions(roomData.id)
      }

      setLoading(false)
    }

    init()
  }, [slug])

  // -------------------------
  // FETCH QUESTIONS
  // -------------------------
  const fetchQuestions = async (roomId: string) => {
    const { data, error } = await supabase
      .from("questions")
      .select(`
        id,
        content,
        guest_name,
        created_at,
        upvotes:upvotes(id)
      `)
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      return
    }

    const formatted: Question[] = (data || []).map((q: any) => ({
      id: q.id,
      content: q.content,
      guest_name: q.guest_name,
      created_at: q.created_at,
      votes: q.upvotes?.length || 0,
    }))

    setQuestions(formatted)
  }

  // -------------------------
  // COPY ROOM LINK
  // -------------------------
  const copyRoomLink = async () => {
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
      toast.success("Room link copied 🚀")
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  // -------------------------
  // VOTE SYSTEM
  // -------------------------
  const handleVote = async (questionId: string) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user

    if (!user) {
      toast.error("Login required to vote")
      return
    }

    const { data: existing } = await supabase
      .from("upvotes")
      .select("*")
      .eq("question_id", questionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from("upvotes").delete().eq("id", existing.id)

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, votes: q.votes - 1 }
            : q
        )
      )
    } else {
      await supabase.from("upvotes").insert([
        {
          question_id: questionId,
          user_id: user.id,
        },
      ])

      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, votes: q.votes + 1 }
            : q
        )
      )
    }
  }

  // -------------------------
  // REALTIME
  // -------------------------
  useEffect(() => {
    const channel = supabase
      .channel("upvotes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "upvotes" },
        () => room?.id && fetchQuestions(room.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="p-6 text-sm text-black/60">
        Loading room...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">

        {/* LEFT */}
        <div>
          <h1 className="text-lg font-semibold">{room?.name}</h1>
          <p className="text-xs text-black/40">#{room?.slug}</p>
        </div>

        {/* RIGHT (COPY LINK ACTION) */}
        <button
          onClick={copyRoomLink}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <Copy size={18} />
        </button>
      </div>

      {/* MAIN */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* QUESTION INPUT (YOUR COMPONENT) */}
        <QuestionInput
          roomId={room?.id}
          onNewQuestion={() => fetchQuestions(room.id)}
        />

        {/* FEED */}
        <div className="space-y-3">
          {questions.map(q => (
            <div
              key={q.id}
              className="bg-white border rounded-lg p-3 shadow-sm"
            >

              {/* TOP ROW */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-black/50">
                  {q.guest_name ?? "Anonymous"}
                </span>

                <button
                  onClick={() => handleVote(q.id)}
                  className="flex items-center gap-1 text-xs hover:text-black transition"
                >
                  ⭐ {q.votes}
                </button>
              </div>

              {/* CONTENT */}
              <div className="text-sm">
                {q.content}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}