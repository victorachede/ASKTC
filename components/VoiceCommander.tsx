'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface VoiceCommanderProps {
  roomId: string;
  slug: string;
  questions: any[];       // pending questions from parent
  panelists: any[];       // panelists in session
  onAssigned?: () => void;
}

type CommandState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface ParsedCommand {
  type: 'assign' | 'done' | 'next' | 'unknown';
  panelistMatch?: any;
  questionIndex?: number; // 0 = next/first unassigned
  raw: string;
}

// ─── COMMAND PARSER ───────────────────────────────────────────────────────────
function parseVoiceCommand(transcript: string, panelists: any[], questions: any[]): ParsedCommand {
  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // Done / Mark complete
  if (/\b(done|finished|complete|next|move on|skip)\b/.test(lower)) {
    return { type: 'done', raw };
  }

  // Find panelist name in transcript — fuzzy match
  const panelistMatch = panelists.find(p => {
    const name = p.name.toLowerCase();
    const title = p.title?.toLowerCase() || '';
    // Match full name, last name, or title + last name
    const nameParts = name.split(' ');
    return (
      lower.includes(name) ||
      lower.includes(nameParts[nameParts.length - 1]) || // last name
      (title && lower.includes(title + ' ' + nameParts[nameParts.length - 1]))
    );
  });

  if (panelistMatch) {
    return { type: 'assign', panelistMatch, questionIndex: 0, raw };
  }

  return { type: 'unknown', raw };
}

