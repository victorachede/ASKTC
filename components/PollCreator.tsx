'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, BarChart2, Trash2, Play, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";

interface Props {
  roomId: string;
  polls: any[];
  onRefresh: () => void;
}

export default function PollCreator({ roomId, polls, onRefresh }: Props) {
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [showResults, setShowResults] = useState(true);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, val: string) => {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  };

  const createPoll = async () => {
    if (!question.trim()) return toast.error('Add a question');
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return toast.error('Need at least 2 options');

    setLoading(true);
    try {
      // Deactivate any active polls first
      await supabase.from('polls').update({ is_active: false }).eq('room_id', roomId).eq('is_active', true);

      const { data: poll, error } = await supabase.from('polls').insert({
        room_id: roomId,
        question: question.trim(),
        is_active: true,
        show_results: showResults,
      }).select().single();

      if (error) throw error;

      await supabase.from('poll_options').insert(
        validOptions.map((text, i) => ({ poll_id: poll.id, text, position: i }))
      );

      toast.success('Poll launched');
      setQuestion('');
      setOptions(['', '']);
      setCreating(false);
      onRefresh();
    } catch {
      toast.error('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (poll: any) => {
    if (poll.is_active) {
      await supabase.from('polls').update({ is_active: false }).eq('id', poll.id);
      toast.success('Poll closed');
    } else {
      await supabase.from('polls').update({ is_active: false }).eq('room_id', roomId);
      await supabase.from('polls').update({ is_active: true }).eq('id', poll.id);
      toast.success('Poll relaunched');
    }
    onRefresh();
  };

  const toggleResults = async (poll: any) => {
    await supabase.from('polls').update({ show_results: !poll.show_results }).eq('id', poll.id);
    onRefresh();
  };

  const deletePoll = async (id: string) => {
    await supabase.from('polls').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={14} color="#d4ff4e" />
          <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f5f0e8' }}>Live Polls</span>
        </div>
        <button onClick={() => setCreating(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: creating ? 'rgba(245,240,232,0.05)' : '#d4ff4e', color: creating ? 'rgba(245,240,232,0.4)' : '#060606', border: creating ? '1px solid rgba(245,240,232,0.1)' : 'none', borderRadius: 10, fontFamily: cond, fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
          {creating ? <><X size={11} /> Cancel</> : <><Plus size={11} /> New Poll</>}
        </button>
      </div>

      {/* CREATE FORM */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* QUESTION */}
              <div>
                <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', display: 'block', marginBottom: 8 }}>Question</label>
                <input value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask your audience..."
                  style={{ width: '100%', background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', borderRadius: 10, padding: '12px 16px', outline: 'none', fontFamily: serif, fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(212,255,78,0.3)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(245,240,232,0.08)')}
                />
              </div>

              {/* OPTIONS */}
              <div>
                <label style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)', display: 'block', marginBottom: 8 }}>Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, color: 'rgba(245,240,232,0.2)', width: 16, textAlign: 'center' }}>{i + 1}</span>
                      <input value={opt} onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        style={{ flex: 1, background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.07)', borderRadius: 8, padding: '10px 14px', outline: 'none', fontFamily: sans, fontSize: 13, color: '#f5f0e8', transition: 'border-color 0.2s' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(212,255,78,0.3)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(245,240,232,0.07)')}
                      />
                      {options.length > 2 && (
                        <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.2)', padding: 4, transition: 'color 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,80,80,0.7)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.2)')}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button onClick={addOption} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: '1px dashed rgba(245,240,232,0.1)', borderRadius: 8, fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s', marginTop: 4 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,255,78,0.3)'; (e.currentTarget as HTMLElement).style.color = '#d4ff4e'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.2)'; }}>
                      <Plus size={11} /> Add Option
                    </button>
                  )}
                </div>
              </div>

              {/* SHOW RESULTS TOGGLE */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid rgba(245,240,232,0.05)' }}>
                <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>Show results to audience</span>
                <button onClick={() => setShowResults(v => !v)}
                  style={{ width: 40, height: 22, borderRadius: 100, background: showResults ? '#d4ff4e' : 'rgba(245,240,232,0.08)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: showResults ? '#060606' : 'rgba(245,240,232,0.3)', position: 'absolute', top: 3, left: showResults ? 21 : 3, transition: 'left 0.2s' }} />
                </button>
              </div>

              {/* LAUNCH */}
              <button onClick={createPoll} disabled={loading}
                style={{ width: '100%', height: 48, background: '#d4ff4e', color: '#060606', border: 'none', borderRadius: 12, fontFamily: cond, fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}>
                <Play size={13} fill="#060606" /> Launch Poll
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXISTING POLLS */}
      {polls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)' }}>Session Polls</span>
          {polls.map(poll => (
            <div key={poll.id} style={{ background: poll.is_active ? 'rgba(212,255,78,0.04)' : 'rgba(245,240,232,0.02)', border: `1px solid ${poll.is_active ? 'rgba(212,255,78,0.2)' : 'rgba(245,240,232,0.06)'}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <p style={{ fontFamily: serif, fontSize: '1rem', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', flex: 1 }}>{poll.question}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggleResults(poll)} title={poll.show_results ? 'Hide results from audience' : 'Show results to audience'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: poll.show_results ? '#d4ff4e' : 'rgba(245,240,232,0.2)', transition: 'color 0.2s' }}>
                    {poll.show_results ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => toggleActive(poll)}
                    style={{ padding: '5px 12px', background: poll.is_active ? 'rgba(245,240,232,0.05)' : '#d4ff4e', color: poll.is_active ? 'rgba(245,240,232,0.4)' : '#060606', border: poll.is_active ? '1px solid rgba(245,240,232,0.1)' : 'none', borderRadius: 8, fontFamily: cond, fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {poll.is_active ? 'Close' : 'Relaunch'}
                  </button>
                  <button onClick={() => deletePoll(poll.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.15)', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,80,80,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.15)')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {poll.is_active && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block', animation: 'pip 2s ease infinite' }} />
                  <span style={{ fontFamily: cond, fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#d4ff4e' }}>Live</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}