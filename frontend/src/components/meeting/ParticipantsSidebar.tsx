'use client';
import { X, MicOff, Mic, VideoOff, Hand, Crown, UserMinus, Crown as CrownIcon } from 'lucide-react';
import { useMeetingStore, Participant } from '@/store/meeting.store';

interface Props {
  onClose: () => void;
  onMute?: (socketId: string, muted: boolean) => void;
  onRemove?: (socketId: string) => void;
}

export default function ParticipantsSidebar({ onClose, onMute, onRemove }: Props) {
  const { participants, role, mySocketId } = useMeetingStore();
  const isHost = role === 'host';

  return (
    <div className="sidebar animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Participants ({participants.filter(p => p.isActive).length})</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {participants.filter(p => p.isActive).map(p => (
          <div key={p.socketId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 group">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${p.role === 'host' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {p.displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {p.role === 'host' && <Crown className="w-3 h-3 text-yellow-400" />}
                <span className="text-white text-sm font-medium truncate">
                  {p.displayName}{p.socketId === mySocketId ? ' (You)' : ''}
                </span>
              </div>
              <span className="text-xs text-slate-500 capitalize">{p.role}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {p.handRaised && <Hand className="w-4 h-4 text-yellow-400" />}
              {p.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
              {p.isCameraOff && <VideoOff className="w-4 h-4 text-red-400" />}

              {isHost && p.socketId !== mySocketId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={() => onMute?.(p.socketId, !p.isMuted)}
                    title={p.isMuted ? 'Unmute' : 'Mute'}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    {p.isMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => onRemove?.(p.socketId)}
                    title="Remove"
                    className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
