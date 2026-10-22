import React from 'react';
import { useStore } from '../../store';
import { Code2, MessageSquare, Settings, History, Github, Activity, Wifi, WifiOff } from 'lucide-react';

export default function Sidebar() {
  const { sidePanel, setSidePanel, connected, members } = useStore();
  const onlineCount = members.filter(m => m.online).length;

  const items = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'activity', icon: Activity, label: 'Activity' },
    { id: 'github', icon: Github, label: 'GitHub' },
  ];

  return (
    <div className="w-10 bg-nexus-panel border-r border-nexus-border flex flex-col items-center py-2 gap-1 flex-shrink-0">
      {/* Members count */}
      <div className="w-7 h-7 rounded-lg bg-nexus-teal/10 border border-nexus-teal/20 flex items-center justify-center mb-2" title={`${onlineCount} online`}>
        <span className="text-nexus-teal text-[9px] font-bold">{onlineCount}</span>
      </div>

      <div className="w-5 h-px bg-nexus-border mb-1" />

      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => setSidePanel(id)} title={label}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${sidePanel === id
            ? 'bg-nexus-teal/10 text-nexus-teal border border-nexus-teal/25'
            : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface'}`}>
          <Icon size={13} />
        </button>
      ))}

      <div className="flex-1" />

      {/* Connection dot */}
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-nexus-teal live-dot' : 'bg-nexus-muted'}`} title={connected ? 'Connected' : 'Offline'} />
    </div>
  );
}
