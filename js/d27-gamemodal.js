// ─────────────────────────────────────────────────────────────────────
// Click-a-game modal: shows a PREVIEW before a game starts, or a RECAP once
// it's final. Self-contained (its own bracket-resolution helpers) so it can be
// dropped onto any page — brackets, schedule, scores, home — without extra deps.
//
//   D27gameModal.setData(tournaments)   // give it the loaded tournament list
//   D27gameModal.openByKey(key, gameNo) // open the modal for one game
//   D27gameModal.open(tournament, game)
//
// Recap text: uses the cached game.recap (AI, written on save) when present,
// otherwise builds a clean 2–3 sentence template from the score + bracket context.
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  // ── tiny helpers ──
  function esc(s) { return s == null ? '' : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function cleanVal(s) { if (s == null) return ''; const t = String(s).trim(); return /^(n\/?a|tbd|tba|-+)$/i.test(t) ? '' : t; } // drop placeholder junk like "N/A"
  function fmtTime(t) { t = cleanVal(t); if (!t) return ''; const p = String(t).split(':'); let h = +p[0]; const m = p[1] || '00'; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ap}`; }
  function fmtDate(d, opt) { d = cleanVal(d); if (!d) return ''; const dt = new Date(d + 'T12:00:00'); if (isNaN(dt)) return ''; return dt.toLocaleDateString('en-US', opt || { weekday: 'short', month: 'short', day: 'numeric' }); }
  // A "Team vs BYE" game records the advancer by name in the game it feeds, not as
  // WG-<bye>. Re-wire that (same as the bracket page) so "next game"/road resolve.
  function normalizeByes(games) {
    const isBye = s => /^\s*bye\s*$/i.test(s == null ? '' : String(s));
    const norm = (games || []).map(g => ({ ...g }));
    for (const b of norm) {
      const aB = isBye(b.away), hB = isBye(b.home); if (aB === hB) continue;
      const adv = aB ? b.home : b.away; if (adv == null || isBye(adv)) continue;
      const key = String(adv).trim();
      const c = norm.filter(x => x.g > b.g && (String(x.away).trim() === key || String(x.home).trim() === key)).sort((p, q) => p.g - q.g)[0];
      if (!c) continue;
      if (String(c.away).trim() === key) c.away = 'WG-' + b.g; else c.home = 'WG-' + b.g;
    }
    return norm;
  }
  const isByeSlot = s => { const r = parseRef(s); return r.kind === 'bye'; };

  // ── self-contained bracket resolution (mirrors js/d27-bracket.js) ──
  function parseRef(s) {
    if (s == null) return { kind: 'tbd' };
    const t = String(s).trim();
    let m = t.match(/^WG-(\d+)$/i); if (m) return { kind: 'WG', g: +m[1] };
    m = t.match(/^LG-(\d+)$/i); if (m) return { kind: 'LG', g: +m[1] };
    if (/if necessary/i.test(t)) return { kind: 'tbd', label: 'If necessary' };
    if (/^bye$/i.test(t)) return { kind: 'bye' };
    return { kind: 'team', name: t };
  }
  const gByNum = (t, n) => (t.games || []).find(g => g.g === n);
  const isPlayed = g => g && g.as != null && g.hs != null && (g.as + g.hs) > 0;
  function feeders(g) { const o = []; for (const raw of [g.away, g.home]) { const r = parseRef(raw); if (r.kind === 'WG' || r.kind === 'LG') o.push(r.g); } return o; }
  function resolveSide(t, raw, seen) {
    seen = seen || new Set();
    const r = parseRef(raw);
    if (r.kind === 'team') return r.name;
    if (r.kind === 'bye') return 'BYE';
    if (r.kind !== 'WG' && r.kind !== 'LG') return null;
    const g = gByNum(t, r.g); if (!g || seen.has(r.g)) return null; seen.add(r.g);
    if (!isPlayed(g)) return null;
    const a = resolveSide(t, g.away, new Set(seen)), h = resolveSide(t, g.home, new Set(seen));
    return r.kind === 'WG' ? (g.as > g.hs ? a : g.hs > g.as ? h : null) : (g.as > g.hs ? h : g.hs > g.as ? a : null);
  }
  function sideDisplay(t, raw) {
    const r = parseRef(raw);
    if (r.kind === 'team') return { name: r.name };
    if (r.kind === 'bye') return { name: 'BYE', tbd: true };
    if (r.kind === 'tbd') return { name: r.label || 'TBD', tbd: true };
    const res = resolveSide(t, raw, new Set());
    if (res) return { name: res, viaGame: r.g, kind: r.kind };
    return { name: (r.kind === 'WG' ? 'Winner of Game ' : 'Loser of Game ') + r.g, tbd: true, viaGame: r.g, kind: r.kind };
  }
  function computeRounds(t) {
    const depth = {}, guard = new Set();
    function d(n) { if (depth[n] != null) return depth[n]; if (guard.has(n)) return 1; guard.add(n); const g = gByNum(t, n); if (!g) return 1; const f = feeders(g); depth[n] = f.length ? 1 + Math.max(...f.map(d)) : 1; return depth[n]; }
    (t.games || []).forEach(g => d(g.g)); return depth;
  }
  function classify(t) {
    const pw = {}, guard = new Set();
    function isPw(n) {
      if (pw[n] != null) return pw[n]; if (guard.has(n)) return true; guard.add(n);
      const g = gByNum(t, n); if (!g) { pw[n] = true; return true; }
      let v = true;
      for (const raw of [g.away, g.home]) { const r = parseRef(raw); if (r.kind === 'LG') v = false; if (r.kind === 'WG' && !isPw(r.g)) v = false; }
      pw[n] = v; return v;
    }
    (t.games || []).forEach(g => isPw(g.g));
    const depth = computeRounds(t); let wbFinal = null, wbDepth = -1;
    for (const g of (t.games || [])) if (pw[g.g] && (depth[g.g] || 1) > wbDepth) { wbDepth = depth[g.g] || 1; wbFinal = g.g; }
    const consumers = {};
    for (const g of (t.games || [])) for (const raw of [g.away, g.home]) { const r = parseRef(raw); if (r.kind === 'WG' || r.kind === 'LG') (consumers[r.g] = consumers[r.g] || []).push(g.g); }
    const fin = new Set();
    if (wbFinal != null) {
      let q = (consumers[wbFinal] || []).filter(n => { const g = gByNum(t, n); const a = parseRef(g.away), h = parseRef(g.home); return (a.kind === 'WG' && a.g === wbFinal) || (h.kind === 'WG' && h.g === wbFinal); });
      while (q.length) { const n = q.shift(); if (fin.has(n)) continue; fin.add(n); (consumers[n] || []).forEach(c => q.push(c)); }
      if (!fin.size) fin.add(wbFinal);
    }
    const cls = {}; for (const g of (t.games || [])) cls[g.g] = fin.has(g.g) ? 'f' : pw[g.g] ? 'w' : 'l'; return cls;
  }
  const isDoubleElim = cls => Object.values(cls).some(c => c === 'l');
  const nextGameOf = (t, n) => (t.games || []).find(x => [x.away, x.home].some(s => { const r = parseRef(s); return r.kind === 'WG' && r.g === n; }));
  function sectionLabel(t, g, cls) {
    const c = cls[g.g];
    if (c === 'f') return /if necessary/i.test(g.home || '') || /if necessary/i.test(g.away || '') ? 'Championship · If Necessary' : 'Championship';
    if (c === 'l') return 'Losers Bracket';
    return isDoubleElim(cls) ? 'Winners Bracket' : 'Bracket';
  }

  // ── recap template (2–3 sentences) — the fallback when game.recap is empty ──
  function recapTemplate(t, g, cls) {
    const next = nextGameOf(t, g.g);
    if (isByeSlot(g.away) || isByeSlot(g.home)) {
      const adv = isByeSlot(g.away) ? g.home : g.away;
      const team = resolveSide(t, adv, new Set()) || sideDisplay(t, adv).name;
      return `${team} drew a bye and advanced${next ? ` to Game ${next.g}` : ''}.`;
    }
    const A = resolveSide(t, g.away, new Set()) || sideDisplay(t, g.away).name;
    const H = resolveSide(t, g.home, new Set()) || sideDisplay(t, g.home).name;
    if (g.as === g.hs) return `${A} and ${H} played to a ${g.as}–${g.hs} tie in Game ${g.g}.`;
    const aWin = g.as > g.hs, winner = aWin ? A : H, loser = aWin ? H : A;
    const ws = Math.max(g.as, g.hs), ls = Math.min(g.as, g.hs), margin = ws - ls;
    const verb = margin >= 10 ? 'routed' : margin >= 6 ? 'rolled past' : margin >= 3 ? 'beat' : margin === 2 ? 'got past' : 'edged';
    const when = fmtDate(g.date, { month: 'long', day: 'numeric' }), whenS = when ? ' on ' + when : '';
    const field = cleanVal(g.field), where = field ? ' at ' + field : '';
    const s1 = `${winner} ${verb} ${loser} ${ws}–${ls}${whenS}${where}.`;
    const c = cls[g.g], dbl = isDoubleElim(cls);
    let s2;
    if (c === 'f') s2 = next ? `${winner} takes Game ${g.g} of the ${t.name} championship.` : `${winner} is the ${t.name} champion.`;
    else if (next) s2 = `${winner} moves on to Game ${next.g}.`;
    else s2 = `${winner} advances.`;
    let s3 = '';
    if (c === 'l') s3 = `${loser}'s tournament run ends.`;
    else if (c === 'w' && dbl) s3 = `${loser} drops to the losers bracket for another shot.`;
    else if (c === 'w' && !dbl) s3 = `${loser} is eliminated.`;
    return [s1, s2, s3].filter(Boolean).join(' ');
  }

  // ── preview / recap bodies ──
  function roadRow(t, raw) {
    const r = parseRef(raw); if (r.kind !== 'WG' && r.kind !== 'LG') return '';
    const fg = gByNum(t, r.g); if (!fg) return '';
    const disp = sideDisplay(t, raw);
    if (isByeSlot(fg.away) || isByeSlot(fg.home)) return `<li><b>${esc(disp.name)}</b> drew a bye <span class="gm-sc">Game ${r.g}</span></li>`;
    if (isPlayed(fg)) {
      const fa = resolveSide(t, fg.away, new Set()), fh = resolveSide(t, fg.home, new Set());
      const fw = fg.as > fg.hs ? fa : fh, fl = fg.as > fg.hs ? fh : fa, sc = `${Math.max(fg.as, fg.hs)}–${Math.min(fg.as, fg.hs)}`;
      return `<li><b>${esc(disp.name)}</b> ${r.kind === 'WG' ? `won Game ${r.g}${fl ? ' over ' + esc(fl) : ''}` : `lost Game ${r.g}`} <span class="gm-sc">${sc}</span></li>`;
    }
    const fa = sideDisplay(t, fg.away).name, fh = sideDisplay(t, fg.home).name;
    return `<li class="tbd">${r.kind === 'WG' ? 'Winner' : 'Loser'} of Game ${r.g} — ${esc(fa)} vs ${esc(fh)}</li>`;
  }
  function previewHTML(t, g, cls) {
    const A = sideDisplay(t, g.away), H = sideDisplay(t, g.home);
    const when = [fmtDate(g.date), fmtTime(g.time)].filter(Boolean).join(' · ');
    const field = cleanVal(g.field);
    const road = [roadRow(t, g.away), roadRow(t, g.home)].filter(Boolean);
    return `
      <div class="gm-matchup">
        <div class="gm-team ${A.tbd ? 'tbd' : ''}">${esc(A.name)}</div>
        <div class="gm-vs">vs</div>
        <div class="gm-team ${H.tbd ? 'tbd' : ''}">${esc(H.name)}</div>
      </div>
      <div class="gm-meta">${when || 'Date &amp; time TBD'}${field ? ` &nbsp;·&nbsp; ${esc(field)}` : ''}</div>
      ${road.length ? `<div class="gm-sec"><h4>Road to this game</h4><ul class="gm-road">${road.join('')}</ul></div>` : ''}`;
  }
  function recapHTML(t, g, cls) {
    const text = (g.recap && String(g.recap).trim()) ? g.recap : recapTemplate(t, g, cls);
    if (isByeSlot(g.away) || isByeSlot(g.home)) {
      const adv = isByeSlot(g.away) ? g.home : g.away;
      return `
        <div class="gm-byewrap"><div class="gm-team">${esc(sideDisplay(t, adv).name)}</div><div class="gm-meta">Advanced on a bye</div></div>
        <div class="gm-sec"><h4>Recap</h4><p class="gm-recap">${esc(text)}</p></div>`;
    }
    const A = sideDisplay(t, g.away), H = sideDisplay(t, g.home);
    const aWin = g.as > g.hs, hWin = g.hs > g.as;
    return `
      <div class="gm-score">
        <div class="gm-srow ${aWin ? 'win' : ''}"><span class="t">${esc(A.name)}</span><span class="s">${g.as}</span></div>
        <div class="gm-srow ${hWin ? 'win' : ''}"><span class="t">${esc(H.name)}</span><span class="s">${g.hs}</span></div>
      </div>
      <div class="gm-sec"><h4>Recap</h4><p class="gm-recap">${esc(text)}</p></div>`;
  }

  // ── modal shell ──
  let overlay = null;
  function close() { if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; } }
  function ensureShell() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'gm-overlay';
    overlay.innerHTML = `<div class="gm-card" role="dialog" aria-modal="true">
      <button class="gm-close" aria-label="Close">✕</button>
      <div class="gm-head"><div class="gm-crumb"></div><span class="gm-badge"></span></div>
      <div class="gm-body"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.gm-close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return overlay;
  }
  function open(t, g) {
    if (!t || !g) return;
    ensureShell();
    const tn = { ...t, games: normalizeByes(t.games) };       // wire byes like the bracket does
    const gg = (tn.games || []).find(x => x.g === g.g) || g;
    const cls = classify(tn), played = isPlayed(gg);
    overlay.querySelector('.gm-crumb').innerHTML = `${esc(tn.name || tn.key)} &nbsp;·&nbsp; ${sectionLabel(tn, gg, cls)} &nbsp;·&nbsp; Game ${gg.g}`;
    const badge = overlay.querySelector('.gm-badge');
    badge.textContent = played ? 'Final' : 'Preview';
    badge.className = 'gm-badge ' + (played ? 'final' : 'preview');
    overlay.querySelector('.gm-body').innerHTML = played ? recapHTML(tn, gg, cls) : previewHTML(tn, gg, cls);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // ── lookup by key + click delegation ──
  let TS = {};
  function setData(list) { TS = {}; (list || []).forEach(t => { if (t && t.key) TS[t.key] = t; }); }
  function openByKey(key, gameNo) { const t = TS[key]; if (!t) return; const g = (t.games || []).find(x => x.g === +gameNo); if (g) open(t, g); }

  // auto-wire any element with [data-game] (set data-tkey + data-g) once per page
  function wireClicks(rootSel) {
    const root = document.querySelector(rootSel || 'body'); if (!root) return;
    root.addEventListener('click', e => {
      const card = e.target.closest('[data-g][data-tkey]');
      if (card) { e.preventDefault(); openByKey(card.dataset.tkey, card.dataset.g); }
    });
  }

  global.D27gameModal = { setData, open, openByKey, wireClicks };
})(window);
