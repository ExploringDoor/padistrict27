// ─────────────────────────────────────────────────────────────────────
// Canonical tournament sort order (per Adam, Jun 2026).
// Used EVERYWHERE tournaments are listed/sorted: dropdowns, chip pickers,
// bracket selector, hub cards, champion cards, admin tournament picker.
// Order is by tournament KEY. Update ORDER when new tournaments are added.
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  var ORDER = [
    // International Baseball
    'BB-10', 'BB-11', 'BB-12', 'BB-INT', 'BB-JR', 'BB-SR',
    // International Softball
    'SB-10', 'SB-11', 'SB-12', 'SB-JR', 'SB-SR',
    // D27 Special Games
    'SB-Major_Champ', 'BB-Bob_Jones', 'BB-9',
    // Bennett 9/10 + John Klein 11/12: pool play, then Red/Blue single-elim brackets
    'BB-Bennett', 'BB-Bennett-Red', 'BB-Bennett-Blue',
    'BB-Klein', 'BB-Klein-Red', 'BB-Klein-Blue'
  ];
  var IDX = {}; ORDER.forEach(function (k, i) { IDX[k] = i; });

  var CAT_ORDER = ['LL International — Baseball', 'LL International — Softball', 'D27 Special Games'];
  var CATIDX = {}; CAT_ORDER.forEach(function (c, i) { CATIDX[c] = i; });

  function keyOf(t) { return (typeof t === 'string') ? t : (t && (t.key || t.tourneyKey || t.tkey)) || ''; }
  function index(t) { var k = keyOf(t); return (k in IDX) ? IDX[k] : 999; }
  // comparator for tournament objects OR raw keys — unknown keys sort last, then alphabetically
  function cmp(a, b) { var d = index(a) - index(b); return d !== 0 ? d : keyOf(a).localeCompare(keyOf(b)); }

  function catIndex(c) { return (c in CATIDX) ? CATIDX[c] : 999; }
  function catCmp(a, b) { var d = catIndex(a) - catIndex(b); return d !== 0 ? d : String(a).localeCompare(String(b)); }

  global.D27order = { ORDER: ORDER, CAT_ORDER: CAT_ORDER, index: index, cmp: cmp, keyOf: keyOf, catIndex: catIndex, catCmp: catCmp };
})(window);
