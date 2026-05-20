'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Shield, Zap, Users, Lock, Globe } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) router.push(`/join?code=${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TST Meet</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Secure Internal Meetings</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
            TST <span className="text-blue-400">Meet</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-lg mx-auto">
            Your company's secure internal meeting platform. Join with a code — no account needed.
          </p>

          {/* Join Form */}
          <motion.form onSubmit={handleJoin} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-16">
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Enter meeting code (e.g. H-ABCD1234)"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono tracking-widest text-lg"
              maxLength={12}
            />
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 whitespace-nowrap">
              Join Meeting
            </button>
          </motion.form>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Zap, title: 'Instant Access', desc: 'Join with a code, no signup' },
              { icon: Shield, title: 'Secure', desc: 'Encrypted end-to-end' },
              { icon: Users, title: 'Collaboration', desc: 'Screen share & whiteboard' },
              { icon: Video, title: 'HD Video', desc: 'Crystal clear quality' },
              { icon: Lock, title: 'Host Controls', desc: 'Full meeting management' },
              { icon: Globe, title: 'Real-time', desc: 'Instant sync via WebRTC' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.3 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors">
                <Icon className="w-6 h-6 text-blue-400 mb-2" />
                <div className="font-semibold text-white text-sm">{title}</div>
                <div className="text-slate-400 text-xs mt-1">{desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-6 text-slate-600 text-sm">
        © 2024 TST Meet — Internal Use Only
      </footer>
    </div>
  );
}
