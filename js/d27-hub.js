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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function cardHTML(t, accent) {
    const B = global.D27bracket;
    const total = (t.games || []).length;
    let played = 0, champion = null;
    try { played = B.playedCount(t); champion = B.championOutcome(t, B.classify(t)).champion; } catch (e) {}

    let badge;
    if (champion)      badge = `<span class="tstatus complete">Champion</span>`;
    else if (played)   badge = `<span class="tstatus live">In Progress</span>`;
    else if (total)    badge = `<span class="tstatus upcoming">Scheduled</span>`;
    else               badge = `<span class="tstatus upcoming">TBD</span>`;

    const rows = [];
    rows.push(`<div class="tcard-row"><span class="k">Games</span><span class="v"><strong>${total}</strong></span></div>`);
    if (total) rows.push(`<div class="tcard-row"><span class="k">Played</span><span class="v">${played} of ${total}</span></div>`);
    if (champion) rows.push(`<div class="tcard-row"><span class="k">🏆 Champion</span><span class="v">${esc(champion)}</span></div>`);
    if (t.updated) rows.push(`<div class="tcard-row"><span class="k">Updated</span><span class="v">${esc(fmtUpdated(t.updated))}</span></div>`);

    return `<div class="tcard">
      <div class="tcard-banner ${accent || ''}">
        ${badge}
        <span class="tcard-kicker">${esc(t.category)}</span>
        <h3>${esc(t.name)}</h3>
      </div>
      <div class="tcard-body">${rows.join('')}</div>
      <div class="tcard-actions">
        <a class="tbtn primary" href="brackets.html#${esc(t.key)}">🏆 Bracket</a>
        <a class="tbtn" href="live-schedule.html#${esc(t.key)}">📅 Schedule</a>
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

    const mine = data.tournaments.filter(t => t.sport === opts.sport);

    const statsEl = opts.statsId && document.getElementById(opts.statsId);
    if (statsEl) {
      const totalGames = mine.reduce((s, t) => s + ((t.games || []).length), 0);
      const live = mine.filter(t => { try { return global.D27bracket.playedCount(t) > 0; } catch (e) { return false; } }).length;
      statsEl.innerHTML =
        `<div class="hub-stat"><span class="n">${mine.length}</span><span class="l">Tournaments</span></div>` +
        `<div class="hub-stat"><span class="n">${totalGames}</span><span class="l">Games</span></div>` +
        `<div class="hub-stat"><span class="n">${live}</span><span class="l">Underway</span></div>`;
    }

    let html = '';
    for (const s of opts.sections) {
      const list = mine.filter(t => t.category === s.cat).sort((a, b) => a.key.localeCompare(b.key));
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
