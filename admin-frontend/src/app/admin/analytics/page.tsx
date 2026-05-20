'use client';
import { useEffect, useState } from 'react';
import { BarChart2, Users, Video, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/meetings/stats'), api.get('/meetings')]).then(([s, m]) => {
      setStats(s.data);
      setMeetings(m.data);
    }).finally(() => setLoading(false));
  }, []);

  const endedMeetings = meetings.filter(m => m.status === 'ended');
  const avgDuration = endedMeetings.length > 0
    ? Math.round(endedMeetings.filter(m => m.startedAt && m.endedAt).reduce((acc, m) => {
        return acc + (new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000;
      }, 0) / endedMeetings.length)
    : 0;

  const byMonth: Record<string, number> = {};
  meetings.forEach(m => {
    const month = format(new Date(m.createdAt), 'MMM yyyy');
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  const monthData = Object.entries(byMonth).slice(-6);
  const maxCount = Math.max(...monthData.map(([, v]) => v), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Meeting insights and usage statistics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Meetings', value: stats?.total ?? 0, icon: Video, color: 'text-blue-400', bg: 'bg-blue-600/20' },
          { label: 'Active Now', value: stats?.active ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-600/20' },
          { label: 'Total Participants', value: stats?.totalParticipants ?? 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-600/20' },
          { label: 'Avg Duration (min)', value: loading ? '—' : avgDuration, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-600/20' },
        ].map((card, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{loading ? '—' : card.value}</div>
            <div className="text-slate-400 text-sm mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings by month bar chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-6">Meetings Per Month</h2>
          {monthData.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">No data yet</div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthData.map(([month, count]) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-white text-xs font-bold">{count}</span>
                  <div className="w-full bg-blue-600 rounded-t-md transition-all" style={{ height: `${(count / maxCount) * 100}%`, minHeight: '4px' }} />
                  <span className="text-slate-500 text-xs text-center leading-tight">{month.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-6">Meeting Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', value: stats?.active ?? 0, color: 'bg-green-500', pct: stats?.total ? Math.round((stats.active / stats.total) * 100) : 0 },
              { label: 'Scheduled', value: stats?.scheduled ?? 0, color: 'bg-blue-500', pct: stats?.total ? Math.round((stats.scheduled / stats.total) * 100) : 0 },
              { label: 'Ended', value: stats?.ended ?? 0, color: 'bg-slate-500', pct: stats?.total ? Math.round((stats.ended / stats.total) * 100) : 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-medium">{item.value} <span className="text-slate-500 font-normal">({item.pct}%)</span></span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top meetings by participants */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Recent Meetings Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase py-2 pr-4">Title</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase py-2 pr-4">Status</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase py-2 pr-4">Codes</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {meetings.slice(0, 8).map(m => (
                  <tr key={m.id} className="hover:bg-white/5">
                    <td className="py-2.5 pr-4 text-white text-sm truncate max-w-[200px]">{m.title}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        m.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        m.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300 text-sm">{m.codes?.length || 0}</td>
                    <td className="py-2.5 text-slate-400 text-sm">{format(new Date(m.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
