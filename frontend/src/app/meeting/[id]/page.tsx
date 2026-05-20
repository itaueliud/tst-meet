'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/meeting.store';
import { useMeeting } from '@/lib/useMeeting';
import VideoTile from '@/components/meeting/VideoTile';
import ChatSidebar from '@/components/meeting/ChatSidebar';
import ParticipantsSidebar from '@/components/meeting/ParticipantsSidebar';
import MeetingControls from '@/components/meeting/MeetingControls';
import Whiteboard from '@/components/meeting/Whiteboard';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MeetingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const store = useMeetingStore();

  useEffect(() => {
    const raw = sessionStorage.getItem('tst_meeting');
    if (!raw) { router.push('/join'); return; }
    const info = JSON.parse(raw);
    if (info.meetingId !== id) { router.push('/join'); return; }
    store.setMeeting(info.meetingId, info.meetingTitle, info.role, info.displayName);
    setLoaded(true);
  }, [id]);

  const meeting = useMeeting(
    loaded ? id : '',
    store.displayName || '',
    store.role || '',
    () => {
      sessionStorage.removeItem('tst_meeting');
      router.push('/');
    },
  );

  const handleEndMeeting = async () => {
    if (!confirm('End the meeting for everyone?')) return;
    meeting.endMeeting();
    try { await api.patch(`/meetings/${id}/end`); } catch {}
    sessionStorage.removeItem('tst_meeting');
    router.push('/');
  };

  const handleLeaveMeeting = () => {
    if (!confirm('Leave the meeting?')) return;
    sessionStorage.removeItem('tst_meeting');
    router.push('/');
  };

  const handleLockMeeting = async (lock: boolean) => {
    meeting.lockMeeting(lock);
    try { await api.patch(`/meetings/${id}/lock`, { lock }); } catch {}
  };

  if (!loaded || !store.meetingId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Connecting to meeting...</div>
      </div>
    );
  }

  const allParticipants = store.participants.filter(p => p.isActive);
  const count = allParticipants.length + 1; // +1 for self
  const gridClass = count === 1 ? 'grid-1' : count === 2 ? 'grid-2' : count <= 4 ? 'grid-4' : count <= 6 ? 'grid-6' : 'grid-9';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 glass border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">T</div>
          <div>
            <div className="text-white font-semibold text-sm">{store.meetingTitle}</div>
            <div className="text-slate-400 text-xs flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {allParticipants.length + 1} participants
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {store.role === 'host' && (
            <span className="text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-medium">👑 Host</span>
          )}
          <span className="text-xs text-slate-500 font-mono">{id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video grid */}
        <div className="flex-1 p-3 overflow-hidden">
          {store.view === 'grid' ? (
            <div className={`video-grid ${gridClass} h-full`}>
              {/* Local video */}
              <VideoTile
                socketId="local"
                displayName={store.displayName || ''}
                role={store.role || ''}
                isMuted={store.isMuted}
                isCameraOff={store.isCameraOff}
                handRaised={store.handRaised}
                stream={store.screenStream || store.localStream || undefined}
                isLocal
                onPin={() => store.setPinned(store.pinnedParticipant === 'local' ? null : 'local')}
                isPinned={store.pinnedParticipant === 'local'}
              />
              {/* Remote participants */}
              {allParticipants.map(p => (
                <VideoTile
                  key={p.socketId}
                  socketId={p.socketId}
                  displayName={p.displayName}
                  role={p.role}
                  isMuted={p.isMuted}
                  isCameraOff={p.isCameraOff}
                  handRaised={p.handRaised}
                  stream={store.peerStreams.get(p.socketId)}
                  onPin={() => store.setPinned(store.pinnedParticipant === p.socketId ? null : p.socketId)}
                  isPinned={store.pinnedParticipant === p.socketId}
                />
              ))}
            </div>
          ) : (
            /* Speaker view */
            <div className="h-full flex gap-3">
              <div className="flex-1">
                {store.pinnedParticipant && store.pinnedParticipant !== 'local' ? (
                  <VideoTile
                    socketId={store.pinnedParticipant}
                    displayName={allParticipants.find(p => p.socketId === store.pinnedParticipant)?.displayName || ''}
                    role={allParticipants.find(p => p.socketId === store.pinnedParticipant)?.role || ''}
                    isMuted={allParticipants.find(p => p.socketId === store.pinnedParticipant)?.isMuted || false}
                    isCameraOff={allParticipants.find(p => p.socketId === store.pinnedParticipant)?.isCameraOff || false}
                    handRaised={allParticipants.find(p => p.socketId === store.pinnedParticipant)?.handRaised || false}
                    stream={store.peerStreams.get(store.pinnedParticipant)}
                  />
                ) : (
                  <VideoTile
                    socketId="local"
                    displayName={store.displayName || ''}
                    role={store.role || ''}
                    isMuted={store.isMuted}
                    isCameraOff={store.isCameraOff}
                    handRaised={store.handRaised}
                    stream={store.screenStream || store.localStream || undefined}
                    isLocal
                  />
                )}
              </div>
              <div className="w-48 flex flex-col gap-2 overflow-y-auto">
                {[
                  { id: 'local', name: store.displayName!, role: store.role!, muted: store.isMuted, camOff: store.isCameraOff, hand: store.handRaised, stream: store.localStream },
                  ...allParticipants.map(p => ({ id: p.socketId, name: p.displayName, role: p.role, muted: p.isMuted, camOff: p.isCameraOff, hand: p.handRaised, stream: store.peerStreams.get(p.socketId) })),
                ].map(p => (
                  <VideoTile
                    key={p.id}
                    socketId={p.id}
                    displayName={p.name}
                    role={p.role}
                    isMuted={p.muted}
                    isCameraOff={p.camOff}
                    handRaised={p.hand}
                    stream={p.stream || undefined}
                    isLocal={p.id === 'local'}
                    onPin={() => store.setPinned(store.pinnedParticipant === p.id ? null : p.id)}
                    isPinned={store.pinnedParticipant === p.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebars */}
        {store.showWhiteboard && (
          <div className="absolute inset-0 z-40 lg:static lg:inset-auto lg:z-auto">
            <Whiteboard
              onDraw={meeting.sendWhiteboardDraw}
              onExternalDraw={meeting.onWhiteboardDraw}
              onClear={meeting.clearWhiteboard}
              onClose={() => store.setShowWhiteboard(false)}
            />
          </div>
        )}
        {store.showParticipants && (
          <div className="absolute inset-0 z-40 lg:static lg:inset-auto lg:z-auto">
            <ParticipantsSidebar
              onClose={() => store.setShowParticipants(false)}
              onMute={meeting.muteParticipant}
              onRemove={meeting.removeParticipant}
            />
          </div>
        )}
        {store.showChat && (
          <div className="absolute inset-0 z-40 lg:static lg:inset-auto lg:z-auto">
            <ChatSidebar
              onSend={meeting.sendMessage}
              onClose={() => store.setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Emoji reactions */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-40">
        {store.reactions.map(r => (
          <div key={r.id} className="emoji-reaction flex flex-col items-center gap-1">
            <span className="text-4xl">{r.emoji}</span>
            <span className="text-xs text-white/70 bg-black/50 px-2 py-0.5 rounded-full">{r.senderName}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="shrink-0">
        <MeetingControls
          onToggleMute={meeting.toggleMute}
          onToggleCamera={meeting.toggleCamera}
          onToggleHand={meeting.toggleHand}
          onShareScreen={meeting.startScreenShare}
          onStopShare={meeting.stopScreenShare}
          onSendReaction={meeting.sendReaction}
          onEndMeeting={handleEndMeeting}
          onLeaveMeeting={handleLeaveMeeting}
          onLockMeeting={handleLockMeeting}
          isLocked={store.isLocked}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
        />
      </div>
    </div>
  );
}
