// ─────────────────────────────────────────────────────────────────────
// Baseball / Softball hub renderer. Pulls live tournaments (Firestore →
// static fallback), groups them by category, and renders real cards that
// link straight to each tournament's bracket + schedule.
//   D27renderHub({ sport, sections, hubId, statsId })
// Each section: { cat, eyebrow, title, accent, soon }
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function fmtUpdated(iso) {
    if (!iso) return '';
    const dateOnly = iso.length <= 10;
    const d = new Date(iso + (dateOnly ? 'T12:00:00' : ''));
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (dateOnly) return date;
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${date} · ${time}`;
  }

  // Local "today" as YYYY-MM-DD (the hub pages don't load d27-scores.js).
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // A tournament is "live" only once its first dated game arrives (so pre-start byes/forfeits don't count).
  function tournamentStarted(t) {
    const s = (t.games || []).map(g => g.date).filter(Boolean).sort()[0];
    return !!s && todayISO() >= s;
  }

  // Sport color-coding (per DA Jeff): Special Games = gray, else Baseball = blue / Softball = orange.
  function sportClass(t) {
    if (t && (t.category === 'Sectional' || t.category === 'State')) return 'sport-ss';
    if (t && (t.category === 'D27 Special Games' || t.special === true)) return 'sport-sg';
    if (t && t.sport === 'Softball') return 'sport-sb';
    return 'sport-bb';
  }
  function cardHTML(t, accent) {
    const B = global.D27bracket;
    const total = (t.games || []).length;
    let played = 0, champion = null;
    try { played = B.playedCount(t); champion = B.championOutcome(t, B.classify(t)).champion; } catch (e) {}

    // earliest dated game = the start date; only treat the tournament as live once that date arrives
    // (so a pre-start bye or forfeit doesn't make an unstarted tournament look "in progress").
    const startISO = (t.games || []).map(g => g.date).filter(Boolean).sort()[0];
    const started = tournamentStarted(t);

    let badge;
    if (champion)               badge = `<span class="tstatus complete">Champion</span>`;
    else if (played && started) badge = `<span class="tstatus live">In Progress</span>`;
    else if (total)             badge = `<span class="tstatus upcoming">Scheduled</span>`;
    else                        badge = `<span class="tstatus upcoming">TBD</span>`;

    const rows = [];
    rows.push(`<div class="tcard-row"><span class="k">Games</span><span class="v"><strong>${total}</strong></span></div>`);
    if (total) rows.push(`<div class="tcard-row"><span class="k">Played</span><span class="v">${(started || champion) ? played : 0} of ${total}</span></div>`);
    if (champion) rows.push(`<div class="tcard-row"><span class="k">🏆 Champion</span><span class="v">${esc(champion)}</span></div>`);
    if (startISO) rows.push(`<div class="tcard-row"><span class="k">${started ? 'Started' : 'Starts'}</span><span class="v">${esc(fmtUpdated(startISO))}</span></div>`);
    // "Updated" intentionally lives inside the bracket view (green live-pill in the title band), not on the card.

    return `<div class="tcard">
      <div class="tcard-banner ${sportClass(t)}">
        ${badge}
        <span class="tcard-kicker">${esc(t.category)}</span>
        <h3>${esc(t.name)}</h3>
      </div>
      <div class="tcard-body">${rows.join('')}</div>
      <div class="tcard-actions">
        <a class="tbtn primary" href="brackets.html#${esc(t.key)}">🏆 Bracket</a>
        <a class="tbtn" href="tournament-schedule.html#${esc(t.key)}">📅 Schedule</a>
      </div>
    </div>`;
  }

  function emptyCardHTML(msg) {
    return `<div class="tcard tcard-empty">
      <div class="ce-ico">🗓️</div>
      <div class="ce-tx"><h3>Schedules coming soon</h3><p>${esc(msg)}</p></div>
    </div>`;
  }

  global.D27renderHub = async function (opts) {
    const hub = document.getElementById(opts.hubId);
    let data;
    try { data = await global.D27loadSchedules(); }
    catch (e) { hub.innerHTML = '<div class="hub-loading">Could not load tournaments. Please refresh the page.</div>'; return; }

    // opts.sport filters to one sport; omit it (e.g. Special Games page) to span all sports.
    const mine = opts.sport ? data.tournaments.filter(t => t.sport === opts.sport) : data.tournaments.slice();

    // each section: filter by s.match(t) if given, else by category s.cat
    const built = opts.sections.map(s => ({
      s,
      list: mine.filter(s.match || (t => t.category === s.cat)).sort(function (a, b) { return global.D27order ? global.D27order.cmp(a, b) : a.key.localeCompare(b.key); }),
    }));

    const statsEl = opts.statsId && document.getElementById(opts.statsId);
    if (statsEl) {
      const seen = {}, statsList = [];
      built.forEach(b => b.list.forEach(t => { if (!seen[t.key]) { seen[t.key] = 1; statsList.push(t); } }));
      const totalGames = statsList.reduce((s, t) => s + ((t.games || []).length), 0);
      const playedGames = statsList.reduce((s, t) => { try { return s + (tournamentStarted(t) ? global.D27bracket.playedCount(t) : 0); } catch (e) { return s; } }, 0);
      statsEl.innerHTML =
        `<div class="hub-stat"><span class="n">${statsList.length}</span><span class="l">Tournaments</span></div>` +
        `<div class="hub-stat"><span class="n">${totalGames}</span><span class="l">Games</span></div>` +
        `<div class="hub-stat"><span class="n">${playedGames}</span><span class="l">Played</span></div>`;
    }

    let html = '';
    for (const b of built) {
      const s = b.s, list = b.list;
      const cards = list.length
        ? list.map(t => cardHTML(t, s.accent)).join('')
        : emptyCardHTML(s.soon || 'Schedules will be posted here once the District finalizes them.');
      html += `<div class="type-group">
        <div class="type-head">
          <div><span class="eyebrow">${esc(s.eyebrow)}</span><h2>${esc(s.title)}</h2></div>
          <span class="count">${list.length ? list.length + ' tournament' + (list.length === 1 ? '' : 's') : 'Coming soon'}</span>
        </div>
        <div class="tcards">${cards}</div>
      </div>`;
    }
    hub.innerHTML = html;
  };
})(window);
