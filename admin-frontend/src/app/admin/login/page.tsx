'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@tst-meet.com');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      if (apiMessage) {
        toast.error(apiMessage);
      } else {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tst-meet.onrender.com/api';
        toast.error(`Unable to reach backend. Confirm API URL is set correctly: ${apiUrl}`);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">TST Meet</div>
            <div className="text-slate-400 text-xs">Admin Portal</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1 text-center">Admin Login</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Sign in to manage meetings</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@tst-meet.com" required />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter password" required className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            Default: <code>admin@tst-meet.com</code> / <code>Admin@123456</code>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <button onClick={() => router.push('/')} className="w-full text-slate-400 hover:text-white text-sm mt-4 py-2 transition-colors">
          ← Back to home
        </button>
      </motion.div>
    </div>
  );
}
