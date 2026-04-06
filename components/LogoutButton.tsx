// components/LogoutButton.tsx
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <button 
      onClick={handleLogout}
      className="absolute top-6 right-6 px-4 py-2 border border-slate-700 text-slate-400 text-[10px] font-black rounded-full hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all duration-300 uppercase tracking-[0.2em] z-50"
    >
      Sign Out
    </button>
  )
}