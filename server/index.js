require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const setupEditorSocket = require('./sockets/editorSocket');
const setupChatSocket = require('./sockets/chatSocket');
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const aiRoutes = require('./routes/ai');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// In-memory workspace state
const workspaces = new Map();
const inviteCodes = new Map();

function getOrCreateWorkspace(workspaceId) {
  if (!workspaces.has(workspaceId)) {
    workspaces.set(workspaceId, {
      id: workspaceId,
      files: {
        'src/index.js': {
          content: `// Welcome to NEXUS CODE\n// Start coding together in real-time\n\nfunction greet(name) {\n  return \`Hello, \${name}! Welcome to NEXUS CODE.\`;\n}\n\nconsole.log(greet('Team'));\n`,
          language: 'javascript',
          version: 0,
          lastModifiedBy: null,
          history: []
        },
        'src/utils.js': {
          content: `// Utility functions\n\nexport const debounce = (fn, delay) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};\n`,
          language: 'javascript',
          version: 0,
          lastModifiedBy: null,
          history: []
        },
        'README.md': {
          content: `# My NEXUS Project\n\nCollaborative workspace.\n\n## Getting Started\n\nEdit files in src/ to begin.\n`,
          language: 'markdown',
          version: 0,
          lastModifiedBy: null,
          history: []
        }
      },
      activeFile: 'src/index.js',
      members: new Map(),
      changeLog: [],
      totalChanges: 0,
      activityLog: []
    });
  }
  return workspaces.get(workspaceId);
}

// Generate invite code
app.post('/api/invite/generate', (req, res) => {
  const { workspaceId, role = 'editor' } = req.body;
  const code = uuidv4().slice(0, 8).toUpperCase();
  inviteCodes.set(code, { workspaceId, role, createdAt: Date.now() });
  res.json({ code, workspaceId, role });
});

// Validate invite code
app.post('/api/invite/validate', (req, res) => {
  const { code } = req.body;
  const invite = inviteCodes.get(code?.toUpperCase());
  if (!invite) return res.status(404).json({ error: 'Invalid invite code' });
  res.json(invite);
});

// Get workspace info
app.get('/api/workspace/:id', (req, res) => {
  const ws = getOrCreateWorkspace(req.params.id);
  const members = Array.from(ws.members.values()).map(m => ({
    id: m.id, name: m.name, color: m.color, online: m.online,
    totalTime: m.totalTime, joinedAt: m.joinedAt
  }));
  res.json({
    id: ws.id,
    files: Object.keys(ws.files).reduce((acc, key) => {
      acc[key] = { language: ws.files[key].language, version: ws.files[key].version };
      return acc;
    }, {}),
    activeFile: ws.activeFile,
    members,
    totalChanges: ws.totalChanges,
    changeLog: ws.changeLog.slice(-50)
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io namespaces
setupEditorSocket(io.of('/editor'), workspaces, getOrCreateWorkspace);
setupChatSocket(io.of('/chat'), workspaces, getOrCreateWorkspace);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 NEXUS CODE server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});

module.exports = { app, io, getOrCreateWorkspace };
