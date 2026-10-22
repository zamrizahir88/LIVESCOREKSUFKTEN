/* KSU 2026 · FKTEN Live Score — mock prototype (no backend yet).
   State lives in localStorage, so a second browser tab updates "live" when an
   admin edits a score. The real version swaps this for Firestore onSnapshot(). */

const STATE_KEY = 'ksu-fkten-mock-v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

let lang = store.get('ksu-lang') || 'ms';
let user = store.get('ksu-user');
let state = store.get(STATE_KEY) || seedState();
let fktenOnly = true;
let adminSport = null;
let adminPick = null;

const SPORT = Object.fromEntries(SPORTS.map(s => [s.id, s]));
const $app = document.getElementById('app');

const tr = (k) => T[lang][k] ?? T.ms[k] ?? k;
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.ms);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const timeOf = (iso) => iso.slice(11, 16);
const dayOf = (iso) => DAYS.indexOf(iso.slice(0, 10));
const locale = () => (lang === 'ms' ? 'ms-MY' : 'en-GB');
const dayLabel = (i, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(`${DAYS[i]}T00:00`).toLocaleDateString(locale(), opts);
const mapsUrl = (v) => `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`;
const facColor = (code) => FACULTIES[code]?.color || '#c5cbd6';

function save() { store.set(STATE_KEY, state); }

/* ---------- match logic ---------- */

function totals(m) {
  if (m.score) return m.score;
  const done = m.status === 'live' ? m.sets.slice(0, -1) : m.sets;
  return done.reduce((acc, [x, y]) => { if (x > y) acc[0]++; else if (y > x) acc[1]++; return acc; }, [0, 0]);
}

function winnerIdx(m) {
  if (m.status !== 'finished') return null;
  const [x, y] = totals(m);
  return x > y ? 0 : y > x ? 1 : null;
}

function standings(sid, group) {
  const ms = state.matches.filter(m => m.sport === sid && m.stage === `grp${group}`);
  const rows = {};
  ms.forEach(m => [m.a, m.b].forEach(t => { rows[t] ??= { team: t, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 }; }));
  ms.filter(m => m.status === 'finished').forEach(m => {
    const [x, y] = totals(m), A = rows[m.a], B = rows[m.b];
    A.p++; B.p++; A.f += x; A.a += y; B.f += y; B.a += x;
    if (x > y) { A.w++; B.l++; A.pts += 3; }
    else if (y > x) { B.w++; A.l++; B.pts += 3; }
    else { A.d++; B.d++; A.pts++; B.pts++; }
  });
  const sorted = Object.values(rows).sort((p, q) => q.pts - p.pts || (q.f - q.a) - (p.f - p.a) || q.f - p.f);
  return { rows: sorted, complete: ms.length > 0 && ms.every(m => m.status === 'finished') };
}

function resolveTeam(sid, code) {
  if (!code.startsWith('@')) return { code, label: code };
  const ph = code.slice(1);
  if (/^[AB][12]$/.test(ph)) {
    const g = standings(sid, ph[0]);
    const row = g.complete && g.rows[+ph[1] - 1];
    if (row) return { code: row.team, label: row.team };
    return { code: null, label: tr(ph[1] === '1' ? 'winnerGroup' : 'runnerGroup').replace('{g}', ph[0]) };
  }
  const [kind, stage] = ph.split(':');
  const m = state.matches.find(x => x.sport === sid && x.stage === stage);
  const w = m && winnerIdx(m);
  if (w != null) {
    const team = teamsOf(m)[kind === 'W' ? w : 1 - w];
    if (team.code) return team;
  }
  return { code: null, label: `${tr(kind === 'W' ? 'winnerOf' : 'loserOf')} ${tr(stage)}` };
}

const teamsOf = (m) => [resolveTeam(m.sport, m.a), resolveTeam(m.sport, m.b)];
const isFk = (m) => teamsOf(m).some(t => t.code === 'FKTEN');
const isKO = (m) => !m.stage.startsWith('grp');

function setNames(m, i) {
  const sp = SPORT[m.sport];
  return sp.cfg.games ? L(PETANQUE_GAMES[i] || { ms: `${tr('game')} ${i + 1}`, en: `${tr('game')} ${i + 1}` }) : `${tr('set')} ${i + 1}`;
}

function setsLine(m) {
  return m.sets.map(([x, y], i) => {
    const cur = m.status === 'live' && i === m.sets.length - 1;
    return `<span class="${cur ? 'cur' : ''}">${x}-${y}</span>`;
  }).join('');
}

function record() {
  const r = { p: 0, w: 0, d: 0, l: 0 };
  state.matches.filter(m => m.status === 'finished').forEach(m => {
    const [A, B] = teamsOf(m);
    const side = A.code === 'FKTEN' ? 0 : B.code === 'FKTEN' ? 1 : -1;
    if (side < 0) return;
    r.p++;
    const w = winnerIdx(m);
    if (w == null) r.d++; else if (w === side) r.w++; else r.l++;
  });
  return r;
}

function medals() {
  const md = { g: 0, s: 0, b: 0 };
  state.matches.filter(m => m.status === 'finished' && (m.stage === 'final' || m.stage === 'third')).forEach(m => {
    const w = winnerIdx(m); if (w == null) return;
    const t = teamsOf(m);
    if (m.stage === 'final') { if (t[w].code === 'FKTEN') md.g++; if (t[1 - w].code === 'FKTEN') md.s++; }
    else if (t[w].code === 'FKTEN') md.b++;
  });
  state.events.filter(e => e.status === 'finished').forEach(e => e.results.forEach(r => {
    if (r.fac !== 'FKTEN') return;
    if (r.pos === 1) md.g++; else if (r.pos === 2) md.s++; else if (r.pos === 3) md.b++;
  }));
  return md;
}

function items({ fkOnly = true } = {}) {
  const ms = state.matches.filter(m => !fkOnly || isFk(m)).map(m => ({ kind: 'm', ...m }));
  const es = state.events.map(e => ({ kind: 'e', ...e }));
  return [...ms, ...es].sort((p, q) => p.start.localeCompare(q.start));
}

/* ---------- small components ---------- */

const icons = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sports: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  venues: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  admin: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg>`;

function chip(x) {
  if (x.status === 'live') return `<span class="chip live"><i></i>${tr('live')}</span>`;
  if (x.status === 'finished') return `<span class="chip done">${tr('ft')}</span>`;
  return `<span class="chip soon">${timeOf(x.start)}</span>`;
}

function teamRow(tm, score, win) {
  return `<div class="team ${tm.code === 'FKTEN' ? 'is-fk' : ''} ${win ? 'is-win' : ''}">
    <span class="dot" style="--c:${facColor(tm.code)}"></span>
    <span class="tname">${esc(tm.label)}</span>
    <span class="tscore">${score ?? ''}</span></div>`;
}

function matchCard(m) {
  const sp = SPORT[m.sport], [A, B] = teamsOf(m), tot = totals(m), w = winnerIdx(m);
  const show = m.status !== 'upcoming';
  return `<a class="card match ${m.status}" href="#/match/${m.id}">
    <div class="meta"><span>${sp.icon} ${esc(L(sp))} · ${tr(m.stage)}</span>${chip(m)}</div>
    ${teamRow(A, show ? tot[0] : null, w === 0)}
    ${teamRow(B, show ? tot[1] : null, w === 1)}
    ${m.sets && m.sets.length ? `<div class="sets">${setsLine(m)}</div>` : ''}
    <div class="foot"><span>${dayLabel(dayOf(m.start))} · ${timeOf(m.start)}</span><span>📍 ${esc(L(VENUES[m.venue]))}</span></div>
    ${m.status === 'live' && m.note ? `<div class="live-note">${esc(L(m.note))}</div>` : ''}
  </a>`;
}

const medalIcon = (pos) => ['🥇', '🥈', '🥉'][pos - 1] || `#${pos}`;

function eventCard(e) {
  const sp = SPORT[e.sport];
  const fk = e.results.filter(r => r.fac === 'FKTEN').sort((a, b) => a.pos - b.pos)[0];
  let body;
  if (fk) {
    body = `<div class="ev-fk"><span class="medal">${medalIcon(fk.pos)}</span>
      <span class="tname">${esc(L(fk.name))}</span><span class="tscore sm">${esc(fk.mark)}</span></div>
      <div class="podium">${e.results.slice(0, 3).map(r => `<span><b>${r.pos}</b> ${r.fac}</span>`).join('')}</div>`;
  } else {
    body = `<div class="ev-entries">${tr('entries')}: <b>${e.entries.map(n => esc(L(n))).join(', ') || '—'}</b></div>`;
  }
  return `<a class="card match ev ${e.status}" href="#/event/${e.id}">
    <div class="meta"><span>${sp.icon} ${esc(L(sp))}</span>${chip(e)}</div>
    <div class="ev-name">${esc(L(e))}</div>
    ${body}
    <div class="foot"><span>${dayLabel(dayOf(e.start))} · ${timeOf(e.start)}</span><span>📍 ${esc(L(VENUES[e.venue]))}</span></div>
    ${e.status === 'live' && e.note ? `<div class="live-note">${esc(L(e.note))}</div>` : ''}
  </a>`;
}

const card = (x) => (x.kind === 'e' || x.results ? eventCard(x) : matchCard(x));
const grid = (list, empty) => (list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<p class="empty">${empty}</p>`);

function sportTile(sp) {
  const live = items().filter(x => x.sport === sp.id && x.status === 'live').length;
  return `<a class="tile" href="#/sport/${sp.id}">
    <span class="t-ico">${sp.icon}</span>
    <span class="t-name">${esc(L(sp))}</span>
    <span class="t-mgr">${sp.manager ? esc(sp.manager.name) : `<em>${tr('tba')}</em>`}</span>
    ${live ? `<span class="chip live sm"><i></i>${live}</span>` : ''}
  </a>`;
}

/* ---------- views ---------- */

function viewHome() {
  const all = items(), r = record(), md = medals();
  const live = all.filter(x => x.status === 'live');
  const next = all.filter(x => x.status === 'upcoming').slice(0, 6);
  const recent = all.filter(x => x.status === 'finished').slice(-6).reverse();
  return `
  <section class="hero">
    <div class="hero-top"><span class="pill">KSU 2026 · UniMAP</span><span>20–22 Nov 2026</span></div>
    <h1>FKTEN <span>Live Score</span></h1>
    <p>${tr('heroSub')}</p>
    <div class="stats">
      <div><b>${r.p}</b><small>${tr('played')}</small></div>
      <div><b>${r.w}</b><small>${tr('won')}</small></div>
      <div><b>${r.d}</b><small>${tr('drew')}</small></div>
      <div><b>${r.l}</b><small>${tr('lost')}</small></div>
      <div class="med"><b>🥇${md.g} 🥈${md.s} 🥉${md.b}</b><small>${tr('medals')}</small></div>
    </div>
  </section>
  <section><h2 class="sec"><span class="pulse"></span>${tr('liveNow')}</h2>${grid(live, tr('noLive'))}</section>
  <section><h2 class="sec">${tr('upNext')}</h2>${grid(next, tr('none'))}</section>
  <section><h2 class="sec">${tr('recent')}</h2>${grid(recent, tr('none'))}</section>
  <section><h2 class="sec">${tr('allSports')}</h2><div class="tiles">${SPORTS.map(sportTile).join('')}</div></section>`;
}

function dayTabs(base, cur) {
  return `<div class="seg">${DAYS.map((_, i) =>
    `<a href="#/${base}/${i}" class="${i === cur ? 'on' : ''}">${dayLabel(i)}</a>`).join('')}</div>`;
}

function viewSchedule(day) {
  const list = items({ fkOnly: fktenOnly }).filter(x => dayOf(x.start) === day);
  return `
  <div class="page-head"><h1>${tr('schedule')}</h1>
    <button class="toggle ${fktenOnly ? 'on' : ''}" data-action="toggle-fk">${fktenOnly ? '✓ ' : ''}${tr('fktenOnly')}</button></div>
  ${dayTabs('schedule', day)}
  ${grid(list, tr('none'))}`;
}

function viewSports() {
  return `<div class="page-head"><h1>${tr('sports')}</h1></div><div class="tiles">${SPORTS.map(sportTile).join('')}</div>`;
}

function standingsTable(sid) {
  const g = standings(sid, 'A');
  return `<div class="card table-card"><h3>${tr('grpA')}</h3>
    <table class="tbl"><thead><tr><th>#</th><th class="l">${tr('colTeam')}</th><th>${tr('colP')}</th><th>${tr('colW')}</th>
      <th>${tr('colD')}</th><th>${tr('colL')}</th><th>${tr('colDiff')}</th><th>${tr('colPts')}</th></tr></thead>
    <tbody>${g.rows.map((r, i) => `<tr class="${r.team === 'FKTEN' ? 'is-fk' : ''} ${i < 2 ? 'q' : ''}">
      <td>${i + 1}</td><td class="l"><span class="dot" style="--c:${facColor(r.team)}"></span>${r.team}</td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.f - r.a > 0 ? '+' : ''}${r.f - r.a}</td><td><b>${r.pts}</b></td></tr>`).join('')}
    </tbody></table>
    <p class="small">${tr('tableNote')}</p></div>
    <p class="small muted">${tr('grpBNote')}</p>`;
}

function miniMatch(m) {
  if (!m) return '';
  const [A, B] = teamsOf(m), tot = totals(m), w = winnerIdx(m), show = m.status !== 'upcoming';
  return `<a class="mini ${m.status}" href="#/match/${m.id}">
    <div class="mini-h"><span>${tr(m.stage)}</span>${chip(m)}</div>
    ${teamRow(A, show ? tot[0] : null, w === 0)}${teamRow(B, show ? tot[1] : null, w === 1)}</a>`;
}

function bracket(sid) {
  const get = (st) => state.matches.find(m => m.sport === sid && m.stage === st);
  return `<div class="bracket">
    <div class="b-col"><h4>${tr('sf1').replace(/ 1$/, '')}</h4>${miniMatch(get('sf1'))}${miniMatch(get('sf2'))}</div>
    <div class="b-col"><h4>${tr('final')}</h4>${miniMatch(get('final'))}<h4>${tr('third')}</h4>${miniMatch(get('third'))}</div>
  </div>`;
}

function viewSport(id, tab) {
  const sp = SPORT[id];
  if (!sp) return viewSports();
  const v = VENUES[sp.venue];
  const tabs = sp.type === 'rank' ? ['events', 'team'] : ['matches', 'standings', 'bracket', 'team'];
  tab = tabs.includes(tab) ? tab : tabs[0];
  let body;
  if (tab === 'events') body = grid(state.events.filter(e => e.sport === id).map(e => ({ kind: 'e', ...e })), tr('none'));
  else if (tab === 'matches') body = grid(state.matches.filter(m => m.sport === id).map(m => ({ kind: 'm', ...m })), tr('none'));
  else if (tab === 'standings') body = standingsTable(id);
  else if (tab === 'bracket') body = bracket(id);
  else body = `<div class="card"><ul class="roster">${(state.rosters[id] || []).map(p =>
      `<li><span class="no">${p.no}</span>${esc(p.name)}</li>`).join('')}</ul></div>`;
  const typeKey = { score: 'typeScore', sets: 'typeSets', rank: 'typeRank' }[sp.type];
  return `
  <a class="back" href="#/sports">${tr('back')}</a>
  <section class="sport-head card">
    <div class="sh-top"><span class="sh-ico">${sp.icon}</span>
      <div><h1>${esc(L(sp))}</h1><span class="tag">${tr(typeKey)}</span></div></div>
    <dl class="facts">
      <div><dt>${tr('manager')}</dt><dd>${sp.manager ? esc(sp.manager.name) : `<em>${tr('tba')}</em>`}</dd></div>
      <div><dt>${tr('where')}</dt><dd>${esc(L(v))} <a class="btn-sm" target="_blank" rel="noopener" href="${mapsUrl(v)}">${tr('openMaps')} ↗</a></dd></div>
      <div><dt>${tr('format')}</dt><dd>${tr(sp.type === 'rank' ? 'fmtRank' : 'fmtTeam')} ${esc(L(sp.info))}</dd></div>
    </dl>
  </section>
  <div class="seg">${tabs.map(t => `<a href="#/sport/${id}/${t}" class="${t === tab ? 'on' : ''}">${tr(t)}</a>`).join('')}</div>
  ${body}`;
}

function updatedLine(x) {
  if (!x.updatedAt) return '';
  const t = new Date(x.updatedAt).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return `<p class="small muted">${tr('updated')} ${t} · ${esc(x.updatedBy)}</p>`;
}

function viewMatch(id) {
  const m = state.matches.find(x => x.id === id);
  if (!m) return viewHome();
  const sp = SPORT[m.sport], [A, B] = teamsOf(m), tot = totals(m), w = winnerIdx(m), v = VENUES[m.venue];
  const side = (tm, i) => `<div class="sb-team ${tm.code === 'FKTEN' ? 'is-fk' : ''} ${w === i ? 'is-win' : ''}">
    <span class="badge" style="--c:${facColor(tm.code)}">${esc(tm.code || '?')}</span>
    <span class="sb-name">${esc(tm.code ? L(FACULTIES[tm.code]) : tm.label)}</span></div>`;
  return `
  <a class="back" href="#/sport/${m.sport}">${tr('back')}</a>
  <section class="scoreboard ${m.status}">
    <div class="sb-meta">${sp.icon} ${esc(L(sp))} · ${tr(m.stage)} ${chip(m)}</div>
    <div class="sb-main">
      ${side(A, 0)}
      <div class="sb-score">${m.status === 'upcoming' ? `<span class="vs">${timeOf(m.start)}</span>` : `${tot[0]}<span>–</span>${tot[1]}`}</div>
      ${side(B, 1)}
    </div>
    ${m.status === 'live' && m.note ? `<div class="sb-note">${esc(L(m.note))}</div>` : ''}
  </section>
  ${m.sets && m.sets.length ? `<div class="card"><table class="tbl sets-tbl"><thead><tr><th class="l"></th>
      ${m.sets.map((_, i) => `<th>${esc(setNames(m, i))}${m.status === 'live' && i === m.sets.length - 1 ? ` <small>(${tr('current')})</small>` : ''}</th>`).join('')}</tr></thead>
    <tbody>${[A, B].map((tm, k) => `<tr class="${tm.code === 'FKTEN' ? 'is-fk' : ''}"><td class="l">${esc(tm.label)}</td>
      ${m.sets.map(s => `<td class="${s[k] > s[1 - k] ? 'win' : ''}">${s[k]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
  <div class="card"><dl class="facts">
    <div><dt>${tr('when')}</dt><dd>${dayLabel(dayOf(m.start), { weekday: 'long', day: 'numeric', month: 'long' })}, ${timeOf(m.start)}</dd></div>
    <div><dt>${tr('where')}</dt><dd>${esc(L(v))} <a class="btn-sm" target="_blank" rel="noopener" href="${mapsUrl(v)}">${tr('openMaps')} ↗</a></dd></div>
    <div><dt>${tr('manager')}</dt><dd>${sp.manager ? esc(sp.manager.name) : `<em>${tr('tba')}</em>`}</dd></div>
  </dl>${updatedLine(m)}</div>`;
}

function viewEvent(id) {
  const e = state.events.find(x => x.id === id);
  if (!e) return viewHome();
  const sp = SPORT[e.sport], v = VENUES[e.venue];
  const markHead = e.unit === 'str' ? tr('strokes') : tr('mark');
  const res = e.results.length ? `<div class="card table-card"><table class="tbl"><thead><tr><th>${tr('place')}</th>
      <th class="l">${tr('faculty')}</th><th class="l">${tr('athlete')}</th><th>${markHead}</th></tr></thead>
    <tbody>${e.results.map(r => `<tr class="${r.fac === 'FKTEN' ? 'is-fk' : ''}"><td>${medalIcon(r.pos)}</td>
      <td class="l"><span class="dot" style="--c:${facColor(r.fac)}"></span>${r.fac}</td><td class="l">${esc(L(r.name)) || '—'}</td><td>${esc(r.mark)}</td></tr>`).join('')}
    </tbody></table>${e.status === 'live' ? `<p class="small">${tr('provisional')} · ${esc(L(e.note))}</p>` : ''}</div>`
    : `<div class="card"><p>${tr('entries')}: <b>${e.entries.map(n => esc(L(n))).join(', ') || '—'}</b></p></div>`;
  return `
  <a class="back" href="#/sport/${e.sport}">${tr('back')}</a>
  <section class="scoreboard ${e.status}">
    <div class="sb-meta">${sp.icon} ${esc(L(sp))} ${chip(e)}</div>
    <div class="sb-event">${esc(L(e))}</div>
  </section>
  ${res}
  <div class="card"><dl class="facts">
    <div><dt>${tr('when')}</dt><dd>${dayLabel(dayOf(e.start), { weekday: 'long', day: 'numeric', month: 'long' })}, ${timeOf(e.start)}</dd></div>
    <div><dt>${tr('where')}</dt><dd>${esc(L(v))} <a class="btn-sm" target="_blank" rel="noopener" href="${mapsUrl(v)}">${tr('openMaps')} ↗</a></dd></div>
  </dl>${updatedLine(e)}</div>`;
}

function viewVenues() {
  const lats = Object.values(VENUES).map(v => v.lat), lngs = Object.values(VENUES).map(v => v.lng);
  const bbox = [Math.min(...lngs) - 0.003, Math.min(...lats) - 0.002, Math.max(...lngs) + 0.003, Math.max(...lats) + 0.002].join(',');
  return `
  <div class="page-head"><h1>${tr('venues')}</h1></div>
  <p class="small muted">${tr('venuesSub')}</p>
  <div class="map card"><iframe title="map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik"></iframe></div>
  <div class="grid">${Object.entries(VENUES).map(([k, v]) => {
    const sps = SPORTS.filter(s => s.venue === k);
    return `<div class="card venue"><h3>📍 ${esc(L(v))}</h3>
      <div class="v-sports">${sps.map(s => `<a href="#/sport/${s.id}">${s.icon} ${esc(L(s))}</a>`).join('')}</div>
      <a class="btn" target="_blank" rel="noopener" href="${mapsUrl(v)}">${tr('openMaps')} ↗</a></div>`;
  }).join('')}</div>`;
}

/* ---------- admin ---------- */

function allowedSports() {
  if (!user) return [];
  return user.sports === '*' ? SPORTS : SPORTS.filter(s => user.sports.includes(s.id));
}

function viewLogin() {
  return `<div class="login card">
    <h1>${tr('loginTitle')}</h1>
    <button class="btn google" disabled><span>G</span>${tr('googleBtn')}</button>
    <p class="small muted">${tr('loginSub')}</p>
    <div class="accounts">${DEMO_ACCOUNTS.map((a, i) => `<button class="acct" data-action="login" data-i="${i}">
      <b>${esc(a.name)}</b><small>${esc(a.email)}</small>
      <span>${a.role === 'admin' ? tr('roleAdmin') : a.sports.map(s => L(SPORT[s])).join(', ')}</span></button>`).join('')}</div>
  </div>`;
}

function adminItemRow(x) {
  const isM = !!x.stage;
  let label;
  if (isM) { const [A, B] = teamsOf(x); const tt = totals(x); label = `${tr(x.stage)} · ${esc(A.label)} ${x.status === 'upcoming' ? 'vs' : `${tt[0]}–${tt[1]}`} ${esc(B.label)}`; }
  else label = esc(L(x));
  return `<button class="arow ${adminPick === x.id ? 'on' : ''} ${x.status}" data-action="pick" data-id="${x.id}">
    <span class="when">${dayLabel(dayOf(x.start))}<br>${timeOf(x.start)}</span><span class="what">${label}</span>${chip(x)}</button>`;
}

function statusButtons(x) {
  return `<div class="statusctl">${['upcoming', 'live', 'finished'].map(s =>
    `<button class="${x.status === s ? 'on ' + s : ''}" data-action="status" data-v="${s}">${tr(s === 'finished' ? 'ft' : s)}</button>`).join('')}</div>`;
}

function teamPicker(m, key) {
  const cur = m[key];
  if (!isKO(m)) return `<div class="nm">${esc(cur)}</div>`;
  const opts = [`<option value="${esc(cur)}">${esc(resolveTeam(m.sport, cur).label)}</option>`,
    ...Object.keys(FACULTIES).filter(f => f !== cur).map(f => `<option value="${f}">${f}</option>`)];
  if (cur !== m[`_${key}`] && m[`_${key}`]) opts.push(`<option value="${esc(m[`_${key}`])}">↺ ${esc(m[`_${key}`])}</option>`);
  return `<select class="nm" data-field="team" data-key="${key}">${opts.join('')}</select>`;
}

function panelMatch(m) {
  const sp = SPORT[m.sport];
  let ctl;
  if (m.score) {
    ctl = `<div class="scorectl">${[0, 1].map(i => `<div class="side">
      ${teamPicker(m, i ? 'b' : 'a')}
      <div class="big">${m.score[i]}</div>
      <div class="btns">${sp.cfg.inc.map(n => `<button data-action="inc" data-side="${i}" data-n="${n}">+${n}</button>`).join('')}
        <button class="minus" data-action="inc" data-side="${i}" data-n="-1">−1</button></div></div>`).join('')}</div>`;
  } else {
    const [A, B] = teamsOf(m);
    ctl = `<div class="scorectl">${[0, 1].map(i => `<div class="side">${teamPicker(m, i ? 'b' : 'a')}
      <div class="big">${totals(m)[i]}</div></div>`).join('')}</div>
      <div class="setlist">${m.sets.map((s, si) => {
        const last = si === m.sets.length - 1;
        return `<div class="setrow ${last ? 'cur' : ''}"><span class="sl">${esc(setNames(m, si))}</span>
          ${[0, 1].map(i => `<span class="sv">${last ? `<button data-action="setinc" data-side="${i}" data-n="-1">−</button>` : ''}
            <b>${s[i]}</b>${last ? `<button data-action="setinc" data-side="${i}" data-n="1">+</button>` : ''}</span>`).join('<i>:</i>')}</div>`;
      }).join('') || `<p class="small muted">${esc(A.label)} vs ${esc(B.label)}</p>`}
      <div class="row-btns"><button class="btn" data-action="newset">${tr('newSet')}</button>
      ${m.sets.length ? `<button class="btn ghost" data-action="delset">${tr('delSet')}</button>` : ''}</div></div>`;
  }
  return `${ctl}${statusButtons(m)}
    <label class="field">${tr('note')}<input data-field="note" value="${esc(typeof m.note === 'string' ? m.note : L(m.note))}"></label>`;
}

function panelEvent(e) {
  return `<div class="card table-card"><table class="tbl edit"><thead><tr><th>${tr('place')}</th><th>${tr('faculty')}</th>
    <th>${tr('athlete')}</th><th>${e.unit === 'str' ? tr('strokes') : tr('mark')}</th><th></th></tr></thead><tbody>
    ${e.results.map((r, i) => `<tr><td><input type="number" min="1" data-field="res" data-i="${i}" data-k="pos" value="${r.pos}"></td>
      <td><select data-field="res" data-i="${i}" data-k="fac">${Object.keys(FACULTIES).map(f => `<option ${f === r.fac ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
      <td><input data-field="res" data-i="${i}" data-k="name" value="${esc(L(r.name))}"></td>
      <td><input data-field="res" data-i="${i}" data-k="mark" value="${esc(r.mark)}"></td>
      <td><button class="x" data-action="delrow" data-i="${i}">✕</button></td></tr>`).join('')}
    </tbody></table><button class="btn" data-action="addrow">${tr('addRow')}</button></div>
    ${statusButtons(e)}
    <label class="field">${tr('note')}<input data-field="note" value="${esc(typeof e.note === 'string' ? e.note : L(e.note))}"></label>`;
}

function viewAdmin() {
  if (!user) return viewLogin();
  const sps = allowedSports();
  if (!sps.find(s => s.id === adminSport)) adminSport = sps[0]?.id;
  const sp = SPORT[adminSport];
  const list = sp.type === 'rank' ? state.events.filter(e => e.sport === sp.id) : state.matches.filter(m => m.sport === sp.id);
  const picked = list.find(x => x.id === adminPick);
  return `
  <div class="page-head"><h1>${tr('admin')}</h1>
    <div class="who"><small>${tr('loggedAs')}</small><b>${esc(user.name)}</b>
      <button class="btn ghost sm" data-action="logout">${tr('logout')}</button></div></div>
  ${sps.length > 1 ? `<div class="chips">${sps.map(s => `<button class="${s.id === adminSport ? 'on' : ''}" data-action="asport" data-id="${s.id}">${s.icon} ${esc(L(s))}</button>`).join('')}</div>` : ''}
  <div class="admin-grid">
    <div class="alist card"><h3>${sp.icon} ${esc(L(sp))}</h3><p class="small muted">${tr('pickItem')}</p>${list.map(adminItemRow).join('')}</div>
    <div class="apanel">${picked ? `<div class="card panel"><div class="p-head"><b>${picked.stage ? tr(picked.stage) : esc(L(picked))}</b>
        <span>${dayLabel(dayOf(picked.start))} · ${timeOf(picked.start)}</span>
        <button class="x" data-action="unpick" title="${tr('close')}">✕</button></div>
        ${picked.stage ? panelMatch(picked) : panelEvent(picked)}</div>` : ''}
      <div class="card"><h3>${tr('log')}</h3>${state.log.length ? `<ul class="log">${state.log.slice(0, 12).map(l =>
        `<li><span>${esc(l.at)}</span> <b>${esc(l.by)}</b> — ${esc(l.what)}</li>`).join('')}</ul>` : `<p class="small muted">${tr('noLog')}</p>`}
        <button class="btn ghost sm" data-action="reset">${tr('reset')}</button></div>
    </div>
  </div>`;
}

function describe(x) {
  const sp = SPORT[x.sport];
  if (!x.stage) return `${L(sp)} · ${L(x)} (${x.status})`;
  const [A, B] = teamsOf(x), [p, q] = totals(x);
  const sets = x.sets && x.sets.length ? ` [${x.sets.map(s => s.join('-')).join(', ')}]` : '';
  return `${L(sp)} · ${A.label} ${p}–${q} ${B.label}${sets} (${x.status})`;
}

function mutate(fn) {
  const x = state.matches.find(m => m.id === adminPick) || state.events.find(e => e.id === adminPick);
  if (!x) return;
  fn(x);
  x.updatedAt = new Date().toISOString();
  x.updatedBy = user.name;
  state.log.unshift({ at: new Date().toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }), by: user.name, what: describe(x) });
  state.log = state.log.slice(0, 50);
  save();
  render();
  toast(tr('saved'));
}

/* ---------- shell ---------- */

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function renderChrome(route) {
  const active = { '': 'home', match: 'home', event: 'home', sport: 'sports' }[route] ?? route;
  document.getElementById('tabbar').innerHTML = ['home', 'schedule', 'sports', 'venues', 'admin'].map(k =>
    `<a href="#/${k === 'home' ? '' : k}" class="${active === k ? 'on' : ''}">${svg(k)}<span>${tr(k)}</span></a>`).join('');
  document.querySelectorAll('#lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  const now = new Date(MOCK_NOW);
  document.getElementById('demobar').innerHTML = `<div class="wrap">🧪 <b>${tr('demo')}</b> · ${tr('simTime')}: ${dayLabel(dayOf(MOCK_NOW))} ${now.toTimeString().slice(0, 5)} · <span>${tr('demoTip')}</span></div>`;
  document.documentElement.lang = lang;
}

function render() {
  const [route = '', ...args] = location.hash.replace(/^#\/?/, '').split('/');
  let html;
  switch (route) {
    case 'schedule': html = viewSchedule(args[0] ? +args[0] : dayOf(MOCK_NOW)); break;
    case 'sports': html = viewSports(); break;
    case 'sport': html = viewSport(args[0], args[1]); break;
    case 'match': html = viewMatch(args[0]); break;
    case 'event': html = viewEvent(args[0]); break;
    case 'venues': html = viewVenues(); break;
    case 'admin': html = viewAdmin(); break;
    default: html = viewHome();
  }
  $app.innerHTML = html;
  renderChrome(route);
}

document.addEventListener('click', (ev) => {
  const langBtn = ev.target.closest('[data-lang]');
  if (langBtn) { lang = langBtn.dataset.lang; store.set('ksu-lang', lang); render(); return; }
  const b = ev.target.closest('[data-action]');
  if (!b) return;
  const a = b.dataset.action;
  if (a === 'toggle-fk') { fktenOnly = !fktenOnly; render(); }
  else if (a === 'login') { user = DEMO_ACCOUNTS[+b.dataset.i]; store.set('ksu-user', user); adminPick = null; render(); }
  else if (a === 'logout') { user = null; store.del('ksu-user'); adminPick = null; render(); }
  else if (a === 'asport') { adminSport = b.dataset.id; adminPick = null; render(); }
  else if (a === 'pick') { adminPick = b.dataset.id; render(); if (innerWidth < 900) document.querySelector('.apanel')?.scrollIntoView({ behavior: 'smooth' }); }
  else if (a === 'unpick') { adminPick = null; render(); }
  else if (a === 'reset') { if (confirm(tr('resetConfirm'))) { state = seedState(); save(); adminPick = null; render(); } }
  else if (a === 'inc') mutate(m => {
    const i = +b.dataset.side; m.score[i] = Math.max(0, m.score[i] + +b.dataset.n);
    if (m.status === 'upcoming') m.status = 'live';
  });
  else if (a === 'setinc') mutate(m => {
    const s = m.sets[m.sets.length - 1], i = +b.dataset.side; s[i] = Math.max(0, s[i] + +b.dataset.n);
    if (m.status === 'upcoming') m.status = 'live';
  });
  else if (a === 'newset') mutate(m => { m.sets.push([0, 0]); if (m.status === 'upcoming') m.status = 'live'; });
  else if (a === 'delset') mutate(m => { m.sets.pop(); });
  else if (a === 'status') mutate(x => { x.status = b.dataset.v; });
  else if (a === 'addrow') mutate(e => { e.results.push({ pos: e.results.length + 1, fac: 'FKTEN', name: '', mark: '' }); });
  else if (a === 'delrow') mutate(e => { e.results.splice(+b.dataset.i, 1); });
});

document.addEventListener('change', (ev) => {
  const f = ev.target.dataset.field;
  if (!f) return;
  const val = ev.target.value;
  if (f === 'note') mutate(x => { x.note = val.trim() || null; });
  else if (f === 'team') mutate(m => {
    const k = ev.target.dataset.key;
    if (m[k].startsWith('@')) m[`_${k}`] = m[k];   // remember placeholder so it can be restored
    m[k] = val;
  });
  else if (f === 'res') mutate(e => {
    const r = e.results[+ev.target.dataset.i], k = ev.target.dataset.k;
    r[k] = k === 'pos' ? +val : val;
    if (k === 'pos') e.results.sort((p, q) => p.pos - q.pos);
  });
});

// Another tab (e.g. the admin) changed the data → re-render, like Firestore onSnapshot would.
window.addEventListener('storage', (ev) => {
  if (ev.key !== STATE_KEY) return;
  state = store.get(STATE_KEY) || seedState();
  render();
  document.body.classList.remove('flash'); void document.body.offsetWidth; document.body.classList.add('flash');
});

window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
save();
render();
