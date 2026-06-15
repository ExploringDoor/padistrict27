// ─────────────────────────────────────────────────────────────────────
// Site chrome: one source of truth for the nav + footer across every real
// page. A page includes <div id="d27-nav"></div> / <div id="d27-footer"></div>
// and this script + replaces them. To hide a page sitewide, remove it from
// NAV below — no per-page edits needed.
// ─────────────────────────────────────────────────────────────────────
(function () {
  // Vercel Web Analytics — counts page views / visitors on every page.
  // (Web Analytics must also be enabled in the Vercel dashboard for this project.)
  (function () {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  })();

  // Google Analytics 4 — set GA_ID to the Measurement ID to switch it on (blank = off).
  // From analytics.google.com → Admin → Data Streams → web stream (looks like G-XXXXXXXXXX).
  var GA_ID = 'G-EX74L9L3WG';
  if (GA_ID) {
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(gaScript);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  // Cosmetic FX — scroll reveals, count-up stats, champion confetti
  (function () { var s = document.createElement('script'); s.defer = true; s.src = 'js/d27-fx.js'; document.head.appendChild(s); })();

  // Favicon — the D27 crest (browser tab / bookmark icon) on every page.
  [['icon', '/favicon-32.png', 'image/png', '32x32'],
   ['icon', '/favicon-16.png', 'image/png', '16x16'],
   ['icon', '/favicon.ico', 'image/x-icon', null],
   ['apple-touch-icon', '/apple-touch-icon.png', null, null]
  ].forEach(function (d) {
    var l = document.createElement('link');
    l.rel = d[0]; l.href = d[1];
    if (d[2]) l.type = d[2];
    if (d[3]) l.setAttribute('sizes', d[3]);
    document.head.appendChild(l);
  });

  var NAV = [
    ['index.html', 'Home'],
    ['scores.html', 'Scores'],
    ['live-schedule.html', 'Schedule'],
    ['baseball.html', 'Baseball'],
    ['softball.html', 'Softball'],
    ['special-games.html', 'Special Games'],
    ['leagues.html', 'Leagues'],
  ];
  var MORE = [
    // Game Status (weather.html) + Game Alerts (alerts.html) hidden off-season — pages stay URL-accessible, re-link when active.
    ['brackets.html', 'Brackets'],
    ['champions.html', 'Champions'],
    ['rules.html', 'Rules'],
    ['history.html', 'History'],
    ['scholarship.html', 'Scholarship'],
    ['https://www.padistrict27.com/', 'Main D27 Site ↗'],
  ];
  var CONTACT = 'jeffbennett.d27@gmail.com';

  // normalize to a bare page name so it matches with or without ".html"
  // (the live site serves /page.html; some dev servers serve clean /page)
  function base(s) { return s.toLowerCase().replace(/\.html$/, '').replace(/\/+$/, '') || 'index'; }
  var here = base(location.pathname.split('/').pop());

  function navItem(n) {
    var ext = /^https?:/i.test(n[0]);
    var active = !ext && base(n[0]) === here;
    var attrs = (active ? ' aria-current="page"' : '') + (ext ? ' target="_blank" rel="noopener"' : '');
    return '<li><a href="' + n[0] + '"' + attrs + '>' + n[1] + '</a></li>';
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
        '<li><a href="special-games.html">Special Games</a></li>' +
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
      '<div><span class="credit">Built by <a href="https://mainline-webdesign.com/" target="_blank" rel="noopener">Mainline Web Design</a></span></div>' +
    '</div></div></footer>';

  // ── Site-wide weather banner: auto-shows when a game is postponed today/tomorrow ──
  var ALERT_DISMISS_KEY = 'd27-alert-dismissed';
  function alertSig(msg){ var s=0, t=String(msg||''); for(var i=0;i<t.length;i++){ s=(s*31+t.charCodeAt(i))|0; } return String(s); }
  function alertDismissed(sig){ try { return localStorage.getItem(ALERT_DISMISS_KEY)===sig; } catch(e){ return false; } }
  function renderWxPopup(n){
    var message = n + ' game' + (n>1?'s':'') + ' ' + (n>1?'have':'has') + ' been postponed.';
    var sig = alertSig(message);
    if(alertDismissed(sig)) return;
    if(document.querySelector('.d27-wx')) return;
    var ov=document.createElement('div'); ov.className='d27-wx';
    ov.innerHTML='<div class="d27-wx-card" role="alertdialog" aria-label="Weather alert">'+
      '<div class="d27-wx-ico">⛈️</div>'+
      '<h2>Weather Alert</h2>'+
      '<p>'+message+' Tap below to see which games are affected and their makeup dates.</p>'+
      '<div class="d27-wx-btns">'+
        '<a class="d27-wx-go" href="weather.html">See what&rsquo;s affected &rsaquo;</a>'+
        '<button class="d27-wx-ok" type="button">Got it</button>'+
      '</div></div>';
    document.body.appendChild(ov);
    document.body.style.overflow='hidden';
    function ack(){ try{ localStorage.setItem(ALERT_DISMISS_KEY, sig); }catch(e){} }
    ov.querySelector('.d27-wx-ok').addEventListener('click', function(){ ack(); ov.remove(); document.body.style.overflow=''; });
    ov.querySelector('.d27-wx-go').addEventListener('click', ack);
  }
  function showWeatherBanner(){
    if(typeof window.D27loadSchedules!=='function') return;
    window.D27loadSchedules().then(function(data){
      var now=new Date();
      var iso=function(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); };
      var today=iso(now), tmrw=iso(new Date(now.getTime()+864e5));
      var n=0;
      (data.tournaments||[]).forEach(function(t){ (t.games||[]).forEach(function(g){
        if(g.status==='ppd' && g.date && g.date>=today) n++;
      }); });
      if(n) renderWxPopup(n);
    }).catch(function(){});
  }

  // Lightweight visit counter — increments once per browser session (≈ a visit, not every page-flip)
  function bumpPageview(){
    try { if(sessionStorage.getItem('d27_seen')) return; sessionStorage.setItem('d27_seen','1'); } catch(e){}
    var n=new Date(), dk='d_'+n.getFullYear()+'_'+String(n.getMonth()+1).padStart(2,'0')+'_'+String(n.getDate()).padStart(2,'0');
    fetch('https://firestore.googleapis.com/v1/projects/d27-schedules/databases/(default)/documents:commit?key=AIzaSyBu_Qd5AUWVSUB6vHP39-zzZgTpbC7s0Fs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ writes:[{ transform:{ document:'projects/d27-schedules/databases/(default)/documents/stats/pageviews', fieldTransforms:[ {fieldPath:'total', increment:{integerValue:'1'}}, {fieldPath:'days.'+dk, increment:{integerValue:'1'}} ] }}] })
    }).catch(function(){});
  }

  function inject() {
    // showWeatherBanner();  // paused off-season alongside the hidden Game Status / Game Alerts pages
    bumpPageview();
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
