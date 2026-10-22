/* KSU 2026 · FKTEN Live Score — mock data.
   Everything here is SAMPLE data for the prototype. In the real system this
   comes from Firestore and is edited by the sport managers. */

const DAYS = ['2026-11-20', '2026-11-21', '2026-11-22'];

// The prototype pretends "now" is the morning of day 2 so every state shows up.
const MOCK_NOW = '2026-11-21T10:30';

// Faculty codes/names are placeholders — confirm with the organiser.
const FACULTIES = {
  FKTEN: { ms: 'Kejuruteraan & Teknologi Elektronik', en: 'Electronic Engineering & Technology', color: '#f5b301' },
  FKTE:  { ms: 'Kejuruteraan & Teknologi Elektrik',   en: 'Electrical Engineering & Technology', color: '#3a86ff' },
  FKTM:  { ms: 'Kejuruteraan & Teknologi Mekanikal',  en: 'Mechanical Engineering & Technology', color: '#e63946' },
  FKTK:  { ms: 'Kejuruteraan & Teknologi Kimia',      en: 'Chemical Engineering & Technology',   color: '#2a9d8f' },
  FKTA:  { ms: 'Kejuruteraan & Teknologi Awam',       en: 'Civil Engineering & Technology',      color: '#8d6e63' },
  FPK:   { ms: 'Perniagaan & Komunikasi',             en: 'Business & Communication',            color: '#9b5de5' },
  FKI:   { ms: 'Komputeran Pintar',                   en: 'Intelligent Computing',               color: '#00b4d8' },
};

// Dummy coordinates around the Pauh Putra campus.
const VENUES = {
  padang:     { ms: 'Padang Utama',            en: 'Main Field',            lat: 6.4612, lng: 100.3498 },
  trek:       { ms: 'Trek Olahraga',           en: 'Athletics Track',       lat: 6.4606, lng: 100.3489 },
  dewan:      { ms: 'Dewan Sukan',             en: 'Sports Hall',           lat: 6.4597, lng: 100.3512 },
  gelanggang: { ms: 'Gelanggang Serbaguna',    en: 'Multipurpose Court',    lat: 6.4590, lng: 100.3505 },
  takraw:     { ms: 'Gelanggang Sepak Takraw', en: 'Sepak Takraw Court',    lat: 6.4594, lng: 100.3520 },
  petanque:   { ms: 'Padang Petanque',         en: 'Petanque Ground',       lat: 6.4620, lng: 100.3515 },
  woodball:   { ms: 'Padang Woodball',         en: 'Woodball Course',       lat: 6.4628, lng: 100.3502 },
};

const mgr = (name) => ({ name, email: `${name.toLowerCase()}@unimap.edu.my` });

