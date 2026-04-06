import { supabase } from '@/lib/supabase';

export async function fetchRoomBySlug(slug: string) {
  return supabase
    .from('rooms')
    .select('*')
    .eq('slug', slug)
    .single();
}

export async function fetchAssignments(roomId: string) {
  return supabase
    .from('question_assignments')
    .select(`
      *,
      panelists(id, name, title),
      questions(id, content, guest_name)
    `)
    .eq('room_id', roomId)
    .order('queue_position', { ascending: true });
}

export async function fetchQuestions(roomId: string) {
  return supabase
    .from('questions')
    .select('*')
    .eq('room_id', roomId);
}

export async function fetchPanelists(roomId: string) {
  return supabase
    .from('panelists')
    .select('*')
    .eq('room_id', roomId);
}

export async function fetchPolls(roomId: string) {
  return supabase
    .from('polls')
    .select('*, poll_options(*)')
    .eq('room_id', roomId);
}