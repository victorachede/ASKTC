"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageSquare, Copy, Check, Star, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import QuestionInput from "@/components/QuestionInput";
import PollVote from "@/components/PollVote";
import ReactionBar from "@/components/ReactionBar";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";
const fontUrl = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap";

// Device fingerprint for anti-statpad
function getFingerprint(): string {
  const key = "asktc_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

function getUpvotedIds(): string[] {
  try { return JSON.parse(localStorage.getItem("asktc_upvoted") || "[]"); } catch { return []; }
}

function addUpvotedId(id: string) {
  const ids = getUpvotedIds();
  if (!ids.includes(id)) {
    localStorage.setItem("asktc_upvoted", JSON.stringify([...ids, id]));
  }
}

function getMyQuestionIds(): string[] {
  try { return JSON.parse(localStorage.getItem("asktc_my_questions") || "[]"); } catch { return []; }
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);

  // Backlog email prompt
  const [unansweredEmail, setUnansweredEmail] = useState<{ questionId: string; content: string } | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const fetchData = async () => {
    try {
      const { data: roomData } = await supabase.from("rooms").select("id, name").eq("slug", slug).single();
      if (!roomData) {
        toast.error("Session not found");
        router.push("/");
        return;
      }
      setRoom(roomData);

      const { data: questionsData } = await supabase
        .from("questions").select("*, upvotes(count)")
        .eq("room_id", roomData.id).eq("status", "answered")
        .order("created_at", { ascending: false });

      const { data: answersData } = await supabase.from("answers").select("*");

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          answer_body: answersData?.find((a: any) => a.question_id === q.id)?.answer_body || null,
        })));
      }

      // Fetch active poll
      const { data: pollData } = await supabase
        .from("polls")
        .select("*, poll_options(*), poll_votes(*)")
        .eq("room_id", roomData.id)
        .eq("is_active", true)
        .single();
      setActivePoll(pollData || null);

      // Check for unanswered questions from this device
      checkUnanswered(roomData.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkUnanswered = async (roomId: string) => {
    const myIds = getMyQuestionIds();
    if (myIds.length === 0) return;

    // Already prompted this session
    if (localStorage.getItem("asktc_email_prompted")) return;

    const { data } = await supabase
      .from("questions")
      .select("id, content, status")
      .eq("room_id", roomId)
      .in("id", myIds)
      .eq("status", "pending");

    if (data && data.length > 0) {
      // Show prompt for oldest unanswered question
      setUnansweredEmail({ questionId: data[0].id, content: data[0].content });
    }
  };

  useEffect(() => {
    if (!slug) { router.push("/"); return; }
    setUpvotedIds(getUpvotedIds());
    fetchData();

    const setup = async () => {
      const { data: roomData } = await supabase.from("rooms").select("id").eq("slug", slug).single();
      if (!roomData) return;
      return supabase.channel(`room-view-${slug}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "questions", filter: `room_id=eq.${roomData.id}` }, fetchData)
        .on("postgres_changes", { event: "*", schema: "public", table: "upvotes" }, fetchData)
        .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `room_id=eq.${roomData.id}` }, fetchData)
        .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, fetchData)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers" }, fetchData)
        .subscribe();
    };

    const ch = setup();
    return () => { ch.then(c => c && supabase.removeChannel(c)); };
  }, [slug]);

  const handleUpvote = async (questionId: string) => {
    if (upvotedIds.includes(questionId)) {
      toast.error("Already starred");
      return;
    }
    const fp = getFingerprint();
    const { error } = await supabase.from("upvotes").insert([{ question_id: questionId, fingerprint: fp }]);
    if (error) {
      toast.error("Already starred");
    } else {
      addUpvotedId(questionId);
      setUpvotedIds(prev => [...prev, questionId]);
      toast.success("Starred");
    }
  };

  const submitEmail = async () => {
    if (!emailInput.trim() || !unansweredEmail) return;
    const { error } = await supabase.from("questions").update({ email: emailInput.trim() }).eq("id", unansweredEmail.questionId);
    if (error) {
      toast.error("Failed to save email");
    } else {
      setEmailSent(true);
      localStorage.setItem("asktc_email_prompted", "1");
      toast.success("We'll reach out when it's answered");
    }
  };

  const dismissEmail = () => {
    setUnansweredEmail(null);
    localStorage.setItem("asktc_email_prompted", "1");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!slug) return null;

  return (
    <main style={{ minHeight: "100vh", background: "#060606", color: "#f5f0e8", fontFamily: sans, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        .exit-link:hover { color: #f5f0e8 !important; }
        .upvote-btn:hover { border-color: rgba(212,255,78,0.3) !important; background: rgba(212,255,78,0.04) !important; }
        .upvote-btn:hover .star-icon { color: #d4ff4e !important; }
        .upvote-btn:hover .upvote-count { color: #d4ff4e !important; }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(245,240,232,0.05)", background: "rgba(6,6,6,0.92)", backdropFilter: "blur(24px)" }}>
        <Link href="/" className="exit-link" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(245,240,232,0.25)", textDecoration: "none", transition: "color 0.2s" }}>
          <ChevronLeft size={14} />
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase" }}>Exit</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.07)", borderRadius: 100 }}>
          <span className="pip" style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ecf8e", display: "block" }} />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "#f5f0e8" }}>{slug}</span>
        </div>

        <button onClick={copyCode} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.25)", transition: "color 0.2s", padding: 4 }}>
          {copied ? <Check size={15} color="#3ecf8e" /> : <Copy size={15} />}
        </button>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 180px" }}>

        {/* HEADER */}
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 1, height: 20, background: "rgba(212,255,78,0.4)" }} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(245,240,232,0.3)" }}>Active Stage</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(2.2rem, 8vw, 3.2rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 0.95, color: "#f5f0e8", marginBottom: 12 }}>
            {room?.name || slug}
          </h1>
        </motion.header>

        {/* UNANSWERED EMAIL PROMPT */}
        <AnimatePresence>
          {unansweredEmail && !emailSent && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ marginBottom: 28, padding: 20, background: "rgba(212,255,78,0.04)", border: "1px solid rgba(212,255,78,0.15)", borderRadius: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <Mail size={14} color="#d4ff4e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "#d4ff4e", marginBottom: 4 }}>Your question wasn't picked up</p>
                  <p style={{ fontFamily: serif, fontSize: "0.95rem", fontStyle: "italic", color: "rgba(245,240,232,0.5)", lineHeight: 1.4 }}>"{unansweredEmail.content}"</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  placeholder="Drop your email for a response"
                  type="email"
                  style={{ flex: 1, background: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 10, padding: "10px 14px", outline: "none", fontFamily: sans, fontSize: 13, color: "#f5f0e8" }}
                  onKeyDown={e => e.key === "Enter" && submitEmail()}
                />
                <button onClick={submitEmail} style={{ padding: "10px 16px", background: "#d4ff4e", color: "#060606", border: "none", borderRadius: 10, fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Send
                </button>
                <button onClick={dismissEmail} style={{ padding: "10px 12px", background: "transparent", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 10, fontFamily: cond, fontSize: 9, fontWeight: 700, color: "rgba(245,240,232,0.3)", cursor: "pointer" }}>
                  Skip
                </button>
              </div>
            </motion.div>
          )}
          {emailSent && unansweredEmail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 28, padding: "14px 18px", background: "rgba(212,255,78,0.04)", border: "1px solid rgba(212,255,78,0.15)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={13} color="#d4ff4e" />
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#d4ff4e" }}>We'll get back to you</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE POLL */}
        <AnimatePresence>
          {activePoll && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 36 }}>
              <PollVote poll={activePoll} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* REACTION BAR */}
        {room && (
          <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid rgba(245,240,232,0.05)" }}>
            <ReactionBar roomId={room.id} />
          </div>
        )}

        {/* SECTION LABEL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid rgba(245,240,232,0.05)", marginBottom: 32 }}>
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(245,240,232,0.2)" }}>Resolved Questions</span>
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(245,240,232,0.25)" }}>{questions.length} total</span>
        </div>

        {/* FEED */}
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={20} color="rgba(245,240,232,0.15)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(245,240,232,0.1)" }}>Syncing</span>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: "80px 24px", textAlign: "center", border: "1px dashed rgba(245,240,232,0.06)", borderRadius: 16 }}>
            <MessageSquare size={28} color="rgba(245,240,232,0.08)" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(245,240,232,0.1)" }}>No answers yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            <AnimatePresence>
              {questions.map((q, i) => {
                const starred = upvotedIds.includes(q.id);
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#111", border: "1px solid rgba(245,240,232,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: cond, fontSize: 11, fontWeight: 900, color: "#f5f0e8", flexShrink: 0 }}>
                        {q.guest_name?.charAt(0).toUpperCase() || "A"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,240,232,0.3)" }}>{q.guest_name || "Anonymous"}</span>
                            <span style={{ fontFamily: sans, fontSize: 10, color: "rgba(245,240,232,0.15)", fontWeight: 500 }}>
                              {new Date(q.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* STAR UPVOTE */}
                          <button onClick={() => handleUpvote(q.id)} className="upvote-btn"
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: starred ? "rgba(212,255,78,0.06)" : "rgba(245,240,232,0.03)", border: starred ? "1px solid rgba(212,255,78,0.25)" : "1px solid rgba(245,240,232,0.07)", borderRadius: 8, cursor: starred ? "default" : "pointer", transition: "border-color 0.2s, background 0.2s" }}>
                            <Star size={10} className="star-icon"
                              fill={starred ? "#d4ff4e" : "none"}
                              style={{ color: starred ? "#d4ff4e" : "rgba(245,240,232,0.2)", transition: "color 0.2s" }} />
                            <span className="upvote-count" style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: starred ? "#d4ff4e" : "rgba(245,240,232,0.25)", transition: "color 0.2s" }}>
                              {q.upvotes?.[0]?.count || 0}
                            </span>
                          </button>
                        </div>

                        <p style={{ fontFamily: serif, fontSize: "clamp(1.1rem, 3vw, 1.3rem)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.4, color: "#f5f0e8" }}>
                          "{q.content}"
                        </p>
                      </div>
                    </div>

                    {q.answer_body && (
                      <div style={{ marginLeft: 46, padding: "20px 22px", background: "rgba(245,240,232,0.02)", border: "1px solid rgba(245,240,232,0.06)", borderLeft: "2px solid rgba(212,255,78,0.25)", borderRadius: "0 12px 12px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                          <CheckCircle2 size={11} color="#d4ff4e" />
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "#d4ff4e" }}>Official Response</span>
                        </div>
                        <p style={{ fontFamily: sans, fontSize: 14, color: "rgba(245,240,232,0.6)", lineHeight: 1.7, fontWeight: 400 }}>{q.answer_body}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* STICKY INPUT */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, padding: "24px 20px", background: "linear-gradient(to top, #060606 60%, transparent)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <QuestionInput />
        </div>
      </div>
    </main>
  );
}