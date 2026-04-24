// ═════════════════════════════════════════════════════════════════════════
// D27 CONFIG — per-deployment settings for PA District 27 Little League
// ═════════════════════════════════════════════════════════════════════════
//
// Mirrors DVSL's config.js pattern. Every value that differs between
// deployments lives here. Loaded first on every page via <script src="/config.js">.
//
// D27 is a district org with 12 member leagues — unlike DVSL (single league),
// this config carries a `leagues` array. Each member league has its own
// brand tokens that the per-league theme system reads at render time via
// [data-league="<slug>"] CSS scoping.
// ═════════════════════════════════════════════════════════════════════════

(function () {
  var CONFIG = {
    // ── Identity ─────────────────────────────────────────────────────────
    id: 'd27',
    name: 'D27',
    fullName: 'PA District 27 Little League',
    tagline: 'Serving 10,000 baseball & softball players across 12 member leagues',
    motto: 'One Team. One Little League.',
    counties: ['Chester', 'Delaware', 'Montgomery'],
    facebook: 'https://www.facebook.com/padistrict27llbs/',

    // ── Season ───────────────────────────────────────────────────────────
    season: {
      year: 2026,
      regularSeason: 'April – mid-June',
      tournamentWindow: 'mid-June – early August',
      banquet: 'October 9, 2026',
      scholarshipDeadline: 'September 8, 2026'
    },

    // ── District theme (Little League-inspired) ──────────────────────────
    // Navy + red + white + gold reads as "official Little League" to
    // parents/DAs without being a literal logo swipe.
    theme: {
      navy:  '#002D72',
      red:   '#DA291C',
      white: '#FFFFFF',
      gold:  '#C9A227',  // sparingly — championship / winner moments
      ink:   '#0F172A',
      paper: '#F7F8FA',
      line:  '#E5E7EB'
    },

    // ── Images ───────────────────────────────────────────────────────────
    images: {
      hero: 'assets/images/hero-d27.jpg',
      logo: 'assets/logos/d27-logo.png',
      fieldBg: 'assets/images/field-bg.png'
    },

    // ── Contact ──────────────────────────────────────────────────────────
    contact: {
      name:  'Adam Miller',
      email: 'adam.miller.22@gmail.com',
      da:    { name: 'Jeff Bennett',  role: 'District Administrator', email: 'jeffbennett.d27@gmail.com' },
      ada:   { name: 'Jason Saylor',  role: 'Assistant District Administrator' },
      scholarship: { name: 'Suzanne L. Battaglia', email: 'SBattaglia@yahoo.com' }
    },

    // ── Member leagues (real 12) ─────────────────────────────────────────
    // Per-league brand tokens drive [data-league="<slug>"] CSS scoping so
    // each league feels like "their" site when a parent is inside it.
    // Colors are approximations until each league's real branding is pulled
    // from their public sites.
    leagues: [
      {
        slug: 'berwyn-paoli', name: 'Berwyn-Paoli LL', short: 'BPLL',
        town: 'Berwyn, PA', county: 'Chester',
        site: 'https://www.bpall.org',
        fields: [{ name: 'Field of Dreams', addr: '915 Howellville Road, Berwyn, PA 19312' }],
        theme: { primary: '#0C2340', accent: '#C8102E' }
      },
      {
        slug: 'chester-valley', name: 'Chester Valley LL', short: 'CVLL',
        town: 'Malvern, PA', county: 'Chester',
        site: 'https://www.chestervalleyll.org',
        fields: [
          { name: '1st Ave Field (Softball)',    addr: '1 1st Avenue, Malvern, PA' },
          { name: 'Lower Field (AA/AAA)',        addr: '128 Mill Road, Malvern, PA' },
          { name: 'Monument Ave (Major/JR/SR)',  addr: '500 Monument Ave., Malvern, PA' }
        ],
        theme: { primary: '#003087', accent: '#FFB81C' }
      },
      {
        slug: 'coventry', name: 'Coventry LL', short: 'CLL',
        town: 'Pottstown, PA', county: 'Chester',
        site: 'https://sports.bluesombrero.com/Coventryll',
        fields: [{ name: 'Wampler Complex', addr: '333 S. Penn St., Pottstown, PA 19465' }],
        theme: { primary: '#1B365D', accent: '#E03A3E' }
      },
      {
        slug: 'devon-strafford', name: 'Devon-Strafford LL', short: 'DSLL',
        town: 'Berwyn, PA', county: 'Chester',
        site: 'http://www.dsll.org/',
        fields: [
          { name: 'Clarke 1 (LL Baseball)',   addr: '100 Old State Rd, Berwyn, PA 19312' },
          { name: 'Clarke 2 (LL Baseball)',   addr: '100 Old State Rd, Berwyn, PA 19312' },
          { name: 'VFMS (90\' Baseball)',     addr: '105 W. Walker Rd, Wayne, PA 19087' }
        ],
        theme: { primary: '#002F6C', accent: '#C41E3A' }
      },
      {
        slug: 'exton', name: 'Exton LL', short: 'ELL',
        town: 'Exton, PA', county: 'Chester',
        site: 'http://www.Extonlittleleague.org',
        fields: [
          { name: 'Ship Road Fields (Baseball)',       addr: '1425 Ship Road, Chester, PA 19380' },
          { name: 'Meadowbrook Manor Park (Softball)', addr: '410 Swedesford Road, Exton, PA 19341' }
        ],
        theme: { primary: '#0C2340', accent: '#CE1141' }
      },
      {
        slug: 'great-valley', name: 'Great Valley LL', short: 'GVLL',
        town: 'Malvern, PA', county: 'Chester',
        site: 'https://www.gvll.org',
        fields: [{ name: 'King Road Complex', addr: '1300 King Road, Malvern, PA 19355' }],
        theme: { primary: '#003831', accent: '#EFB21E' }
      },
      {
        slug: 'lower-merion', name: 'Lower Merion LL', short: 'LMLL',
        town: 'Gladwyne, PA', county: 'Montgomery',
        site: 'http://www.lmll.org',
        fields: [
          { name: 'Ashburn Field (Baseball)',                 addr: '1799 Youngs Ford Rd., Gladwyne, PA 19035' },
          { name: 'South Ardmore Park Field B (Softball)',    addr: '1420 Sussex Rd., Wynnewood, PA 19096' }
        ],
        theme: { primary: '#002D62', accent: '#EB6E1F' }
      },
      {
        slug: 'lower-perkiomen', name: 'Lower Perkiomen LL', short: 'LPLL',
        town: 'Collegeville, PA', county: 'Montgomery',
        site: 'https://www.lpll.org',
        fields: [
          { name: 'Palmer Park (8-12 BB & SB)',              addr: '4060 Creamery Rd, Collegeville, PA 19426' },
          { name: 'Jeanne Rosset French Memorial (Junior BB)', addr: '3903 Township Line Rd., Collegeville, PA 19426' }
        ],
        theme: { primary: '#002B5C', accent: '#FD5A1E' }
      },
      {
        slug: 'pottsgrove', name: 'Pottsgrove LL', short: 'PGLL',
        town: 'Pottstown, PA', county: 'Montgomery',
        site: 'http://pottsgrove-little-league.sportssignup.com',
        fields: [{ name: 'Teeball Fields', addr: '699 North Pleasantview Road, Pottstown, PA 19464' }],
        theme: { primary: '#27251F', accent: '#FDB827' }
      },
      {
        slug: 'pottstown', name: 'Pottstown LL', short: 'PLL',
        town: 'Pottstown, PA', county: 'Montgomery',
        site: 'https://www.pottstownlittleleague.org',
        fields: [{ name: 'Main Complex', addr: '451 Manatawny Street, Pottstown, PA 19464' }],
        theme: { primary: '#BD3039', accent: '#0C2340' }
      },
      {
        slug: 'radnor-wayne', name: 'Radnor-Wayne LL', short: 'RWLL',
        town: 'Wayne, PA', county: 'Delaware',
        site: 'https://rwll.teamsnapsites.com/field-locations/',
        fields: [{ name: 'Multiple field locations', addr: 'See site for addresses' }],
        theme: { primary: '#00385D', accent: '#A6192E' }
      },
      {
        slug: 'upper-providence', name: 'Upper Providence LL', short: 'UPLL',
        town: 'Upper Providence, PA', county: 'Montgomery',
        site: 'https://www.up-littleleague.org',
        fields: [{ name: 'Multiple field locations', addr: 'See site for addresses' }],
        theme: { primary: '#134A8E', accent: '#E8291C' }
      }
    ],

    // ── Showcase leagues (fully populated for the pitch) ─────────────────
    // Berwyn-Paoli + Chester Valley are fully built out with rosters /
    // schedules / sample team pages. The other 10 render as "ready to
    // onboard" cards on leagues.html.
    showcaseLeagues: ['berwyn-paoli', 'chester-valley'],

    // ── Tournaments (17 total: 11 baseball, 6 softball) ──────────────────
    tournaments: {
      baseball: [
        { slug: 'bb-10-pappy-patton', name: 'Al "Pappy" Patton Memorial',  short: 'BB-10',       age: '8-9-10 YO',  type: 'International', est: 2001 },
        { slug: 'bb-11',              name: 'BB-11',                        short: 'BB-11',       age: '9-10-11 YO', type: 'International' },
        { slug: 'bb-12',              name: 'BB-12',                        short: 'BB-12',       age: '10-11-12 YO', type: 'International' },
        { slug: 'bb-int',             name: 'Intermediate 50/70',           short: 'BB-INT',      age: '11-13 YO',   type: 'International' },
        { slug: 'bb-jr',              name: 'Junior League',                short: 'BB-JR',       age: '12-14 YO',   type: 'International' },
        { slug: 'bb-sr',              name: 'Senior League',                short: 'BB-SR',       age: '13-16 YO',   type: 'International' },
        { slug: 'bob-jones',          name: 'Bob Jones Tournament',         short: 'Bob Jones',   age: '11-12 YO Majors', type: 'Special', single_elim: true },
        { slug: 'bb-9',               name: 'BB-9 District Invitational',   short: 'BB-9',        age: '8-9 YO',     type: 'Special' },
        { slug: 'bennett',            name: 'Bennett Tournament',           short: 'Bennett',     age: '9-10 YO',    type: 'Special' },
        { slug: 'john-klein',         name: 'John Klein Tournament',        short: 'John Klein',  age: '11-12 YO',   type: 'Special' },
        { slug: 's8-bb-jr',           name: 'Section 8 Junior League',      short: 'S8-BB-JR',    age: '12-14 YO',   type: 'Section 8', host: 'Chester Valley' }
      ],
      softball: [
        { slug: 'sb-10',              name: 'SB-10',                        short: 'SB-10',       age: '8-9-10 YO',  type: 'International' },
        { slug: 'sb-11',              name: 'SB-11',                        short: 'SB-11',       age: '9-10-11 YO', type: 'International' },
        { slug: 'sb-12',              name: 'SB-12',                        short: 'SB-12',       age: '10-11-12 YO', type: 'International' },
        { slug: 'sb-jr',              name: 'SB Junior League',             short: 'SB-JR',       age: '12-14 YO',   type: 'International' },
        { slug: 'sb-sr',              name: 'SB Senior League',             short: 'SB-SR',       age: '13-16 YO',   type: 'International' },
        { slug: 'sb-majors-bob-jones', name: 'Bob Jones Tournament (Softball)', short: 'SB Majors', age: '11-12 YO Majors', type: 'Special' }
      ]
    },

    // ── History figures (named tournaments) ──────────────────────────────
    history: {
      bobJones: {
        name: 'Bob Jones',
        role: 'President, Bridgeport LL',
        story: 'Died in office. The Bob Jones Tournament — single-elimination for regular season Majors teams, 11-12 YO — was named in his honor by Tony Marra.'
      },
      johnKlein: {
        name: 'John Klein',
        role: 'Volunteer, Chester Valley LL',
        story: 'A mainstay at the old "B" tournament at Chester Valley (VFW and Monument Avenue fields). Before his passing, District 23 Administrator Tony Marra presented him with a banner and informed him the tournament would be named in his honor.'
      },
      pappyPatton: {
        name: 'Al "Pappy" Patton',
        role: 'ADA, D23 & D27 · 62-year umpire',
        est: 2001,
        story: 'Umpired the 1957 Little League World Series at first base — the first year a non-US team competed (Monterrey, Mexico) and the only perfect game ever pitched in an LLWS Championship (later inspired the 2009 film "The Perfect Game"). Founding member of the Little League World Series Umpires Alumni International. Inducted into the PA Sports Hall of Fame in 1984. Passed in 2001.'
      }
    },

    // ── Scholarship ──────────────────────────────────────────────────────
    scholarship: {
      name: 'Laura and Van Scott PA District 27 Higher Education Scholarship',
      est: 2005,
      amount: 1000,
      awardsPerYear: 2,
      eligibility: '4+ years in PA D27 LL; current HS junior/senior pursuing post-secondary OR first-year college',
      deadline: 'September 8',
      announced: 'Annual banquet (October 9)',
      about: 'Founding members of Pottstown LL. Van served as ADA under Tony Marra in District 23; when D23 split in 1993, Van became the first DA of District 27. Laura served as D27 Financial Coordinator. They stepped down from district roles in 2004.',
      recent2024: [
        { name: 'Matthew Valenti',     league: 'Berwyn-Paoli',     sport: 'Baseball' },
        { name: 'Dyson Wade Neill',    league: 'Coventry',         sport: 'Baseball' },
        { name: 'Denise Nicole Hurd',  league: 'Lower Perkiomen',  sport: 'Softball' }
      ]
    },

    // ── Firebase (placeholder — demo uses static JSON) ───────────────────
    // D27 will get its own Firebase project if/when the pitch converts.
    firebase: null,

    // ── Demo flag ────────────────────────────────────────────────────────
    demo: true,

    // ── Credit ───────────────────────────────────────────────────────────
    credit: {
      by: 'Mainline Web Design',
      byName: 'Adam Miller'
    }
  };

  if (typeof window !== 'undefined') window.LEAGUE_CONFIG = CONFIG;
  if (typeof self   !== 'undefined') self.LEAGUE_CONFIG   = CONFIG;
})();
