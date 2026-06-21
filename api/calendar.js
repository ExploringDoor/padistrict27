// Vercel Serverless Function — /api/calendar  (PA District 27)
// Returns an iCalendar (.ics) feed of every game on the site, live from Firestore.
// Subscribe in any calendar app via webcal://padistrict27.vercel.app/api/calendar
//
// Optional filters (combine freely):
//   ?tournament=BB-12        one tournament (by key)
//   ?team=Chester%20Valley   games involving a team/league (case-insensitive substring)
//   ?sport=Baseball|Softball
//
// Stable per-game UID so subscribed calendars update games in place (no duplicates).

const FS = 'https://firestore.googleapis.com/v1/projects/d27-schedules/databases/(default)/documents/schedules?key=AIzaSyBu_Qd5AUWVSUB6vHP39-zzZgTpbC7s0Fs&pageSize=100';
const REFERER = 'https://padistrict27.vercel.app/';

function fsVal(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
  if ('mapValue' in v) { const o = {}, f = v.mapValue.fields || {}; for (const k in f) o[k] = fsVal(f[k]); return o; }
  return null;
}
function parseDoc(doc) { const o = {}, f = doc.fields || {}; for (const k in f) o[k] = fsVal(f[k]); o.games = o.games || []; return o; }

function isRef(n) { n = String(n == null ? '' : n).trim(); return !n || /^(wg|lg)-/i.test(n) || /^(bye|tbd|tba)$/i.test(n) || /^if necessary/i.test(n); }
function teamName(n) { return isRef(n) ? 'TBD' : String(n).trim(); }
function esc(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function pad(n) { return String(n).padStart(2, '0'); }

// America/New_York VTIMEZONE so every calendar app reads times correctly year-round.
const VTZ = [
  'BEGIN:VTIMEZONE', 'TZID:America/New_York',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const fTour = (q.tournament || q.t || '').trim();
  const fTeam = (q.team || '').trim().toLowerCase();
  const fSport = (q.sport || '').trim().toLowerCase();

  let tournaments = [];
  try {
    const r = await fetch(FS, { headers: { Referer: REFERER } });
    const data = await r.json();
    tournaments = (data.documents || []).map(parseDoc).filter(t => t.key);
  } catch (e) {
    res.status(502).send('Could not load schedule');
    return;
  }

  const now = new Date();
  const stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';

  const events = [];
  tournaments.forEach(t => {
    if (fTour && t.key !== fTour) return;
    if (fSport && String(t.sport || '').toLowerCase() !== fSport) return;
    (t.games || []).forEach(g => {
      if (!g.date) return;                                  // undated slot — skip
      const away = teamName(g.away), home = teamName(g.home);
      if (fTeam && !(away.toLowerCase().includes(fTeam) || home.toLowerCase().includes(fTeam))) return;

      const ymd = String(g.date).replace(/-/g, '');
      const played = g.as != null && g.hs != null && (Number(g.as) + Number(g.hs)) > 0;
      const ppd = g.status === 'ppd';

      let dtStart, dtEnd;
      if (g.time && /^\d{1,2}:\d{2}/.test(g.time)) {
        const hm = g.time.split(':'); let h = +hm[0]; const m = +hm[1];
        dtStart = 'DTSTART;TZID=America/New_York:' + ymd + 'T' + pad(h) + pad(m) + '00';
        let eh = h + 2, em = m; if (eh > 23) { eh = 23; em = 59; }
        dtEnd = 'DTEND;TZID=America/New_York:' + ymd + 'T' + pad(eh) + pad(em) + '00';
      } else {
        dtStart = 'DTSTART;VALUE=DATE:' + ymd;               // all-day if no time
        dtEnd = '';
      }

      let summary = away + ' vs ' + home;
      if (ppd) summary = 'PPD · ' + summary;
      else if (played) summary += ' (' + g.as + '–' + g.hs + ')';
      const tname = t.name || t.key;
      summary += ' — ' + tname;

      const descLines = [tname + (t.sport ? ' (' + t.sport + ')' : '')];
      if (ppd) descLines.push('Postponed' + (g.ppdReason ? ' (' + g.ppdReason + ')' : '') + (g.makeupDate ? ' — makeup ' + g.makeupDate : ''));
      else if (played) descLines.push('Final: ' + away + ' ' + g.as + ', ' + home + ' ' + g.hs);
      descLines.push('padistrict27.vercel.app');

      const ev = [
        'BEGIN:VEVENT',
        'UID:' + t.key + '-' + (g.g || ymd + (g.time || '')) + '@padistrict27',
        'DTSTAMP:' + stamp,
        dtStart,
        dtEnd,
        'SUMMARY:' + esc(summary),
        g.field ? 'LOCATION:' + esc(g.field) : '',
        'DESCRIPTION:' + esc(descLines.join('\n')),
        'STATUS:' + (ppd ? 'CANCELLED' : 'CONFIRMED'),
        'END:VEVENT',
      ].filter(Boolean);
      events.push(ev.join('\r\n'));
    });
  });

  let calName = 'PA District 27';
  if (fTour) { const tt = tournaments.find(t => t.key === fTour); calName += ' — ' + (tt ? tt.name : fTour); }
  else if (q.team) calName += ' — ' + q.team;
  else calName += ' — All Games';

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PA District 27//Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + esc(calName), 'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT2H', 'X-PUBLISHED-TTL:PT2H',
    VTZ, ...events, 'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="d27-schedule.ics"');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  res.status(200).send(ics);
};