// ─── TRANSCRIPT BUBBLE ────────────────────────────────────────────────────────
function TranscriptBubble({ text, state }: { text: string; state: CommandState }) {
  const serif = "'Cormorant Garamond', serif";
  const cond = "'Barlow Condensed', sans-serif";

  const colors: Record<CommandState, string> = {
    idle: 'rgba(245,240,232,0.05)',
    listening: 'rgba(212,255,78,0.06)',
    processing: 'rgba(245,240,232,0.04)',
    success: 'rgba(62,207,142,0.08)',
    error: 'rgba(255,80,80,0.06)',
  };

  const borders: Record<CommandState, string> = {
    idle: 'rgba(245,240,232,0.06)',
    listening: 'rgba(212,255,78,0.2)',
    processing: 'rgba(245,240,232,0.08)',
    success: 'rgba(62,207,142,0.25)',
    error: 'rgba(255,80,80,0.2)',
  };

  return (
    <motion.div
      animate={{ background: colors[state], borderColor: borders[state] }}
      transition={{ duration: 0.4 }}
      style={{ border: `1px solid ${borders[state]}`, borderRadius: 14, padding: '14px 18px', minHeight: 56, display: 'flex', alignItems: 'center' }}
    >
      {text ? (
        <p style={{ fontFamily: serif, fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 300, color: state === 'success' ? '#3ecf8e' : state === 'error' ? 'rgba(255,120,120,0.9)' : '#f5f0e8', lineHeight: 1.4 }}>
          "{text}"
        </p>
      ) : (
        <p style={{ fontFamily: cond, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>
          {state === 'listening' ? 'Listening...' : 'Say a command'}
        </p>
      )}
    </motion.div>
  );
}

// ─── WAVEFORM ─────────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
      {[0.4, 0.7, 1, 0.7, 0.5, 0.8, 0.6, 1, 0.4, 0.7].map((h, i) => (
        <motion.div
          key={i}
          animate={active ? { scaleY: [h, 1, h * 0.5, 1, h] } : { scaleY: 0.2 }}
          transition={active ? { duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' } : { duration: 0.3 }}
          style={{ width: 3, height: 20, background: active ? '#d4ff4e' : 'rgba(245,240,232,0.1)', borderRadius: 2, transformOrigin: 'center' }}
        />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function VoiceCommander({ roomId, slug, questions, panelists, onAssigned }: VoiceCommanderProps) {
  const [state, setState] = useState<CommandState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResult, setLastResult] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);

  const serif = "'Cormorant Garamond', serif";
  const cond = "'Barlow Condensed', sans-serif";
  const sans = "'Barlow', sans-serif";

  // ── FETCH ASSIGNMENTS ──────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    const { data } = await supabase
      .from('question_assignments')
      .select('*')
      .eq('room_id', roomId)
      .neq('status', 'done');
    setAssignments(data || []);
  }, [roomId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ── EXECUTE COMMAND ────────────────────────────────────────────────────────
  const executeCommand = useCallback(async (cmd: ParsedCommand) => {
    setState('processing');

    if (cmd.type === 'done') {
      // Mark active assignment as done
      const active = assignments.find(a => a.status === 'active');
      if (active) {
        await supabase.from('question_assignments').update({ status: 'done' }).eq('id', active.id);
        // Promote next queued
        const next = assignments.find(a => a.status === 'queued');
        if (next) {
          await supabase.from('question_assignments').update({ status: 'active' }).eq('id', next.id);
        }
        setLastResult('Marked done — next question up');
        setState('success');
        onAssigned?.();
      } else {
        setLastResult('Nothing active to mark done');
        setState('error');
      }
      return;
    }

    if (cmd.type === 'assign' && cmd.panelistMatch) {
      // Find next unassigned pending question
      const assignedIds = new Set(assignments.map(a => a.question_id));
      const pending = questions.filter(q => q.status === 'pending' && !assignedIds.has(q.id));

      if (pending.length === 0) {
        setLastResult('No unassigned questions in queue');
        setState('error');
        return;
      }

      const targetQ = pending[0];
      const queuedCount = assignments.filter(a => a.status !== 'done').length;

      // If nothing active, push straight to active
      const hasActive = assignments.some(a => a.status === 'active');
      const newStatus = hasActive ? 'queued' : 'active';

      const { error } = await supabase.from('question_assignments').insert({
        question_id: targetQ.id,
        panelist_id: cmd.panelistMatch.id,
        room_id: roomId,
        status: newStatus,
        queue_position: queuedCount,
      });

      if (error) {
        setLastResult('Assignment failed');
        setState('error');
      } else {
        const pName = `${cmd.panelistMatch.title ? cmd.panelistMatch.title + ' ' : ''}${cmd.panelistMatch.name}`;
        setLastResult(`Assigned to ${pName}${newStatus === 'active' ? ' — now live' : ' — queued'}`);
        setState('success');
        onAssigned?.();
        fetchAssignments();
      }
      return;
    }

    setLastResult(`Didn't catch that — try "Prof Barry, take this" or "Done"`);
    setState('error');
  }, [assignments, questions, panelists, roomId, onAssigned, fetchAssignments]);

  // ── SPEECH RECOGNITION SETUP ───────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState('listening');
      setTranscript('');
    };

    recognition.onresult = (e: any) => {
      const current = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(current);

      // If final result
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript;
        const cmd = parseVoiceCommand(final, panelists, questions);
        executeCommand(cmd);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'aborted') {
        setState('error');
        setLastResult('Mic error — try again');
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      if (state === 'listening') setState('idle');
    };

    recognitionRef.current = recognition;
  }, [panelists, questions, executeCommand]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (listeningRef.current) {
      recognitionRef.current.stop();
      listeningRef.current = false;
      setState('idle');
    } else {
      try {
        recognitionRef.current.start();
        listeningRef.current = true;
        setState('listening');
        // Reset after 3s of success/error
        if (state === 'success' || state === 'error') {
          setTranscript('');
          setLastResult('');
        }
      } catch (e) {
        // Already started
      }
    }
  };

  // Auto-reset success/error after 4s
  useEffect(() => {
    if (state === 'success' || state === 'error') {
      const t = setTimeout(() => { setState('idle'); setTranscript(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!isSupported) return (
    <div style={{ padding: '16px 20px', background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: 14 }}>
      <p style={{ fontFamily: cond, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,120,120,0.7)' }}>
        Voice commands not supported in this browser — use Chrome
      </p>
    </div>
  );

  const isListening = state === 'listening';

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 20, overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(245,240,232,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={13} color="#d4ff4e" />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f5f0e8' }}>Voice Commander</span>
        </div>
        <Waveform active={isListening} />
      </div>

      {/* BODY */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* TRANSCRIPT */}
        <TranscriptBubble text={state === 'success' || state === 'error' ? lastResult : transcript} state={state} />

        {/* MIC BUTTON */}
        <button
          onClick={toggleListen}
          style={{
            width: '100%', height: 56, border: 'none', borderRadius: 14, cursor: 'pointer',
            background: isListening ? '#d4ff4e' : 'rgba(245,240,232,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.2s, transform 0.1s',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isListening ? 'on' : 'off'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isListening
                ? <><MicOff size={16} color="#060606" /><span style={{ fontFamily: cond, fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: '#060606' }}>STOP</span></>
                : <><Mic size={16} color="rgba(245,240,232,0.5)" /><span style={{ fontFamily: cond, fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(245,240,232,0.4)' }}>HOLD TO COMMAND</span></>
              }
            </motion.div>
          </AnimatePresence>
        </button>

        {/* COMMAND HINTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontFamily: cond, fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)', marginBottom: 4 }}>Example Commands</p>
          {[
            `"Prof Barry, take that question"`,
            `"Dr. Okon, this one's yours"`,
            `"Done" / "Next" / "Move on"`,
          ].map(hint => (
            <div key={hint} style={{ padding: '8px 12px', background: 'rgba(245,240,232,0.02)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 8 }}>
              <p style={{ fontFamily: serif, fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(245,240,232,0.3)' }}>{hint}</p>
            </div>
          ))}
        </div>

        {/* PANELISTS IN SESSION */}
        {panelists.length > 0 && (
          <div>
            <p style={{ fontFamily: cond, fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)', marginBottom: 8 }}>Recognized Names</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {panelists.map(p => (
                <span key={p.id} style={{ padding: '5px 10px', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 8, fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(245,240,232,0.35)' }}>
                  {p.title ? `${p.title} ` : ''}{p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}