// type: 'score' = goals/points, 'sets' = sets/games, 'rank' = placing / time / distance / strokes
const SPORTS = [
  { id: 'olahraga', ms: 'Olahraga', en: 'Athletics', icon: '🏃', type: 'rank', venue: 'trek', manager: null,
    info: { ms: 'Acara balapan & padang. Pingat ikut kedudukan akhir.', en: 'Track & field events. Medals by final placing.' } },
  { id: 'bolasepak', ms: 'Bola Sepak', en: 'Football', icon: '⚽', type: 'score', venue: 'padang', manager: null,
    cfg: { range: [0, 4], inc: [1], dur: 100, draw: true, live: { ms: "Babak ke-2 · 67'", en: "2nd half · 67'" } },
    info: { ms: '11 pemain. Seri di kalah mati → sepakan penalti.', en: '11-a-side. Knockout draws go to penalties.' } },
  { id: 'ragbi', ms: 'Ragbi', en: 'Rugby', icon: '🏉', type: 'score', venue: 'padang', manager: null,
    cfg: { range: [0, 31], inc: [5, 3, 2, 1], dur: 40, draw: true, live: { ms: 'Babak ke-2', en: '2nd half' } },
    info: { ms: 'Ragbi 7 sebelah. Try 5, conversion 2, penalti 3.', en: 'Rugby sevens. Try 5, conversion 2, penalty 3.' } },
  { id: 'bolabaling-l', ms: 'Bola Baling (L)', en: 'Handball (M)', icon: '🤾', type: 'score', venue: 'dewan', manager: null,
    cfg: { range: [12, 30], inc: [1], dur: 75, draw: true, live: { ms: 'Babak ke-2 · 18:40', en: '2nd half · 18:40' } },
    info: { ms: '7 pemain termasuk penjaga gol.', en: '7 players including goalkeeper.' } },
  { id: 'bolabaling-p', ms: 'Bola Baling (P)', en: 'Handball (W)', icon: '🤾‍♀️', type: 'score', venue: 'dewan', manager: mgr('Fairul'),
    cfg: { range: [8, 24], inc: [1], dur: 75, draw: true, live: { ms: 'Babak ke-1 · 22:10', en: '1st half · 22:10' } },
    info: { ms: '7 pemain termasuk penjaga gol.', en: '7 players including goalkeeper.' } },
  { id: 'petanque-l', ms: 'Petanque (L)', en: 'Petanque (M)', icon: '⚫', type: 'sets', venue: 'petanque', manager: mgr('Ashraf'),
    cfg: { to: 13, last: 13, games: true, dur: 120 },
    info: { ms: '3 permainan: Perseorangan, Beregu, Trio. Setiap permainan hingga 13 mata.', en: '3 games: Singles, Doubles, Triples. Each game to 13 points.' } },
  { id: 'petanque-p', ms: 'Petanque (P)', en: 'Petanque (W)', icon: '⚫', type: 'sets', venue: 'petanque', manager: null,
    cfg: { to: 13, last: 13, games: true, dur: 120 },
    info: { ms: '3 permainan: Perseorangan, Beregu, Trio. Setiap permainan hingga 13 mata.', en: '3 games: Singles, Doubles, Triples. Each game to 13 points.' } },
  { id: 'sepaktakraw', ms: 'Sepak Takraw', en: 'Sepak Takraw', icon: '🦶', type: 'sets', venue: 'takraw', manager: null,
    cfg: { to: 21, last: 15, dur: 70 },
    info: { ms: 'Terbaik 3 set. Format mata ikut peraturan penganjur.', en: 'Best of 3 sets. Scoring per organiser rules.' } },
  { id: 'bolatampar-l', ms: 'Bola Tampar (L)', en: 'Volleyball (M)', icon: '🏐', type: 'sets', venue: 'dewan', manager: mgr('Faizoo'),
    cfg: { to: 25, last: 15, dur: 90 },
    info: { ms: 'Terbaik 3 set: 25 mata, set penentuan 15 mata.', en: 'Best of 3: sets to 25, deciding set to 15.' } },
  { id: 'bolatampar-p', ms: 'Bola Tampar (P)', en: 'Volleyball (W)', icon: '🏐', type: 'sets', venue: 'dewan', manager: null,
    cfg: { to: 25, last: 15, dur: 90 },
    info: { ms: 'Terbaik 3 set: 25 mata, set penentuan 15 mata.', en: 'Best of 3: sets to 25, deciding set to 15.' } },
  { id: 'bolakeranjang', ms: 'Bola Keranjang', en: 'Basketball', icon: '🏀', type: 'score', venue: 'gelanggang', manager: mgr('Syahril'),
    cfg: { range: [28, 70], inc: [1, 2, 3], dur: 80, draw: false, live: { ms: 'Suku ke-3 · 04:12', en: 'Q3 · 04:12' } },
    info: { ms: '4 suku masa. 5 pemain di gelanggang.', en: '4 quarters. 5 players on court.' } },
  { id: 'bolajaring', ms: 'Bola Jaring', en: 'Netball', icon: '🥅', type: 'score', venue: 'gelanggang', manager: mgr('Suriati'),
    cfg: { range: [12, 40], inc: [1], dur: 70, draw: true, live: { ms: 'Suku ke-3', en: 'Q3' } },
    info: { ms: '4 suku masa. 7 pemain.', en: '4 quarters. 7 players.' } },
  { id: 'woodball', ms: 'Woodball', en: 'Woodball', icon: '⛳', type: 'rank', venue: 'woodball', manager: mgr('Zamri'),
    info: { ms: 'Stroke play — jumlah pukulan paling sedikit menang.', en: 'Stroke play — fewest strokes wins.' } },
];

const PETANQUE_GAMES = [
  { ms: 'Perseorangan', en: 'Singles' },
  { ms: 'Beregu', en: 'Doubles' },
  { ms: 'Trio', en: 'Triples' },
];

