import { supabase } from '@/lib/supabase';

export function subscribeRoom(slug: string, onUpdate: () => void) {
  const channel = supabase.channel(`room_engine_${slug}`);

  const tables = [
    'questions',
    'panelists',
    'polls',
    'question_assignments',
    'poll_votes'
  ];

  tables.forEach(table => {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => onUpdate()
    );
  });

  channel.subscribe();

  return () => supabase.removeChannel(channel);
}