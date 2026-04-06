"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"

export default function QuestionInput({
  roomId,
  onNewQuestion,
}: {
  roomId: string
  onNewQuestion: () => void
}) {
  const [question, setQuestion] = useState("")
  const [name, setName] = useState("")

  const submit = async () => {
    if (!question.trim()) return

    const { error } = await supabase.from("questions").insert([
      {
        content: question,
        room_id: roomId,

        // 🔥 THIS is the missing piece
        guest_name: name?.trim() || "Anonymous",
      },
    ])

    if (error) {
      console.log(error)
      toast.error("Failed to post question")
      return
    }

    setQuestion("")
    setName("")
    onNewQuestion()
  }

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm space-y-2">

      {/* NAME INPUT */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full text-sm outline-none border-b pb-1"
      />

      {/* QUESTION INPUT */}
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something..."
        className="w-full text-sm outline-none resize-none"
      />

      {/* ACTION */}
      <div className="flex justify-end">
        <button
          onClick={submit}
          className="text-sm px-3 py-1 bg-black text-white rounded-md"
        >
          Send
        </button>
      </div>
    </div>
  )
}