import React from 'react';
import { useStore } from '../../store';
import { GitCommit, RotateCcw } from 'lucide-react';

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function HistoryPanel({ editorSocket }) {
  const { changeLog, totalChanges } = useStore();
  const reversed = [...changeLog].reverse();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-nexus-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-xs font-semibold text-nexus-text">Change History</h3>
        <span className="text-[10px] text-nexus-teal bg-nexus-teal/10 px-2 py-0.5 rounded-full border border-nexus-teal/20">
          {totalChanges} saves
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-none">
        {reversed.length === 0 && (
          <p className="text-[10px] text-nexus-muted px-3 py-4">No changes yet. Start coding!</p>
        )}
        {reversed.map((entry, i) => (
          <div key={entry.id || i} className="flex items-start gap-2 px-3 py-2 hover:bg-nexus-surface transition-colors group fade-in">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-0.5">
              <GitCommit size={10} style={{ color: entry.userColor || '#4a4a6a' }} />
              {i < reversed.length - 1 && <div className="w-px h-4 bg-nexus-border" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium" style={{ color: entry.userColor }}>{entry.userName}</span>
                <span className="text-[9px] text-nexus-muted">{timeAgo(entry.timestamp)}</span>
              </div>
              <p className="text-[10px] text-nexus-dim truncate">{entry.filePath}</p>
              <p className="text-[9px] text-nexus-muted">v{entry.version} · {entry.contentLength} chars</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
