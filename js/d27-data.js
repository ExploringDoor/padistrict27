// ─────────────────────────────────────────────────────────────────────
// D27 schedule loader — reads live from Firestore (public read), and
// falls back to the static data/schedule-data.json if Firebase is ever
// unreachable. Returns the same shape both ways:
//   { tournaments: [...], categoryOrder: [...], source: 'firebase'|'static' }
// Used by live-schedule.html and brackets.html (plain <script>, no module).
// ─────────────────────────────────────────────────────────────────────
(function (global) {
  const PROJECT = 'd27-schedules';
  const KEY = 'AIzaSyBu_Qd5AUWVSUB6vHP39-zzZgTpbC7s0Fs';
  const CATEGORY_ORDER = [
    'LL International — Baseball',
    'LL International — Softball',
    'D27 Special Games',
    'Sectional',
    'State',
  ];

  // Unwrap a Firestore REST typed value into a plain JS value
  function fsVal(v) {
    if (v == null) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
    if ('mapValue' in v) {
      const o = {}, f = v.mapValue.fields || {};
      for (const k in f) o[k] = fsVal(f[k]);
      return o;
    }
    return null;
  }
  function parseDoc(doc) {
    const o = {}, f = doc.fields || {};
    for (const k in f) o[k] = fsVal(f[k]);
    o.games = o.games || [];
    return o;
  }

  global.D27loadSchedules = async function () {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/schedules?key=${KEY}&pageSize=100`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('firestore ' + res.status);
      const data = await res.json();
      if (!data.documents || !data.documents.length) throw new Error('empty');
      const tournaments = data.documents.map(parseDoc).filter(t => t.key);
      // Firestore doesn't store the team/home-field table yet — merge it from the
      // static export by tournament key so the Teams & Fields panel has data.
      try {
        const sres = await fetch('data/schedule-data.json');
        const sd = await sres.json();
        const teamMap = {};
        (sd.tournaments || []).forEach(st => { if (st.key && st.teams && st.teams.length) teamMap[st.key] = st.teams; });
        tournaments.forEach(t => { if ((!t.teams || !t.teams.length) && teamMap[t.key]) t.teams = teamMap[t.key]; });
      } catch (e) { /* teams are optional — ignore if the static file is unreachable */ }
      return { tournaments, categoryOrder: CATEGORY_ORDER, source: 'firebase' };
    } catch (e) {
      const res = await fetch('data/schedule-data.json');
      const d = await res.json();
      d.source = 'static';
      return d;
    }
  };
})(window);
