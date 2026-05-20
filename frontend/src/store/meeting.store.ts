import { create } from 'zustand';

export interface Participant {
  id: string;
  socketId: string;
  displayName: string;
  role: string;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
  isActive: boolean;
  stream?: MediaStream;
}

export interface ChatMsg {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  type: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  senderName: string;
  socketId: string;
}

interface MeetingState {
  meetingId: string | null;
  meetingTitle: string | null;
  role: string | null;
  displayName: string | null;
  mySocketId: string | null;
  participants: Participant[];
  messages: ChatMsg[];
  reactions: Reaction[];
  isLocked: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  handRaised: boolean;
  isSharingScreen: boolean;
  view: 'grid' | 'speaker';
  pinnedParticipant: string | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  peerStreams: Map<string, MediaStream>;
  showChat: boolean;
  showParticipants: boolean;
  showWhiteboard: boolean;
  unreadMessages: number;

  setMeeting: (id: string, title: string, role: string, name: string) => void;
  setMySocketId: (id: string) => void;
  setParticipants: (p: Participant[]) => void;
  addMessage: (m: ChatMsg) => void;
  setMessages: (msgs: ChatMsg[]) => void;
  addReaction: (r: Reaction) => void;
  removeReaction: (id: string) => void;
  setMuted: (v: boolean) => void;
  setCameraOff: (v: boolean) => void;
  setHandRaised: (v: boolean) => void;
  setSharingScreen: (v: boolean) => void;
  setView: (v: 'grid' | 'speaker') => void;
  setPinned: (id: string | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setScreenStream: (s: MediaStream | null) => void;
  addPeerStream: (socketId: string, stream: MediaStream) => void;
  removePeerStream: (socketId: string) => void;
  setShowChat: (v: boolean) => void;
  setShowParticipants: (v: boolean) => void;
  setShowWhiteboard: (v: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  reset: () => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetingId: null, meetingTitle: null, role: null, displayName: null, mySocketId: null,
  participants: [], messages: [], reactions: [], isLocked: false,
  isMuted: false, isCameraOff: false, handRaised: false, isSharingScreen: false,
  view: 'grid', pinnedParticipant: null, localStream: null, screenStream: null,
  peerStreams: new Map(), showChat: false, showParticipants: false, showWhiteboard: false,
  unreadMessages: 0,

  setMeeting: (id, title, role, name) => set({ meetingId: id, meetingTitle: title, role, displayName: name }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setParticipants: (p) => set({ participants: p }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setMessages: (msgs) => set({ messages: msgs }),
  addReaction: (r) => set((s) => ({ reactions: [...s.reactions, r] })),
  removeReaction: (id) => set((s) => ({ reactions: s.reactions.filter(r => r.id !== id) })),
  setMuted: (v) => set({ isMuted: v }),
  setCameraOff: (v) => set({ isCameraOff: v }),
  setHandRaised: (v) => set({ handRaised: v }),
  setSharingScreen: (v) => set({ isSharingScreen: v }),
  setView: (v) => set({ view: v }),
  setPinned: (id) => set({ pinnedParticipant: id }),
  setLocalStream: (s) => set({ localStream: s }),
  setScreenStream: (s) => set({ screenStream: s }),
  addPeerStream: (socketId, stream) => set((s) => {
    const m = new Map(s.peerStreams); m.set(socketId, stream); return { peerStreams: m };
  }),
  removePeerStream: (socketId) => set((s) => {
    const m = new Map(s.peerStreams); m.delete(socketId); return { peerStreams: m };
  }),
  setShowChat: (v) => set({ showChat: v }),
  setShowParticipants: (v) => set({ showParticipants: v }),
  setShowWhiteboard: (v) => set({ showWhiteboard: v }),
  incrementUnread: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
  clearUnread: () => set({ unreadMessages: 0 }),
  reset: () => set({
    meetingId: null, meetingTitle: null, role: null, displayName: null, mySocketId: null,
    participants: [], messages: [], reactions: [], isLocked: false,
    isMuted: false, isCameraOff: false, handRaised: false, isSharingScreen: false,
    view: 'grid', pinnedParticipant: null, localStream: null, screenStream: null,
    peerStreams: new Map(), showChat: false, showParticipants: false, showWhiteboard: false, unreadMessages: 0,
  }),
}));
