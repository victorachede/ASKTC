export type UserRole = 'YOUTH' | 'LEADER' | 'OVERSEER';

export interface Profile {
  id: string; // UUID from Supabase
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  content: string;
  status: 'PENDING' | 'ANSWERED' | 'HIDDEN';
  is_priority: boolean; // For those "urgent" spirit-led questions
  created_at: string;
  profiles?: Profile; // Joins the user data to the question
}

export interface Answer {
  id: string;
  question_id: string;
  leader_id: string;
  content: string;
  created_at: string;
}