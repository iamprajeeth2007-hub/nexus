import React from 'react';
import { useStore } from '../../store';
import { Wifi, WifiOff, GitCommit, Clock } from 'lucide-react';

export default function BottomBar() {
  const { connected, totalChanges, changeLog, activeFile } = useStore();
  const last = changeLog[changeLog.length - 1];

  return (
    <div className="h-6 bg-nexus-panel border-t border-nexus-border flex items-center px-3 gap-4 flex-shrink-0">
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        {connected
          ? <Wifi size={10} className="text-nexus-teal" />
          : <WifiOff size={10} className="text-nexus-muted" />}
        <span className={`text-[10px] ${connected ? 'text-nexus-teal' : 'text-nexus-muted'}`}>
          {connected ? 'Connected' : 'Reconnecting...'}
        </span>
      </div>

      <div className="w-px h-3 bg-nexus-border" />

      {/* Change count */}
      <div className="flex items-center gap-1.5">
        <GitCommit size={10} className="text-nexus-dim" />
        <span className="text-[10px] text-nexus-dim">{totalChanges} changes saved</span>
      </div>

      {/* Last change */}
      {last && (
        <>
          <div className="w-px h-3 bg-nexus-border" />
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-nexus-muted" />
            <span className="text-[10px] text-nexus-muted">
              Last: <span style={{ color: last.userColor }}>{last.userName}</span> → {last.filePath}
            </span>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Active file */}
      <span className="text-[10px] text-nexus-muted">{activeFile}</span>
    </div>
  );
}
