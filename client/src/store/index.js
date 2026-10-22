import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Workspace
  workspaceId: null,
  setWorkspaceId: (id) => set({ workspaceId: id }),

  // Members
  members: [],
  setMembers: (members) => set({ members }),

  // Files
  files: {},
  setFiles: (files) => set({ files }),
  updateFile: (path, content) => set(state => ({
    files: { ...state.files, [path]: { ...state.files[path], content } }
  })),

  // Active file
  activeFile: 'src/index.js',
  setActiveFile: (file) => set({ activeFile: file }),

  // Remote cursors (other users)
  remoteCursors: {},
  setRemoteCursor: (userId, data) => set(state => ({
    remoteCursors: { ...state.remoteCursors, [userId]: data }
  })),
  removeRemoteCursor: (userId) => set(state => {
    const c = { ...state.remoteCursors };
    delete c[userId];
    return { remoteCursors: c };
  }),

  // Change tracking
  totalChanges: 0,
  setTotalChanges: (n) => set({ totalChanges: n }),
  changeLog: [],
  addChangeLog: (entry) => set(state => ({
    changeLog: [...state.changeLog.slice(-99), entry]
  })),

  // Chat
  chatMessages: { general: [], 'code-help': [] },
  addMessage: (channel, msg) => set(state => ({
    chatMessages: {
      ...state.chatMessages,
      [channel]: [...(state.chatMessages[channel] || []), msg]
    }
  })),
  setChatHistory: (msgs) => set({ chatMessages: msgs }),

  // UI state
  sidePanel: 'chat', // 'chat' | 'history' | 'github' | 'activity'
  setSidePanel: (p) => set({ sidePanel: p }),
  showInviteModal: false,
  setShowInviteModal: (v) => set({ showInviteModal: v }),
  showGithubModal: false,
  setShowGithubModal: (v) => set({ showGithubModal: v }),

  // Connection
  connected: false,
  setConnected: (v) => set({ connected: v }),
}));
