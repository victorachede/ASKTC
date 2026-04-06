'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Mic, MicOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";
const serif = "'Cormorant Garamond', serif";

interface Props {
  roomId: string;
  slug: string;
  questions: any[];
  panelists: any[];
  onAssigned: () => void;
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(transcript: string, panelists: any[]): any | null {
  const words = transcript.toLowerCase().split(/\s+/);
  let bestMatch: any = null;
  let bestScore = Infinity;

  for (const panelist of panelists) {
    const nameParts = panelist.name.toLowerCase().split(/\s+/);
    // Try matching any word in transcript against any word in panelist name
    for (const nameWord of nameParts) {
      if (nameWord.length < 3) continue; // skip short words like "Dr"
      for (const transcriptWord of words) {
        if (transcriptWord.length < 3) continue;
        const dist = levenshtein(transcriptWord, nameWord);
        const threshold = Math.max(1, Math.floor(nameWord.length * 0.35));
        if (dist <= threshold && dist < bestScore) {
          bestScore = dist;
          bestMatch = panelist;
        }
      }
    }
  }
  return bestMatch;
}

function isDoneCommand(transcript: string): boolean {
  const t = transcript.toLowerCase();
  return ['done', 'next', 'move on', 'next question', 'finished', 'complete'].some(cmd => t.includes(cmd));
}

export default function VoiceCommander({ roomId, slug, questions, panelists, onAssigned }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'done'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const recognitionRef = useRef<any>(null);
  const restartRef = useRef<boolean>(false);

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const handleResult = async (raw: string) => {
    const t = raw.trim();
    setTranscript(t);

    // DONE command
    if (isDoneCommand(t)) {
      const { data: active } = await supabase
        .from('question_assignments').select('*')
        .eq('room_id', roomId).eq('status', 'active').single();

      if (active) {
        await supabase.from('question_assignments').update({ status: 'done' }).eq('id', active.id);
        // Promote next queued
        const { data: next } = await supabase
          .from('question_assignments').select('*')
          .eq('room_id', roomId).eq('status', 'queued')
          .order('queue_position', { ascending: true }).limit(1).single();
        if (next) await supabase.from('question_assignments').update({ status: 'active' }).eq('id', next.id);
        setStatus('done');
        setStatusMsg('Moving on');
        onAssigned();
      } else {
        setStatus('error');
        setStatusMsg('Nothing active to close');
      }
      setTimeout(() => { setStatus('idle'); setTranscript(''); }, 3000);
      return;
    }

    // ASSIGN command - find panelist
    const panelist = fuzzyMatch(t, panelists);
    if (!panelist) {
      setStatus('error');
      setStatusMsg(`Didn't catch a name — heard: "${t}"`);
      setTimeout(() => { setStatus('idle'); setTranscript(''); }, 4000);
      return;
    }

    // Find next unassigned pending question
    const assignedIds = (await supabase.from('question_assignments').select('question_id').eq('room_id', roomId).in('status', ['active', 'queued'])).data?.map((a: any) => a.question_id) || [];
    const nextQ = questions.find(q => q.status === 'pending' && !q.is_projected && !assignedIds.includes(q.id));

    if (!nextQ) {
      setStatus('error');
      setStatusMsg('No pending questions to assign');
      setTimeout(() => { setStatus('idle'); setTranscript(''); }, 3000);
      return;
    }

    // Check if anything is active
    const { data: currentActive } = await supabase
      .from('question_assignments').select('id')
      .eq('room_id', roomId).eq('status', 'active');

    const assignStatus = (currentActive && currentActive.length > 0) ? 'queued' : 'active';

    const { data: existingQ } = await supabase
      .from('question_assignments').select('queue_position')
      .eq('room_id', roomId).eq('status', 'queued')
      .order('queue_position', { ascending: false }).limit(1).single();

    const queuePos = (existingQ?.queue_position || 0) + 1;

    await supabase.from('question_assignments').insert({
      question_id: nextQ.id,
      panelist_id: panelist.id,
      room_id: roomId,
      status: assignStatus,
      queue_position: assignStatus === 'queued' ? queuePos : 0,
    });

    setStatus('success');
    setStatusMsg(`Assigned to ${panelist.name}`);
    onAssigned();
    setTimeout(() => { setStatus('idle'); setTranscript(''); }, 3000);
  };

  const startListening = () => {
    if (!supported) return toast.error('Voice not supported in this browser');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (e: any) => {
      const results = Array.from(e.results as SpeechRecognitionResultList);
      const final = results.filter((r: any) => r.isFinal).map((r: any) => r[0].transcript).join(' ');
      if (final) handleResult(final);
    };

    r.onerror = (e: any) => {
      if (e.error === 'no-speech') return; // ignore silence
      if (e.error === 'aborted') return;
      setStatus('error');
      setStatusMsg('Mic error — try again');
      setTimeout(() => setStatus('idle'), 3000);
    };

    r.onend = () => {
      // Auto restart if still supposed to be listening
      if (restartRef.current) {
        try { r.start(); } catch {}
      }
    };

    recognitionRef.current = r;
    restartRef.current = true;
    r.start();
    setListening(true);
    setStatus('idle');
    setTranscript('');
  };

  const stopListening = () => {
    restartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setStatus('idle');
    setTranscript('');
  };

  useEffect(() => () => stopListening(), []);

  const statusColor = status === 'success' ? '#d4ff4e' : status === 'error' ? 'rgba(255,80,80,0.8)' : status === 'done' ? '#d4ff4e' : 'rgba(245,240,232,0.3)';

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={12} color="#d4ff4e" />
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.6)' }}>Voice Control</span>
        </div>
        {!supported && (
          <span style={{ fontFamily: cond, fontSize: 8, fontWeight: 700, color: 'rgba(255,80,80,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Chrome only</span>
        )}
      </div>

      {/* MIC BUTTON */}
      <button onClick={listening ? stopListening : startListening} disabled={!supported}
        style={{ width: '100%', height: 56, borderRadius: 14, border: listening ? '1px solid rgba(212,255,78,0.3)' : '1px solid rgba(245,240,232,0.08)', background: listening ? 'rgba(212,255,78,0.06)' : 'rgba(245,240,232,0.03)', cursor: supported ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
        {listening ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {[1,2,3,4,3,2].map((h, i) => (
                <div key={i} style={{ width: 3, height: h * 5, background: '#d4ff4e', borderRadius: 100, animation: `wave ${0.5 + i * 0.1}s ease infinite alternate` }} />
              ))}
            </div>
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#d4ff4e' }}>Listening — tap to stop</span>
          </>
        ) : (
          <>
            <Mic size={15} color="rgba(245,240,232,0.4)" />
            <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)' }}>Tap to start</span>
          </>
        )}
      </button>

      <style>{`
        @keyframes wave { from { transform: scaleY(0.5); } to { transform: scaleY(1.5); } }
      `}</style>

      {/* TRANSCRIPT / STATUS */}
      {(transcript || status !== 'idle') && (
        <div style={{ padding: '12px 14px', background: 'rgba(245,240,232,0.02)', border: `1px solid ${statusColor}30`, borderRadius: 10 }}>
          {transcript && (
            <p style={{ fontFamily: serif, fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(245,240,232,0.5)', marginBottom: statusMsg ? 6 : 0 }}>"{transcript}"</p>
          )}
          {statusMsg && (
            <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: statusColor }}>{statusMsg}</p>
          )}
        </div>
      )}

      {/* PANELIST CHIPS */}
      {panelists.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: cond, fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>Say their name</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {panelists.map(p => (
              <span key={p.id} style={{ padding: '4px 10px', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 100, fontFamily: cond, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.35)' }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* HINT */}
      <div style={{ padding: '10px 12px', background: 'rgba(245,240,232,0.02)', borderRadius: 8, borderLeft: '2px solid rgba(212,255,78,0.15)' }}>
        <p style={{ fontFamily: cond, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(245,240,232,0.2)', lineHeight: 1.7 }}>
          "PROF BARRY, TAKE THAT" → assigns next question<br />
          "DONE" / "NEXT" → marks active, promotes queue
        </p>
      </div>
    </div>
  );
}