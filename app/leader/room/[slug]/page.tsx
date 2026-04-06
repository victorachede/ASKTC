'use client';

<<<<<<< HEAD
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
=======
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Trash2, User, ExternalLink, Loader2,
  Play, Zap, RotateCcw, Users, Activity, ArrowRight,
  MonitorOff, CheckCircle2, Pin, BarChart2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PanelistModerator from '@/components/PanelistModerator';
import VoiceCommander from '@/components/VoiceCommander';
import PollCreator from '@/components/PollCreator';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap';

type Tab = 'control' | 'panelist' | 'polls';

export default function RoomControlPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('control');
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [panelists, setPanelists] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase.from('rooms').select('*').eq('slug', slug).single();
      if (roomError || !roomData) throw new Error('Room not found');
      setRoom(roomData);

      const { data: qData } = await supabase
        .from('questions').select('*, upvotes(count)')
        .eq('room_id', roomData.id).order('created_at', { ascending: true });
      setQuestions(qData || []);

      const { data: pData } = await supabase
        .from('panelists').select('*')
        .eq('room_id', roomData.id).order('created_at', { ascending: true });
      setPanelists(pData || []);

      const { data: pollData } = await supabase
        .from('polls').select('*, poll_options(*), poll_votes(*)')
        .eq('room_id', roomData.id).order('created_at', { ascending: false });
      setPolls(pollData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel(`room_control_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upvotes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panelists' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  const handleStageAction = async (id: string, action: 'push' | 'withdraw' | 'archive') => {
    try {
      if (action === 'push') {
        await supabase.from('questions').update({ is_projected: false }).eq('room_id', room.id).eq('is_projected', true);
        const { error } = await supabase.from('questions').update({ status: 'answered', is_projected: true }).eq('id', id);
        if (error) throw error;
        toast.success('Signal live');
      } else if (action === 'withdraw') {
        const { error } = await supabase.from('questions').update({ status: 'pending', is_projected: false }).eq('id', id);
        if (error) throw error;
        toast.success('Signal withdrawn');
      } else if (action === 'archive') {
        const { error } = await supabase.from('questions').update({ status: 'answered', is_projected: false }).eq('id', id);
        if (error) throw error;
        toast.success('Resolved and archived');
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const pinQuestion = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase.from('questions').update({ is_pinned: !currentPinned }).eq('id', id);
    if (error) toast.error('Pin failed');
    else toast.success(currentPinned ? 'Unpinned' : 'Pinned to top');
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) toast.error('Delete failed');
  };

  if (loading) return (
    <div style={{ height: '100vh', background: '#060606', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Loader2 size={28} color="#d4ff4e" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)' }}>Syncing</span>
    </div>
  );

  const activeQuestion = questions.find(q => q.is_projected === true);
  const pendingQueue = questions
    .filter(q => q.status === 'pending' && !q.is_projected)
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (b.upvotes?.[0]?.count || 0) - (a.upvotes?.[0]?.count || 0);
    });
  const nextUp = pendingQueue[0];
  const upcoming = pendingQueue.slice(1);
  const history = questions.filter(q => q.status === 'answered' && !q.is_projected).reverse();

  const TABS: { key: Tab; label: string; icon?: any }[] = [
    { key: 'control', label: 'Control' },
    { key: 'panelist', label: 'Panelists', icon: Users },
    { key: 'polls', label: 'Polls', icon: BarChart2 },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#060606', color: '#f5f0e8', fontFamily: sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('${fontUrl}');
        * { box-sizing: border-box; }
        .scrollbar::-webkit-scrollbar { width: 3px; }
        .scrollbar::-webkit-scrollbar-thumb { background: rgba(212,255,78,0.1); border-radius: 10px; }
        .tab-btn { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); border: none; cursor: pointer; }
        .withdraw-btn:hover { color: rgba(255,80,80,0.8) !important; border-color: rgba(255,80,80,0.2) !important; background: rgba(255,80,80,0.04) !important; }
        .push-btn:hover { transform: scale(1.03); }
        .push-btn:active { transform: scale(0.97); }
        .history-card { opacity: 0.35; transition: opacity 0.2s; }
        .history-card:hover { opacity: 1; }
        @keyframes pip { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pip { animation: pip 2s ease infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* GRAIN */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* NAV */}
      <nav style={{ height: 64, borderBottom: '1px solid rgba(245,240,232,0.05)', background: 'rgba(6,6,6,0.92)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 100, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <Link href="/leader" style={{ color: 'rgba(245,240,232,0.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <ChevronLeft size={20} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(1rem,3vw,1.4rem)', fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '28vw' }}>{room?.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <Activity size={9} color="#d4ff4e" className="pip" />
              <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>asktc.app/{slug}</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 100, padding: 4, gap: 2, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="tab-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 100, fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: activeTab === t.key ? '#060606' : 'rgba(245,240,232,0.3)', background: activeTab === t.key ? '#d4ff4e' : 'transparent' }}>
              {t.icon && <t.icon size={10} />}
              {t.label}
            </button>
          ))}
        </div>

        <Link href={`/projector/${slug}`} target="_blank"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: '1px solid rgba(212,255,78,0.25)', color: '#d4ff4e', borderRadius: 100, fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d4ff4e'; (e.currentTarget as HTMLElement).style.color = '#060606'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#d4ff4e'; }}>
          Stage View <ExternalLink size={11} />
        </Link>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 28px 80px' }}>
        <AnimatePresence mode="wait">

          {/* ── PANELIST TAB ── */}
          {activeTab === 'panelist' && (
            <motion.div key="panelist"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
              <PanelistModerator roomId={room.id} slug={slug} questions={questions} />
              <div style={{ position: 'sticky', top: 80 }}>
                <VoiceCommander roomId={room.id} slug={slug} questions={questions} panelists={panelists} onAssigned={fetchData} />
              </div>
            </motion.div>
          )}

          {/* ── POLLS TAB ── */}
          {activeTab === 'polls' && (
            <motion.div key="polls"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ maxWidth: 640 }}>
              <PollCreator roomId={room.id} polls={polls} onRefresh={fetchData} />
            </motion.div>
          )}

          {/* ── CONTROL TAB ── */}
          {activeTab === 'control' && (
            <motion.div key="control"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>

              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* LIVE STAGE */}
                <section style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 24, padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
                  {activeQuestion && <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: '70%', height: 160, background: 'radial-gradient(ellipse, rgba(212,255,78,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pip" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block' }} />
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#d4ff4e' }}>Live Program</span>
                    </div>

                    {activeQuestion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => handleStageAction(activeQuestion.id, 'withdraw')} className="withdraw-btn"
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(245,240,232,0.1)', background: 'transparent', color: 'rgba(245,240,232,0.5)', fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <MonitorOff size={13} /> Withdraw
                        </button>
                        <button onClick={() => handleStageAction(activeQuestion.id, 'archive')}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, border: 'none', background: '#d4ff4e', color: '#060606', fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                          <CheckCircle2 size={13} /> Mark Answered
                        </button>
                      </div>
                    )}
                  </div>

                  {activeQuestion ? (
                    <div style={{ position: 'relative' }}>
                      <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.05, color: '#f5f0e8', marginBottom: 20 }}>
                        "{activeQuestion.content}"
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 100 }}>
                          <User size={10} color="rgba(245,240,232,0.3)" />
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)' }}>{activeQuestion.guest_name || 'Anonymous'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Zap size={10} color="rgba(212,255,78,0.5)" fill="rgba(212,255,78,0.5)" />
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,255,78,0.5)' }}>{activeQuestion.upvotes?.[0]?.count || 0} heat</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '48px 0', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.06)', borderRadius: 16 }}>
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.1)' }}>Frequency Silent</p>
                    </div>
                  )}
                </section>

                {/* NEXT UP + QUEUE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* NEXT UP */}
                  <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.06)', borderRadius: 20, padding: '28px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>Up Next</span>
                      {nextUp && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => pinQuestion(nextUp.id, nextUp.is_pinned)} title={nextUp.is_pinned ? 'Unpin' : 'Pin to top'}
                            style={{ padding: '6px 10px', background: nextUp.is_pinned ? 'rgba(212,255,78,0.1)' : 'transparent', border: `1px solid ${nextUp.is_pinned ? 'rgba(212,255,78,0.3)' : 'rgba(245,240,232,0.1)'}`, borderRadius: 8, cursor: 'pointer', color: nextUp.is_pinned ? '#d4ff4e' : 'rgba(245,240,232,0.3)', transition: 'all 0.2s' }}>
                            <Pin size={11} />
                          </button>
                          <button onClick={() => handleStageAction(nextUp.id, 'push')} className="push-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 10, fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'transform 0.15s' }}>
                            <Play size={10} fill="#060606" /> Push Live
                          </button>
                        </div>
                      )}
                    </div>
                    {nextUp ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          {nextUp.is_pinned && <Pin size={10} color="#d4ff4e" />}
                          {(nextUp.upvotes?.[0]?.count || 0) > 0 && <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(212,255,78,0.5)' }}>★ {nextUp.upvotes[0].count}</span>}
                        </div>
                        <p style={{ fontFamily: serif, fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.35, color: 'rgba(245,240,232,0.7)', marginBottom: 10 }}>"{nextUp.content}"</p>
                        <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4ff4e' }}>{nextUp.guest_name}</span>
                      </div>
                    ) : (
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.08)' }}>Queue empty</p>
                    )}
                  </div>

                  {/* WAITING LINE */}
                  <div style={{ background: 'rgba(245,240,232,0.02)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 20, padding: '28px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>Waiting Line</span>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(245,240,232,0.2)' }}>{upcoming.length}</span>
                    </div>
                    <div className="scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
                      {upcoming.length === 0 ? (
                        <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.06)', textAlign: 'center', paddingTop: 20 }}>Empty</p>
                      ) : upcoming.map(q => (
                        <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(245,240,232,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            {q.is_pinned && <Pin size={9} color="#d4ff4e" style={{ flexShrink: 0 }} />}
                            <p style={{ fontFamily: serif, fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(245,240,232,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{q.content}"</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => pinQuestion(q.id, q.is_pinned)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: q.is_pinned ? '#d4ff4e' : 'rgba(245,240,232,0.15)', transition: 'color 0.2s' }}>
                              <Pin size={11} />
                            </button>
                            <button onClick={() => handleStageAction(q.id, 'push')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.2)', transition: 'color 0.2s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#d4ff4e')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.2)')}>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — HISTORY LOG */}
              <div style={{ borderLeft: '1px solid rgba(245,240,232,0.05)', paddingLeft: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>History Log</span>
                  <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(245,240,232,0.15)' }}>{history.length} handled</span>
                </div>

                <div className="scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 }}>
                  {history.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed rgba(245,240,232,0.05)', borderRadius: 16 }}>
                      <p style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.08)' }}>Clear</p>
                    </div>
                  ) : history.map(q => (
                    <div key={q.id} className="history-card" style={{ padding: '18px 20px', background: 'rgba(245,240,232,0.01)', border: '1px solid rgba(245,240,232,0.05)', borderRadius: 14 }}>
                      <p style={{ fontFamily: serif, fontSize: '1rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(245,240,232,0.5)', lineHeight: 1.4, marginBottom: 12 }}>"{q.content}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>{q.guest_name}</span>
                          {q.email && (
                            <span style={{ fontFamily: cond, fontSize: 8, fontWeight: 700, color: 'rgba(212,255,78,0.5)', letterSpacing: '0.1em' }}>📧 waiting</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button onClick={() => handleStageAction(q.id, 'withdraw')} title="Return to queue"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.15)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#d4ff4e')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.15)')}>
                            <RotateCcw size={12} />
                          </button>
                          <button onClick={() => deleteQuestion(q.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.1)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,80,80,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.1)')}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
>>>>>>> d8d8456f3e30c747ec5c81912e52a98488582235
      </div>
    </main>
  );
}