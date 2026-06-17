// ─────────────────────────────────────────────────────────────────────
// D27 pool-play standings engine. For round-robin tournaments (format:'pool')
// like the Bennett 9/10 + John Klein 11/12 invitationals.
// Computes W/L/T, runs for/against, diff; ranks by wins → head-to-head →
// fewest runs allowed → run differential. (Coin-flip / final Red-Blue
// seeding is the District's call — standings are informational.)
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  function num(v) { return (v === null || v === undefined || v === '') ? null : Number(v); }
  function played(g) { return num(g.as) != null && num(g.hs) != null; }
  function isPlaceholder(n) {
    n = String(n == null ? '' : n).trim();
    return !n || /^(wg|lg)-/i.test(n) || /^(bye|tbd|tba)$/i.test(n) || /^if necessary/i.test(n) || /winner of|loser of/i.test(n);
  }

  function compute(t) {
    var rows = {};
    function row(name) { if (!rows[name]) rows[name] = { name: name, gp: 0, w: 0, l: 0, ties: 0, rf: 0, ra: 0 }; return rows[name]; }
    (t.teams || []).forEach(function (tm) { if (tm && tm.name && !isPlaceholder(tm.name)) row(tm.name); });
    (t.games || []).forEach(function (g) {
      if (isPlaceholder(g.away) || isPlaceholder(g.home) || !played(g)) return;
      var as = num(g.as), hs = num(g.hs), a = row(g.away), h = row(g.home);
      a.gp++; h.gp++; a.rf += as; a.ra += hs; h.rf += hs; h.ra += as;
      if (as > hs) { a.w++; h.l++; } else if (hs > as) { h.w++; a.l++; } else { a.ties++; h.ties++; }
    });
    var games = t.games || [];
    function h2h(a, b) {
      var aw = 0, bw = 0;
      games.forEach(function (g) {
        if (!played(g)) return;
        var s = [g.away, g.home];
        if (s.indexOf(a.name) >= 0 && s.indexOf(b.name) >= 0) {
          var as = num(g.as), hs = num(g.hs); if (as === hs) return;
          var aWon = (g.away === a.name) ? as > hs : hs > as;
          if (aWon) aw++; else bw++;
        }
      });
      return aw > bw ? -1 : (bw > aw ? 1 : 0);
    }
    var arr = Object.keys(rows).map(function (k) { var r = rows[k]; r.diff = r.rf - r.ra; r.pct = r.gp ? (r.w + r.ties * 0.5) / r.gp : 0; return r; });
    arr.sort(function (a, b) {
      if (b.w !== a.w) return b.w - a.w;
      if (b.pct !== a.pct) return b.pct - a.pct;
      var h = h2h(a, b); if (h) return h;
      if (a.ra !== b.ra) return a.ra - b.ra;
      if (b.diff !== a.diff) return b.diff - a.diff;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function logo(name) { return global.D27logos ? D27logos.html(name, 26) : ''; }

  function tableBlock(rows, anyTie, anyPlayed) {
    var head = '<tr><th class="st-rk">#</th><th class="st-tm">Team</th><th>GP</th><th>W</th><th>L</th>' + (anyTie ? '<th>T</th>' : '') + '<th>RF</th><th>RA</th><th>Diff</th></tr>';
    var body = rows.map(function (r, i) {
      var d = (r.diff > 0 ? '+' : '') + r.diff;
      return '<tr><td class="st-rk">' + (i + 1) + '</td>' +
        '<td class="st-tm">' + logo(r.name) + '<span>' + esc(r.name) + '</span></td>' +
        '<td>' + r.gp + '</td><td class="st-w">' + r.w + '</td><td>' + r.l + '</td>' + (anyTie ? '<td>' + r.ties + '</td>' : '') +
        '<td>' + r.rf + '</td><td>' + r.ra + '</td><td>' + (anyPlayed ? d : '—') + '</td></tr>';
    }).join('');
    return '<div class="st-scroll"><table class="st-table">' + head + body + '</table></div>';
  }
  function divOf(t, name) { var d = (t.divisions || {})[name]; return String(d == null ? '' : d).toLowerCase(); }

  function tableHTML(t) {
    var rows = compute(t);
    if (!rows.length) return '';
    var anyTie = rows.some(function (r) { return r.ties > 0; });
    var anyPlayed = rows.some(function (r) { return r.gp > 0; });
    var note = anyPlayed ? '' : '<div class="st-note">Standings fill in as pool-play scores are entered.</div>';
    var legend = '<div class="st-legend">Ranked by wins, then head-to-head, then fewest runs allowed. Final Red / Blue bracket seeding is set by the District.</div>';
    var hasDiv = rows.some(function (r) { return divOf(t, r.name) === 'red' || divOf(t, r.name) === 'blue'; });
    if (!hasDiv) {
      return '<div class="bk-standings"><div class="st-head">Pool Play Standings</div>' + note + tableBlock(rows, anyTie, anyPlayed) + legend + '</div>';
    }
    function grp(d) { return rows.filter(function (r) { return divOf(t, r.name) === d; }); }
    function sec(label, cls, list) { return list.length ? '<div class="st-div ' + cls + '"><div class="st-div-h">' + label + '</div>' + tableBlock(list, anyTie, anyPlayed) + '</div>' : ''; }
    var un = rows.filter(function (r) { var d = divOf(t, r.name); return d !== 'red' && d !== 'blue'; });
    return '<div class="bk-standings"><div class="st-head">Pool Play Standings</div>' + note +
      sec('Red Division', 'st-red', grp('red')) +
      sec('Blue Division', 'st-blue', grp('blue')) +
      sec('Unassigned', 'st-un', un) +
      legend + '</div>';
  }

  global.D27standings = { compute: compute, tableHTML: tableHTML };
})(window);
