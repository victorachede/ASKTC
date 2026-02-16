'use client';

import { useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AnswerBox({ 
  questionId, 
  leaderId, 
  onComplete 
}: { 
  questionId: string, 
  leaderId?: string, 
  onComplete?: () => void 
}) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error("Please enter a response.");
      return;
    }
    
    setLoading(true);
    
    const insertData: any = { 
      question_id: questionId,
      answer_body: answer.trim() 
    }
    
    if (leaderId) insertData.leader_id = leaderId;
    
    const { error: answerError } = await supabase
      .from('answers')
      .insert([insertData]);

    if (answerError) {
      toast.error("Could not save answer.");
      setLoading(false);
      return;
    }

    const { error: statusError } = await supabase
      .from('questions')
      .update({ status: 'answered' })
      .eq('id', questionId);

    if (statusError) {
      toast.error("Failed to update status.");
      setLoading(false);
    } else {
      toast.success("Answer shared!");
      setAnswer('');
      setLoading(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="bg-[#111] rounded-2xl border border-white/5 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-4 text-zinc-500">
        <MessageSquare size={16} />
        <span className="text-xs font-medium tracking-wide uppercase">Your Response</span>
      </div>

      <div className="relative group">
        <textarea 
          className="w-full bg-[#18181b] border border-white/10 rounded-xl p-5 text-base leading-relaxed outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none min-h-[140px] text-zinc-200 placeholder:text-zinc-600"
          placeholder="Share your thoughts here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              submitAnswer();
            }
          }}
        />
        
        {/* Subtle helper text */}
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-[11px] text-zinc-500 font-medium">
            Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5 font-sans">CMD + Enter</kbd> to send
          </p>
          <span className="text-[11px] text-zinc-600 tabular-nums">
            {answer.length} characters
          </span>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          onClick={submitAnswer}
          disabled={loading || !answer.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white h-11 px-8 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sharing...</span>
            </>
          ) : (
            <>
              <span>Broadcast Answer</span>
              <Send size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}