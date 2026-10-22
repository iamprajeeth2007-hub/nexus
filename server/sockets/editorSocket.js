const { v4: uuidv4 } = require('uuid');

const USER_COLORS = [
  '#00f5c4', '#a855f7', '#f59e0b', '#3b82f6',
  '#ec4899', '#10b981', '#f97316', '#8b5cf6'
];

function setupEditorSocket(namespace, workspaces, getOrCreateWorkspace) {
  namespace.on('connection', (socket) => {
    let currentWorkspaceId = null;
    let currentUser = null;
    let sessionStart = null;

    // Join workspace
    socket.on('join-workspace', ({ workspaceId, userName, userId }) => {
      currentWorkspaceId = workspaceId;
      sessionStart = Date.now();
      const ws = getOrCreateWorkspace(workspaceId);

      // Assign or restore user
      const existingMember = ws.members.get(userId);
      const colorIndex = ws.members.size % USER_COLORS.length;

      currentUser = {
        id: userId || uuidv4(),
        socketId: socket.id,
        name: userName || `Dev_${Math.floor(Math.random() * 999)}`,
        color: existingMember?.color || USER_COLORS[colorIndex],
        online: true,
        cursor: null,
        activeFile: ws.activeFile,
        joinedAt: existingMember?.joinedAt || new Date().toISOString(),
        totalTime: existingMember?.totalTime || 0,
        sessionStart
      };

      ws.members.set(currentUser.id, currentUser);
      socket.join(workspaceId);

      // Send full workspace state to the joining user
      const filesData = {};
      for (const [path, file] of Object.entries(ws.files)) {
        filesData[path] = { content: file.content, language: file.language, version: file.version };
      }

      socket.emit('workspace-state', {
        files: filesData,
        activeFile: ws.activeFile,
        userId: currentUser.id,
        userColor: currentUser.color,
        userName: currentUser.name,
        changeLog: ws.changeLog.slice(-100),
        totalChanges: ws.totalChanges
      });

      // Broadcast updated member list
      broadcastMembers(namespace, workspaceId, ws);

      console.log(`✅ ${currentUser.name} joined workspace ${workspaceId}`);
    });

    // Code change (primary sync event)
    socket.on('code-change', ({ workspaceId, filePath, content, cursorPosition, changeId }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws || !ws.files[filePath]) return;

      const file = ws.files[filePath];
      file.content = content;
      file.version += 1;
      file.lastModifiedBy = currentUser?.name;

      // Record history (keep last 200 changes per file)
      const changeEntry = {
        id: changeId || uuidv4(),
        filePath,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userColor: currentUser?.color,
        timestamp: new Date().toISOString(),
        version: file.version,
        contentLength: content.length
      };

      file.history.push(changeEntry);
      if (file.history.length > 200) file.history.shift();

      ws.totalChanges += 1;
      ws.changeLog.push(changeEntry);
      if (ws.changeLog.length > 500) ws.changeLog.shift();

      // Broadcast to everyone else in workspace
      socket.to(workspaceId).emit('code-update', {
        filePath,
        content,
        version: file.version,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userColor: currentUser?.color,
        timestamp: changeEntry.timestamp
      });

      // Send updated change count to all
      namespace.to(workspaceId).emit('change-count', {
        total: ws.totalChanges,
        latest: changeEntry
      });
    });

    // Cursor position sync
    socket.on('cursor-move', ({ workspaceId, filePath, position, selection }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws || !currentUser) return;

      const member = ws.members.get(currentUser.id);
      if (member) {
        member.cursor = position;
        member.activeFile = filePath;
      }

      socket.to(workspaceId).emit('cursor-update', {
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        filePath,
        position,
        selection
      });
    });

    // File switch
    socket.on('switch-file', ({ workspaceId, filePath }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws || !ws.files[filePath]) return;

      const file = ws.files[filePath];
      socket.emit('file-content', {
        filePath,
        content: file.content,
        language: file.language,
        version: file.version
      });

      if (currentUser) {
        const member = ws.members.get(currentUser.id);
        if (member) member.activeFile = filePath;
        socket.to(workspaceId).emit('user-file-change', {
          userId: currentUser.id,
          userName: currentUser.name,
          filePath
        });
      }
    });

    // Create new file
    socket.on('create-file', ({ workspaceId, filePath, content = '' }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws) return;

      const ext = filePath.split('.').pop();
      const langMap = { js: 'javascript', ts: 'typescript', py: 'python', md: 'markdown', css: 'css', html: 'html', json: 'json' };

      ws.files[filePath] = {
        content,
        language: langMap[ext] || 'plaintext',
        version: 0,
        lastModifiedBy: currentUser?.name,
        history: []
      };

      namespace.to(workspaceId).emit('file-created', {
        filePath,
        language: ws.files[filePath].language,
        createdBy: currentUser?.name
      });
    });

    // Get change history
    socket.on('get-history', ({ workspaceId, filePath }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws) return;
      const history = filePath ? ws.files[filePath]?.history || [] : ws.changeLog.slice(-100);
      socket.emit('history-data', { history, filePath });
    });

    // Restore file version (rollback)
    socket.on('restore-version', ({ workspaceId, filePath, version }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws || !ws.files[filePath]) return;
      // In production, you'd store full content per version
      // Here we emit a signal so all clients can reload
      namespace.to(workspaceId).emit('version-restored', {
        filePath, version, restoredBy: currentUser?.name
      });
    });

    // Activity heartbeat (track active time)
    socket.on('heartbeat', ({ workspaceId }) => {
      const ws = workspaces.get(workspaceId);
      if (!ws || !currentUser) return;
      const member = ws.members.get(currentUser.id);
      if (member) {
        member.lastSeen = Date.now();
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (!currentWorkspaceId || !currentUser) return;
      const ws = workspaces.get(currentWorkspaceId);
      if (!ws) return;

      const member = ws.members.get(currentUser.id);
      if (member) {
        member.online = false;
        member.totalTime += Math.floor((Date.now() - sessionStart) / 1000);
        member.lastSeen = new Date().toISOString();
      }

      namespace.to(currentWorkspaceId).emit('user-disconnected', {
        userId: currentUser.id,
        userName: currentUser.name
      });

      broadcastMembers(namespace, currentWorkspaceId, ws);
      console.log(`👋 ${currentUser.name} left workspace ${currentWorkspaceId}`);
    });
  });
}

function broadcastMembers(namespace, workspaceId, ws) {
  const members = Array.from(ws.members.values()).map(m => ({
    id: m.id,
    name: m.name,
    color: m.color,
    online: m.online,
    activeFile: m.activeFile,
    totalTime: m.totalTime,
    joinedAt: m.joinedAt,
    lastSeen: m.lastSeen
  }));
  namespace.to(workspaceId).emit('members-update', { members });
}

module.exports = setupEditorSocket;
