// ─────────────────────────────────────────────────────────────────────
// Shared double-elimination logic: resolve WG-/LG- placeholders, classify
// games (winners / losers / final), and determine the champion.
// Exposed as window.D27bracket for the hub pages (baseball/softball).
// Mirrors the same logic embedded in brackets.html / live-schedule.html.
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  function parseRef(s) {
    if (s == null) return { kind: 'tbd' };
    const t = String(s).trim();
    let m = t.match(/^WG-(\d+)$/i); if (m) return { kind: 'WG', g: +m[1] };
    m = t.match(/^LG-(\d+)$/i);     if (m) return { kind: 'LG', g: +m[1] };
    if (/if necessary/i.test(t)) return { kind: 'tbd', label: 'If necessary' };
    if (/^bye$/i.test(t))        return { kind: 'bye' };
    return { kind: 'team', name: t };
  }
  const gameByNum = (t, n) => t.games.find(g => g.g === n);
  const isPlayed = g => g && g.as != null && g.hs != null && (g.as + g.hs) > 0;
  function resolveSide(t, ref, seen) {
    seen = seen || new Set();
    if (ref.kind === 'team') return ref.name;
    if (ref.kind === 'bye')  return 'BYE';
    if (ref.kind !== 'WG' && ref.kind !== 'LG') return null;
    const g = gameByNum(t, ref.g); if (!g || seen.has(ref.g)) return null;
    seen.add(ref.g);
    return ref.kind === 'WG' ? winnerName(t, g, seen) : loserName(t, g, seen);
  }
  function winnerName(t, g, seen) { if (!isPlayed(g)) return null; const a = resolveSide(t, parseRef(g.away), new Set(seen)), h = resolveSide(t, parseRef(g.home), new Set(seen)); return g.as > g.hs ? a : g.hs > g.as ? h : null; }
  function loserName(t, g, seen)  { if (!isPlayed(g)) return null; const a = resolveSide(t, parseRef(g.away), new Set(seen)), h = resolveSide(t, parseRef(g.home), new Set(seen)); return g.as > g.hs ? h : g.hs > g.as ? a : null; }
  function feeders(g) { const o = []; for (const raw of [g.away, g.home]) { const r = parseRef(raw); if (r.kind === 'WG' || r.kind === 'LG') o.push(r.g); } return o; }
  function computeRounds(t) {
    const depth = {}, guard = new Set();
    function d(n) { if (depth[n] != null) return depth[n]; if (guard.has(n)) return 1; guard.add(n); const g = gameByNum(t, n); if (!g) return 1; const f = feeders(g); const r = f.length ? 1 + Math.max(...f.map(d)) : 1; depth[n] = r; return r; }
    t.games.forEach(g => d(g.g)); return depth;
  }
  function classify(t) {
    const pw = {}, guard = new Set();
    function isPw(n) {
      if (pw[n] != null) return pw[n];
      if (guard.has(n)) return true; guard.add(n);
      const g = gameByNum(t, n); if (!g) { pw[n] = true; return true; }
      let v = true;
      for (const raw of [g.away, g.home]) {
        const r = parseRef(raw);
        if (r.kind === 'LG') v = false;
        if (r.kind === 'WG' && !isPw(r.g)) v = false;
      }
      pw[n] = v; return v;
    }
    t.games.forEach(g => isPw(g.g));
    const depth = computeRounds(t);
    let wbFinal = null, wbDepth = -1;
    for (const g of t.games) if (pw[g.g] && (depth[g.g] || 1) > wbDepth) { wbDepth = depth[g.g] || 1; wbFinal = g.g; }
    const consumers = {};
    for (const g of t.games) for (const raw of [g.away, g.home]) { const r = parseRef(raw); if (r.kind === 'WG' || r.kind === 'LG') (consumers[r.g] = consumers[r.g] || []).push(g.g); }
    const fin = new Set();
    if (wbFinal != null) {
      let q = (consumers[wbFinal] || []).filter(n => {
        const g = gameByNum(t, n);
        const a = parseRef(g.away), h = parseRef(g.home);
        return (a.kind === 'WG' && a.g === wbFinal) || (h.kind === 'WG' && h.g === wbFinal);
      });
      while (q.length) { const n = q.shift(); if (fin.has(n)) continue; fin.add(n); (consumers[n] || []).forEach(c => q.push(c)); }
      if (!fin.size) fin.add(wbFinal); // WB final with no follow-on = the championship game (single-elimination)
    }
    const cls = {};
    for (const g of t.games) cls[g.g] = fin.has(g.g) ? 'f' : pw[g.g] ? 'w' : 'l';
    return cls;
  }
  function championOutcome(t, cls) {
    const finals = t.games.filter(g => cls[g.g] === 'f').sort((a, b) => a.g - b.g);
    const hide = new Set();
    if (!finals.length) return { champion: null, hide };
    const gf = finals[0];
    const feederCls = raw => { const r = parseRef(raw); return (r.kind === 'WG' || r.kind === 'LG') ? cls[r.g] : null; };
    const winnersSide = feederCls(gf.away) === 'w' ? 'away' : feederCls(gf.home) === 'w' ? 'home' : 'away';
    let champion = null;
    if (isPlayed(gf)) {
      const winSide = gf.as > gf.hs ? 'away' : gf.hs > gf.as ? 'home' : null;
      if (winSide === winnersSide) {
        champion = resolveSide(t, parseRef(winSide === 'away' ? gf.away : gf.home), new Set());
        finals.slice(1).forEach(g => hide.add(g.g));
      } else if (winSide) {
        const dec = finals[1];
        if (dec && isPlayed(dec)) {
          const ds = dec.as > dec.hs ? 'away' : dec.hs > dec.as ? 'home' : null;
          if (ds) champion = resolveSide(t, parseRef(ds === 'away' ? dec.away : dec.home), new Set());
        }
      }
    }
    return { champion, hide };
  }
  function playedCount(t) { return (t.games || []).filter(isPlayed).length; }
  // resolve a slot (team / WG-3 / LG-2 / bye) to a display object { name, tbd? }
  function sideDisplay(t, raw) {
    const ref = parseRef(raw);
    if (ref.kind === 'team') return { name: ref.name };
    if (ref.kind === 'bye')  return { name: 'BYE', tbd: true };
    if (ref.kind === 'tbd')  return { name: ref.label || 'TBD', tbd: true };
    const resolved = resolveSide(t, ref, new Set());
    if (resolved) return { name: resolved };
    return { name: (ref.kind === 'WG' ? 'Winner G' : 'Loser G') + ref.g, tbd: true };
  }

  global.D27bracket = { parseRef, isPlayed, classify, championOutcome, playedCount, sideDisplay, resolveSide };
})(window);
