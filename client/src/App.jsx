import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';
import { useEditorSocket, useChatSocket } from './hooks/useSockets';
import LoginScreen from './components/shared/LoginScreen';
import Workspace from './components/Workspace';

export default function App() {
  const { user, workspaceId } = useStore();

  return (
    <div className="h-screen w-screen bg-nexus overflow-hidden font-mono">
      <Toaster position="bottom-right" />
      {!user || !workspaceId ? (
        <LoginScreen />
      ) : (
        <WorkspaceWithSockets />
      )}
    </div>
  );
}

function WorkspaceWithSockets() {
  const editorSocket = useEditorSocket();
  const chatSocket = useChatSocket();
  return <Workspace editorSocket={editorSocket} chatSocket={chatSocket} />;
}
