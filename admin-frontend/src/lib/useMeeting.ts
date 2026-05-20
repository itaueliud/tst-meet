'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMeetingStore } from '@/store/meeting.store';
import toast from 'react-hot-toast';
const uuidv4 = () => crypto.randomUUID();

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useMeeting(meetingId: string, displayName: string, role: string, onEnded?: () => void) {
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const store = useMeetingStore();

  const getOrCreatePC = useCallback((targetId: string): RTCPeerConnection => {
    if (pcsRef.current.has(targetId)) return pcsRef.current.get(targetId)!;
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit('ice-candidate', { to: targetId, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) store.addPeerStream(targetId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        store.removePeerStream(targetId);
        pcsRef.current.delete(targetId);
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }

    pcsRef.current.set(targetId, pc);
    return pc;
  }, [store]);

  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      store.setLocalStream(stream);
      return stream;
    } catch (err) {
      // Try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        store.setLocalStream(stream);
        store.setCameraOff(true);
        toast('Camera not available, audio only');
        return stream;
      } catch {
        toast.error('No media devices found');
        return null;
      }
    }
  }, [store]);

  useEffect(() => {
    if (!meetingId || !displayName) return;

    const socket = io(`${WS_URL}/meeting`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', async () => {
      store.setMySocketId(socket.id!);
      await initLocalMedia();
      socket.emit('join-meeting', { meetingId, displayName, role });
    });

    socket.on('participants-updated', (participants) => {
      store.setParticipants(participants);
    });

    socket.on('chat-history', (messages) => {
      store.setMessages(messages);
    });

    socket.on('new-message', (msg) => {
      store.addMessage(msg);
      if (!store.showChat) store.incrementUnread();
    });

    socket.on('reaction', (data) => {
      const id = uuidv4();
      store.addReaction({ id, ...data });
      setTimeout(() => store.removeReaction(id), 2500);
    });

    socket.on('hand-raised', (data) => {
      if (data.raised) toast(`✋ ${data.displayName} raised their hand`);
    });

    socket.on('meeting-ended', () => {
      toast('Meeting has ended');
      onEnded?.();
    });

    socket.on('removed-from-meeting', () => {
      toast.error('You were removed from the meeting');
      onEnded?.();
    });

    socket.on('force-muted', ({ muted }) => {
      if (muted) {
        store.setMuted(true);
        localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = false);
        toast('You were muted by the host');
      }
    });

    socket.on('meeting-locked', ({ locked }) => {
      toast(locked ? '🔒 Meeting locked' : '🔓 Meeting unlocked');
    });

    // WebRTC signaling
    socket.on('participant-joined', async ({ socketId, displayName: name }) => {
      // Initiate offer to new participant
      const pc = getOrCreatePC(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: socketId, offer, from: displayName });
    });

    socket.on('offer', async ({ offer, from: fromId, fromName }) => {
      const pc = getOrCreatePC(fromId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: fromId, answer });
    });

    socket.on('answer', async ({ answer, from }) => {
      const pc = pcsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      const pc = pcsRef.current.get(from);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    socket.on('participant-left', ({ socketId }) => {
      const pc = pcsRef.current.get(socketId);
      if (pc) { pc.close(); pcsRef.current.delete(socketId); }
      store.removePeerStream(socketId);
    });

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      store.screenStream?.getTracks().forEach(t => t.stop());
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      socket.disconnect();
      store.reset();
    };
  }, [meetingId, displayName]);

  const toggleMute = useCallback(() => {
    const muted = !store.isMuted;
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !muted);
    store.setMuted(muted);
    socketRef.current?.emit('toggle-mute', { meetingId, isMuted: muted });
  }, [store, meetingId]);

  const toggleCamera = useCallback(() => {
    const off = !store.isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !off);
    store.setCameraOff(off);
    socketRef.current?.emit('toggle-camera', { meetingId, isCameraOff: off });
  }, [store, meetingId]);

  const toggleHand = useCallback(() => {
    const raised = !store.handRaised;
    store.setHandRaised(raised);
    socketRef.current?.emit('raise-hand', { meetingId, raised, displayName });
  }, [store, meetingId, displayName]);

  const sendMessage = useCallback((message: string) => {
    socketRef.current?.emit('send-message', { meetingId, message, senderName: displayName, senderRole: role });
  }, [meetingId, displayName, role]);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit('reaction', { meetingId, emoji, senderName: displayName });
  }, [meetingId, displayName]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      store.setScreenStream(stream);
      store.setSharingScreen(true);
      socketRef.current?.emit('screen-share-started', { meetingId, displayName });

      // Replace video track in all PCs
      const videoTrack = stream.getVideoTracks()[0];
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
      toast.error('Screen share failed');
    }
  }, [meetingId, displayName, store]);

  const stopScreenShare = useCallback(async () => {
    store.screenStream?.getTracks().forEach(t => t.stop());
    store.setScreenStream(null);
    store.setSharingScreen(false);
    socketRef.current?.emit('screen-share-stopped', { meetingId });

    // Restore camera track
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
      }
    }
  }, [meetingId, store]);

  const muteParticipant = useCallback((targetSocketId: string, mute: boolean) => {
    socketRef.current?.emit('host-mute-participant', { meetingId, targetSocketId, mute });
  }, [meetingId]);

  const removeParticipant = useCallback((targetSocketId: string) => {
    socketRef.current?.emit('host-remove-participant', { meetingId, targetSocketId });
  }, [meetingId]);

  const endMeeting = useCallback(() => {
    socketRef.current?.emit('host-end-meeting', { meetingId });
  }, [meetingId]);

  const lockMeeting = useCallback((lock: boolean) => {
    socketRef.current?.emit('host-lock-meeting', { meetingId, locked: lock });
  }, [meetingId]);

  const sendWhiteboardDraw = useCallback((drawData: any) => {
    socketRef.current?.emit('whiteboard-draw', { meetingId, drawData });
  }, [meetingId]);

  const clearWhiteboard = useCallback(() => {
    socketRef.current?.emit('whiteboard-clear', { meetingId });
  }, [meetingId]);

  const onWhiteboardDraw = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('whiteboard-draw', cb);
    socketRef.current?.on('whiteboard-clear', () => cb({ clear: true }));
  }, []);

  return {
    socket: socketRef.current,
    toggleMute, toggleCamera, toggleHand,
    sendMessage, sendReaction,
    startScreenShare, stopScreenShare,
    muteParticipant, removeParticipant, endMeeting, lockMeeting,
    sendWhiteboardDraw, clearWhiteboard, onWhiteboardDraw,
  };
}
