'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Trash2, ArrowRight, CheckCircle2,
  Users, Play, SkipForward, List, ExternalLink, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PanelistModeratorProps {
  roomId: string;
  slug: string;
  questions: any[]; // The existing questions array from the parent
}

export default function PanelistModerator({ roomId, slug, questions }: PanelistModeratorProps) {
  const [panelists, setPanelists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [addingPanelist, setAddingPanelist] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedPanelist, setSelectedPanelist] = useState<string | null>(null);

  // ── FETCH ───────────────────────────────────────────────────────────────────
  const fetchPanelists = async () => {
    const { data } = await supabase
      .from('panelists')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setPanelists(data || []);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('question_assignments')
      .select(`*, panelists(id, name, title), questions(id, content, guest_name)`)
      .eq('room_id', roomId)
      .order('queue_position', { ascending: true });
    setAssignments(data || []);
  };

  useEffect(() => {
    fetchPanelists();
    fetchAssignments();

    const channel = supabase
      .channel(`mod_panel_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panelists' }, fetchPanelists)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_assignments' }, fetchAssignments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // ── PANELIST ACTIONS ────────────────────────────────────────────────────────
  const addPanelist = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('panelists').insert({
      room_id: roomId,
      name: newName.trim(),
      title: newTitle.trim() || null,
    });
    if (error) { toast.error('Failed to add panelist'); return; }
    toast.success(`${newName} added to panel`);
    setNewName('');
    setNewTitle('');
    setAddingPanelist(false);
  };

  const removePanelist = async (id: string, name: string) => {
    await supabase.from('panelists').delete().eq('id', id);
    toast.success(`${name} removed`);
  };

  // ── ASSIGNMENT ACTIONS ──────────────────────────────────────────────────────
  const assignQuestion = async () => {
    if (!selectedQuestion || !selectedPanelist) {
      toast.error('Select a question and a panelist');
      return;
    }

    // Check if already assigned
    const existing = assignments.find(a => a.question_id === selectedQuestion);
    if (existing) {
      // Reassign — update panelist
      const { error } = await supabase
        .from('question_assignments')
        .update({ panelist_id: selectedPanelist })
        .eq('id', existing.id);
      if (!error) toast.success('Question reassigned');
      else toast.error('Reassignment failed');
    } else {
      // New assignment — queue position is next in line
      const queuedCount = assignments.filter(a => a.status !== 'done').length;
      const { error } = await supabase.from('question_assignments').insert({
        question_id: selectedQuestion,
        panelist_id: selectedPanelist,
        room_id: roomId,
        status: 'queued',
        queue_position: queuedCount,
      });
      if (!error) toast.success('Question assigned to panelist');
      else toast.error('Assignment failed');
    }

    setSelectedQuestion(null);
    setSelectedPanelist(null);
  };

  const pushLive = async (assignmentId: string) => {
    // Set any active to queued first
    const active = assignments.find(a => a.status === 'active');
    if (active) {
      await supabase.from('question_assignments').update({ status: 'queued' }).eq('id', active.id);
    }
    await supabase.from('question_assignments').update({ status: 'active' }).eq('id', assignmentId);
    toast.success('Question is now live on panelist screen');
  };

  const markDone = async (assignmentId: string) => {
    await supabase.from('question_assignments').update({ status: 'done' }).eq('id', assignmentId);
    toast.success('Marked as done');
  };

  const removeAssignment = async (assignmentId: string) => {
    await supabase.from('question_assignments').delete().eq('id', assignmentId);
  };

  // ── DERIVED DATA ────────────────────────────────────────────────────────────
  const assignedQuestionIds = new Set(
    assignments.filter(a => a.status !== 'done').map(a => a.question_id)
  );
  const unassignedQuestions = questions.filter(
    q => q.status === 'pending' && !assignedQuestionIds.has(q.id)
  );
  const activeAssignment = assignments.find(a => a.status === 'active');
  const queuedAssignments = assignments.filter(a => a.status === 'queued');

  return (
    <div className="space-y-8">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Panelist Moderator</h2>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Assign questions to panel members</p>
        </div>
        <a
          href={`/panelist/${slug}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-all"
        >
          Panelist Screen
          <ExternalLink size={10} />
        </a>
      </div>

      {/* ── LIVE NOW ───────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500">Live on Panelist Screen</span>
        </div>

        {activeAssignment ? (
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-lg font-bold italic text-white leading-snug">
                "{activeAssignment.questions?.content}"
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  → {activeAssignment.panelists?.title} {activeAssignment.panelists?.name}
                </span>
                {activeAssignment.questions?.guest_name && (
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    by {activeAssignment.questions.guest_name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => markDone(activeAssignment.id)}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <CheckCircle2 size={12} />
              Done
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
            Nothing live — push a question from the queue below
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── PANELIST ROSTER ──────────────────────────────────────────────── */}
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
              <Users size={12} />
              Panel ({panelists.length})
            </h3>
            <button
              onClick={() => setAddingPanelist(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
            >
              {addingPanelist ? <X size={10} /> : <UserPlus size={10} />}
              {addingPanelist ? 'Cancel' : 'Add'}
            </button>
          </div>

          {/* Add panelist form */}
          <AnimatePresence>
            {addingPanelist && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mb-6 pb-6 border-b border-white/5">
                  <input
                    type="text"
                    placeholder="Title (e.g. Pastor, Dr.)"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white placeholder:text-zinc-700 outline-none focus:border-white/20 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPanelist()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white placeholder:text-zinc-700 outline-none focus:border-white/20 transition-colors"
                  />
                  <button
                    onClick={addPanelist}
                    className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                  >
                    Add to Panel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panelist list */}
          <div className="space-y-3">
            {panelists.length === 0 ? (
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800 py-8 text-center">
                No panelists yet
              </p>
            ) : panelists.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPanelist(p.id === selectedPanelist ? null : p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPanelist === p.id
                    ? 'border-white/30 bg-white/5'
                    : 'border-white/5 bg-white/[0.01] hover:border-white/10'
                }`}
              >
                <div>
                  {p.title && <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{p.title} </span>}
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  {selectedPanelist === p.id && (
                    <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-emerald-500">Selected</span>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removePanelist(p.id, p.name); }}
                  className="text-zinc-800 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── UNASSIGNED QUESTIONS ─────────────────────────────────────────── */}
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
            <List size={12} />
            Unassigned ({unassignedQuestions.length})
          </h3>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {unassignedQuestions.length === 0 ? (
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800 py-8 text-center">
                All questions assigned
              </p>
            ) : unassignedQuestions.map(q => (
              <div
                key={q.id}
                onClick={() => setSelectedQuestion(q.id === selectedQuestion ? null : q.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedQuestion === q.id
                    ? 'border-white/30 bg-white/5'
                    : 'border-white/5 bg-white/[0.01] hover:border-white/10'
                }`}
              >
                <p className="text-xs italic text-zinc-300 leading-relaxed">"{q.content}"</p>
                <div className="flex items-center justify-between mt-2">
                  {q.guest_name && (
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{q.guest_name}</span>
                  )}
                  {selectedQuestion === q.id && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Selected</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Assign CTA */}
          {(selectedQuestion || selectedPanelist) && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={assignQuestion}
              disabled={!selectedQuestion || !selectedPanelist}
              className="w-full mt-6 py-3.5 flex items-center justify-center gap-2 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight size={12} />
              {selectedQuestion && selectedPanelist ? 'Assign to Panelist' : 'Select both to assign'}
            </motion.button>
          )}
        </section>
      </div>

      {/* ── ASSIGNMENT QUEUE ────────────────────────────────────────────────── */}
      {queuedAssignments.length > 0 && (
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">
            Queue — {queuedAssignments.length} waiting
          </h3>
          <div className="space-y-3">
            {queuedAssignments.map((a, i) => (
              <div key={a.id} className="flex items-start justify-between gap-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <span className="text-[9px] font-black text-zinc-800 mt-0.5 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs italic text-zinc-400 leading-relaxed truncate">"{a.questions?.content}"</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                      → {a.panelists?.title} {a.panelists?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => pushLive(a.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all"
                  >
                    <Play size={9} fill="currentColor" />
                    Push Live
                  </button>
                  <button
                    onClick={() => removeAssignment(a.id)}
                    className="p-1.5 text-zinc-800 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
