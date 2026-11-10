/*
 * Flying Fish Catcher · 09-game.js
 * Rounds, bets, cash-outs and the balance come from GameEngineAPI (see 00-api.js); this file
 * mirrors them on screen. Also: the two bet slips, the show-only bot players, the bets list,
 * my bets, the field guide panel and the HUD text.
 */
'use strict';

/* ================= rounds (driven by the game server) ================= */
// The server decides everything that matters: when betting opens, when the round starts,
// the crash point, the balance and the payouts. This file only mirrors it on screen.
// Bots and fish are just for show.
const live = { client: new LiveCrashClient(GAME_ID), online: false, msg: 'Connecting to the game server…', config: null, status: null, phaseEndsLocal: 0, startedLocal: 0, lastTick: 1 };

function makeBots() {
  const names = NICKS.slice().sort(() => Math.random() - 0.5).slice(0, 14 + ((Math.random() * 9) | 0));
  bots = names.map((name, i) => ({ name, c: BOT_COLORS[i % BOT_COLORS.length], bet: pick([5, 10, 10, 20, 25, 50, 50, 75, 100, 150, 250, 500, 1000]), target: r2(Math.min(40, 1.1 - Math.log(1 - Math.random()) * 1.5)), joinAt: i < 4 ? 0 : rand(0.3, WAIT * 0.85), joined: i < 4, cashed: false, lost: false, at: 0 }));
  listDirty = true;
}
/** Seconds of betting left, by the server's clock. */
function bettingLeft() { return Math.max(0, (live.phaseEndsLocal - performance.now()) / 1000); }
/** The multiplier right now, worked out the way the server does it (e^(growth × seconds), floored to the cent). */
function liveMult() {
  const m = Math.floor(100 * Math.exp(RATE * Math.max(0, performance.now() - live.startedLocal) / 1000)) / 100;
  return Math.max(1, m, live.lastTick);
}
function toWaiting() {
  game.phase = 'waiting'; game.t = 0; game.mult = 1; game.haul = 0; game.catches = {}; game.mile = 0; game.msgT = 0;
  // the server opens betting a few seconds after the crash: set off a mine that is still on its way down
  if (mine && mine.state !== 'boom') explode(mine.x, mine.y);
  mine = null; idleJumpT = 1.5; guideDirty = true; game.rounds++;
  if (game.rounds % 2 === 0) setTheme(th.idx + 1);
  for (const s of slots) { s.active = false; s.cashed = false; s.stake = 0; s.win = 0; s.cashAt = 0; s.betId = null; }
  makeBots();
  if (!sardines.length) spawnSardines(true);
  for (const s of slots) { if (s.queued || s.autoBet.checked) { s.queued = false; placeBet(s); } }
  if (Math.random() < 0.35) setTimeout(() => { if (game.phase === 'waiting') (Math.random() < 0.5 ? orcaPod : dolphinPod)(); }, 1800);
  renderBalance(); listDirty = true;
  announce('Bets are open for the next round.');
}
function startRound() {
  game.phase = 'running'; game.t = 0; game.mult = 1; game.haul = 0; game.catches = {}; game.mile = 0;
  live.lastTick = 1; spawnT = 0.15; sharkT = rand(2, 4);
  for (const b of bots) b.joined = true;
  listDirty = true; guideDirty = true;
  announce('Round started. The crew is out catching fish.');
}
function crash(addToHistory) {
  game.phase = 'crashed'; game.t = 0; game.mult = game.crashAt;
  if (addToHistory) { crashHistory.unshift(game.crashAt); crashHistory = crashHistory.slice(0, 30); }
  const lost = slots.reduce((t, s) => t + (s.active && !s.cashed ? s.stake : 0), 0);
  if (lost > 0) toast(`Mine at ${game.crashAt.toFixed(2)}×. You lost ${fmt(lost)}.`, 'bad'); else announce(`The mine went off at ${game.crashAt.toFixed(2)}×.`);
  for (const b of bots) if (!b.cashed) b.lost = true;
  dropMine();
  renderHistory(); listDirty = true;
}
/** A Round message from the server (sent on every phase change), or the round in a snapshot. */
function applyRound(r, fromEvent) {
  const newRound = r.id !== game.round;
  game.round = r.id; live.status = r.status;
  if (r.status === 'BETTING') {
    live.phaseEndsLocal = live.client.toLocal(r.phaseEndsAt);
    if (game.phase !== 'waiting' || newRound) toWaiting();
  } else if (r.status === 'FLYING') {
    live.startedLocal = live.client.toLocal(r.startedAt);
    if (game.phase !== 'running' || newRound) startRound();
  } else if (r.status === 'CRASHED') {
    game.crashAt = Number(r.crashPoint);
    if (game.phase !== 'crashed' || newRound) crash(fromEvent);
  }
}
/** The whole state: on connect, and again after a reconnect. */
function applySnapshot(s) {
  live.config = s.config; RATE = s.config.growthRate; WAIT = s.config.bettingMs / 1000;
  if (s.balance != null) bal = Number(s.balance);
  crashHistory = (s.state.history || []).map((h) => Number(h.crashPoint));
  applyRound(s.state.round, false);
  if (s.state.multiplier != null) live.lastTick = Number(s.state.multiplier);
  for (const b of s.state.myBets || []) if (b.roundId === game.round) applyMyBet(b, true);
  renderHistory(); renderBalance(); listDirty = true;
  if (s.balance == null) live.client.getBalance().then((v) => { bal = Number(v); renderBalance(); }).catch(() => {});
}
/** One of my bets changed on the server (placed, auto cashed out, lost, cancelled). */
function applyMyBet(bet, quiet) {
  const s = slots[bet.slot]; if (!s) return;
  if (bet.roundId === game.round) {
    if (bet.status === 'Active' || bet.status === 'CashedOut' || bet.status === 'Lost') { s.active = true; s.stake = Number(bet.amount); s.betId = bet.id; }
    if (bet.status === 'CashedOut' && !s.cashed) {
      s.cashed = true; s.cashAt = Number(bet.cashedOutAt); s.win = Number(bet.win || 0);
      if (!quiet) { sfx.cash(); toast(`Bet ${s.id}: +${fmt(s.win)} at ${s.cashAt.toFixed(2)}×`, 'good'); }
    }
    if (bet.status === 'Cancelled') { s.active = false; s.stake = 0; s.betId = null; }
    listDirty = true;
  }
  if (bet.status === 'CashedOut' || bet.status === 'Lost') {
    const row = { id: bet.id, round: bet.roundId, slot: s.id, stake: Number(bet.amount), at: bet.status === 'CashedOut' ? Number(bet.cashedOutAt) : null, win: Number(bet.win || 0), crash: game.crashAt };
    const i = myBets.findIndex((b) => b.id === bet.id);
    if (i >= 0) myBets[i] = row; else myBets.unshift(row);
    myBets = myBets.slice(0, 40); mineDirty = true;
  }
}
function setOnline(state, msg) {
  live.online = state === 'online';
  live.msg = msg || '';
  if (state !== 'online' && msg) toast(msg, 'bad');
}
async function connectLive() {
  const c = live.client;
  c.handlers = {
    round: (r) => applyRound(r, true),
    tick: (m) => { live.lastTick = Number(m); },
    myBet: (bet, balance) => { if (balance != null) { bal = Number(balance); renderBalance(); } applyMyBet(bet, false); },
    resync: applySnapshot,
    status: setOnline,
  };
  try { applySnapshot(await c.connect()); }
  catch (e) { setOnline('offline', e && /session|lobby/i.test(e.message || '') ? e.message : "Can't reach the game server. Is GameEngineAPI running?"); }
}
function showBanner(text) { bannerEl.textContent = text; bannerEl.classList.add('show'); clearTimeout(showBanner.t); showBanner.t = setTimeout(() => bannerEl.classList.remove('show'), 2600); }

