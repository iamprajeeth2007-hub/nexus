# NEXUS CODE — Real-time Collaborative Coding Platform

## Quick Start (2 terminals)

### Prerequisites
- Node.js 18+
- npm

---

### Step 1 — Setup Server

```bash
cd nexus-code/server
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY if you want AI features
npm install
npm run dev
# Server starts on http://localhost:3001
```

### Step 2 — Setup Client (new terminal)

```bash
cd nexus-code/client
cp .env.example .env
npm install
npm run dev
# App opens on http://localhost:5173
```

---

## How to Use

1. **Open** `http://localhost:5173`
2. **Enter your name** → click "Create Workspace"
3. **Copy your workspace ID** from Settings → Invite and share with teammates
4. Your teammate opens the same URL, clicks **"Join Workspace"**, enters name + invite code
5. Start coding — changes sync **instantly** to all members

---

## Features

| Feature | How |
|---------|-----|
| Real-time code sync | WebSocket — edits appear instantly |
| Live cursors | Each user gets a unique color cursor |
| Change history | Right panel → History tab |
| Activity + time tracking | Right panel → Activity tab |
| Chat | Right panel → Chat tab — #general and #code-help |
| Push to GitHub | Right panel → GitHub tab — enter repo URL + token |
| Create files | File tree → + button |
| AI suggestions | Editor toolbar → AI button (needs ANTHROPIC_API_KEY) |
| Run JS code | Editor toolbar → Run button |

---

## GitHub Push Setup

1. Go to https://github.com/settings/tokens
2. Generate a **Personal Access Token** (classic) with `repo` scope
3. In the app → GitHub panel → paste repo URL + token → Push

---

## Deploy to Production

### Server (Railway / Render / Fly.io)
```bash
cd server
# Set env vars: PORT, CLIENT_URL, ANTHROPIC_API_KEY
npm start
```

### Client (Vercel / Netlify)
```bash
cd client
# Set env var: VITE_SERVER_URL=https://your-server.railway.app
npm run build
# Deploy the dist/ folder
```

---

## Project Structure

```
nexus-code/
├── server/
│   ├── index.js              # Express + Socket.io server
│   ├── sockets/
│   │   ├── editorSocket.js   # Real-time code sync, cursors, history
│   │   └── chatSocket.js     # Real-time chat
│   ├── routes/
│   │   ├── auth.js           # User sessions
│   │   ├── github.js         # Git push to GitHub
│   │   └── ai.js             # Claude AI suggestions
│   └── .env.example
│
└── client/
    └── src/
        ├── App.jsx
        ├── store/index.js         # Zustand global state
        ├── hooks/useSockets.js    # Socket.io hooks
        └── components/
            ├── Workspace.jsx
            ├── editor/
            │   ├── CodeEditor.jsx     # Monaco + real-time sync
            │   ├── FileTree.jsx       # File explorer
            │   ├── HistoryPanel.jsx   # Change history
            │   └── GithubPanel.jsx    # GitHub push
            ├── chat/
            │   └── ChatPanel.jsx      # Real-time chat
            ├── sidebar/
            │   ├── Sidebar.jsx        # Icon rail
            │   └── ActivityPanel.jsx  # Time tracking
            └── shared/
                ├── LoginScreen.jsx
                ├── TopBar.jsx
                ├── BottomBar.jsx
                └── InviteModal.jsx
```

---

## Notes

- All data is in-memory — restarts clear the workspace. Add MongoDB/PostgreSQL to persist.
- The GitHub push uses `simple-git` and clones to a temp folder — works for small projects.
- AI features require `ANTHROPIC_API_KEY` in server/.env
