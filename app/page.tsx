import QuestionCard from '@/components/QuestionCard';
import { getQuestions } from '@/lib/actions';
import QuestionInput from '@/components/QuestionInput';

// Forces fresh data on every visit
export const dynamic = 'force-dynamic';

export default async function Page() {
  const allQuestions = await getQuestions();
  
  // 1. Ensure we have an array and sort it by newest first (Safety Sort)
  const questions = Array.isArray(allQuestions) 
    ? [...allQuestions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) 
    : [];

  return (
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden relative md:pt-20"> 
      
      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pt-8 pb-32 px-4 scrollbar-hide">
        <div className="max-w-2xl mx-auto w-full">
          
          {/* Mobile-Only Page Header */}
          <header className="flex items-center justify-between mb-10 md:hidden">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
              ASKTC
            </h1>
            <a href="/archives" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-amber-600 transition-colors">
              Archives →
            </a>
          </header>

          <div className="flex flex-col gap-6">
            {questions.length > 0 ? (
              questions.map((q: any) => {
                // 2. EXTRACT THE ANSWER OBJECT
                const answerObj = q.answers && q.answers.length > 0 ? q.answers[0] : null;

                // 3. EXTRACT THE LEADER'S NAME
                // This pulls the real name from the profiles join we set up
                const leaderDisplayName = answerObj?.profiles?.full_name;

                return (
                  <QuestionCard 
                    key={q.id}
                    studentName={q.guest_name || "Guest"}
                    studentEmoji={q.guest_emoji || "👤"}
                    question={q.content}
                    timestamp={new Date(q.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    status={q.status}
                    answer={answerObj?.answer_body} 
                    leaderName={leaderDisplayName} 
                  />
                );
              })
            ) : (
              <div className="text-center py-24 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  The dispatch is clear
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Action Bar */}
      <QuestionInput />
    </main>
  );
}