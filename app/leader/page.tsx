'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast'; // Import Toast

export default function AnswerBox({ questionId, leaderId }: { questionId: string, leaderId: string }) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error("Please enter a response");
    
    setLoading(true);
    
    // 1. Insert into the answers table
    const { error: answerError } = await supabase
      .from('answers')
      .insert([{ 
        question_id: questionId, 
        leader_id: leaderId, 
        answer_body: answer 
      }]);

    if (answerError) {
      toast.error("Deployment failed: " + answerError.message);
      setLoading(false);
      return;
    }

    // 2. Update the question status
    const { error: statusError } = await supabase
      .from('questions')
      .update({ status: 'answered' })
      .eq('id', questionId);

    if (statusError) {
      toast.error("Status update failed");
    } else {
      toast.success("Intelligence Verified & Dispatched!", {
        icon: '✅',
        style: { background: '#10b981', color: '#fff' }
      });
      // Refresh to show the new "Verified Dispatch" box
      window.location.reload(); 
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea 
        className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all"
        placeholder="Type the official response..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button 
        onClick={submitAnswer}
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-50"
      >
        {loading ? "Transmitting..." : "Verify & Dispatch"}
      </button>
    </div>
  );
}