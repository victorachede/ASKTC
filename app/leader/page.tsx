import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getQuestions } from '@/lib/actions';
import AnswerBox from '@/components/AnswerBox'; 
import LogoutButton from '@/components/LogoutButton';
import TakeDownButton from '@/components/TakeDownButton';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LeaderDashboard() {
  // 1. ASYNC COOKIE ACCESS
  const cookieStore = await cookies();
  
  // 2. INITIALIZE SUPABASE WITH FULL COOKIE SYNC (Fixes Terminal Warning)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored if called from a Server Component
          }
        },
      },
    }
  );

  // 3. AUTH CHECK
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/leader-login'); 
  }

  // 4. FETCH QUESTIONS (Now including the joined answers array)
  const questions = await getQuestions();

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 flex flex-col items-center">
      {/* HEADER SECTION */}
      <div className="w-full max-w-4xl mb-10 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] w-fit mb-2">
            System Admin
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
            Command <span className="text-amber-500">Center</span>
          </h1>
        </div>
        <LogoutButton />
      </div>

      {/* THE FEED */}
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {questions?.map((q: any) => {
          const studentProfile = q['profiles!questions_user_id_fkey'];
          
          // ATTACHMENT LOGIC: Look for the answer in the related data
          const attachedAnswer = q.answers && q.answers.length > 0 ? q.answers[0] : null;

          return (
            <div key={q.id} className="bg-slate-800 border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-xl shadow-inner">
                      {studentProfile?.emoji_key || '👤'}
                   </div>
                   <div>
                    <p className="text-white font-bold text-sm uppercase leading-none mb-1">
                      {studentProfile?.full_name || "New Recruit"}
                    </p>
                    <p className="text-slate-500 text-[9px] font-mono tracking-widest uppercase">
                      REF: {q.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <TakeDownButton questionId={q.id} />
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase border ${
                    q.status === 'answered' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-inner">
                <p className="text-slate-100 text-xl font-medium leading-relaxed italic">
                  "{q.content}"
                </p>
              </div>

              {/* LOGIC SWITCH: If answered, show briefing. Else show AnswerBox. */}
              {attachedAnswer ? (
                <div className="mt-4 p-6 bg-slate-900 border border-amber-500/20 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">
                      Verified Dispatch
                    </span>
                  </div>
                  <p className="text-slate-200 text-lg leading-relaxed">
                    {attachedAnswer.answer_body}
                  </p>
                  <p className="text-slate-600 text-[10px] mt-4 uppercase font-bold tracking-widest border-t border-slate-800 pt-4">
                    Authorized by: {attachedAnswer.profiles?.full_name || 'System Admin'}
                  </p>
                </div>
              ) : (
                <AnswerBox 
                  questionId={q.id} 
                  leaderId={session.user.id} 
                />
              )}
            </div>
          );
        })}
        
        {(!questions || questions.length === 0) && (
          <div className="text-center py-24 bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-700">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Clear Skies • No Intel Received</p>
          </div>
        )}
      </div>
    </main>
  );
}