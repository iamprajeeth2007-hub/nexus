const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const os = require('os');

// Push workspace files to GitHub
router.post('/push', async (req, res) => {
  const { files, repoUrl, branch = 'main', commitMessage, token, authorName, authorEmail } = req.body;

  if (!files || !repoUrl || !token) {
    return res.status(400).json({ error: 'files, repoUrl, and token are required' });
  }

  const tmpDir = path.join(os.tmpdir(), `nexus-${Date.now()}`);

  try {
    await fs.ensureDir(tmpDir);

    // Build authenticated URL
    const urlObj = new URL(repoUrl);
    urlObj.username = token;
    urlObj.password = 'x-oauth-basic';
    const authUrl = urlObj.toString();

    const git = simpleGit(tmpDir);

    // Clone or init
    try {
      await git.clone(authUrl, tmpDir, ['--depth', '1', '--branch', branch]);
    } catch {
      await git.init();
      await git.addRemote('origin', authUrl);
    }

    // Write all files
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(tmpDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf8');
    }

    // Configure git
    await git.addConfig('user.name', authorName || 'NEXUS CODE');
    await git.addConfig('user.email', authorEmail || 'nexus@nexuscode.dev');

    await git.add('.');
    await git.commit(commitMessage || `NEXUS CODE: collaborative commit - ${new Date().toISOString()}`);

    try {
      await git.push('origin', branch, ['--set-upstream']);
    } catch {
      await git.push(['-u', 'origin', branch, '--force']);
    }

    await fs.remove(tmpDir);

    res.json({
      success: true,
      message: `Successfully pushed to ${branch}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    await fs.remove(tmpDir).catch(() => {});
    console.error('GitHub push error:', err.message);
    res.status(500).json({ error: err.message || 'Push failed' });
  }
});

// Get repo info
router.post('/repo-info', async (req, res) => {
  const { repoUrl, token } = req.body;
  if (!repoUrl || !token) return res.status(400).json({ error: 'repoUrl and token required' });

  try {
    const apiUrl = repoUrl
      .replace('https://github.com/', 'https://api.github.com/repos/')
      .replace(/\.git$/, '');

    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });
    const data = await response.json();
    res.json({ name: data.name, defaultBranch: data.default_branch, private: data.private });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
