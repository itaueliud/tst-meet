'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowLeft, Loader2, Plus, Users, MessageSquare, Monitor, FolderOpen, Shield } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    allowScreenShare: true,
    allowChat: true,
    allowFileShare: false,
    requireApproval: false,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Meeting title is required'); return; }
    setLoading(true);
    try {
      const res = await api.post('/meetings', form);
      setCreated(res.data);
      toast.success('Meeting created successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    } finally { setLoading(false); }
  };

  const hostCode = created?.codes?.find((c: any) => c.role === 'host');
  const participantCode = created?.codes?.find((c: any) => c.role === 'participant');

  if (created) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/admin/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Meeting Created! 🎉</h1>
        </div>

        <div className="max-w-2xl">
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">{created.title}</h2>
            {created.description && <p className="text-slate-400 text-sm mb-4">{created.description}</p>}

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-300 mb-4">
              ✅ Share the codes below with your host and participants. Codes expire in 7 days.
            </div>

            {/* Host code */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2 block">Host Code (1 person)</label>
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex-1">
                  <div className="text-purple-300 font-mono text-2xl font-bold tracking-widest">{hostCode?.code}</div>
                  <div className="text-slate-500 text-xs mt-1">Share this with the meeting host</div>
                </div>
                <CopyButton text={hostCode?.code} />
              </div>
            </div>

            {/* Participant code */}
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2 block">Participant Code (shared by all participants)</label>
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <span className="text-blue-300 font-mono font-semibold flex-1 tracking-wider">{participantCode?.code}</span>
                <CopyButton text={participantCode?.code} />
              </div>
            </div>
          </div>

          {/* Copy all */}
          <div className="flex gap-3">
            <button onClick={() => {
              const all = [
                `TST Meet - ${created.title}`,
                `Host Code: ${hostCode?.code}`,
                `Participant Code: ${participantCode?.code}`,
                '',
                `Join at: ${window.location.origin}/join`,
              ].join('\n');
              navigator.clipboard.writeText(all);
              toast.success('All codes copied!');
            }} className="btn-primary flex-1">
              <Copy className="w-4 h-4" /> Copy All Codes
            </button>
            <button onClick={() => router.push(`/admin/meetings/${created.id}`)} className="btn-ghost flex-1">
              View Meeting
            </button>
          </div>

          <button onClick={() => { setCreated(null); setForm({ title: '', description: '', scheduledAt: '', allowScreenShare: true, allowChat: true, allowFileShare: false, requireApproval: false }); }}
            className="mt-3 w-full text-slate-400 hover:text-white text-sm py-2 transition-colors">
            + Create Another Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/admin/dashboard')} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create Meeting</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Meeting Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Meeting Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Weekly Team Standup" required maxLength={100} />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description..." rows={3} maxLength={500}
                  className="bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Scheduled Date & Time (optional)</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Permissions</h2>
            <div className="space-y-3">
              {[
                { key: 'allowChat', label: 'Allow Chat', desc: 'Participants can send messages', icon: MessageSquare },
                { key: 'allowScreenShare', label: 'Allow Screen Share', desc: 'Participants can share their screen', icon: Monitor },
                { key: 'allowFileShare', label: 'Allow File Share', desc: 'Participants can share files', icon: FolderOpen },
                { key: 'requireApproval', label: 'Require Approval', desc: 'Host must admit each participant', icon: Shield },
              ].map(({ key, label, desc, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-slate-500 text-xs">{desc}</div>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${form[key as keyof typeof form] ? 'bg-blue-600' : 'bg-slate-600'}`}
                    onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full btn-primary justify-center py-3 text-base disabled:opacity-50">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : <><Plus className="w-5 h-5" /> Create Meeting</>}
          </button>
        </form>
      </div>
    </div>
  );
}
