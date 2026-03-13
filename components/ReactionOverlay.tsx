'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface Props {
  roomId: string;
  enabled: boolean;
}

export default function ReactionOverlay({ roomId, enabled }: Props) {
  const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel(`reactions_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reactions',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const id = Math.random().toString(36).substring(2);
        const x = 10 + Math.random() * 80; // % from left
        const y = 60 + Math.random() * 30; // % from top — starts near bottom

        const floater: FloatingEmoji = { id, emoji: payload.new.emoji, x, y };
        setFloaters(prev => [...prev, floater]);

        // Remove after animation
        setTimeout(() => {
          setFloaters(prev => prev.filter(f => f.id !== id));
        }, 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, enabled]);

  if (!enabled) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          15% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          80% { opacity: 0.8; transform: translateY(-120px) scale(1); }
          100% { opacity: 0; transform: translateY(-180px) scale(0.8); }
        }
        .floater { animation: floatUp 3s cubic-bezier(0.16,1,0.3,1) forwards; font-size: clamp(2rem,5vw,3.5rem); position: absolute; }
      `}</style>
      {floaters.map(f => (
        <span key={f.id} className="floater" style={{ left: `${f.x}%`, top: `${f.y}%` }}>
          {f.emoji}
        </span>
      ))}
    </div>
  );
}