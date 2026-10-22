import React from 'react';
import { useStore } from '../store';
import Sidebar from './sidebar/Sidebar';
import TopBar from './shared/TopBar';
import FileTree from './editor/FileTree';
import CodeEditor from './editor/CodeEditor';
import BottomBar from './shared/BottomBar';
import ChatPanel from './chat/ChatPanel';
import HistoryPanel from './editor/HistoryPanel';
import ActivityPanel from './sidebar/ActivityPanel';
import GithubPanel from './editor/GithubPanel';
import InviteModal from './shared/InviteModal';

export default function Workspace({ editorSocket, chatSocket }) {
  const { sidePanel, showInviteModal } = useStore();

  return (
    <div className="h-screen flex flex-col bg-nexus overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail */}
        <Sidebar />

        {/* File tree */}
        <FileTree editorSocket={editorSocket} />

        {/* Main editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CodeEditor editorSocket={editorSocket} />
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 border-l border-nexus-border flex flex-col overflow-hidden">
          {sidePanel === 'chat' && <ChatPanel chatSocket={chatSocket} />}
          {sidePanel === 'history' && <HistoryPanel editorSocket={editorSocket} />}
          {sidePanel === 'github' && <GithubPanel />}
          {sidePanel === 'activity' && <ActivityPanel />}
        </div>
      </div>
      <BottomBar />

      {/* Modals */}
      {showInviteModal && <InviteModal />}
    </div>
  );
}
