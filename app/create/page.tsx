"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Loader2, ArrowRight, Hash } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

export default function CreateRoom() {
  const router = useRouter()

  const [roomName, setRoomName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)

  const generateSlug = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

  const handleNameChange = (val: string) => {
    setRoomName(val)
    setSlug(generateSlug(val))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalSlug =
      slug.trim() || Math.random().toString(36).substring(2, 8)

    setLoading(true)

    const { error } = await supabase
      .from("rooms")
      .insert([{ name: roomName, slug: finalSlug }])

    if (error) {
      toast.error(
        error.code === "23505"
          ? "Access code already exists"
          : "Failed to create session"
      )
      setLoading(false)
      return
    }

    toast.success("Session created")
    router.push(`/leader/room/${finalSlug}`)
  }

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 border-b border-black/10 bg-white/80 backdrop-blur">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-black/60 hover:text-black transition"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/40">
          <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
          Create session
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-xl mx-auto w-full px-6 pt-28 pb-20 flex-1 flex flex-col justify-center">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="text-xs uppercase tracking-widest text-black/40 mb-4">
            Session setup
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Launch a{" "}
            <span className="text-lime-500">live session</span>
          </h1>

          <p className="text-sm text-black/60 mt-4">
            Create a room for real-time audience interaction.
          </p>
        </motion.div>

        {/* FORM */}
        <motion.form
          onSubmit={handleCreate}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="space-y-8"
        >

          {/* NAME */}
          <div>
            <label className="text-xs uppercase tracking-widest text-black/40">
              Session name
            </label>

            <input
              value={roomName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Youth Conference 2026"
              className="w-full mt-3 text-xl font-medium border-b border-black/10 focus:border-lime-400 outline-none py-3"
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="text-xs uppercase tracking-widest text-black/40">
              Access code
            </label>

            <input
              value={slug}
              onChange={(e) =>
                setSlug(generateSlug(e.target.value))
              }
              placeholder="auto-generated"
              className="w-full mt-3 px-4 py-3 text-sm font-semibold tracking-widest uppercase border border-black/10 rounded-md focus:border-lime-400 outline-none"
            />

            <div className="flex items-center gap-2 mt-2 text-xs text-black/40">
              <Hash size={12} />
              <span>
                Join link:{" "}
                <span className="font-mono text-black/60">
                  asktc.vercel.app/room/{slug || "..."}
                </span>
              </span>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={!roomName || loading}
            className="w-full h-14 bg-black text-white rounded-md font-medium flex items-center justify-center gap-2 hover:bg-black/90 disabled:opacity-40 transition"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Create session
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.form>

        {/* FOOTER */}
        <p className="text-center text-xs text-black/30 mt-10">
          You’ll be redirected to the control dashboard.
        </p>
      </div>
    </main>
  )
}