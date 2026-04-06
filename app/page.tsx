"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [topicIndex, setTopicIndex] = useState(0)

  const topics = ["audience", "event", "session", "meeting", "presentation"]

  useEffect(() => {
    const interval = setInterval(() => {
      setTopicIndex((prev) => (prev + 1) % topics.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  const createSession = () => {
    router.push("/create")
  }

 const joinSession = () => {
  router.push("/join")
}

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">

      {/* NAV */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-black/10">
        <div className="text-sm font-semibold tracking-tight">
          AskTheChurch
        </div>

        <button
          onClick={createSession}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:opacity-90 transition"
        >
          Create session
        </button>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center flex-1 px-6 py-20">

        <div className="text-xs uppercase tracking-widest text-black/60 mb-4">
          Real-time Q&A platform
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
          Live questions for{" "}
          <span className="underline decoration-black/30">
            {topics[topicIndex]}
          </span>
        </h1>

        <p className="mt-6 text-black/60 max-w-xl text-sm md:text-base">
          Collect, organize, and manage audience questions in real time.
          No friction. No apps. Instant interaction.
        </p>

        <div className="mt-8 flex gap-3">
          <button
            onClick={createSession}
            className="px-5 py-3 bg-black text-white rounded-md text-sm hover:opacity-90 transition"
          >
            Create session
          </button>

          <button
            onClick={joinSession}
            className="px-5 py-3 border border-black/20 rounded-md text-sm hover:bg-black hover:text-white transition"
          >
            Join session
          </button>
        </div>

        {/* STATS */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-lg font-semibold">No setup</div>
            <div className="text-xs text-black/60">Works in browser</div>
          </div>

          <div>
            <div className="text-lg font-semibold">Live sync</div>
            <div className="text-xs text-black/60">Real-time updates</div>
          </div>

          <div>
            <div className="text-lg font-semibold">Moderation</div>
            <div className="text-xs text-black/60">Control flow</div>
          </div>

          <div>
            <div className="text-lg font-semibold">Free</div>
            <div className="text-xs text-black/60">For participants</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20 border-t border-black/10 grid md:grid-cols-4 gap-8">

        <div>
          <div className="text-xs text-black/40 mb-2">01</div>
          <h3 className="font-semibold mb-2">Live Questions</h3>
          <p className="text-sm text-black/60">
            Audience submits questions in real time.
          </p>
        </div>

        <div>
          <div className="text-xs text-black/40 mb-2">02</div>
          <h3 className="font-semibold mb-2">Voice Control</h3>
          <p className="text-sm text-black/60">
            Assign and manage questions using voice input.
          </p>
        </div>

        <div>
          <div className="text-xs text-black/40 mb-2">03</div>
          <h3 className="font-semibold mb-2">Presenter Mode</h3>
          <p className="text-sm text-black/60">
            Clean full-screen view for live sessions.
          </p>
        </div>

        <div>
          <div className="text-xs text-black/40 mb-2">04</div>
          <h3 className="font-semibold mb-2">Live Polls</h3>
          <p className="text-sm text-black/60">
            Instant audience feedback during events.
          </p>
        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 border-t border-black/10">
        <div className="max-w-3xl mx-auto text-center">

          <h2 className="text-2xl font-semibold mb-10">
            How it works
          </h2>

          <div className="space-y-6 text-left">

            <div>
              <div className="text-xs text-black/40">01</div>
              <div className="font-semibold">Create a session</div>
              <div className="text-sm text-black/60">Generate a room instantly</div>
            </div>

            <div>
              <div className="text-xs text-black/40">02</div>
              <div className="font-semibold">Share link</div>
              <div className="text-sm text-black/60">Participants join instantly</div>
            </div>

            <div>
              <div className="text-xs text-black/40">03</div>
              <div className="font-semibold">Manage live</div>
              <div className="text-sm text-black/60">Moderate in real time</div>
            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-black/10 text-center">
        <h2 className="text-3xl font-semibold">
          Start a live session in under 30 seconds
        </h2>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={createSession}
            className="px-6 py-3 bg-black text-white rounded-md text-sm"
          >
            Create session
          </button>

          <button
            onClick={joinSession}
            className="px-6 py-3 border border-black/20 rounded-md text-sm"
          >
            Join session
          </button>
        </div>
      </section>

    </main>
  )
}