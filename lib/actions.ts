// lib/actions.ts
import { supabase } from './supabase';

export async function getQuestions() {
  // Ensure the query string has no syntax errors like "*, {"
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      profiles!questions_user_id_fkey(full_name, emoji_key),
      answers!answers_question_id_fkey(
        answer_body,
        profiles!answers_leader_id_fkey(full_name)
      )
    `) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error:', error.message);
    return [];
  }
  return data;
}