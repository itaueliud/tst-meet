'use client';
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, Hand, MessageSquare, Users, Layout, PhoneOff, Lock, Unlock, PenTool } from 'lucide-react';
import { useMeetingStore } from '@/store/meeting.store';

const EMOJIS = ['??', '??', '??', '??', '??', '??', '??', '??'];

interface Props {
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleHand: () => void;
  onShareScreen: () => void;
  onStopShare: () => void;
  onSendReaction: (emoji: string) => void;
  onEndMeeting?: () => void;
  onLeaveMeeting: () => void;
  onLockMeeting?: (lock: boolean) => void;
  isLocked?: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
}

export default function MeetingControls({
  onToggleMute, onToggleCamera, onToggleHand, onShareScreen, onStopShare,
  onSendReaction, onEndMeeting, onLeaveMeeting, onLockMeeting,
  isLocked, showEmojiPicker, setShowEmojiPicker,
}: Props) {
  const { isMuted, isCameraOff, handRaised, isSharingScreen, role, showChat, showParticipants, showWhiteboard, setShowChat, setShowParticipants, setShowWhiteboard, setView, view, unreadMessages } = useMeetingStore();
  const isHost = role === 'host';

  return (
    <div className="relative px-3 py-2 glass border-t border-white/10">
      <div className="hidden md:flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-1/4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">LIVE</span>
        </div>

        <div className="flex items-center gap-2 justify-center">
          <button onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'} className={`control-btn ${isMuted ? 'muted' : 'active'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>
          <button onClick={onToggleCamera} title={isCameraOff ? 'Turn on camera' : 'Turn off camera'} className={`control-btn ${isCameraOff ? 'muted' : 'active'}`}>
            {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
          </button>
          <button onClick={isSharingScreen ? onStopShare : onShareScreen} title={isSharingScreen ? 'Stop sharing' : 'Share screen'} className={`control-btn ${isSharingScreen ? 'bg-blue-600 hover:bg-blue-700' : 'active'}`}>
            {isSharingScreen ? <MonitorOff className="w-5 h-5 text-white" /> : <MonitorUp className="w-5 h-5 text-white" />}
          </button>
          <button onClick={onToggleHand} className={`control-btn ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'active'}`} title={handRaised ? 'Lower hand' : 'Raise hand'}>
            <Hand className="w-5 h-5 text-white" />
          </button>

          <div className="relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="control-btn active text-lg">??</button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-xl p-2 flex gap-1.5 shadow-2xl z-50">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { onSendReaction(e); setShowEmojiPicker(false); }} className="text-2xl hover:scale-125 transition-transform w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">{e}</button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-white/10" />

          {isHost ? (
            <button onClick={onEndMeeting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 transition-colors text-sm">
              <PhoneOff className="w-4 h-4" />
              End Meeting
            </button>
          ) : (
            <button onClick={onLeaveMeeting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 transition-colors text-sm">
              <PhoneOff className="w-4 h-4" />
              Leave
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 justify-end w-1/4">
          {isHost && (
            <button onClick={() => onLockMeeting?.(!isLocked)} className={`control-btn ${isLocked ? 'bg-orange-600 hover:bg-orange-700' : 'active'}`} title={isLocked ? 'Unlock meeting' : 'Lock meeting'}>
              {isLocked ? <Lock className="w-4 h-4 text-white" /> : <Unlock className="w-4 h-4 text-white" />}
            </button>
          )}

          <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? 'bg-blue-600' : 'active'}`} title="Whiteboard">
            <PenTool className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setShowParticipants(!showParticipants)} className={`control-btn ${showParticipants ? 'bg-blue-600' : 'active'}`} title="Participants">
            <Users className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => { setShowChat(!showChat); }} className={`control-btn relative ${showChat ? 'bg-blue-600' : 'active'}`} title="Chat">
            <MessageSquare className="w-4 h-4 text-white" />
            {unreadMessages > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadMessages}</span>
            )}
          </button>
          <button onClick={() => setView(view === 'grid' ? 'speaker' : 'grid')} className="control-btn active" title="Toggle view">
            <Layout className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={onToggleMute} className={`control-btn ${isMuted ? 'muted' : 'active'}`}>{isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}</button>
          <button onClick={onToggleCamera} className={`control-btn ${isCameraOff ? 'muted' : 'active'}`}>{isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}</button>
          <button onClick={isSharingScreen ? onStopShare : onShareScreen} className={`control-btn ${isSharingScreen ? 'bg-blue-600 hover:bg-blue-700' : 'active'}`}>{isSharingScreen ? <MonitorOff className="w-5 h-5 text-white" /> : <MonitorUp className="w-5 h-5 text-white" />}</button>
          <button onClick={onToggleHand} className={`control-btn ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'active'}`}><Hand className="w-5 h-5 text-white" /></button>
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="control-btn active text-lg">??</button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-xl p-2 grid grid-cols-4 gap-1.5 shadow-2xl z-50">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { onSendReaction(e); setShowEmojiPicker(false); }} className="text-2xl hover:scale-125 transition-transform w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">{e}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowParticipants(!showParticipants)} className={`control-btn ${showParticipants ? 'bg-blue-600' : 'active'}`}><Users className="w-4 h-4 text-white" /></button>
          <button onClick={() => { setShowChat(!showChat); }} className={`control-btn relative ${showChat ? 'bg-blue-600' : 'active'}`}>
            <MessageSquare className="w-4 h-4 text-white" />
            {unreadMessages > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadMessages}</span>
            )}
          </button>
          <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? 'bg-blue-600' : 'active'}`}><PenTool className="w-4 h-4 text-white" /></button>
          <button onClick={() => setView(view === 'grid' ? 'speaker' : 'grid')} className="control-btn active"><Layout className="w-4 h-4 text-white" /></button>
          {isHost && (
            <button onClick={() => onLockMeeting?.(!isLocked)} className={`control-btn ${isLocked ? 'bg-orange-600 hover:bg-orange-700' : 'active'}`}>{isLocked ? <Lock className="w-4 h-4 text-white" /> : <Unlock className="w-4 h-4 text-white" />}</button>
          )}
          {isHost ? (
            <button onClick={onEndMeeting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 h-12 rounded-full flex items-center gap-2 transition-colors text-sm whitespace-nowrap"><PhoneOff className="w-4 h-4" />End</button>
          ) : (
            <button onClick={onLeaveMeeting} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 h-12 rounded-full flex items-center gap-2 transition-colors text-sm whitespace-nowrap"><PhoneOff className="w-4 h-4" />Leave</button>
          )}
        </div>
      </div>
    </div>
  );
}
