// Vercel Serverless Function — /api/recap.js  (PA District 27)
// Generates a short, AI-written recap of a tournament game with Claude Haiku.
// Called from the editor (schedule-admin.html) when a played game is saved;
// the text is cached in Firestore as game.recap and shown in the click-a-game modal.
//
// Env var (Vercel → padistrict27 project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY  — from https://console.anthropic.com
//
// If the key is missing or the API errors, it returns recap:'' so the editor
// quietly falls back to the built-in template recap — nothing ever breaks.

const MODEL = 'claude-haiku-4-5';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Light origin guard — only our own site may use the key (deters random abuse).
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin && !/(padistrict27\.vercel\.app|localhost|127\.0\.0\.1)/.test(origin)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(200).json({ recap: '', skipped: 'no-key' });

  const f = req.body || {};
  if (!f.winner || !f.away || !f.home || f.awayScore == null || f.homeScore == null) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const system =
    "You are a friendly sportswriter for a youth Little League district (kids' baseball and softball). " +
    "Write a SHORT, upbeat recap of ONE tournament game — 2 to 3 sentences, plain text, no headline, no markdown. " +
    "Rules: use the exact final score; name the winning and losing teams; keep it warm, positive and family-friendly; " +
    "do NOT invent player names, stats, innings, or any detail not provided; " +
    "if a 'Stake' is given (advancing / championship), work it in naturally; " +
    "if no stake is given, do not speculate about what comes next or about elimination.";

  const user =
    `Game facts:\n` +
    `Tournament: ${f.tournament || 'District 27'}${f.sport ? ' (' + f.sport + ')' : ''}\n` +
    `Game ${f.game}\n` +
    `Final score: ${f.away} ${f.awayScore}, ${f.home} ${f.homeScore}\n` +
    `Winner: ${f.winner} (won by ${f.margin})\n` +
    (f.stake ? `Stake: ${f.stake}\n` : '') +
    `\nWrite the recap.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 240, system, messages: [{ role: 'user', content: user }] }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'anthropic error' });
    const recap = ((data.content && data.content[0] && data.content[0].text) || '').trim();
    return res.status(200).json({ recap });
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
}
