"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔗 Auto-fill from URL (?code=abc)
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode);
    }
  }, [searchParams]);

  // 🚀 Handle Join
  const handleJoin = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      // optional: validate room exists
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rooms?slug=eq.${code}`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();

      if (!data || data.length === 0) {
        setError("Room not found");
        setLoading(false);
        return;
      }

      // ✅ Redirect
      router.push(`/room/${code}`);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md text-center space-y-6">

        {/* 🧠 Title */}
        <h1 className="text-3xl font-bold">
          Join a session
        </h1>

        {/* 💬 Subtitle */}
        <p className="text-gray-400">
          Enter a code or scan a QR to join instantly
        </p>

        {/* 🔤 Input */}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toLowerCase())}
          placeholder="e.g. sunday-service"
          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:border-white transition"
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />

        {/* ⚠️ Error */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* 🚀 Button */}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
        >
          {loading ? "Joining..." : "Join Session"}
        </button>

        {/* 🔗 Hint */}
        <p className="text-xs text-gray-500">
          Tip: you can join using a shared link or QR code
        </p>
      </div>
    </div>
  );
}