'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";

// Simple device fingerprint from localStorage
function getFingerprint(): string {
  const key = 'asktc_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

interface Props {
  poll: any; // poll with options and votes
}

export default function PollVote({ poll }: Props) {
  const [voted, setVoted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<any[]>([]);

  useEffect(() => {
    // Check if already voted
    const fp = getFingerprint();
    const myVote = poll.poll_votes?.find((v: any) => v.fingerprint === fp);
    if (myVote) setVoted(myVote.option_id);
    setVotes(poll.poll_votes || []);
  }, [poll]);

  const vote = async (optionId: string) => {
    if (voted || loading) return;
    setLoading(true);
    const fp = getFingerprint();

    const { error } = await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      option_id: optionId,
      fingerprint: fp,
    });

    if (error) {
      if (error.code === '23505') toast.error('Already voted');
      else toast.error('Vote failed');
    } else {
      setVoted(optionId);
      toast.success('Vote cast');
    }
    setLoading(false);
  };

  const totalVotes = votes.length;
  const getCount = (optionId: string) => votes.filter(v => v.option_id === optionId).length;
  const getPercent = (optionId: string) => totalVotes === 0 ? 0 : Math.round((getCount(optionId) / totalVotes) * 100);

  const showResults = voted || poll.show_results;

  return (
    <div style={{ background: 'rgba(212,255,78,0.03)', border: '1px solid rgba(212,255,78,0.15)', borderRadius: 20, overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,255,78,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4ff4e', display: 'block', animation: 'pip 2s ease infinite' }} />
        <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#d4ff4e' }}>Live Poll</span>
        {totalVotes > 0 && (
          <span style={{ marginLeft: 'auto', fontFamily: cond, fontSize: 9, fontWeight: 700, color: 'rgba(245,240,232,0.25)' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* QUESTION */}
      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ fontFamily: serif, fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', lineHeight: 1.3, marginBottom: 20 }}>
          {poll.question}
        </p>

        {/* OPTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {poll.poll_options?.sort((a: any, b: any) => a.position - b.position).map((opt: any) => {
            const isVoted = voted === opt.id;
            const pct = getPercent(opt.id);

            return (
              <button key={opt.id} onClick={() => vote(opt.id)} disabled={!!voted || loading}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: isVoted ? 'rgba(212,255,78,0.08)' : 'rgba(245,240,232,0.03)', border: `1px solid ${isVoted ? 'rgba(212,255,78,0.3)' : 'rgba(245,240,232,0.07)'}`, borderRadius: 12, cursor: voted ? 'default' : 'pointer', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s' }}>

                {/* PROGRESS BAR */}
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, background: isVoted ? 'rgba(212,255,78,0.08)' : 'rgba(245,240,232,0.03)', borderRadius: 12 }}
                  />
                )}

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isVoted && <CheckCircle2 size={13} color="#d4ff4e" />}
                    <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: isVoted ? '#f5f0e8' : 'rgba(245,240,232,0.6)' }}>{opt.text}</span>
                  </div>
                  {showResults && (
                    <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, color: isVoted ? '#d4ff4e' : 'rgba(245,240,232,0.3)', flexShrink: 0 }}>{pct}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!voted && (
          <p style={{ fontFamily: cond, fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.15)', textAlign: 'center', marginTop: 14 }}>
            Tap to vote
          </p>
        )}
      </div>
    </div>
  );
}