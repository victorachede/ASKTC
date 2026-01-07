// components/QuestionCard.tsx
import GoldBadge from './GoldBadge' 

export default function QuestionCard({ 
  studentName, 
  studentEmoji,
  question, 
  timestamp,
  status, 
  answer, 
  leaderName // This needs to come from the DB joins!
}: any) {
  return (
    <div className="w-full max-w-2xl bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
      
      {/* STUDENT HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-50">
            {studentEmoji || "👤"}
          </div>
          <div>
            <h3 className="text-slate-900 font-black text-sm uppercase tracking-tight">
              {studentName}
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{timestamp}</p>
          </div>
        </div>

        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border ${
          status === 'answered' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {status || 'pending'}
        </span>
      </div>
      
      {/* THE QUESTION */}
      <div className="px-1 mb-2">
        <p className="text-slate-700 text-lg font-semibold leading-relaxed">
          "{question}"
        </p>
      </div>

      {/* LEADER RESPONSE SECTION */}
      {answer && (
        <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] border-2 border-amber-500/20 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-1">
                Verified Briefing
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  {leaderName || "Command Center"}
                </span>
                
                <GoldBadge /> 
              </div>
            </div>
          </div>
          
          <p className="text-slate-200 text-base italic leading-relaxed font-medium border-l-2 border-amber-500/30 pl-4">
            "{answer}"
          </p>
        </div>
      )}
    </div>
  )
}