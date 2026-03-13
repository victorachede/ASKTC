'use client';

import { motion } from 'framer-motion';

const serif = "'Cormorant Garamond', serif";
const cond = "'Barlow Condensed', sans-serif";
const sans = "'Barlow', sans-serif";

interface Props {
  poll: any;
}

export default function PollResults({ poll }: Props) {
  const votes = poll.poll_votes || [];
  const totalVotes = votes.length;
  const getCount = (optionId: string) => votes.filter((v: any) => v.option_id === optionId).length;
  const getPercent = (optionId: string) => totalVotes === 0 ? 0 : Math.round((getCount(optionId) / totalVotes) * 100);

  const sorted = [...(poll.poll_options || [])].sort((a: any, b: any) => a.position - b.position);
  const maxPct = Math.max(...sorted.map(o => getPercent(o.id)), 1);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(1.8rem,4vw,3rem)', fontStyle: 'italic', fontWeight: 300, color: '#f5f0e8', lineHeight: 1.1, maxWidth: '75%' }}>{poll.question}</h2>
        <span style={{ fontFamily: cond, fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.25)' }}>{totalVotes} votes</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorted.map((opt: any, i: number) => {
          const pct = getPercent(opt.id);
          const isLeading = pct === maxPct && pct > 0;

          return (
            <div key={opt.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 'clamp(0.9rem,2vw,1.1rem)', fontWeight: 500, color: isLeading ? '#f5f0e8' : 'rgba(245,240,232,0.5)' }}>{opt.text}</span>
                <span style={{ fontFamily: cond, fontSize: 'clamp(1rem,2.5vw,1.4rem)', fontWeight: 800, color: isLeading ? '#d4ff4e' : 'rgba(245,240,232,0.3)' }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(245,240,232,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: isLeading ? '#d4ff4e' : 'rgba(245,240,232,0.15)', borderRadius: 100 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}