'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, Users, Clock, Search, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format, formatDuration, intervalToDuration } from 'date-fns';

export default function MeetingHistoryPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(meetings.filter(m => m.title.toLowerCase().includes(q) || m.id.includes(q)));
  }, [search, meetings]);

  const load = async () => {
    try {
      const res = await api.get('/meetings/history');
      setMeetings(res.data);
      setFiltered(res.data);
    } finally { setLoading(false); }
  };

  const deleteMeeting = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its data? This cannot be undone.`)) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting deleted');
      load();
    } catch { toast.error('Failed to delete meeting'); }
  };

  const getDuration = (m: any) => {
    if (!m.startedAt || !m.endedAt) return '—';
    const dur = intervalToDuration({ start: new Date(m.startedAt), end: new Date(m.endedAt) });
    return formatDuration(dur, { format: ['hours', 'minutes'] }) || '< 1 min';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Meeting History</h1>
          <p className="text-slate-400 text-sm mt-1">{meetings.length} completed meetings</p>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search meetings..." className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">{search ? 'No results found' : 'No completed meetings'}</h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3">Meeting</th>
                <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Duration</th>
                <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Participants</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white text-sm font-medium">{m.title}</div>
                    <div className="text-slate-500 text-xs font-mono">{m.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-slate-300 text-sm">{format(new Date(m.endedAt || m.createdAt), 'MMM d, yyyy')}</div>
                    <div className="text-slate-500 text-xs">{format(new Date(m.endedAt || m.createdAt), 'HH:mm')}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {getDuration(m)}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {m.participants?.length || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => router.push(`/admin/meetings/${m.id}`)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMeeting(m.id, m.title)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
