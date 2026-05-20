'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useMeetingStore } from '@/store/meeting.store';
import { format } from 'date-fns';

interface Props {
  onSend: (msg: string) => void;
  onClose: () => void;
}

export default function ChatSidebar({ onSend, onClose }: Props) {
  const { messages, displayName, role, clearUnread } = useMeetingStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    clearUnread();
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="sidebar animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Chat</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-8">No messages yet. Say hello! 👋</div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.senderName === displayName ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${msg.senderRole === 'host' ? 'text-purple-300' : 'text-slate-400'}`}>
                {msg.senderRole === 'host' && '👑 '}{msg.senderName}
              </span>
              <span className="text-xs text-slate-600">{format(new Date(msg.createdAt), 'HH:mm')}</span>
            </div>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              msg.senderName === displayName
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white/10 text-slate-200 rounded-tl-sm'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Type a message..." className="flex-1 text-sm py-2"
            maxLength={500} />
          <button type="submit" disabled={!input.trim()}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors shrink-0">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
