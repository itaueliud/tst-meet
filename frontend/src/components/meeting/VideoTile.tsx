'use client';
import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Hand, Crown, Pin, PinOff } from 'lucide-react';
import { useMeetingStore } from '@/store/meeting.store';

interface Props {
  socketId: string;
  displayName: string;
  role: string;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
  stream?: MediaStream;
  isLocal?: boolean;
  isSpeaking?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
}

export default function VideoTile({ socketId, displayName, role, isMuted, isCameraOff, handRaised, stream, isLocal, isSpeaking, onPin, isPinned }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = displayName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className={`video-tile relative group ${isSpeaking ? 'speaking' : ''}`}
      style={{ border: '2px solid transparent', borderRadius: '12px' }}>

      {/* Video or Avatar */}
      {stream && !isCameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal}
          className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800" style={{ aspectRatio: '16/9', minHeight: '120px' }}>
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          {role === 'host' && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
          <span className="text-white text-xs font-medium truncate">{displayName}{isLocal ? ' (You)' : ''}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {handRaised && <Hand className="w-3.5 h-3.5 text-yellow-400" />}
          {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
          {isCameraOff && <VideoOff className="w-3.5 h-3.5 text-red-400" />}
        </div>
      </div>

      {/* Pin button */}
      {onPin && (
        <button onClick={onPin}
          className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
          {isPinned ? <PinOff className="w-3.5 h-3.5 text-white" /> : <Pin className="w-3.5 h-3.5 text-white" />}
        </button>
      )}
    </div>
  );
}
