const express = require('express');
const router = express.Router();

// Security: block dangerous patterns
const BLOCKED_PATTERNS = [
  /rm\s+-rf/i, /exec\s*\(/i, /eval\s*\(/i,
  /child_process/i, /require\s*\(\s*['"]fs['"]\s*\)/i,
  /__import__/i, /subprocess/i, /os\.system/i
];

function isSafeCode(code) {
  return !BLOCKED_PATTERNS.some(p => p.test(code));
}

function sanitizeInput(text) {
  // Prevent prompt injection
  const injectionPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /you are now/i,
    /forget your/i,
    /act as/i
  ];
  for (const p of injectionPatterns) {
    if (p.test(text)) return null;
  }
  return text.slice(0, 4000);
}

router.post('/suggest', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ suggestion: null, error: 'AI not configured. Add ANTHROPIC_API_KEY to .env' });
  }

  const { code, language, prompt } = req.body;

  const cleanCode = sanitizeInput(code || '');
  const cleanPrompt = sanitizeInput(prompt || 'Suggest an improvement or completion');

  if (!cleanCode || !cleanPrompt) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  if (!isSafeCode(cleanCode)) {
    return res.status(400).json({ error: 'Potentially unsafe code pattern detected' });
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a helpful coding assistant in a collaborative code editor called NEXUS CODE. 
      Only provide code suggestions and explanations. 
      Never execute commands, access files, or perform any actions outside of code suggestions.
      Keep responses concise and code-focused.
      Language context: ${language || 'javascript'}`,
      messages: [
        {
          role: 'user',
          content: `Current code:\n\`\`\`${language || 'javascript'}\n${cleanCode}\n\`\`\`\n\nRequest: ${cleanPrompt}`
        }
      ]
    });

    const suggestion = response.content[0]?.text || '';
    res.json({ suggestion });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});

router.post('/explain', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ explanation: 'AI not configured. Add ANTHROPIC_API_KEY to .env' });
  }

  const { code, language } = req.body;
  const cleanCode = sanitizeInput(code || '');
  if (!cleanCode) return res.status(400).json({ error: 'Invalid input' });

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are a coding assistant. Explain code briefly and clearly. No execution, no file access.',
      messages: [{
        role: 'user',
        content: `Explain this ${language || 'code'} briefly:\n\`\`\`\n${cleanCode}\n\`\`\``
      }]
    });

    res.json({ explanation: response.content[0]?.text || '' });
  } catch (err) {
    res.status(500).json({ error: 'Explanation failed' });
  }
});

module.exports = router;
