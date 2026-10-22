import React, { useState } from 'react';
import axios from 'axios';
import { useStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function LoginScreen() {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setWorkspaceId } = useStore();

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setLoading(true); setError('');
    try {
      const wid = uuidv4();
      const userId = uuidv4();
      setUser({ userId, name: name.trim(), color: '#00f5c4' });
      setWorkspaceId(wid);
    } catch { setError('Failed to create workspace'); }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !inviteCode.trim()) return setError('Enter name and invite code');
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${SERVER}/api/invite/validate`, { code: inviteCode.trim() });
      const userId = uuidv4();
      setUser({ userId, name: name.trim(), color: '#a855f7' });
      setWorkspaceId(res.data.workspaceId);
    } catch { setError('Invalid invite code'); }
    setLoading(false);
  }

  return (
    <div className="h-screen w-screen grid-bg flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-nexus-teal/10 border border-nexus-teal/30 flex items-center justify-center">
              <span className="text-nexus-teal font-bold text-lg">N</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">NEXUS CODE</h1>
          </div>
          <p className="text-nexus-dim text-sm">Real-time collaborative coding workspace</p>
        </div>

        {/* Card */}
        <div className="glass rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-nexus-bg rounded-lg mb-6">
            {['create', 'join'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs rounded-md transition-all capitalize ${tab === t
                  ? 'bg-nexus-surface text-white border border-nexus-border'
                  : 'text-nexus-dim hover:text-nexus-text'}`}>
                {t === 'create' ? '+ New Workspace' : '→ Join Workspace'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'create' ? handleCreate : handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-nexus-dim mb-1.5">Your Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2.5 text-sm text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-teal/50 transition-colors"
                autoFocus
              />
            </div>

            {tab === 'join' && (
              <div>
                <label className="block text-xs text-nexus-dim mb-1.5">Invite Code</label>
                <input
                  type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2.5 text-sm text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-purple/50 transition-colors font-mono tracking-widest"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'create'
                  ? 'bg-nexus-teal/10 border border-nexus-teal/30 text-nexus-teal hover:bg-nexus-teal/20'
                  : 'bg-nexus-purple/10 border border-nexus-purple/30 text-nexus-purple hover:bg-nexus-purple/20'
                } disabled:opacity-50`}>
              {loading ? 'Loading...' : tab === 'create' ? 'Create Workspace' : 'Join Workspace'}
            </button>
          </form>
        </div>

        <p className="text-center text-nexus-muted text-xs mt-6">
          Share your invite code from Settings → Invite
        </p>
      </div>
    </div>
  );
}
