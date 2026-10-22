import React, { useState } from 'react';
import axios from 'axios';
import { Github, GitBranch, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../../store';
import toast from 'react-hot-toast';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function GithubPanel() {
  const { files, user } = useStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');

  async function handlePush(e) {
    e.preventDefault();
    if (!repoUrl || !token) return toast.error('Repo URL and token required', { style: toastStyle });

    setLoading(true); setStatus(null);
    try {
      const fileContents = {};
      for (const [path, file] of Object.entries(files)) {
        fileContents[path] = file.content || '';
      }

      const { data } = await axios.post(`${SERVER}/api/github/push`, {
        files: fileContents,
        repoUrl,
        branch,
        commitMessage: commitMsg || `NEXUS CODE commit by ${user?.name}`,
        token,
        authorName: user?.name,
        authorEmail: `${user?.name?.toLowerCase()}@nexuscode.dev`
      });

      setStatus('success');
      setStatusMsg(data.message);
      toast.success('Pushed to GitHub!', { style: toastStyle });
    } catch (err) {
      setStatus('error');
      setStatusMsg(err.response?.data?.error || err.message);
      toast.error('Push failed', { style: toastStyle });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-nexus-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Github size={12} className="text-nexus-text" />
          <h3 className="text-xs font-semibold text-nexus-text">Push to GitHub</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
        <form onSubmit={handlePush} className="space-y-3">
          <div>
            <label className="block text-[10px] text-nexus-dim mb-1">Repository URL</label>
            <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-2 text-[11px] text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-teal/40 transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] text-nexus-dim mb-1">
              Personal Access Token
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer"
                className="ml-1 text-nexus-teal hover:underline">get one</a>
            </label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-2 text-[11px] text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-teal/40 transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] text-nexus-dim mb-1">Branch</label>
            <div className="flex items-center gap-1.5 bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-2">
              <GitBranch size={10} className="text-nexus-muted" />
              <input value={branch} onChange={e => setBranch(e.target.value)}
                className="flex-1 bg-transparent text-[11px] text-nexus-text placeholder-nexus-muted focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-nexus-dim mb-1">Commit Message</label>
            <textarea value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
              rows={2} placeholder={`NEXUS CODE commit by ${user?.name || 'team'}`}
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-2.5 py-2 text-[11px] text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-teal/40 transition-colors resize-none" />
          </div>

          {/* Files summary */}
          <div className="bg-nexus-bg border border-nexus-border rounded-lg p-2">
            <p className="text-[10px] text-nexus-dim mb-1">Files to push ({Object.keys(files).length})</p>
            {Object.keys(files).map(f => (
              <p key={f} className="text-[9px] text-nexus-muted pl-1">+ {f}</p>
            ))}
          </div>

          {status && (
            <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[10px] ${
              status === 'success'
                ? 'bg-nexus-teal/5 border-nexus-teal/20 text-nexus-teal'
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              {status === 'success' ? <Check size={10} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2 flex items-center justify-center gap-2 text-[11px] text-nexus-teal border border-nexus-teal/25 rounded-lg hover:bg-nexus-teal/10 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            {loading ? 'Pushing...' : 'Push to GitHub'}
          </button>
        </form>
      </div>
    </div>
  );
}

const toastStyle = {
  background: '#13131e', color: '#c8c8d8',
  border: '1px solid #1e1e2e', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px'
};