// unit: s = seconds, min = m:ss, m = metres, str = strokes. step is per placing.
const RANK_EVENTS = [
  { id: 'ol-100l',  sport: 'olahraga', ms: '100m Lelaki',            en: '100m Men',          day: 0, time: '09:00', dur: 30,  unit: 's',   base: 11.2, step: 0.22 },
  { id: 'ol-100p',  sport: 'olahraga', ms: '100m Wanita',            en: '100m Women',        day: 0, time: '09:30', dur: 30,  unit: 's',   base: 12.9, step: 0.3 },
  { id: 'ol-lj',    sport: 'olahraga', ms: 'Lompat Jauh Lelaki',     en: 'Long Jump Men',     day: 0, time: '10:00', dur: 90,  unit: 'm',   base: 6.6,  step: -0.18 },
  { id: 'ol-1500',  sport: 'olahraga', ms: '1500m Lelaki',           en: '1500m Men',         day: 0, time: '16:00', dur: 20,  unit: 'min', base: 255,  step: 4 },
  { id: 'ol-400l',  sport: 'olahraga', ms: '400m Lelaki',            en: '400m Men',          day: 1, time: '08:30', dur: 30,  unit: 's',   base: 51.5, step: 0.8 },
  { id: 'ol-shot',  sport: 'olahraga', ms: 'Lontar Peluru Wanita',   en: 'Shot Put Women',    day: 1, time: '10:00', dur: 90,  unit: 'm',   base: 10.4, step: -0.4,
    liveNote: { ms: 'Lontaran ke-4 daripada 6', en: 'Throw 4 of 6' } },
  { id: 'ol-200p',  sport: 'olahraga', ms: '200m Wanita',            en: '200m Women',        day: 1, time: '11:30', dur: 30,  unit: 's',   base: 26.8, step: 0.5 },
  { id: 'ol-4x100l',sport: 'olahraga', ms: '4x100m Lelaki',          en: '4x100m Men',        day: 1, time: '16:30', dur: 30,  unit: 's',   base: 44.8, step: 0.6, relay: true },
  { id: 'ol-4x100p',sport: 'olahraga', ms: '4x100m Wanita',          en: '4x100m Women',      day: 2, time: '09:00', dur: 30,  unit: 's',   base: 52.3, step: 0.7, relay: true },
  { id: 'ol-4x400l',sport: 'olahraga', ms: '4x400m Lelaki',          en: '4x400m Men',        day: 2, time: '10:30', dur: 30,  unit: 'min', base: 212,  step: 3,   relay: true },
  { id: 'wb-ind-l', sport: 'woodball', ms: 'Individu Lelaki',        en: 'Individual Men',    day: 0, time: '14:00', dur: 180, unit: 'str', base: 38,   step: 2 },
  { id: 'wb-ind-p', sport: 'woodball', ms: 'Individu Wanita',        en: 'Individual Women',  day: 1, time: '08:00', dur: 180, unit: 'str', base: 24,   step: 2,
    liveNote: { ms: 'Selepas lubang 9', en: 'After fairway 9' } },
  { id: 'wb-team-l',sport: 'woodball', ms: 'Beregu Lelaki',          en: 'Team Men',          day: 2, time: '08:30', dur: 180, unit: 'str', base: 152,  step: 5,   relay: true },
  { id: 'wb-team-p',sport: 'woodball', ms: 'Beregu Wanita',          en: 'Team Women',        day: 2, time: '08:30', dur: 180, unit: 'str', base: 168,  step: 6,   relay: true },
];

const NAME_POOL = [
  'Ahmad Faris', 'Nurul Aina', 'Muhammad Haziq', 'Siti Hajar', 'Lim Wei Jie', 'Kavin Raj',
  'Aiman Hakimi', 'Nur Syafiqah', 'Tan Mei Ling', 'Harith Danial', 'Arvind Kumar', 'Farah Nabila',
  'Izzat Rahman', 'Amirul Asyraf', 'Nadia Sofea', 'Daniel Ong', 'Hafiz Zulkifli', 'Aqilah Husna',
  'Syazwan Idris', 'Priya Devi', 'Khairul Anwar', 'Ain Maisarah', 'Wong Jia Hui', 'Firdaus Hakim',
];

// Demo logins. Real system: Google sign-in restricted to @unimap.edu.my.
const DEMO_ACCOUNTS = [
  { name: 'Urusetia FKTEN', email: 'urusetia.fkten@unimap.edu.my', role: 'admin', sports: '*' },
  ...SPORTS.filter(s => s.manager).map(s => ({ ...s.manager, role: 'manager', sports: [s.id] })),
];

function rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtMark(unit, v) {
  if (unit === 's') return v.toFixed(2);
  if (unit === 'min') return `${Math.floor(v / 60)}:${(v % 60).toFixed(2).padStart(5, '0')}`;
  if (unit === 'm') return `${v.toFixed(2)} m`;
  return String(Math.round(v));
}

