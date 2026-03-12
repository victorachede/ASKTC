'use client';

import { useState } from 'react';
import { Send, Loader2, MessageSquare, Monitor, CheckCircle2 } from 'lucide-react';
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
  const [isOnProjector, setIsOnProjector] = useState(false);

  // Font Stacks from Landing Page
  const serif = "'Cormorant Garamond', serif";
  const cond = "'Barlow Condensed', sans-serif";
  const sans = "'Barlow', sans-serif";

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
    
    // 1. Save the Answer
    const { error: answerError } = await supabase
      .from('answers')
      .insert([insertData]);

    if (answerError) {
      toast.error("Could not save answer.");
      setLoading(false);
      return;
    }

    // 2. Update Question Status and Projector Visibility
    const { error: statusError } = await supabase
      .from('questions')
      .update({ 
        status: 'answered',
        is_projected: isOnProjector // Feature: Send to projector
      })
      .eq('id', questionId);

    if (statusError) {
      toast.error("Failed to update status.");
      setLoading(false);
    } else {
      toast.success(isOnProjector ? "Answered and Projected!" : "Answer shared!");
      setAnswer('');
      setLoading(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(245,240,232,0.05)', fontFamily: sans }} className="rounded-2xl p-6 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-zinc-500">
          <MessageSquare size={14} color="#d4ff4e" />
          <span style={{ fontFamily: cond }} className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Moderator Response</span>
        </div>
        
        {/* Projector Toggle Feature */}
        <button 
          onClick={() => setIsOnProjector(!isOnProjector)}
          style={{ 
            background: isOnProjector ? 'rgba(212,255,78,0.1)' : 'transparent',
            border: `1px solid ${isOnProjector ? '#d4ff4e' : 'rgba(245,240,232,0.1)'}`,
            transition: 'all 0.2s ease'
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg group"
        >
          <Monitor size={12} color={isOnProjector ? '#d4ff4e' : '#555'} />
          <span style={{ fontFamily: cond, color: isOnProjector ? '#d4ff4e' : '#555' }} className="text-[9px] font-bold uppercase tracking-widest">
            {isOnProjector ? 'On Projector' : 'Send to Projector'}
          </span>
        </button>
      </div>

      <div className="relative">
        <textarea 
          style={{ 
            background: 'rgba(245,240,232,0.02)', 
            border: '1px solid rgba(245,240,232,0.06)',
            fontFamily: serif
          }}
          className="w-full rounded-xl p-5 text-lg italic font-light leading-relaxed outline-none focus:border-[#d4ff4e]/30 transition-all resize-none min-h-[160px] text-zinc-200 placeholder:text-zinc-800"
          placeholder="Type the official response..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              submitAnswer();
            }
          }}
        />
        
        <div className="mt-4 flex items-center justify-between px-1">
          <p style={{ color: 'rgba(245,240,232,0.2)' }} className="text-[10px] font-medium uppercase tracking-tight">
            Press <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-sans text-zinc-400">CMD + Enter</kbd> to broadcast
          </p>
          <span style={{ fontFamily: cond, color: 'rgba(245,240,232,0.1)' }} className="text-[10px] font-bold tabular-nums tracking-widest">
            {answer.length} CHARS
          </span>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button 
          onClick={submitAnswer}
          disabled={loading || !answer.trim()}
          style={{ 
            background: loading || !answer.trim() ? '#111' : '#d4ff4e',
            color: loading || !answer.trim() ? '#444' : '#060606',
            fontFamily: cond,
            transition: 'all 0.2s'
          }}
          className="h-12 px-10 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2 active:scale-[0.96] shadow-xl"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <span>Broadcast Response</span>
              <Send size={14} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}