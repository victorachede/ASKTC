'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LeaderLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back');
      window.location.href = '/leader';
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >

        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            Leader Access
          </h1>

          <p className="text-sm text-black/40 mt-2">
            Sign in to manage rooms, questions, and live sessions
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[#fafafa] border border-black/5 rounded-2xl p-6">

          <form onSubmit={handleLogin} className="space-y-4">

            {/* EMAIL */}
            <div>
              <label className="text-xs text-black/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black/30 transition"
                placeholder="you@company.com"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-xs text-black/40">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-black outline-none focus:border-black/30 transition"
                placeholder="••••••••"
              />
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl hover:opacity-80 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Signing in
                </>
              ) : (
                'Sign in'
              )}
            </button>

          </form>

        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-black/30 mt-6">
          Secure leader environment
        </p>

      </motion.div>

    </main>
  );
}