// ─────────────────────────────────────────────────────────────────────
// Flatten all games across tournaments, resolve team slots, and classify
// played vs upcoming. Used by the Scores & Schedule page and the home cards.
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  function allGames(data) {
    const out = [];
    (data.tournaments || []).forEach(function (t) {
      (t.games || []).forEach(function (g) {
        out.push(Object.assign({}, g, { _t: t, tourneyName: t.name, tourneyKey: t.key, sport: t.sport }));
      });
    });
    return out;
  }
  function played(g) { return g.as != null && g.hs != null && (g.as + g.hs) > 0; }
  function side(g, which) {
    const raw = which === 'away' ? g.away : g.home;
    try { return global.D27bracket.sideDisplay(g._t, raw); }
    catch (e) { return { name: raw || 'TBD', tbd: true }; }
  }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // most-recent finished games first
  function recentResults(data, limit) {
    const today = todayISO();
    return allGames(data)
      .filter(g => played(g) && g.date && g.date <= today)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.time || '').localeCompare(String(a.time || '')))
      .slice(0, limit || 6);
  }
  // soonest upcoming (not yet played) games first
  function upcoming(data, limit) {
    const today = todayISO();
    return allGames(data)
      .filter(g => !played(g) && g.date && g.date >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || String(a.time || '').localeCompare(String(b.time || '')))
      .slice(0, limit || 6);
  }
  global.D27scores = { allGames, played, side, todayISO, recentResults, upcoming };
})(window);
