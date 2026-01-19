'use client';
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AnswerBox({ questionId, leaderId, onComplete }: { 
  questionId: string, 
  leaderId?: string, // Made optional
  onComplete?: () => void 
}) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    
    setLoading(true);
    
    // 1. Insert into answers (leader_id is now optional)
    const insertData: any = { 
      question_id: questionId,
      answer_body: answer.trim() 
    }
    
    if (leaderId) {
      insertData.leader_id = leaderId
    }
    
    const { error: answerError } = await supabase
      .from('answers')
      .insert([insertData]);

    if (answerError) {
      console.error("Full Supabase Error:", JSON.stringify(answerError, null, 2));
      console.error("Error details:", answerError);
      toast.error(answerError.message || "Failed to send answer");
      setLoading(false);
      return;
    }

    // 2. Update status
    const { error: statusError } = await supabase
      .from('questions')
      .update({ status: 'answered' })
      .eq('id', questionId);

    if (statusError) {
      toast.error("Failed to update question status");
      setLoading(false);
    } else {
      toast.success("Answer sent successfully!");
      setAnswer('');
      setLoading(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all resize-none min-h-[120px] font-medium placeholder:text-gray-400"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif' }}
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span className="font-medium">{answer.length}</span> characters
        </div>

        <button 
          onClick={submitAnswer}
          disabled={loading || !answer.trim()}
          className="bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white h-10 px-6 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Answer</span>
              <Send size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}