import React from 'react';
import { useStore } from '../../store';
import { GitBranch, UserPlus, History, MessageSquare, Activity, Github } from 'lucide-react';

export default function TopBar() {
  const { members, workspaceId, setShowInviteModal, setSidePanel, sidePanel, connected } = useStore();
  const online = members.filter(m => m.online);

  return (
    <div className="h-10 bg-nexus-panel border-b border-nexus-border flex items-center px-3 gap-3 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-5 h-5 rounded bg-nexus-teal/15 border border-nexus-teal/30 flex items-center justify-center">
          <span className="text-nexus-teal text-[9px] font-bold">N</span>
        </div>
        <span className="text-white text-xs font-semibold tracking-wider">NEXUS CODE</span>
      </div>

      <div className="w-px h-4 bg-nexus-border" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full live-dot ${connected ? 'bg-nexus-teal' : 'bg-nexus-muted'}`} />
        <span className="text-nexus-dim text-xs">
          {online.length} {online.length === 1 ? 'dev' : 'devs'} online
        </span>
      </div>

      {/* Member avatars */}
      <div className="flex items-center -space-x-1.5 ml-1">
        {online.slice(0, 5).map(m => (
          <div key={m.id} title={m.name}
            className="w-5 h-5 rounded-full border border-nexus-bg flex items-center justify-center text-[8px] font-bold"
            style={{ background: m.color + '33', color: m.color, borderColor: m.color + '66' }}>
            {m.name[0].toUpperCase()}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {[
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'history', icon: History, label: 'History' },
          { id: 'activity', icon: Activity, label: 'Activity' },
          { id: 'github', icon: Github, label: 'GitHub' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setSidePanel(id)} title={label}
            className={`p-1.5 rounded transition-colors ${sidePanel === id
              ? 'text-nexus-teal bg-nexus-teal/10'
              : 'text-nexus-muted hover:text-nexus-text'}`}>
            <Icon size={13} />
          </button>
        ))}

        <div className="w-px h-4 bg-nexus-border mx-1" />

        <button onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-nexus-teal border border-nexus-teal/25 hover:bg-nexus-teal/10 transition-colors">
          <UserPlus size={11} />
          Invite
        </button>
      </div>
    </div>
  );
}
