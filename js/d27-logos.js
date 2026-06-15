// ─────────────────────────────────────────────────────────────────────
// League / team logos. Teams ARE leagues, so a team like "Coventry (Keeler)"
// maps to the Coventry logo. One file per league in assets/logos/<slug>.png.
// Any league without a file falls back to a navy circle with its abbreviation,
// so missing logos never break the layout.
//
//   D27logos.html(name, sizePx)  -> <img> (or fallback circle) HTML string
//   D27logos.slug(name)          -> logo slug, or null
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  var BASE = 'assets/logos/';

  // canonical slug per league + every name variant we see in the data
  var MAP = {
    'berwyn-paoli': 'berwyn-paoli', 'berwyn/paoli': 'berwyn-paoli',
    'chester valley': 'chester-valley',
    'coventry': 'coventry',
    'devon-strafford': 'devon-strafford', 'devon/strafford': 'devon-strafford', 'devon strafford': 'devon-strafford',
    'gve': 'gve', 'great valley exton': 'gve', 'great valley': 'great-valley', 'greater valley': 'great-valley',
    'exton': 'exton',
    'lower merion': 'lower-merion',
    'lower perk': 'lower-perk', 'lower perkiomen': 'lower-perk',
    'pgp': 'pgp', 'pottsgrove-pottstown': 'pgp', 'pottsgrove/pottstown': 'pgp', 'pottsgrove': 'pgp', 'pottstown': 'pgp',
    'radnor-wayne': 'radnor-wayne', 'radnor/wayne': 'radnor-wayne', 'radnor wayne': 'radnor-wayne', 'radnorwayne': 'radnor-wayne',
    'upper providence': 'upper-providence', 'upper prov': 'upper-providence',
  };
  var ABBR = {
    'berwyn-paoli': 'BP', 'chester-valley': 'CV', 'coventry': 'COV', 'devon-strafford': 'DS',
    'exton': 'EX', 'gve': 'GVE', 'great-valley': 'GV', 'lower-merion': 'LM', 'lower-perk': 'LP', 'pgp': 'PGP',
    'radnor-wayne': 'RW', 'upper-providence': 'UP',
  };

  function esc(s) { return s == null ? '' : String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // strip "(manager)", "Little League"/"LL", trailing variant digit → base league text
  function base(name) {
    return String(name == null ? '' : name)
      .replace(/\s*\(.*?\)\s*$/, '')
      .replace(/\blittle league\b/ig, '')
      .replace(/\bLL\b/g, '')
      .replace(/\d+\s*$/, '')
      .trim();
  }
  function slug(name) {
    var b = base(name); if (!b) return null;
    var k = b.toLowerCase().replace(/\s+/g, ' ').trim();
    if (MAP[k]) return MAP[k];
    // prefix match: a known league followed by a mascot/color, e.g.
    // "Lower Perk Gators" -> lower-perk, "Great Valley Blue" -> gve
    var mk = Object.keys(MAP).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < mk.length; i++) { if (k.indexOf(mk[i] + ' ') === 0) return MAP[mk[i]]; }
    var s = k.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || null;
  }
  function abbr(name) {
    var s = slug(name);
    if (s && ABBR[s]) return ABBR[s];
    var b = base(name);
    var words = b.split(/[\s/\-]+/).filter(Boolean);
    return (words.map(function (w) { return w[0]; }).join('').slice(0, 3) || '?').toUpperCase();
  }

  function fbSpan(ab, size) {
    return '<span class="d27-logo d27-logo-fb" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.38) + 'px">' + esc(ab) + '</span>';
  }
  // returns an <img>; if the file is missing it swaps to a navy abbr circle via
  // the onerror handler (fail), so leagues without a logo still show a clean badge.
  function html(name, size) {
    size = size || 24;
    var s = slug(name), ab = abbr(name);
    if (!s) return fbSpan(ab, size);
    return '<img class="d27-logo" src="' + BASE + s + '.png" alt="' + esc(base(name)) + ' logo" width="' + size + '" height="' + size +
      '" data-ab="' + esc(ab) + '" data-sz="' + size + '" loading="lazy" decoding="async" onerror="window.D27logos&&D27logos.fail(this)">';
  }
  function fail(img) {
    var sz = +img.getAttribute('data-sz') || 24, ab = img.getAttribute('data-ab') || '?';
    var span = document.createElement('span');
    span.className = 'd27-logo d27-logo-fb';
    span.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.round(sz * 0.38) + 'px';
    span.textContent = ab;
    if (img.parentNode) img.parentNode.replaceChild(span, img);
  }

  function known(name) { var s = slug(name); return !!(s && ABBR[s]); }   // maps to a real D27 league?
  global.D27logos = { html: html, slug: slug, abbr: abbr, base: base, fail: fail, known: known };
})(window);