/* ================= betting ================= */
const slots = [];
function slotHTML(id, amt, auto) {
  return `<div class="slot" id="slot${id}">
    <div class="slot-head"><span class="slot-name">Bet ${id}</span>
      <label class="sw" for="autoBet${id}"><input type="checkbox" id="autoBet${id}"><i></i>Auto bet</label>
      <span class="auto-grp"><label class="sw" for="auto${id}"><input type="checkbox" id="auto${id}"><i></i>Auto cash out</label>
      <span class="auto-at"><input type="number" id="autoAt${id}" min="1.01" step="0.01" value="${auto}" aria-label="Bet ${id} auto cash-out multiplier">×</span></span></div>
    <div class="slot-body">
      <div class="amt">
        <div class="stepper"><button type="button" class="step" data-d="-10" aria-label="Lower bet ${id} by 10">−</button><input id="bet${id}" type="number" inputmode="numeric" min="1" step="1" value="${amt}" aria-label="Bet ${id} amount"><button type="button" class="step" data-d="10" aria-label="Raise bet ${id} by 10">+</button></div>
        <div class="quick"><button type="button" data-set="10">10</button><button type="button" data-set="50">50</button><button type="button" data-set="100">100</button><button type="button" data-set="500">500</button></div>
      </div>
      <button class="action" type="button" id="act${id}" data-mode="bet"><span class="am">Place bet</span><small class="as"></small></button>
    </div>
    <p class="msg" id="msg${id}" role="alert"></p>
  </div>`;
}
function buildSlots() {
  $('slots').innerHTML = slotHTML('A', 50, '2.00') + slotHTML('B', 20, '5.00');
  for (const [idx, id] of [[0, 'A'], [1, 'B']]) {
    const s = { id, idx, stake: 0, active: false, cashed: false, cashAt: 0, win: 0, queued: false, busy: false, betId: null, cache: {} };
    s.amt = $('bet' + id); s.auto = $('auto' + id); s.autoAt = $('autoAt' + id); s.autoBet = $('autoBet' + id); s.btn = $('act' + id);
    s.main = s.btn.querySelector('.am'); s.sub = s.btn.querySelector('.as'); s.msg = $('msg' + id); s.card = $('slot' + id);
    s.card.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.d) s.amt.value = Math.max(1, readBet(s) + Number(b.dataset.d));
      if (b.dataset.set) s.amt.value = b.dataset.set;
    });
    s.btn.addEventListener('click', () => act(s));
    s.autoBet.addEventListener('change', () => { if (s.autoBet.checked && live.status === 'BETTING' && game.phase === 'waiting' && !s.active && !s.busy) placeBet(s); });
    s.autoAt.addEventListener('change', () => { const v = parseFloat(s.autoAt.value); if (!(v >= 1.01)) { s.autoAt.value = '1.01'; setMsg(s, 'Auto cash-out needs at least 1.01×.'); } else s.autoAt.value = v.toFixed(2); });
    slots.push(s);
  }
}
function readBet(s) { const v = Math.floor(Number(s.amt.value)); return Number.isFinite(v) ? v : 0; }
function readAuto(s) {
  if (!s.auto.checked) return null;
  const v = Math.round(parseFloat(s.autoAt.value) * 100) / 100, min = live.config ? live.config.minAutoCashOut : 1.01;
  return v >= min ? v : null;
}
const errText = (e) => (e && e.message ? e.message.replace(/^.*HubException: /, '') : "Can't reach the game server.");
// Every bet, cancel and cash-out goes to the server. The balance shown is always the server's.
async function placeBet(s) {
  const amt = readBet(s), cfg = live.config;
  if (!live.online) { setMsg(s, live.msg || 'Not connected to the game server.'); s.autoBet.checked = false; return false; }
  if (cfg && amt < cfg.minBet) { setMsg(s, `The smallest bet is ${fmt(cfg.minBet)}.`); return false; }
  if (cfg && amt > cfg.maxBet) { setMsg(s, `The biggest bet is ${fmt(cfg.maxBet)}.`); return false; }
  if (bal != null && amt > bal) { setMsg(s, `You have ${fmt(bal)}. Lower the bet.`); s.autoBet.checked = false; return false; }
  s.busy = true;
  try {
    const res = await live.client.placeBet(s.idx, amt, readAuto(s));
    if (res.balance != null) bal = Number(res.balance);
    if (res.ok) { s.active = true; s.cashed = false; s.stake = amt; s.betId = res.bet && res.bet.id; setMsg(s, ''); sfx.chip(); }
    else { setMsg(s, res.error || 'The bet was not placed.'); s.autoBet.checked = false; }
    return !!res.ok;
  } catch (e) { setMsg(s, errText(e)); s.autoBet.checked = false; return false; }
  finally { s.busy = false; renderBalance(); listDirty = true; }
}
async function cancelBet(s) {
  if (live.status !== 'BETTING' || !s.active) return;
  s.busy = true;
  try {
    const res = await live.client.cancelBet(s.idx);
    if (res.balance != null) bal = Number(res.balance);
    if (res.ok) { s.stake = 0; s.active = false; s.betId = null; s.autoBet.checked = false; } else setMsg(s, res.error || 'Could not cancel the bet.');
  } catch (e) { setMsg(s, errText(e)); }
  finally { s.busy = false; renderBalance(); listDirty = true; }
}
async function cashOut(s) {
  if (live.status !== 'FLYING' || !s.active || s.cashed) return;
  s.busy = true;
  try {
    const res = await live.client.cashOut(s.idx);
    if (res.balance != null) bal = Number(res.balance);
    if (res.ok) {
      // the server's clock decides the multiplier, not ours
      if (!s.cashed) { s.cashed = true; s.cashAt = Number(res.multiplier); s.win = Number(res.win); sfx.cash(); toast(`Bet ${s.id}: +${fmt(s.win)} at ${s.cashAt.toFixed(2)}×`, 'good'); }
    } else setMsg(s, res.error || 'Could not cash out.');
  } catch (e) { setMsg(s, errText(e)); }
  finally { s.busy = false; renderBalance(); listDirty = true; }
}
function act(s) {
  unlockAudio();
  if (s.busy) return;
  if (!live.online) { setMsg(s, live.msg || 'Not connected to the game server.'); return; }
  if (live.status === 'BETTING' && game.phase === 'waiting') { s.active ? cancelBet(s) : placeBet(s); }
  else if (live.status === 'FLYING' && s.active && !s.cashed) cashOut(s);
  else { s.queued = !s.queued; if (s.queued && bal != null && readBet(s) > bal) { s.queued = false; setMsg(s, `You have ${fmt(bal)}. Lower the bet.`); } }
}

