import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Send, Hash } from 'lucide-react';

function timeStr(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ chatSocket }) {
  const { chatMessages, user } = useStore();
  const [channel, setChannel] = useState('general');
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const channels = ['general', 'code-help'];
  const messages = chatMessages[channel] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, channel]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    chatSocket.sendMessage(channel, input.trim());
    setInput('');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Channels */}
      <div className="flex-shrink-0 border-b border-nexus-border">
        <div className="flex">
          {channels.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] transition-colors ${
                channel === ch
                  ? 'text-nexus-teal border-b border-nexus-teal bg-nexus-teal/5'
                  : 'text-nexus-muted hover:text-nexus-text'}`}>
              <Hash size={9} />
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-none">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[10px] text-nexus-muted">No messages yet in #{channel}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const grouped = prev && prev.userId === msg.userId &&
            (new Date(msg.timestamp) - new Date(prev.timestamp)) < 120000;
          return (
            <MessageRow key={msg.id || i} msg={msg} grouped={grouped} isMe={msg.userId === user?.userId} />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-2 border-t border-nexus-border">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder={`#${channel}`}
            className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-1.5 text-[11px] text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-teal/30 transition-colors"
            maxLength={500}
          />
          <button type="submit" disabled={!input.trim()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-nexus-teal border border-nexus-teal/25 hover:bg-nexus-teal/10 transition-colors disabled:opacity-30">
            <Send size={11} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageRow({ msg, grouped, isMe }) {
  return (
    <div className={`flex items-start gap-2 px-1 py-0.5 rounded-lg hover:bg-nexus-surface transition-colors group ${grouped ? 'mt-0' : 'mt-2'}`}>
      {!grouped ? (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
          style={{ background: (msg.userColor || '#4a4a6a') + '22', color: msg.userColor || '#4a4a6a' }}>
          {msg.userName?.[0]?.toUpperCase()}
        </div>
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[11px] font-medium" style={{ color: msg.userColor || '#c8c8d8' }}>
              {msg.userName} {isMe && <span className="text-nexus-muted font-normal text-[9px]">(you)</span>}
            </span>
            <span className="text-[9px] text-nexus-muted">{timeStr(msg.timestamp)}</span>
          </div>
        )}
        <p className="text-[11px] text-nexus-text leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: msg.text }} />
      </div>
    </div>
  );
}
