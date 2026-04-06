'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft,
  Loader2,
  ExternalLink,
  Mic,
  MicOff,
  X,
  User,
  ChevronRight,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Tab = 'control' | 'panelist' | 'polls';

interface Panelist {
  id: string;
  name: string;
  title?: string;
  room_id: string;
  created_at: string;
}

interface Question {
  id: string;
  content: string;
  status: string;
  is_projected: boolean;
  guest_name?: string;
  created_at: string;
}

interface Assignment {
  id: string;
  question_id: string;
  panelist_id: string;
  room_id: string;
  status: 'queued' | 'active' | 'done';
  queue_position: number;
  questions?: Question;
}

interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  poll_options?: { id: string; text: string }[];
}

// -----------------------------------------------------------------------
// VOICE HOOK
// -----------------------------------------------------------------------
function useVoice(onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error('Voice error — try again');
    };
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      onResult(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop };
}

// -----------------------------------------------------------------------
// PANELIST SLIDE-OVER
// -----------------------------------------------------------------------
function PanelistSlideOver({
  panelist,
  assignments,
  queue,
  roomId,
  slug,
  onClose,
  onRefresh,
}: {
  panelist: Panelist;
  assignments: Assignment[];
  queue: Question[];
  roomId: string;
  slug: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const myAssignments = assignments
    .filter((a) => a.panelist_id === panelist.id)
    .sort((a, b) => a.queue_position - b.queue_position);

  const assignedIds = new Set(myAssignments.map((a) => a.question_id));
  const unassigned = queue.filter((q) => !assignedIds.has(q.id));

  const assignQuestion = async (questionId: string) => {
    const maxPos = myAssignments.length
      ? Math.max(...myAssignments.map((a) => a.queue_position))
      : 0;

    const { error } = await supabase.from('question_assignments').insert({
      question_id: questionId,
      panelist_id: panelist.id,
      room_id: roomId,
      status: 'queued',
      queue_position: maxPos + 1,
    });

    if (error) { toast.error('Failed to assign question'); return; }
    onRefresh();
  };

  const updateStatus = async (
    assignmentId: string,
    status: 'queued' | 'active' | 'done'
  ) => {
    await supabase
      .from('question_assignments')
      .update({ status })
      .eq('id', assignmentId);
    onRefresh();
  };

  const removeAssignment = async (assignmentId: string) => {
    await supabase.from('question_assignments').delete().eq('id', assignmentId);
    onRefresh();
  };

  const movePosition = async (assignment: Assignment, direction: 'up' | 'down') => {
    const idx = myAssignments.findIndex((a) => a.id === assignment.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= myAssignments.length) return;
    const swap = myAssignments[swapIdx];

    await Promise.all([
      supabase
        .from('question_assignments')
        .update({ queue_position: swap.queue_position })
        .eq('id', assignment.id),
      supabase
        .from('question_assignments')
        .update({ queue_position: assignment.queue_position })
        .eq('id', swap.id),
    ]);
    onRefresh();
  };

  const statusColor: Record<string, string> = {
    queued: 'bg-black/5 text-black/40',
    active: 'bg-green-100 text-green-700',
    done: 'bg-black/5 text-black/30 line-through',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">

        {/* header */}
        <div className="px-6 pt-8 pb-6 border-b border-black/5 flex items-start justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-3">
              <User size={18} className="text-black/40" />
            </div>
            <h2 className="text-xl font-medium">{panelist.name}</h2>
            {panelist.title && (
              <p className="text-sm text-black/40 mt-0.5">{panelist.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => {
                const url = `${window.location.origin}/room/${slug}/panelist/${panelist.id}`;
                navigator.clipboard.writeText(url);
                toast.success('Link copied');
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-black/10 text-black/40 hover:text-black hover:border-black/30 transition flex items-center gap-1.5"
            >
              <ExternalLink size={11} />
              Copy link
            </button>
            <button onClick={onClose} className="text-black/30 hover:text-black transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* assigned questions */}
          <div>
            <div className="text-xs uppercase text-black/30 mb-3 tracking-wider">
              Assigned Questions ({myAssignments.length})
            </div>

            {myAssignments.length === 0 ? (
              <div className="text-sm text-black/30 italic">No questions assigned yet</div>
            ) : (
              <div className="space-y-2">
                {myAssignments.map((a, idx) => (
                  <div
                    key={a.id}
                    className="bg-[#fafafa] border border-black/5 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-black/70 flex-1 leading-relaxed">
                        "{a.questions?.content}"
                      </p>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => movePosition(a, 'up')}
                          disabled={idx === 0}
                          className="text-black/20 hover:text-black disabled:opacity-0 transition"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => movePosition(a, 'down')}
                          disabled={idx === myAssignments.length - 1}
                          className="text-black/20 hover:text-black disabled:opacity-0 transition"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1">
                        {(['queued', 'active', 'done'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(a.id, s)}
                            className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition border
                              ${a.status === s
                                ? statusColor[s] + ' border-transparent'
                                : 'border-black/10 text-black/30 hover:text-black'
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => removeAssignment(a.id)}
                        className="text-black/20 hover:text-red-500 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* assign from queue */}
          {unassigned.length > 0 && (
            <div>
              <div className="text-xs uppercase text-black/30 mb-3 tracking-wider">
                Assign from Queue
              </div>
              <div className="space-y-2">
                {unassigned.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => assignQuestion(q.id)}
                    className="cursor-pointer group flex items-center justify-between bg-white border border-black/5 hover:border-black/20 rounded-xl p-4 transition"
                  >
                    <p className="text-sm text-black/50 group-hover:text-black transition leading-relaxed">
                      "{q.content.slice(0, 80)}{q.content.length > 80 ? '…' : ''}"
                    </p>
                    <ChevronRight
                      size={14}
                      className="text-black/20 group-hover:text-black transition shrink-0 ml-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------
export default function RoomControlPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [activeTab, setActiveTab] = useState<Tab>('control');
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPanelist, setSelectedPanelist] = useState<Panelist | null>(null);

  const refreshTimer = useRef<any>(null);
  const [newPanelist, setNewPanelist] = useState({ name: '', title: '' });
  const [newPoll, setNewPoll] = useState({ question: '', options: [''] });

  // -----------------------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------------------
  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .single();

      if (roomErr || !roomData) { toast.error('Room not found'); return; }

      setRoom(roomData);
      const roomId = roomData.id;

      const [
        { data: qData },
        { data: pData },
        { data: pollData },
        { data: assignData },
      ] = await Promise.all([
        supabase
          .from('questions')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false }),
        supabase.from('panelists').select('*').eq('room_id', roomId),
        supabase.from('polls').select('*, poll_options(*)').eq('room_id', roomId),
        supabase
          .from('question_assignments')
          .select('*, questions(*)')
          .eq('room_id', roomId),
      ]);

      setQuestions(qData || []);
      setPanelists(pData || []);
      setPolls(pollData || []);
      setAssignments(assignData || []);
    } catch {
      toast.error('Failed to load room');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // REALTIME
  // -----------------------------------------------------------------------
  useEffect(() => {
    fetchData(true);

    const channel = supabase
      .channel(`room_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panelists' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_assignments' }, () => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => fetchData(), 200);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(refreshTimer.current);
    };
  }, [slug]);

  // -----------------------------------------------------------------------
  // VOICE
  // -----------------------------------------------------------------------
  const handleVoiceResult = useCallback(
    async (transcript: string) => {
      if (!room) return;
      const lower = transcript.toLowerCase();

      // "add [name] as [title]" or "add [name]"
      const addMatchFull = lower.match(/^add\s+(.+?)\s+as\s+(.+)$/i);
      const addMatchSimple = lower.match(/^add\s+(.+)$/i);

      // "remove [name]"
      const removeMatch = lower.match(/^remove\s+(.+)$/i);

      if (addMatchFull) {
        const name = addMatchFull[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
        const title = addMatchFull[2].trim();
        const { error } = await supabase.from('panelists').insert({ room_id: room.id, name, title });
        error ? toast.error('Failed to add panelist') : toast.success(`Added ${name}`);
        return;
      }

      if (addMatchSimple) {
        const name = addMatchSimple[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
        const { error } = await supabase.from('panelists').insert({ room_id: room.id, name });
        error ? toast.error('Failed to add panelist') : toast.success(`Added ${name}`);
        return;
      }

      if (removeMatch) {
        const spoken = removeMatch[1].trim().toLowerCase();
        const match = panelists.find((p) => p.name.toLowerCase().includes(spoken));
        if (!match) { toast.error(`No panelist matching "${spoken}"`); return; }
        const { error } = await supabase.from('panelists').delete().eq('id', match.id);
        error ? toast.error('Failed to remove panelist') : toast.success(`Removed ${match.name}`);
        return;
      }

      toast(`Didn't understand: "${transcript}"`, { icon: '🤔' });
    },
    [room, panelists]
  );

  const { listening, start, stop } = useVoice(handleVoiceResult);

  // -----------------------------------------------------------------------
  // QUESTION ACTIONS
  // -----------------------------------------------------------------------
  const handleStageAction = async (
    id: string,
    action: 'push' | 'withdraw' | 'archive'
  ) => {
    if (!room) return;

    setQuestions((prev) =>
      prev.map((q) => {
        if (action === 'push') return { ...q, is_projected: q.id === id };
        if (action === 'withdraw')
          return { ...q, is_projected: q.id === id ? false : q.is_projected };
        if (action === 'archive')
          return {
            ...q,
            is_projected: q.id === id ? false : q.is_projected,
            status: q.id === id ? 'answered' : q.status,
          };
        return q;
      })
    );

    try {
      if (action === 'push') {
        await supabase.from('questions').update({ is_projected: false }).eq('room_id', room.id);
        await supabase.from('questions').update({ is_projected: true }).eq('id', id);
      }
      if (action === 'withdraw') {
        await supabase.from('questions').update({ is_projected: false }).eq('id', id);
      }
      if (action === 'archive') {
        await supabase.from('questions').update({ status: 'answered', is_projected: false }).eq('id', id);
      }
    } catch {
      toast.error('Action failed');
      fetchData();
    }
  };

  // -----------------------------------------------------------------------
  // PANELIST ACTIONS
  // -----------------------------------------------------------------------
  const addPanelist = async () => {
    if (!room || !newPanelist.name) return;
    const { error } = await supabase.from('panelists').insert({
      room_id: room.id,
      name: newPanelist.name,
      title: newPanelist.title,
    });
    if (error) { toast.error('Failed to add panelist'); return; }
    setNewPanelist({ name: '', title: '' });
  };

  const removePanelist = async (id: string) => {
    await supabase.from('panelists').delete().eq('id', id);
  };

  // -----------------------------------------------------------------------
  // POLL ACTIONS
  // -----------------------------------------------------------------------
  const addPollOption = () =>
    setNewPoll((p) => ({ ...p, options: [...p.options, ''] }));

  const createPoll = async () => {
    if (!room || !newPoll.question) return;
    const { data: poll, error } = await supabase
      .from('polls')
      .insert({ room_id: room.id, question: newPoll.question })
      .select()
      .single();
    if (error || !poll) { toast.error('Failed to create poll'); return; }
    await supabase.from('poll_options').insert(
      newPoll.options
        .filter((o) => o.trim())
        .map((text, i) => ({ poll_id: poll.id, text, position: i }))
    );
    setNewPoll({ question: '', options: [''] });
  };

  const togglePollActive = async (poll: Poll) => {
    await supabase.from('polls').update({ is_active: !poll.is_active }).eq('id', poll.id);
  };

  // -----------------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="animate-spin opacity-60" />
      </div>
    );
  }

  const activeQuestion = questions.find((q) => q.is_projected);
  const queue = questions.filter((q) => !q.is_projected && q.status !== 'answered');
  const history = questions.filter((q) => q.status === 'answered');

  // -----------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-white text-black px-6 py-10">

      {/* PANELIST SLIDE-OVER */}
      {selectedPanelist && (
        <PanelistSlideOver
          panelist={selectedPanelist}
          assignments={assignments}
          queue={queue}
          roomId={room.id}
          slug={slug}
          onClose={() => setSelectedPanelist(null)}
          onRefresh={() => fetchData()}
        />
      )}

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/leader" className="text-black/40 hover:text-black">
            <ChevronLeft />
          </Link>
          <div>
            <h1 className="text-lg font-medium">{room?.name}</h1>
            <p className="text-xs text-black/40">/{slug}</p>
          </div>
        </div>
        <Link
          href={`/projector/${slug}`}
          target="_blank"
          className="text-xs px-4 py-2 rounded-full border border-black/10 hover:border-black/30 transition flex items-center gap-2"
        >
          Stage View
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* TAB BAR */}
      <div className="max-w-6xl mx-auto mb-8 flex gap-2 text-xs">
        {(['control', 'panelist', 'polls'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full border transition capitalize
            ${activeTab === tab
                ? 'bg-black text-white border-black'
                : 'border-black/10 text-black/50 hover:text-black'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-10">

        {/* LEFT */}
        <div className="space-y-8">

          {/* CONTROL TAB */}
          {activeTab === 'control' && (
            <>
              <section className="bg-[#fafafa] border border-black/5 p-8 rounded-2xl">
                <div className="flex justify-between mb-6">
                  <div className="flex items-center gap-2 text-green-600 text-xs uppercase">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </div>
                  {activeQuestion && (
                    <div className="flex gap-3 text-xs items-center">
                      <button
                        onClick={() => handleStageAction(activeQuestion.id, 'withdraw')}
                        className="text-black/40 hover:text-black transition"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => handleStageAction(activeQuestion.id, 'archive')}
                        className="bg-black text-white px-3 py-1 rounded-md"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
                {activeQuestion ? (
                  <h2 className="text-3xl font-medium">"{activeQuestion.content}"</h2>
                ) : (
                  <div className="text-black/30 text-sm">No active question</div>
                )}
              </section>

              <section className="bg-white border border-black/5 p-6 rounded-2xl">
                <div className="text-xs uppercase text-black/40 mb-4">
                  Queue ({queue.length})
                </div>
                <div className="space-y-2">
                  {queue.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handleStageAction(q.id, 'push')}
                      className="cursor-pointer text-black/60 hover:text-black transition py-1"
                    >
                      "{q.content.slice(0, 90)}{q.content.length > 90 ? '…' : ''}"
                    </div>
                  ))}
                  {queue.length === 0 && (
                    <div className="text-sm text-black/20 italic">Queue is empty</div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* PANELIST TAB */}
          {activeTab === 'panelist' && (
            <div className="space-y-6">

              <section className="bg-[#fafafa] border border-black/5 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase text-black/40">Add Panelist</div>
                  <button
                    onClick={listening ? stop : start}
                    className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition
                      ${listening
                        ? 'bg-red-500 text-white border-red-500 animate-pulse'
                        : 'border-black/10 text-black/50 hover:text-black hover:border-black/30'
                      }`}
                  >
                    {listening ? <MicOff size={12} /> : <Mic size={12} />}
                    {listening ? 'Listening…' : 'Voice'}
                  </button>
                </div>

                {listening && (
                  <div className="text-xs text-black/40 bg-black/[0.03] rounded-lg px-3 py-2 leading-relaxed">
                    Try:{' '}
                    <span className="font-medium text-black/60">"Add John Smith as CEO"</span>
                    {' '}or{' '}
                    <span className="font-medium text-black/60">"Remove John"</span>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    value={newPanelist.name}
                    onChange={(e) => setNewPanelist((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Panelist name"
                    className="w-full border border-black/10 p-2 rounded-md text-sm focus:outline-none focus:border-black/30"
                  />
                  <input
                    value={newPanelist.title}
                    onChange={(e) => setNewPanelist((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title / role"
                    className="w-full border border-black/10 p-2 rounded-md text-sm focus:outline-none focus:border-black/30"
                  />
                  <button
                    onClick={addPanelist}
                    className="text-xs px-3 py-2 bg-black text-white rounded-md"
                  >
                    Add Panelist
                  </button>
                </div>
              </section>

              {/* panelist cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {panelists.map((p) => {
                  const count = assignments.filter(
                    (a) => a.panelist_id === p.id && a.status !== 'done'
                  ).length;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPanelist(p)}
                      className="group cursor-pointer bg-[#fafafa] border border-black/5 hover:border-black/20 p-5 rounded-2xl transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                          <User size={15} className="text-black/30" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          {p.title && (
                            <div className="text-xs text-black/40">{p.title}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => { e.stopPropagation(); removePanelist(p.id); }}
                            className="text-black/20 hover:text-red-500 transition p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={14} className="text-black/30" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {panelists.length === 0 && (
                  <div className="col-span-2 text-sm text-black/30 italic">
                    No panelists yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <section className="space-y-4">
              <div className="bg-[#fafafa] border border-black/5 p-6 rounded-2xl space-y-3">
                <div className="text-xs uppercase text-black/40">Create Poll</div>
                <input
                  value={newPoll.question}
                  onChange={(e) => setNewPoll((p) => ({ ...p, question: e.target.value }))}
                  placeholder="Poll question"
                  className="w-full border border-black/10 p-2 rounded-md text-sm focus:outline-none focus:border-black/30"
                />
                <div className="space-y-2">
                  {newPoll.options.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...newPoll.options];
                        copy[i] = e.target.value;
                        setNewPoll((p) => ({ ...p, options: copy }));
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="w-full border border-black/10 p-2 rounded-md text-sm focus:outline-none focus:border-black/30"
                    />
                  ))}
                </div>
                <div className="flex gap-3 items-center">
                  <button onClick={addPollOption} className="text-xs text-black/50 hover:text-black transition">
                    + Add option
                  </button>
                  <button onClick={createPoll} className="text-xs px-3 py-2 bg-black text-white rounded-md">
                    Publish Poll
                  </button>
                </div>
              </div>

              {polls.map((poll) => (
                <div key={poll.id} className="bg-[#fafafa] border border-black/5 p-6 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-medium text-sm">{poll.question}</div>
                    <button
                      onClick={() => togglePollActive(poll)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ml-3 transition
                        ${poll.is_active
                          ? 'bg-green-100 text-green-700 border-transparent'
                          : 'border-black/10 text-black/40 hover:text-black'
                        }`}
                    >
                      {poll.is_active ? 'Live' : 'Activate'}
                    </button>
                  </div>
                  <div className="space-y-1.5 text-sm text-black/50">
                    {poll.poll_options?.map((opt) => (
                      <div key={opt.id}>• {opt.text}</div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* RIGHT — HISTORY */}
        <aside className="space-y-4">
          <div className="text-xs uppercase text-black/40">History</div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {history.map((q) => (
              <div key={q.id} className="bg-[#fafafa] border border-black/5 p-4 rounded-xl">
                <p className="text-sm text-black/50 italic">"{q.content}"</p>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-sm text-black/20 italic">No answered questions yet</div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}