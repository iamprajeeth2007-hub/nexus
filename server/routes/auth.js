const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple auth - just generate a user session
// In production replace with proper JWT + DB
router.post('/login', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

  const userId = uuidv4();
  res.json({
    userId,
    name: name.trim(),
    workspaceId: uuidv4() // default workspace
  });
});

router.post('/join', (req, res) => {
  const { name, inviteCode } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  res.json({ userId: uuidv4(), name: name.trim() });
});

module.exports = router;