function seedState() {
  const R = rng(2026);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const now = new Date(MOCK_NOW);
  const hh = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const at = (day, time) => `${DAYS[day]}T${time}`;
  const statusOf = (start, dur) => {
    const s = new Date(start), e = new Date(s.getTime() + dur * 60000);
    return now < s ? 'upcoming' : now < e ? 'live' : 'finished';
  };

  const matches = [], events = [], rosters = {};
  const others = Object.keys(FACULTIES).filter(f => f !== 'FKTEN');

  SPORTS.forEach((sp, si) => {
    const nums = shuffle([...Array(30)].map((_, i) => i + 1));
    rosters[sp.id] = shuffle(NAME_POOL).slice(0, ri(6, 10)).map((name, k) => ({ no: nums[k], name }));
  });

  SPORTS.forEach((sp, si) => {
    if (sp.type === 'rank') return;
    const cfg = sp.cfg;

    const fill = (m) => {
      const fk = m.a === 'FKTEN' ? 1 : m.b === 'FKTEN' ? -1 : 0;
      const pWin = fk === 1 ? 0.6 : fk === -1 ? 0.25 : 0.45;
      const pDraw = cfg.draw ? 0.15 : 0;
      const r = R();
      const o = r < pWin ? 1 : r < pWin + pDraw ? 0 : -1;   // outcome for side a
      const live = m.status === 'live';

      if (sp.type === 'score') {
        let x = ri(...cfg.range), y = ri(...cfg.range);
        if (o === 0) y = x;
        else { if (x === y) x++; if ((x > y) !== (o === 1)) [x, y] = [y, x]; }
        if (live) { x = Math.round(x * 0.6); y = Math.round(y * 0.6); m.note = cfg.live; }
        m.score = [x, y];
        return;
      }
      const w = o === 1 ? 0 : o === -1 ? 1 : ri(0, 1);
      const order = R() < 0.4 ? (R() < 0.5 ? [w, 1 - w, w] : [1 - w, w, w]) : [w, w];
      const setScore = (winner, idx) => {
        const to = idx === 2 ? cfg.last : cfg.to;
        const lose = cfg.games ? ri(2, 11) : ri(Math.max(3, to - 12), to - 2);
        return winner === 0 ? [to, lose] : [lose, to];
      };
      if (live) {
        const cur = cfg.games ? [ri(3, 9), ri(3, 9)] : [ri(8, cfg.to - 5), ri(8, cfg.to - 5)];
        m.sets = [setScore(order[0], 0), cur];
      } else {
        m.sets = order.map(setScore);
      }
    };

    const rot = others.slice(si % 6).concat(others.slice(0, si % 6));
    const A = ['FKTEN', ...rot.slice(0, 3)];
    const rounds = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
    const slots = [[0, 8 + (si % 5)], [0, 14 + (si % 4)], [1, 8 + (si % 4)]];

    const add = (stage, a, b, start) => {
      const m = { id: `${sp.id}-${matches.length}`, sport: sp.id, stage, a, b, start, venue: sp.venue,
                  status: statusOf(start, cfg.dur), note: null };
      if (sp.type === 'score') m.score = [0, 0]; else m.sets = [];
      if (m.status !== 'upcoming') fill(m);
      matches.push(m);
    };

    rounds.forEach((pairs, r) => pairs.forEach(([x, y], k) => {
      add('grpA', A[x], A[y], at(slots[r][0], hh(slots[r][1] + k * 0.5)));
    }));
    add('sf1', '@A1', '@B2', at(1, '15:00'));
    add('sf2', '@B1', '@A2', at(1, '16:30'));
    add('third', '@L:sf1', '@L:sf2', at(2, '09:00'));
    add('final', '@W:sf1', '@W:sf2', at(2, hh(10 + (si % 4))));
  });

  RANK_EVENTS.forEach(ev => {
    const start = at(ev.day, ev.time);
    const status = statusOf(start, ev.dur);
    const roster = rosters[ev.sport];
    const fkName = () => ev.relay ? { ms: 'Pasukan FKTEN', en: 'FKTEN Team' } : roster[ri(0, roster.length - 1)].name;
    const e = { id: ev.id, sport: ev.sport, ms: ev.ms, en: ev.en, start, venue: SPORTS.find(s => s.id === ev.sport).venue,
                status, unit: ev.unit, results: [], entries: [], note: null };

    if (status === 'upcoming') {
      e.entries = ev.relay ? [fkName()] : shuffle(roster).slice(0, ri(1, 2)).map(r => r.name);
    } else {
      const facs = shuffle(others).slice(0, 5);
      const fkPos = R() < 0.6 ? ri(0, 2) : ri(3, 5);
      facs.splice(fkPos, 0, 'FKTEN');
      let v = ev.base;
      e.results = facs.map((fac, i) => {
        if (i) v += ev.step * (0.6 + R() * 0.8);
        return { pos: i + 1, fac, name: fac === 'FKTEN' ? fkName() : '', mark: fmtMark(ev.unit, v) };
      });
      if (status === 'live') e.note = ev.liveNote || { ms: 'Keputusan sementara', en: 'Provisional' };
    }
    events.push(e);
  });

  return { matches, events, rosters, log: [] };
}
