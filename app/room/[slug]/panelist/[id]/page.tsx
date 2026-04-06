'use client';

import { useState, useEffect, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface Panelist {
  id: string;
  name: string;
  title?: string;
}

interface Question {
  id: string;
  content: string;
  guest_name?: string;
}

interface Assignment {
  id: string;
  question_id: string;
  panelist_id: string;
  status: 'queued' | 'active' | 'done';
  queue_position: number;
  questions?: Question;
}

interface ActiveQuestion {
  id: string;
  content: string;
  is_projected: boolean;
  guest_name?: string;
}

export default function PanelistScreen({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);

  const [panelist, setPanelist] = useState<Panelist | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const refreshTimer = useRef<any>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (roomErr || !roomData) return;

      const [
        { data: pData, error: pErr },
        { data: aData },
        { data: qData },
      ] = await Promise.all([
        supabase.from('panelists').select('*').eq('id', id).single(),
        supabase
          .from('question_assignments')
          .select('*, questions(*)')
          .eq('panelist_id', id)
          .eq('room_id', roomData.id)
          .order('queue_position', { ascending: true }),
        supabase
          .from('questions')
          .select('*')
          .eq('room_id', roomData.id.toString())
          .eq('is_projected', true)
          .limit(1),
      ]);

      if (pErr || !pData) return;
      setPanelist(pData);
      setAssignments(aData || []);
      setActiveQuestion(qData?.[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const channel = supabase
      .channel(`panelist_screen_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_assignments' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(refreshTimer.current);
    };
  }, [slug, id]);

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-white/20" size={24} />
      </div>
    );
  }

  if (!panelist) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-3">
        <p className="text-white/20 text-sm tracking-widest uppercase">Panelist not found</p>
        <p className="text-white/10 text-xs">Use the link from the control panel</p>
      </div>
    );
  }

  const queued = assignments.filter((a) => a.status === 'queued');
  const active = assignments.filter((a) => a.status === 'active');
  const done = assignments.filter((a) => a.status === 'done');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0a0a0a', color: '#f0ede8', fontFamily: 'ui-monospace, monospace' }}
    >
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-8 pt-8">
        <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.2)' }}>
          {slug}
        </span>
        <span style={{ fontSize: 11, letterSpacing: '0.15em', color: 'rgba(240,237,232,0.2)', fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>
      </header>

      {/* BODY */}
      <main className="flex-1 px-8 pb-8 pt-10 w-full max-w-3xl mx-auto space-y-8">

        {/* IDENTITY */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.25)', marginBottom: 8 }}>
            You are
          </p>
          <h1 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.15, color: '#f0ede8', fontFamily: 'Georgia, serif' }}>
            {panelist.name}
          </h1>
          {panelist.title && (
            <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.3)', marginTop: 8, letterSpacing: '0.05em' }}>
              {panelist.title}
            </p>
          )}
        </div>

        {/* ON STAGE NOW */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 0 0 rgba(134,239,172,0.4)', animation: 'pulse 2s infinite' }}
            />
            <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.25)' }}>
              On Stage Now
            </span>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: activeQuestion ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
              border: activeQuestion ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.5s ease',
            }}
          >
            {activeQuestion ? (
              <>
                <p style={{ fontSize: 22, lineHeight: 1.6, color: 'rgba(240,237,232,0.9)', fontFamily: 'Georgia, serif' }}>
                  "{activeQuestion.content}"
                </p>
                {activeQuestion.guest_name && (
                  <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.3)', marginTop: 12, letterSpacing: '0.05em' }}>
                    — {activeQuestion.guest_name}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.2)', fontStyle: 'italic' }}>
                No question on stage yet
              </p>
            )}
          </div>
        </div>

        {/* YOUR QUEUE */}
        {(active.length > 0 || queued.length > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.25)' }}>
                Your Queue
              </span>
              <span style={{
                fontSize: 10, background: 'rgba(255,255,255,0.05)',
                color: 'rgba(240,237,232,0.3)', padding: '2px 8px', borderRadius: 99,
              }}>
                {active.length + queued.length}
              </span>
            </div>

            <div className="space-y-2">
              {[...active, ...queued].map((a, i) => (
                <div
                  key={a.id}
                  className="rounded-xl px-5 py-4"
                  style={
                    a.status === 'active'
                      ? { background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', color: '#86efac' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(240,237,232,0.5)' }
                  }
                >
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 10, opacity: 0.4, marginTop: 2, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {a.questions?.content}
                    </p>
                  </div>
                  {a.status === 'active' && (
                    <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginTop: 8, marginLeft: 22 }}>
                      Up next
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        {done.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.15)' }}>
                Answered
              </span>
              <span style={{
                fontSize: 10, background: 'rgba(255,255,255,0.03)',
                color: 'rgba(240,237,232,0.2)', padding: '2px 8px', borderRadius: 99,
              }}>
                {done.length}
              </span>
            </div>
            <div className="space-y-2">
              {done.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl px-5 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    color: 'rgba(240,237,232,0.2)',
                    textDecoration: 'line-through',
                  }}
                >
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{a.questions?.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY */}
        {assignments.length === 0 && (
          <div className="text-center py-16">
            <p style={{ fontSize: 28, fontFamily: 'Georgia, serif', color: 'rgba(240,237,232,0.1)', fontStyle: 'italic' }}>
              Nothing assigned yet
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.15)', marginTop: 12, letterSpacing: '0.05em' }}>
              The moderator will assign questions to you shortly
            </p>
          </div>
        )}

      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(134,239,172,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(134,239,172,0); }
        }
      `}</style>
    </div>
  );
}