'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Users, MessageSquare, BarChart2, Play, Square, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function CodeBadge({ code, role }: { code: any; role: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${role === 'host' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/20'}`}>
      <span className={`font-mono text-sm font-semibold tracking-wider ${!code.isActive ? 'opacity-40 line-through' : role === 'host' ? 'text-purple-300' : 'text-blue-300'}`}>
        {code.code}
      </span>
      {code.isActive && (
        <button onClick={() => { navigator.clipboard.writeText(code.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="ml-auto p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [meeting, setMeeting] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'chat' | 'attendance' | 'codes'>('overview');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [mRes, aRes, msgRes] = await Promise.all([
        api.get(`/meetings/${id}`),
        api.get(`/meetings/${id}/attendance`),
        api.get(`/meetings/${id}/messages`),
      ]);
      setMeeting(mRes.data);
      setAttendance(aRes.data);
      setMessages(msgRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const startMeeting = async () => {
    await api.patch(`/meetings/${id}/start`);
    toast.success('Meeting started'); load();
  };
  const endMeeting = async () => {
    if (!confirm('End this meeting?')) return;
    await api.patch(`/meetings/${id}/end`);
    toast.success('Meeting ended'); load();
  };
  const lockMeeting = async (lock: boolean) => {
    await api.patch(`/meetings/${id}/lock`, { lock });
    toast.success(lock ? 'Locked' : 'Unlocked'); load();
  };
  const genCodes = async (role: string) => {
    await api.post(`/meetings/${id}/codes`, { count: 1, role });
    toast.success(`${role === 'host' ? 'Host' : 'Participant'} code regenerated`);
    load();
  };
  const deleteMeeting = async () => {
    if (!confirm('Delete this meeting permanently?')) return;
    await api.delete(`/meetings/${id}`);
    toast.success('Deleted'); router.push('/admin/meetings/history');
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!meeting) return <div className="text-red-400 p-8">Meeting not found</div>;

  const hostCode = meeting.codes?.find((c: any) => c.role === 'host' && c.isActive)
    || meeting.codes?.find((c: any) => c.role === 'host');
  const participantCode = meeting.codes?.find((c: any) => c.role === 'participant' && c.isActive)
    || meeting.codes?.find((c: any) => c.role === 'participant');
  const activeParticipants = meeting.participants?.filter((p: any) => p.isActive) || [];

  const statusColors: any = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ended: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[meeting.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
              {meeting.status}
            </span>
            {meeting.isLocked && <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">🔒 Locked</span>}
          </div>
          <p className="text-slate-400 text-sm mt-0.5 font-mono">{id.slice(0,8)}... • Created {format(new Date(meeting.createdAt), 'MMM d, yyyy HH:mm')}</p>
        </div>
        <div className="flex gap-2">
          {meeting.status === 'scheduled' && <button onClick={startMeeting} className="btn-primary text-sm px-3 py-1.5"><Play className="w-3.5 h-3.5" /> Start</button>}
          {meeting.status === 'active' && <>
            <button onClick={() => lockMeeting(!meeting.isLocked)} className="btn-ghost text-sm px-3 py-1.5">{meeting.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} {meeting.isLocked ? 'Unlock' : 'Lock'}</button>
            <button onClick={endMeeting} className="btn-danger text-sm px-3 py-1.5"><Square className="w-3.5 h-3.5" /> End</button>
          </>}
          <button onClick={deleteMeeting} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {[['overview', 'Overview'], ['codes', 'Codes (2)'], ['attendance', `Attendance (${attendance.length})`], ['chat', `Chat (${messages.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              {meeting.description && <p className="text-slate-300">{meeting.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Status', meeting.status],
                  ['Locked', meeting.isLocked ? 'Yes' : 'No'],
                  ['Allow Chat', meeting.allowChat ? 'Yes' : 'No'],
                  ['Screen Share', meeting.allowScreenShare ? 'Yes' : 'No'],
                  ['Started', meeting.startedAt ? format(new Date(meeting.startedAt), 'MMM d, HH:mm') : '—'],
                  ['Ended', meeting.endedAt ? format(new Date(meeting.endedAt), 'MMM d, HH:mm') : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-slate-500 text-xs">{label}</div>
                    <div className="text-white font-medium capitalize">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Active Participants ({activeParticipants.length})</h3>
            {activeParticipants.length === 0 ? (
              <div className="text-slate-500 text-sm">No one in the meeting right now</div>
            ) : (
              <div className="space-y-2">
                {activeParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.role === 'host' ? 'bg-purple-600' : 'bg-blue-600'}`}>{p.displayName[0]?.toUpperCase()}</div>
                    <div>
                      <div className="text-white text-sm">{p.displayName}</div>
                      <div className="text-slate-500 text-xs capitalize">{p.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Host Code</h3>
              <button onClick={() => genCodes('host')} className="text-xs btn-ghost px-2 py-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {hostCode ? <CodeBadge code={hostCode} role="host" /> : <div className="text-slate-500 text-sm">No host code</div>}
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Participant Code</h3>
              <button onClick={() => genCodes('participant')} className="text-xs btn-ghost px-2 py-1"><Plus className="w-3 h-3" /> Regenerate</button>
            </div>
            {participantCode ? <CodeBadge code={participantCode} role="participant" /> : <div className="text-slate-500 text-sm">No participant code</div>}
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead><tr className="border-b border-white/10 bg-white/5">
              <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3">Name</th>
              <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3">Role</th>
              <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Joined</th>
              <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Left</th>
              <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3">Duration</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {attendance.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-slate-500 py-8">No attendance data</td></tr>
              ) : attendance.map(a => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white text-sm">{a.participantName}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${a.role === 'host' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>{a.role}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden md:table-cell">{a.joinedAt ? format(new Date(a.joinedAt), 'HH:mm:ss') : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden md:table-cell">{a.leftAt ? format(new Date(a.leftAt), 'HH:mm:ss') : '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{a.duration ? `${Math.floor(a.duration / 60)}m ${a.duration % 60}s` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chat' && (
        <div className="card max-w-2xl">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 ? <div className="text-center text-slate-500 py-8">No messages</div> : messages.map(m => (
              <div key={m.id} className="flex gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.senderRole === 'host' ? 'bg-purple-600' : 'bg-blue-600'}`}>{m.senderName[0]?.toUpperCase()}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${m.senderRole === 'host' ? 'text-purple-300' : 'text-blue-300'}`}>{m.senderName}</span>
                    <span className="text-xs text-slate-600">{format(new Date(m.createdAt), 'HH:mm')}</span>
                  </div>
                  <p className="text-slate-300 text-sm mt-0.5">{m.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