/* ================= UI ================= */
const cache = {};
function setText(el, key, v) { if (cache[key] !== v) { cache[key] = v; el.textContent = v; } }
function setData(el, key, name, v) { if (cache[key] !== v) { cache[key] = v; el.dataset[name] = v; } }
function setMsg(s, t) { s.msg.textContent = t; clearTimeout(s.msgTimer); if (t) s.msgTimer = setTimeout(() => { s.msg.textContent = ''; }, 4000); }
function announce(t) { liveEl.textContent = t; }
let toastTimer = 0;
function toast(t, kind) { toastText.textContent = t; toastEl.dataset.kind = kind; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800); announce(t); }
function addFeed(kind, who, verb, name) {
  const li = document.createElement('li');
  const img = document.createElement('img'); img.alt = ''; img.src = ICONS[kind] || ''; li.appendChild(img);
  const sp = document.createElement('span'); const b = document.createElement('b'); b.textContent = who; sp.appendChild(b); sp.appendChild(document.createTextNode(` ${verb} a ${name}`)); li.appendChild(sp);
  feedEl.appendChild(li); while (feedEl.children.length > 4) feedEl.removeChild(feedEl.firstChild);
}
function renderBalance() { balEl.textContent = bal == null ? '—' : fmt(bal); }
function renderHistory() { histEl.innerHTML = crashHistory.slice(0, 24).map((v, i) => `<span class="pill ${v < 2 ? 'lo' : v < 10 ? 'mid' : 'hi'}${i === 0 ? ' new' : ''}">${v.toFixed(2)}×</span>`).join(''); }
function initials(n) { return n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'; }
function renderPlayers() {
  listDirty = false;
  const rows = [];
  for (const s of slots) if (s.active) rows.push({ name: `You · ${s.id}`, c: '#ff7a2f', bet: s.stake, me: true, cashed: s.cashed, at: s.cashAt, lost: game.phase === 'crashed' && !s.cashed });
  for (const b of bots) if (b.joined) rows.push(b);
  const total = rows.reduce((t, r) => t + r.bet, 0);
  crewCount.textContent = `${rows.length} bets this round`; crewTotal.textContent = fmt(total);
  const body = rows.map((r) => {
    const cls = [r.me ? 'me' : '', r.cashed ? 'won' : '', r.lost ? 'lost' : ''].join(' ').trim();
    const at = r.cashed ? `${r.at.toFixed(2)}×` : '–', win = r.cashed ? `+${fmt(r.bet * r.at)}` : r.lost ? `−${fmt(r.bet)}` : '–';
    return `<li class="${cls}"><span class="who"><i style="--c:${r.c}">${r.me ? 'ME' : initials(r.name)}</i><span>${r.name}</span></span><span class="bet">${r.bet}</span><span class="at">${at}</span><span class="win">${win}</span></li>`;
  }).join('');
  playersEl.innerHTML = '<li class="head"><span>Player</span><span>Bet</span><span>Out</span><span>Result</span></li>' + (body || '<li class="empty">Waiting for players…</li>');
}
function renderMine() {
  mineDirty = false;
  const body = myBets.map((b) => `<li class="${b.at ? 'won' : 'lost'}"><span class="who"><span>Round ${b.round.toLocaleString('en-US')} · ${b.slot}</span></span><span class="bet">${b.stake}</span><span class="at">${(b.at || b.crash).toFixed(2)}×</span><span class="win">${b.at ? '+' + fmt(b.win) : '−' + fmt(b.stake)}</span></li>`).join('');
  mineEl.innerHTML = '<li class="head"><span>Round</span><span>Bet</span><span>At</span><span>Result</span></li>' + (body || '<li class="empty">Your bets will show here after each round.</li>');
}
function makeIcon(fn) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 72;
  const prev = ctx; ctx = c.getContext('2d');
  try { ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.translate(32, 18); fn(); } catch (e) { /* icon optional */ }
  ctx = prev;
  try { return c.toDataURL(); } catch (e) { return ''; }
}
function buildIcons() {
  const fake = (k) => ({ pal: KINDS[k].pals ? KINDS[k].pals[0] : null, air: true, kind: k, state: 'jump', wig: 0, icon: true });
  for (const k in KINDS) ICONS[k] = makeIcon(() => { if (k === 'sail') ctx.translate(-5, 6); if (k === 'flyer' || k === 'gold') ctx.translate(2, 5); KINDS[k].draw(fake(k), KINDS[k].icon, 1); });
  ICONS.shark = makeIcon(() => { ctx.translate(4, 2); fishGeneric({ wig: 0, chomp: 0, gape: 0.6 }, 13.5, D.shark, 0); });
  ICONS.tiger = makeIcon(() => { ctx.translate(4, 2); fishGeneric({ wig: 0, chomp: 0, gape: 0 }, 12.5, D.tiger, 0); });
  ICONS.orca = makeIcon(() => { ctx.translate(3, 7); fishGeneric({ wig: 0 }, 14.5, D.orca, 0); });
  ICONS.whale = makeIcon(() => { ctx.translate(4, -4); fishGeneric({ wig: 0 }, 8, D.whale, 0); });
  ICONS.dolphin = makeIcon(() => { ctx.translate(2, 3); fishGeneric({ wig: 0 }, 19, D.dolphin, 0); });
  ICONS.turtle = makeIcon(() => drawTurtle({ x: -4, y: 4, s: 15, vx: 1, ph: 0 }));
  ICONS.manta = makeIcon(() => drawManta({ x: 4, y: 0, s: 26, dir: 1, ph: 0 }));
  ICONS.octopus = makeIcon(() => drawOctopus(0, 15, 14, 0, 0));
  ICONS.crab = makeIcon(() => drawCrab(0, 6, 13, 0));
  for (const [k] of CREW_GUIDE) ICONS[k] = makeIcon(() => { drawPerson(2, 54, KITS[k], { k: 0.82, mood: 'happy' }); });
}
function buildGuide() {
  const row = (k, name, desc, tag) => `<li><img src="${ICONS[k] || ''}" alt=""><div><b>${name}</b><small>${desc}</small></div>${tag != null ? `<em data-count="${k}">${tag}</em>` : '<em></em>'}</li>`;
  guideEl.innerHTML = '<h3>Sea life</h3><ul>' + SEA_GUIDE.map(([k, n, d, w]) => row(k, n, d, w)).join('') + '</ul><h3>The crew</h3><ul>' + CREW_GUIDE.map(([k, n, d]) => row(k, n, d, null)).join('') + '</ul>';
}
function renderGuideCounts() {
  guideDirty = false;
  for (const [k, , , when] of SEA_GUIDE) { const el = guideEl.querySelector(`[data-count="${k}"]`); if (!el) continue; const n = game.catches[k] || 0; el.textContent = n ? `${n} caught` : when; }
}
function hud() {
  const p = game.phase;
  setText(roundEl, 'round', `Round ${game.round.toLocaleString('en-US')}`);
  if (cache.phase !== p) { cache.phase = p; wrap.dataset.phase = p; }
  setText(haulEl, 'haul', String(game.haul));
  if (!live.online || !live.status) {
    setText(tagEl, 'tag', live.msg && !/Connecting/.test(live.msg) ? 'Offline' : 'Connecting'); setText(multEl, 'mult', '–.––×'); setData(multEl, 'ms', 'state', 'idle');
    setText(statusEl, 'status', live.msg || 'Connecting to the game server…'); barEl.hidden = true;
  } else if (p === 'waiting') {
    const left = bettingLeft();
    setText(tagEl, 'tag', 'Bets open'); setText(multEl, 'mult', '1.00×'); setData(multEl, 'ms', 'state', 'idle');
    setText(statusEl, 'status', left > 0 ? `Next round in ${left.toFixed(1)}s` : 'Starting…'); barEl.hidden = false; barFill.style.transform = `scaleX(${clamp(left / WAIT, 0, 1)})`;
  } else if (p === 'running') {
    const m = game.mult;
    setText(tagEl, 'tag', 'Catching'); setText(multEl, 'mult', `${m.toFixed(2)}×`); setData(multEl, 'ms', 'state', m >= 10 ? 'hot' : m >= 2 ? 'warm' : 'run');
    setText(statusEl, 'status', game.msgT > 0 ? game.msg : `${game.haul} fish in the hold`); barEl.hidden = true;
  } else {
    setText(tagEl, 'tag', 'Crashed'); setText(multEl, 'mult', `${game.crashAt.toFixed(2)}×`); setData(multEl, 'ms', 'state', 'crashed');
    setText(statusEl, 'status', mine && mine.state !== 'boom' ? 'Mine away! Brace!' : game.msgT > 0 ? game.msg : 'BOOM! Hank is still firing'); barEl.hidden = true;
  }
  for (const s of slots) {
    let mode, main, sub;
    if (p === 'waiting') { if (s.active) { mode = 'cancel'; main = 'Cancel'; sub = `${fmt(s.stake)} on this round`; } else { mode = 'bet'; main = 'Place bet'; sub = `${fmt(readBet(s))} credits`; } }
    else if (p === 'running' && s.active && !s.cashed) { mode = 'cash'; main = 'Cash out'; sub = `${fmt(s.stake * game.mult)} at ${game.mult.toFixed(2)}×`; }
    else if (s.queued) { mode = 'queued'; main = 'Cancel'; sub = `${fmt(readBet(s))} waiting for next round`; }
    else { mode = 'next'; main = 'Bet next round'; sub = s.cashed ? `Won ${fmt(s.win)} at ${s.cashAt.toFixed(2)}×` : p === 'crashed' && s.active ? `Lost ${fmt(s.stake)}` : `${fmt(readBet(s))} credits`; }
    if (s.busy) sub = 'Sending…';
    if (s.cache.mode !== mode) { s.cache.mode = mode; s.btn.dataset.mode = mode; }
    if (s.cache.main !== main) { s.cache.main = main; s.main.textContent = main; }
    if (s.cache.sub !== sub) { s.cache.sub = sub; s.sub.textContent = sub; }
    const lock = s.active && p !== 'crashed' && !(p === 'running' && s.cashed);
    if (s.cache.lock !== lock) { s.cache.lock = lock; s.card.querySelectorAll('.stepper input, .step, .quick button, .auto-grp input').forEach((el) => { el.disabled = lock; }); }
  }
  if (listDirty) renderPlayers();
  if (mineDirty) renderMine();
  if (guideDirty) renderGuideCounts();
}
