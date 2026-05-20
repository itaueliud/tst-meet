'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function JoinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') || '');
  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [loading, setLoading] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const validateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter a meeting code'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/meetings/validate-code', { code: code.trim().toUpperCase() });
      if (!res.data.valid) { setError('Invalid or expired meeting code. Please check and try again.'); return; }
      setMeetingInfo(res.data);
      setStep('name');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate code');
    } finally { setLoading(false); }
  };

  const joinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error('Please enter your name'); return; }
    sessionStorage.setItem('tst_meeting', JSON.stringify({
      meetingId: meetingInfo.meetingId,
      meetingTitle: meetingInfo.meetingTitle,
      role: meetingInfo.role,
      displayName: displayName.trim(),
      settings: meetingInfo.settings,
    }));
    router.push(`/meeting/${meetingInfo.meetingId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TST Meet</span>
        </div>

        {step === 'code' ? (
          <form onSubmit={validateCode}>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Join Meeting</h2>
            <p className="text-slate-400 text-sm text-center mb-6">Enter your meeting code to get started</p>

            <div className="mb-4">
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Meeting Code</label>
              <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="e.g. H-ABCD1234 or P-ABCD1234"
                className="text-center font-mono tracking-widest text-lg bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                maxLength={12} autoFocus />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</> : 'Continue'}
            </button>

            <button type="button" onClick={() => router.push('/')} className="w-full text-slate-400 hover:text-white text-sm mt-3 py-2 transition-colors">
              ← Back to home
            </button>
          </form>
        ) : (
          <form onSubmit={joinMeeting}>
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Code Verified!</h2>
            <div className="text-center mb-6">
              <p className="text-blue-300 font-semibold text-lg">{meetingInfo?.meetingTitle}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${meetingInfo?.role === 'host' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                {meetingInfo?.role === 'host' ? '👑 Host' : '👤 Participant'}
              </span>
            </div>

            <div className="mb-6">
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">Your Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Enter your name" className="pl-10" autoFocus maxLength={50} />
              </div>
            </div>

            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-200">
              Join Meeting
            </button>
            <button type="button" onClick={() => setStep('code')} className="w-full text-slate-400 hover:text-white text-sm mt-3 py-2 transition-colors">
              ← Use different code
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function JoinPage() {
  return <Suspense><JoinContent /></Suspense>;
}
