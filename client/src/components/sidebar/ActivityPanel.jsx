import React from 'react';
import { useStore } from '../../store';
import { Clock, Circle } from 'lucide-react';

function formatTime(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeSince(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ActivityPanel() {
  const { members, changeLog } = useStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-nexus-border flex-shrink-0">
        <h3 className="text-xs font-semibold text-nexus-text">Activity</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Members + time */}
        <div>
          <p className="text-[10px] text-nexus-muted uppercase tracking-wider px-1 mb-2">Team</p>
          <div className="space-y-1">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-nexus-surface transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: m.color + '22', color: m.color }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-nexus-text truncate">{m.name}</p>
                  <p className="text-[10px] text-nexus-muted truncate">{m.activeFile || 'idle'}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1">
                    <Clock size={9} className="text-nexus-muted" />
                    <span className="text-[10px] text-nexus-dim">{formatTime(m.totalTime)}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Circle size={6} className={m.online ? 'text-nexus-teal fill-nexus-teal' : 'text-nexus-muted'} />
                    <span className="text-[9px] text-nexus-muted">{m.online ? 'online' : timeSince(m.lastSeen)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent changes */}
        <div>
          <p className="text-[10px] text-nexus-muted uppercase tracking-wider px-1 mb-2">Recent Changes</p>
          <div className="space-y-0.5">
            {[...changeLog].reverse().slice(0, 30).map((entry, i) => (
              <div key={entry.id || i} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-nexus-surface transition-colors fade-in">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: entry.userColor || '#4a4a6a' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] leading-relaxed text-nexus-dim">
                    <span style={{ color: entry.userColor }}>{entry.userName}</span>
                    {' edited '}
                    <span className="text-nexus-text">{entry.filePath}</span>
                  </p>
                  <p className="text-[9px] text-nexus-muted">{timeSince(entry.timestamp)}</p>
                </div>
              </div>
            ))}
            {changeLog.length === 0 && (
              <p className="text-[10px] text-nexus-muted px-2 py-3">No changes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
