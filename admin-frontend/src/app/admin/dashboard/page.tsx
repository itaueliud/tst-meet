'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Activity, History, Plus, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, meetingsRes] = await Promise.all([
        api.get('/meetings/stats'),
        api.get('/meetings'),
      ]);
      setStats(statsRes.data);
      setRecentMeetings(meetingsRes.data.slice(0, 5));
    } finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Total Meetings', value: stats?.total ?? 0, icon: Video, gradient: 'from-blue-600 to-blue-800', change: 'All time' },
    { label: 'Active Now', value: stats?.active ?? 0, icon: Activity, gradient: 'from-green-600 to-green-800', change: 'Live' },
    { label: 'Participants', value: stats?.totalParticipants ?? 0, icon: Users, gradient: 'from-purple-600 to-purple-800', change: 'Total joined' },
    { label: 'Completed', value: stats?.ended ?? 0, icon: CheckCircle, gradient: 'from-slate-600 to-slate-800', change: 'Ended' },
  ];

  const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ended: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button onClick={() => router.push('/admin/meetings/create')}
          className="btn-primary">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 border border-white/10`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading ? '—' : card.value.toLocaleString()}
            </div>
            <div className="text-white/70 text-sm font-medium">{card.label}</div>
            <div className="text-white/50 text-xs mt-1">{card.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Create New Meeting', href: '/admin/meetings/create', icon: Plus, color: 'text-blue-400' },
              { label: 'View Active Meetings', href: '/admin/meetings/active', icon: Activity, color: 'text-green-400' },
              { label: 'Meeting History', href: '/admin/meetings/history', icon: History, color: 'text-purple-400' },
              { label: 'Analytics', href: '/admin/analytics', icon: Users, color: 'text-orange-400' },
            ].map(action => (
              <button key={action.href} onClick={() => router.push(action.href)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{action.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Meetings</h2>
            <button onClick={() => router.push('/admin/meetings/history')} className="text-blue-400 text-sm hover:text-blue-300">View all</button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No meetings yet. Create your first one!</div>
          ) : (
            <div className="space-y-2">
              {recentMeetings.map(m => (
                <button key={m.id} onClick={() => router.push(`/admin/meetings/${m.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{m.title}</div>
                    <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[m.status as keyof typeof statusColors] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                    {m.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
