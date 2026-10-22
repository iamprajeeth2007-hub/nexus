import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store';
import toast from 'react-hot-toast';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useEditorSocket() {
  const socketRef = useRef(null);
  const store = useStore();

  useEffect(() => {
    const socket = io(`${SERVER}/editor`, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      store.setConnected(true);
      const { user, workspaceId } = useStore.getState();
      if (user && workspaceId) {
        socket.emit('join-workspace', {
          workspaceId,
          userName: user.name,
          userId: user.userId
        });
      }
    });

    socket.on('disconnect', () => store.setConnected(false));

    socket.on('workspace-state', ({ files, activeFile, userId, userColor, userName, changeLog, totalChanges }) => {
      store.setFiles(files);
      store.setActiveFile(activeFile);
      store.setTotalChanges(totalChanges);
      // Update our user color from server
      const currentUser = useStore.getState().user;
      if (currentUser) store.setUser({ ...currentUser, color: userColor });
    });

    socket.on('code-update', ({ filePath, content, userId, userName, userColor }) => {
      store.updateFile(filePath, content);
    });

    socket.on('cursor-update', ({ userId, userName, userColor, filePath, position, selection }) => {
      const currentFile = useStore.getState().activeFile;
      if (filePath === currentFile) {
        store.setRemoteCursor(userId, { userId, userName, userColor, position, selection });
      }
    });

    socket.on('members-update', ({ members }) => store.setMembers(members));

    socket.on('change-count', ({ total, latest }) => {
      store.setTotalChanges(total);
      store.addChangeLog(latest);
    });

    socket.on('file-content', ({ filePath, content, language }) => {
      store.updateFile(filePath, content);
    });

    socket.on('file-created', ({ filePath, language, createdBy }) => {
      store.setFiles({
        ...useStore.getState().files,
        [filePath]: { content: '', language, version: 0 }
      });
      toast.success(`${createdBy} created ${filePath}`, { style: toastStyle });
    });

    socket.on('user-disconnected', ({ userName }) => {
      toast(`${userName} left`, { icon: '👋', style: toastStyle });
    });

    socket.on('version-restored', ({ filePath, restoredBy }) => {
      toast.success(`${restoredBy} restored ${filePath}`, { style: toastStyle });
    });

    // Heartbeat
    const hb = setInterval(() => {
      const { workspaceId } = useStore.getState();
      if (workspaceId) socket.emit('heartbeat', { workspaceId });
    }, 30000);

    return () => {
      clearInterval(hb);
      socket.disconnect();
    };
  }, []);

  const sendCodeChange = useCallback((filePath, content) => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('code-change', { workspaceId, filePath, content });
  }, []);

  const sendCursorMove = useCallback((filePath, position, selection) => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('cursor-move', { workspaceId, filePath, position, selection });
  }, []);

  const switchFile = useCallback((filePath) => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('switch-file', { workspaceId, filePath });
    store.setActiveFile(filePath);
  }, []);

  const createFile = useCallback((filePath) => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('create-file', { workspaceId, filePath });
  }, []);

  const getHistory = useCallback(() => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('get-history', { workspaceId });
  }, []);

  return { sendCodeChange, sendCursorMove, switchFile, createFile, getHistory, socket: socketRef };
}

export function useChatSocket() {
  const socketRef = useRef(null);
  const store = useStore();

  useEffect(() => {
    const socket = io(`${SERVER}/chat`, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      const { user, workspaceId } = useStore.getState();
      if (user && workspaceId) {
        socket.emit('join-chat', {
          workspaceId,
          userId: user.userId,
          userName: user.name,
          userColor: user.color
        });
      }
    });

    socket.on('chat-history', ({ messages }) => store.setChatHistory(messages));
    socket.on('new-message', ({ channel, message }) => store.addMessage(channel, message));

    return () => socket.disconnect();
  }, []);

  const sendMessage = useCallback((channel, text) => {
    const { workspaceId } = useStore.getState();
    if (!socketRef.current || !workspaceId || !text.trim()) return;
    socketRef.current.emit('send-message', { workspaceId, channel, text });
  }, []);

  return { sendMessage };
}

const toastStyle = {
  background: '#13131e',
  color: '#c8c8d8',
  border: '1px solid #1e1e2e',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '12px'
};
