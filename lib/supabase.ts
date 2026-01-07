import { createBrowserClient } from '@supabase/ssr'

// Use createBrowserClient for Next.js 16 compatibility
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)