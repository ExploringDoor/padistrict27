// ─────────────────────────────────────────────────────────────────────
// Tournament auto-generator.
// Given teams + fields + dates, build a complete single- or double-
// elimination bracket as a games[] array using the SAME WG-/LG- reference
// model the bracket renderer (d27-bracket.js) understands, then lay out a
// draft schedule (date / time / field per game). The output drops straight
// into Firestore schedules/{key} — identical shape to the Excel importer.
//
//   D27gen.generateTournament({
//     key, format:'single'|'double',
//     teams:[ 'Name' | {name,abbr,park} ],
//     dates:['2026-06-22', ...], times:['18:00', ...], fields:['GV-King Road', ...],
//     startGame:1
//   }) -> { games:[{g,id,date,time,away,as,home,hs,field}], teams:[{n,name,abbr,park}] }
//
// Pure + side-effect-free. Browser: window.D27gen. Node: module.exports.
// ─────────────────────────────────────────────────────────────────────
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.D27gen = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var pad2 = function (n) { return String(n).padStart(2, '0'); };
  var nextPow2 = function (n) { var p = 1; while (p < n) p <<= 1; return p; };

  // "WG-3" / "LG-2" -> 3 / 2 ; anything else -> null
  function refGameNum(s) {
    var m = /^(?:WG|LG)-(\d+)$/i.exec(String(s == null ? '' : s).trim());
    return m ? +m[1] : null;
  }

  // Auto-abbreviation when the caller doesn't supply one ("Lower Merion" -> "LM").
  function abbrev(name) {
    var w = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    if (!w.length) return '';
    if (w.length === 1) return w[0].slice(0, 3).toUpperCase();
    return w.map(function (x) { return x[0]; }).join('').slice(0, 4).toUpperCase();
  }

  // Standard single-elim seed order for a power-of-2 bracket.
  // seedSlots(8) -> [1,8,4,5,2,7,3,6]  (1-indexed seeds; slot i faces slot i+1)
  function seedSlots(size) {
    var seeds = [1, 2];
    while (seeds.length < size) {
      var sum = seeds.length * 2 + 1, next = [];
      for (var i = 0; i < seeds.length; i++) { next.push(seeds[i]); next.push(sum - seeds[i]); }
      seeds = next;
    }
    return seeds;
  }

  // ── Winners bracket (this IS the whole bracket for single-elim) ──────
  // Returns { games:[{g,away,home}], waves:[ [loserRef|null,...] perWBround ],
  //           wbChampRef:'WG-N', lastG }
  // waves[0] = WR1 losers (one slot per WR1 matchup; null where that matchup
  // was a bye, so no loser dropped); waves[k-1] = the WB final's single loser.
  function buildWinners(teams, startG) {
    var N = teams.length, size = nextPow2(N), seeds = seedSlots(size);
    var slot = seeds.map(function (sd) { return sd <= N ? teams[sd - 1] : null; }); // null = bye
    var games = [], g = startG - 1, waves = [];

    // round 1
    var adv = [], wave1 = [];
    for (var i = 0; i < size; i += 2) {
      var a = slot[i], b = slot[i + 1];
      if (a && b) { g++; games.push({ g: g, away: a, home: b }); adv.push('WG-' + g); wave1.push('LG-' + g); }
      else if (a || b) { adv.push(a || b); wave1.push(null); } // bye → team carries, drops no loser
      else { adv.push(null); wave1.push(null); }
    }
    waves.push(wave1);

    // rounds 2..k
    while (adv.length > 1) {
      var next = [], wave = [];
      for (var j = 0; j < adv.length; j += 2) {
        var x = adv[j], y = adv[j + 1];
        if (x && y) { g++; games.push({ g: g, away: x, home: y }); next.push('WG-' + g); wave.push('LG-' + g); }
        else if (x || y) { next.push(x || y); wave.push(null); }
        else { next.push(null); wave.push(null); }
      }
      adv = next; waves.push(wave);
    }
    return { games: games, waves: waves, wbChampRef: adv[0], lastG: g };
  }

  // ── Losers bracket (double-elim only) ───────────────────────────────
  // Consumes the WB loser waves. Alternates "minor" rounds (LB survivors play
  // each other) and "major" rounds (LB survivors meet the freshly-dropped WB
  // losers). Returns { games, lbChampRef, lastG }.
  function buildLosers(waves, startG) {
    var games = [], g = startG - 1, k = waves.length;

    // pair a list of refs among themselves → winners (a null slot = bye, carries)
    function pairUp(refs) {
      var out = [];
      for (var i = 0; i < refs.length; i += 2) {
        var a = refs[i], b = refs[i + 1];
        if (a && b) { g++; games.push({ g: g, away: a, home: b }); out.push('WG-' + g); }
        else if (a || b) out.push(a || b);
        else out.push(null);
      }
      return out;
    }
    // LB survivors vs newly-dropped WB losers (reverse the drops to cut rematches)
    function absorb(surv, drops) {
      var d = drops.slice().reverse(), out = [], len = Math.max(surv.length, d.length);
      for (var i = 0; i < len; i++) {
        var a = surv[i] != null ? surv[i] : null, b = d[i] != null ? d[i] : null;
        if (a && b) { g++; games.push({ g: g, away: a, home: b }); out.push('WG-' + g); }
        else if (a || b) out.push(a || b);
        else out.push(null);
      }
      return out;
    }

    var surv = pairUp(waves[0]);            // WR1 losers play each other
    for (var r = 1; r < k; r++) {
      surv = absorb(surv, waves[r]);        // meet WR(r+1) losers
      if (r < k - 1) surv = pairUp(surv);   // then halve (except before the last wave)
    }
    var lbChampRef = null;
    for (var s = 0; s < surv.length; s++) if (surv[s] != null) { lbChampRef = surv[s]; break; }
    return { games: games, lbChampRef: lbChampRef, lastG: g };
  }

  // ── Grand final + "if necessary" reset (matches Jeff's encoding) ─────
  function buildFinal(wbChampRef, lbChampRef, startG) {
    var gf = { g: startG, away: wbChampRef, home: lbChampRef };
    var reset = { g: startG + 1, away: 'WG-' + startG, home: 'If Necessary' };
    return { games: [gf, reset], lastG: startG + 1 };
  }

  // ── Bracket structure only (refs/names; no schedule yet) ─────────────
  function generateBracket(opts) {
    var teams = (opts && opts.teams) || [], startG = (opts && opts.startGame) || 1;
    if (teams.length < 2) return [];
    var wb = buildWinners(teams, startG);
    if ((opts.format || 'single') !== 'double') return wb.games;     // single-elim
    var lb = buildLosers(wb.waves, wb.lastG + 1);
    var fin = buildFinal(wb.wbChampRef, lb.lbChampRef, lb.lastG + 1);
    return wb.games.concat(lb.games, fin.games);
  }

  // Normalize inputs: a field is { name, lights } (lights default true); a time is
  // { value:'HH:MM', needsLights } (defaults to needing lights at/after 6:00 PM).
  function normField(f) { return typeof f === 'string' ? { name: f, lights: true } : { name: (f && f.name) || '', lights: !(f && f.lights === false) }; }
  function normTime(t) {
    if (t && typeof t === 'object') return { value: t.value || '18:00', needsLights: !!t.needsLights };
    var h = parseInt(String(t).split(':')[0], 10);
    return { value: String(t), needsLights: !isNaN(h) && h >= 18 };
  }

  // ── Draft scheduler: assign date / time / field per game ─────────────
  // Games are grouped by dependency depth (round); each round starts on the next
  // available date and fills that day's valid (field × time) slots, spilling to the
  // following date when a round has more games than a day can hold. A game is never
  // dated before the games that feed it, and an UNLIT field never takes a night game.
  function scheduleGames(games, opts) {
    opts = opts || {};
    var dates = (opts.dates || []).filter(Boolean);
    var times = (opts.times && opts.times.length ? opts.times : ['18:00']).map(normTime);
    var fields = (opts.fields && opts.fields.length ? opts.fields : ['']).map(normField);
    if (!times.length) times = [{ value: '18:00', needsLights: false }];
    if (!fields.length) fields = [{ name: '', lights: true }];

    // valid slots for a single day, earliest time first — skip night×unlit combos
    var daySlots = [];
    times.forEach(function (t) { fields.forEach(function (f) { if (f.lights || !t.needsLights) daySlots.push({ field: f.name, time: t.value }); }); });
    if (!daySlots.length) daySlots.push({ field: fields[0].name, time: times[0].value });

    var byNum = {}; games.forEach(function (g) { byNum[g.g] = g; });
    var memo = {};
    function depth(n) {
      if (memo[n] != null) return memo[n];
      memo[n] = 1; // guard against cycles
      var g = byNum[n]; if (!g) return 1;
      var fds = [g.away, g.home].map(refGameNum).filter(function (x) { return x != null; });
      var d = fds.length ? 1 + Math.max.apply(null, fds.map(depth)) : 1;
      memo[n] = d; return d;
    }
    games.forEach(function (g) { depth(g.g); });

    var rounds = [];
    games.forEach(function (g) { var d = memo[g.g]; (rounds[d] = rounds[d] || []).push(g); });

    var dateIdx = 0;
    for (var d = 1; d < rounds.length; d++) {
      var rg = rounds[d]; if (!rg || !rg.length) continue;
      rg.sort(function (a, b) { return a.g - b.g; });
      var slot = 0;
      rg.forEach(function (g) {
        if (slot >= daySlots.length) { dateIdx++; slot = 0; }   // round bigger than a day → spill
        var s = daySlots[slot];
        g.date = dates.length ? dates[Math.min(dateIdx, dates.length - 1)] : '';
        g.time = s.time; g.field = s.field;
        slot++;
      });
      dateIdx++;
    }
    return games;
  }

  // ── Full tournament: structure + schedule + final Firestore shape ────
  function generateTournament(opts) {
    opts = opts || {};
    var rawTeams = opts.teams || [];
    var names = rawTeams.map(function (t) { return typeof t === 'string' ? t : (t && t.name) || ''; }).filter(Boolean);
    var format = opts.format === 'double' ? 'double' : 'single';
    var key = opts.key || '';

    var games = generateBracket({ format: format, teams: names, startGame: opts.startGame || 1 });
    games = scheduleGames(games, { dates: opts.dates, times: opts.times, fields: opts.fields });

    games.forEach(function (g) {
      g.id = key ? key + '-' + pad2(g.g) : '';
      if (g.as === undefined) g.as = null;
      if (g.hs === undefined) g.hs = null;
      if (g.date === undefined) g.date = '';
      if (g.time === undefined) g.time = '';
      if (g.field === undefined) g.field = '';
    });

    var teams = rawTeams.map(function (t, i) {
      if (typeof t === 'string') return { n: i + 1, name: t, abbr: abbrev(t), park: '' };
      return { n: i + 1, name: t.name || '', abbr: t.abbr || abbrev(t.name), park: t.park || '' };
    });

    return { games: games, teams: teams };
  }

  return {
    generateTournament: generateTournament,
    generateBracket: generateBracket,
    scheduleGames: scheduleGames,
    abbrev: abbrev,
    // internals exposed for testing
    _seedSlots: seedSlots, _buildWinners: buildWinners, _buildLosers: buildLosers, _refGameNum: refGameNum
  };
});
