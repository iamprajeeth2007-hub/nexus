import React, { useState } from 'react';
import { useStore } from '../../store';
import { File, Folder, FolderOpen, Plus } from 'lucide-react';

const LANG_COLORS = {
  js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
  py: '#3776ab', md: '#6b6b8a', css: '#264de4', html: '#e34c26',
  json: '#00f5c4'
};

function getExt(path) { return path.split('.').pop().toLowerCase(); }

export default function FileTree({ editorSocket }) {
  const { files, activeFile, members } = useStore();
  const [newFileName, setNewFileName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const filePaths = Object.keys(files);

  // Group into folders
  const tree = {};
  for (const path of filePaths) {
    const parts = path.split('/');
    if (parts.length === 1) {
      tree['__root'] = tree['__root'] || [];
      tree['__root'].push(path);
    } else {
      const folder = parts[0];
      tree[folder] = tree[folder] || [];
      tree[folder].push(path);
    }
  }

  // Who's editing which file
  const editingMap = {};
  for (const m of members) {
    if (m.online && m.activeFile) {
      editingMap[m.activeFile] = editingMap[m.activeFile] || [];
      editingMap[m.activeFile].push(m);
    }
  }

  function handleFileClick(path) {
    editorSocket.switchFile(path);
  }

  function handleCreateFile(e) {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = newFileName.includes('/') ? newFileName : `src/${newFileName}`;
    editorSocket.createFile(path);
    setNewFileName('');
    setShowInput(false);
  }

  return (
    <div className="w-44 bg-nexus-panel border-r border-nexus-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-nexus-border">
        <span className="text-[10px] text-nexus-muted uppercase tracking-wider">Files</span>
        <button onClick={() => setShowInput(!showInput)}
          className="text-nexus-muted hover:text-nexus-teal transition-colors">
          <Plus size={11} />
        </button>
      </div>

      {/* New file input */}
      {showInput && (
        <form onSubmit={handleCreateFile} className="px-2 py-1.5 border-b border-nexus-border">
          <input
            autoFocus type="text" value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onBlur={() => { if (!newFileName) setShowInput(false); }}
            placeholder="src/file.js"
            className="w-full bg-nexus-bg border border-nexus-teal/30 rounded px-2 py-1 text-[10px] text-nexus-text placeholder-nexus-muted focus:outline-none"
          />
        </form>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-none">
        {Object.entries(tree).map(([folder, paths]) => (
          <FolderGroup key={folder} folder={folder} paths={paths}
            activeFile={activeFile} editingMap={editingMap}
            onFileClick={handleFileClick} />
        ))}
      </div>
    </div>
  );
}

function FolderGroup({ folder, paths, activeFile, editingMap, onFileClick }) {
  const [open, setOpen] = useState(true);
  const isRoot = folder === '__root';

  return (
    <div>
      {!isRoot && (
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-nexus-surface text-nexus-dim hover:text-nexus-text transition-colors">
          {open ? <FolderOpen size={11} className="text-nexus-teal/60" /> : <Folder size={11} className="text-nexus-teal/60" />}
          <span className="text-[11px]">{folder}</span>
        </button>
      )}
      {(isRoot || open) && paths.map(path => (
        <FileItem key={path} path={path} isActive={path === activeFile}
          editors={editingMap[path] || []} onClick={() => onFileClick(path)}
          indent={!isRoot} />
      ))}
    </div>
  );
}

function FileItem({ path, isActive, editors, onClick, indent }) {
  const ext = getExt(path);
  const name = path.split('/').pop();
  const color = LANG_COLORS[ext] || '#6b6b8a';

  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 w-full py-1 transition-colors group ${indent ? 'pl-5 pr-2' : 'px-2'}
        ${isActive ? 'bg-nexus-teal/8 text-white' : 'text-nexus-dim hover:bg-nexus-surface hover:text-nexus-text'}`}>
      <File size={10} style={{ color }} className="flex-shrink-0" />
      <span className="text-[11px] flex-1 text-left truncate">{name}</span>
      {/* Live editing dots */}
      <div className="flex -space-x-1">
        {editors.map(m => (
          <div key={m.id} className="w-2 h-2 rounded-full live-dot border border-nexus-panel"
            style={{ background: m.color }} title={m.name} />
        ))}
      </div>
    </button>
  );
}
