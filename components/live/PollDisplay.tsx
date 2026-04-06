'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface Props {
  poll: any;
}

export default function PollDisplay({ poll }: Props) {
  const [options, setOptions] = useState<any[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchOptions = async () => {
    const { data } = await supabase
      .from('poll_options')
      .select('*, poll_votes(count)')
      .eq('poll_id', poll.id);

    if (!data) return;

    const formatted = data.map((opt: any) => {
      const votes = opt.poll_votes?.[0]?.count || 0;
      return { ...opt, votes };
    });

    const total = formatted.reduce((sum, o) => sum + o.votes, 0);

    setOptions(formatted);
    setTotalVotes(total);
  };

  useEffect(() => {
    fetchOptions();

    // real-time subscription (vote updates)
    const channel = supabase
      .channel(`poll_live_${poll.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        () => fetchOptions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  return (
    <div className="w-full max-w-3xl text-center mx-auto">
      
      {/* HEADER */}
      <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-6">
        Live Poll
      </p>

      <h2 className="text-4xl md:text-5xl font-black mb-10 text-white">
        {poll.question}
      </h2>

      {/* OPTIONS */}
      <div className="space-y-4">
        {options.map((opt, i) => {
          const percent = totalVotes === 0 ? 0 : (opt.votes / totalVotes) * 100;

          return (
            <div
              key={opt.id}
              className="relative w-full border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]"
            >
              {/* animated bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-emerald-400/20"
              />

              {/* content */}
              <div className="relative flex justify-between items-center px-4 py-3">
                <span className="text-sm text-white font-medium">
                  {opt.text}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 font-mono">
                    {opt.votes}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER STATS */}
      <div className="mt-8 text-[10px] tracking-[0.3em] uppercase text-zinc-600">
        {totalVotes} total votes
      </div>
    </div>
  );
}