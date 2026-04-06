"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Copy, Check, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import QuestionInput from "@/components/QuestionInput"
import ReactionBar from "@/components/ReactionBar"
import PollVote from "@/components/PollVote"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()

  const slug = typeof params?.slug === "string" ? params.slug : ""

  const [room, setRoom] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [activePoll, setActivePoll] = useState<any>(null)
  const [liveQuestion, setLiveQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [upvotedIds, setUpvotedIds] = useState<string[]>([])

  /* ------------------ FETCH ------------------ */

  const fetchRoom = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("slug", slug)
      .single()

    if (!data) {
      toast.error("Room not found")
      router.push("/")
      return null
    }

    setRoom(data)
    return data
  }

  const fetchQuestions = async (roomId: string) => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })

    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("question_id")

    const formatted =
      data?.map((q: any) => ({
        ...q,
        upvote_count:
          upvotes?.filter((u) => u.question_id === q.id).length || 0,
      })) || []

    setQuestions(formatted)
  }

  const fetchPoll = async (roomId: string) => {
    const { data } = await supabase
      .from("polls")
      .select("*, poll_options(*), poll_votes(*)")
      .eq("room_id", roomId)
      .eq("is_active", true)
      .maybeSingle()

    setActivePoll(data || null)
  }

  const fetchLiveQuestion = async (roomId: string) => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_projected", true)
      .maybeSingle()

    setLiveQuestion(data || null)
  }

  const fetchAll = async () => {
    setLoading(true)

    const roomData = await fetchRoom()
    if (!roomData) return

    await Promise.all([
      fetchQuestions(roomData.id),
      fetchPoll(roomData.id),
      fetchLiveQuestion(roomData.id),
    ])

    setLoading(false)
  }

  useEffect(() => {
    if (!slug) return
    fetchAll()
  }, [slug])

  /* ------------------ UI HELPERS ------------------ */

  const copyCode = () => {
    navigator.clipboard.writeText(slug)
    setCopied(true)
    toast.success("Copied room code")
    setTimeout(() => setCopied(false), 2000)
  }

  /* ------------------ UI ------------------ */

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1a1410] flex flex-col">

      {/* ================= TOP BAR ================= */}
      <div className="sticky top-0 z-50 bg-[#f7f4ef]/90 backdrop-blur border-b border-black/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="text-sm text-black/50 flex items-center gap-2">
            <ChevronLeft size={14} /> Exit
          </Link>

          <div className="text-xs font-semibold tracking-widest">
            LIVE • {room?.name || slug}
          </div>

          <button onClick={copyCode}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 w-full">

        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* ================= LIVE ZONE ================= */}
          <div className="space-y-6 mb-10">

            <ReactionBar roomId={room?.id} />

            {activePoll && <PollVote poll={activePoll} />}

            {liveQuestion && (
              <div className="p-6 border border-black/10 rounded-2xl bg-white">
                <div className="text-xs text-black/40 mb-2">
                  Live Question
                </div>
                <p className="text-lg italic">
                  "{liveQuestion.content}"
                </p>
              </div>
            )}

          </div>

          {/* ================= FEED ================= */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="border-b border-black/10 pb-6"
                >
                  <div className="flex justify-between gap-6">

                    <div>
                      <div className="text-xs text-black/40 mb-1">
                        {q.guest_name || "Anonymous"}
                      </div>

                      <p className="text-lg italic">
                        "{q.content}"
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <Star size={16} className="text-black/40" />
                      <span className="text-xs text-black/60">
                        {q.upvote_count || 0}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ================= INPUT BAR ================= */}
      <div className="sticky bottom-0 border-t border-black/10 bg-[#f7f4ef]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <QuestionInput />
        </div>
      </div>

    </main>
  )
}