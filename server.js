require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const OWN_API_KEY = process.env.G_ONE_AI_API_KEY;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => res.json({ ok: true, service: 'G ONE AI', model: GEMINI_MODEL }));
app.get('/api/status', (req, res) => res.json({
  ok: true,
  service: 'G ONE AI',
  provider: 'Google Gemini',
  model: GEMINI_MODEL,
  gemini: GEMINI_API_KEY ? 'configured' : 'missing'
}));

async function geminiChat(message) {
  if (!GEMINI_API_KEY) {
    const e = new Error('GEMINI_API_KEY is not configured'); e.status = 500; throw e;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You are G ONE AI, a professional, friendly and intelligent AI assistant. Answer naturally. If the user writes Hindi or Hinglish, respond in clear Hindi/Hinglish. Be concise when appropriate and provide useful steps for technical questions.' }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  });
  const data = await r.json();
  if (!r.ok) {
    console.error('Gemini API:', JSON.stringify(data));
    const e = new Error(data?.error?.message || 'Gemini API request failed'); e.status = r.status; throw e;
  }
  const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!reply) { const e = new Error('Gemini returned an empty response'); e.status = 502; throw e; }
  return reply;
}

app.post('/api/chat', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });
    if (message.length > 10000) return res.status(400).json({ success: false, error: 'Message is too long' });
    const reply = await geminiChat(message);
    res.json({ success: true, model: GEMINI_MODEL, reply });
  } catch (e) {
    console.error('Chat error:', e.message);
    res.status(e.status || 500).json({ success: false, error: 'G ONE AI could not generate a response.' });
  }
});

app.post('/api/g-one-ai/chat', async (req, res) => {
  try {
    if (OWN_API_KEY && req.headers['x-api-key'] !== OWN_API_KEY) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });
    const reply = await geminiChat(message);
    res.json({ success: true, service: 'G ONE AI', model: GEMINI_MODEL, reply });
  } catch (e) {
    console.error('Own API error:', e.message);
    res.status(e.status || 500).json({ success: false, error: 'AI service unavailable' });
  }
});

app.get('/api/g-one-ai', (req, res) => res.json({
  name: 'G ONE AI', version: '3.5', provider: 'Google Gemini', model: GEMINI_MODEL,
  status: GEMINI_API_KEY ? 'ready' : 'api-key-missing'
}));

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('*', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`G ONE AI running on port ${PORT}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
  console.log(`Gemini key: ${GEMINI_API_KEY ? 'FOUND' : 'MISSING'}`);
});
