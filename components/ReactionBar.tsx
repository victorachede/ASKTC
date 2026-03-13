'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const cond = "'Barlow Condensed', sans-serif";

const REACTIONS = ['🔥', '💯', '🙏', '👏', '❓'];
const THROTTLE_MS = 2000;

interface Props {
  roomId: string;
}

export default function ReactionBar({ roomId }: Props) {
  const [lastSent, setLastSent] = useState<Record<string, number>>({});
  const [popping, setPopping] = useState<string | null>(null);

  const sendReaction = async (emoji: string) => {
    const now = Date.now();
    if (lastSent[emoji] && now - lastSent[emoji] < THROTTLE_MS) return;

    setLastSent(prev => ({ ...prev, [emoji]: now }));
    setPopping(emoji);
    setTimeout(() => setPopping(null), 300);

    await supabase.from('reactions').insert({ room_id: roomId, emoji });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontFamily: cond, fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.2)', textAlign: 'center' }}>React</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => sendReaction(emoji)}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: popping === emoji ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,240,232,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,240,232,0.04)')}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}