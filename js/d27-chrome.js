// ─────────────────────────────────────────────────────────────────────
// Site chrome: one source of truth for the nav + footer across every real
// page. A page includes <div id="d27-nav"></div> / <div id="d27-footer"></div>
// and this script + replaces them. To hide a page sitewide, remove it from
// NAV below — no per-page edits needed.
// ─────────────────────────────────────────────────────────────────────
(function () {
  var NAV = [
    ['index.html', 'Home'],
    ['baseball.html', 'Baseball'],
    ['softball.html', 'Softball'],
    ['leagues.html', 'Leagues'],
  ];
  var MORE = [
    ['live-schedule.html', 'Schedule'],
    ['brackets.html', 'Brackets'],
    ['champions.html', 'Champions'],
    ['rules.html', 'Rules'],
    ['history.html', 'History'],
    ['scholarship.html', 'Scholarship'],
  ];
  var CONTACT = 'jeffbennett.d27@gmail.com';

  // normalize to a bare page name so it matches with or without ".html"
  // (the live site serves /page.html; some dev servers serve clean /page)
  function base(s) { return s.toLowerCase().replace(/\.html$/, '').replace(/\/+$/, '') || 'index'; }
  var here = base(location.pathname.split('/').pop());

  function navItem(n) {
    var active = base(n[0]) === here;
    return '<li><a href="' + n[0] + '"' + (active ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>';
  }
  var topLinks = NAV.map(navItem).join('');
  var moreActive = MORE.some(function (n) { return base(n[0]) === here; });
  var moreHTML = '<li class="nav-more">' +
    '<a href="#more" class="nav-more-trigger"' + (moreActive ? ' aria-current="page"' : '') +
      ' aria-haspopup="true" aria-expanded="false">More <span class="caret">▾</span></a>' +
    '<ul class="nav-dropdown">' + MORE.map(navItem).join('') + '</ul></li>';

  var navHTML =
    '<nav class="nav"><div class="container nav-inner">' +
      '<a class="nav-brand" href="index.html"><img class="nav-crest" src="assets/d27-crest-logo.jpg" alt="PA District 27 Little League crest" />' +
        '<span class="name-block">PA District 27<span class="sub">Little League · Baseball &amp; Softball</span></span></a>' +
      '<button class="nav-toggle" aria-label="Menu" onclick="document.querySelector(\'.nav-links\').classList.toggle(\'open\')">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
        '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg></button>' +
      '<ul class="nav-links">' + topLinks + moreHTML + '</ul>' +
    '</div></nav>';

  var footHTML =
    '<footer class="footer"><div class="container"><div class="footer-grid">' +
      '<div><h5>PA District 27 Little League</h5>' +
        '<p style="color: rgba(255,255,255,.7); max-width: 48ch;">Leadership and guidance to locally chartered Little Leagues across Chester, Delaware, and Montgomery counties. One team. One Little League.</p>' +
        '<p style="color: rgba(255,255,255,.55); font-size: var(--text-xs); margin-top: 12px;">Jeff Bennett — District Administrator<br><a href="mailto:' + CONTACT + '">' + CONTACT + '</a></p></div>' +
      '<div><h5>Tournaments</h5><ul>' +
        '<li><a href="baseball.html">Baseball</a></li><li><a href="softball.html">Softball</a></li>' +
        '<li><a href="live-schedule.html">Schedules</a></li><li><a href="brackets.html">Brackets</a></li>' +
        '<li><a href="champions.html">Champions</a></li></ul></div>' +
      '<div><h5>District</h5><ul>' +
        '<li><a href="leagues.html">Member Leagues &amp; Fields</a></li><li><a href="rules.html">Tournament Guidelines</a></li>' +
        '<li><a href="history.html">History</a></li><li><a href="scholarship.html">Scholarship</a></li>' +
        '<li><a href="about.html">About</a></li></ul></div>' +
      '<div><h5>Connect</h5><ul>' +
        '<li><a href="https://www.facebook.com/padistrict27llbs/" target="_blank" rel="noopener">Facebook</a></li>' +
        '<li><a href="mailto:' + CONTACT + '">Contact D27</a></li>' +
        '<li><a href="schedule-admin.html">Sign In</a></li></ul></div>' +
    '</div><div class="footer-bottom">' +
      '<div>© 2026 PA District 27 Little League. All rights reserved.</div>' +
      '<div><span class="credit">Built by Mainline Web Design · Adam Miller</span></div>' +
    '</div></div></footer>';

  function inject() {
    var n = document.getElementById('d27-nav'); if (n) n.outerHTML = navHTML;
    var f = document.getElementById('d27-footer'); if (f) f.outerHTML = footHTML;
    var more = document.querySelector('.nav-more');
    if (more) {
      var trig = more.querySelector('.nav-more-trigger');
      trig.addEventListener('click', function (e) {
        e.preventDefault();
        var open = more.classList.toggle('open');
        trig.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (!more.contains(e.target)) { more.classList.remove('open'); trig.setAttribute('aria-expanded', 'false'); }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
