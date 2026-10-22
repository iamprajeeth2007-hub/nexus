import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Copy, Check } from 'lucide-react';
import { useStore } from '../../store';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function InviteModal() {
  const { setShowInviteModal, workspaceId } = useStore();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState('editor');

  useEffect(() => { generateCode(); }, []);

  async function generateCode() {
    try {
      const res = await axios.post(`${SERVER}/api/invite/generate`, { workspaceId, role });
      setCode(res.data.code);
    } catch { setCode('ERR-OFFLINE'); }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}?invite=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
      <div className="glass rounded-xl p-6 w-80 fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Invite to Workspace</h2>
          <button onClick={() => setShowInviteModal(false)} className="text-nexus-muted hover:text-nexus-text">
            <X size={14} />
          </button>
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-xs text-nexus-dim mb-1.5">Role</label>
          <div className="flex gap-2">
            {['editor', 'viewer'].map(r => (
              <button key={r} onClick={() => { setRole(r); generateCode(); }}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors capitalize ${role === r
                  ? 'border-nexus-teal/40 text-nexus-teal bg-nexus-teal/10'
                  : 'border-nexus-border text-nexus-muted hover:border-nexus-muted'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Code */}
        <div className="mb-4">
          <label className="block text-xs text-nexus-dim mb-1.5">Invite Code</label>
          <div className="flex items-center gap-2 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2.5">
            <span className="flex-1 text-sm font-mono tracking-[0.25em] text-white">{code || '...'}</span>
            <button onClick={copyCode} className="text-nexus-muted hover:text-nexus-teal transition-colors">
              {copied ? <Check size={13} className="text-nexus-teal" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={copyLink}
            className="py-2 text-xs text-nexus-teal border border-nexus-teal/25 rounded-lg hover:bg-nexus-teal/10 transition-colors">
            Copy Link
          </button>
          <button onClick={generateCode}
            className="py-2 text-xs text-nexus-dim border border-nexus-border rounded-lg hover:border-nexus-muted transition-colors">
            New Code
          </button>
        </div>

        <p className="text-[10px] text-nexus-muted mt-3 text-center">Share this code with your teammate</p>
      </div>
    </div>
  );
}
