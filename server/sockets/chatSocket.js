const { v4: uuidv4 } = require('uuid');

function setupChatSocket(namespace, workspaces, getOrCreateWorkspace) {
  // In-memory messages per workspace
  const messages = new Map();

  namespace.on('connection', (socket) => {
    let currentWorkspaceId = null;
    let currentUser = null;

    socket.on('join-chat', ({ workspaceId, userId, userName, userColor }) => {
      currentWorkspaceId = workspaceId;
      currentUser = { id: userId, name: userName, color: userColor };

      if (!messages.has(workspaceId)) {
        messages.set(workspaceId, {
          general: [],
          'code-help': []
        });
      }

      socket.join(workspaceId);

      // Send existing messages
      socket.emit('chat-history', { messages: messages.get(workspaceId) });
    });

    socket.on('send-message', ({ workspaceId, channel, text }) => {
      if (!currentUser || !text?.trim()) return;
      const ws = messages.get(workspaceId);
      if (!ws || !ws[channel]) return;

      const msg = {
        id: uuidv4(),
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        text: sanitizeMessage(text),
        channel,
        timestamp: new Date().toISOString()
      };

      ws[channel].push(msg);
      if (ws[channel].length > 200) ws[channel].shift();

      namespace.to(workspaceId).emit('new-message', { channel, message: msg });
    });

    socket.on('disconnect', () => {});
  });
}

function sanitizeMessage(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 2000);
}

module.exports = setupChatSocket;
