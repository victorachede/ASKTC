"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"
import { UserPlus, Trash2 } from "lucide-react"

type Panelist = {
  id: string
  name: string
  role: string
}

export default function PanelistPanel({ roomId }: { roomId: string }) {
  const [panelists, setPanelists] = useState<Panelist[]>([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  // -------------------------
  // FETCH PANELISTS
  // -------------------------
  const fetchPanelists = async () => {
    if (!roomId) return

    const { data, error } = await supabase
      .from("panelists")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })

    if (error) {
      console.log(error)
      return
    }

    setPanelists(data || [])
  }

  useEffect(() => {
    fetchPanelists()
  }, [roomId])

  // -------------------------
  // ADD PANELIST
  // -------------------------
  const addPanelist = async () => {
    if (!name.trim()) return

    setLoading(true)

    const { error } = await supabase.from("panelists").insert([
      {
        room_id: roomId,
        name: name.trim(),
      },
    ])

    setLoading(false)

    if (error) {
      toast.error("Failed to add panelist")
      return
    }

    setName("")
    fetchPanelists()
  }

  // -------------------------
  // DELETE PANELIST
  // -------------------------
  const deletePanelist = async (id: string) => {
    const { error } = await supabase
      .from("panelists")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Delete failed")
      return
    }

    setPanelists(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400">
          Panelists
        </h2>

        <UserPlus size={14} className="text-zinc-500" />
      </div>

      {/* ADD INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add panelist..."
          className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-xs outline-none"
        />

        <button
          onClick={addPanelist}
          disabled={loading}
          className="px-3 py-2 bg-white text-black text-xs rounded hover:bg-zinc-200 transition"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {panelists.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            No panelists yet
          </p>
        ) : (
          panelists.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-black/30 border border-white/10 rounded px-3 py-2"
            >
              <div>
                <p className="text-sm">{p.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase">
                  {p.role}
                </p>
              </div>

              <button
                onClick={() => deletePanelist(p.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}