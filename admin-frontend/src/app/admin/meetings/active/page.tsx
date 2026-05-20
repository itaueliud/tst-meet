'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, Clock, Lock, Square, RefreshCw, Eye } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ActiveMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/meetings/active');
      setMeetings(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  const endMeeting = async (id: string, title: string) => {
    if (!confirm(`End "${title}" for all participants?`)) return;
    try {
      await api.patch(`/meetings/${id}/end`);
      toast.success('Meeting ended');
      load();
    } catch { toast.error('Failed to end meeting'); }
  };

  const lockMeeting = async (id: string, lock: boolean) => {
    try {
      await api.patch(`/meetings/${id}/lock`, { lock });
      toast.success(lock ? 'Meeting locked' : 'Meeting unlocked');
      load();
    } catch { toast.error('Failed to update meeting'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Meetings</h1>
          <p className="text-slate-400 text-sm mt-1">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} currently live</p>
        </div>
        <button onClick={load} className="btn-ghost text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">No active meetings</h3>
          <p className="text-slate-600 text-sm mt-1">Meetings will appear here when started</p>
          <button onClick={() => router.push('/admin/meetings/create')} className="btn-primary mt-4 mx-auto">
            Create Meeting
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map(m => (
            <div key={m.id} className="card hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">{m.title}</h3>
                    {m.description && <p className="text-slate-400 text-sm">{m.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.isLocked && (
                    <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {m.participants?.filter((p: any) => p.isActive).length || 0} participants
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Started {formatDistanceToNow(new Date(m.startedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => router.push(`/admin/meetings/${m.id}`)} className="btn-ghost text-sm px-3 py-1.5">
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
                <button onClick={() => lockMeeting(m.id, !m.isLocked)} className="btn-ghost text-sm px-3 py-1.5">
                  <Lock className="w-3.5 h-3.5" /> {m.isLocked ? 'Unlock' : 'Lock'}
                </button>
                <button onClick={() => endMeeting(m.id, m.title)}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                  <Square className="w-3.5 h-3.5" /> End Meeting
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
