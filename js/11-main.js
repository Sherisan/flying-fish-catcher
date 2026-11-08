/*
 * Flying Fish Catcher · 11-main.js
 * Main loop, saving to localStorage, tab and button wiring, and start().
 */
'use strict';

/* ================= loop ================= */
function update(dt) {
  T += dt; game.t += dt; game.msgT = Math.max(0, game.msgT - dt);
  if (th.t < 1) { th.t = Math.min(1, th.t + dt / 2.5); TH = blendTheme(th.from, th.to, ease(th.t)); }
  if (game.phase === 'waiting') {
    for (const b of bots) if (!b.joined && game.t >= b.joinAt) { b.joined = true; listDirty = true; }
    idleJumpT -= dt;
    if (idleJumpT <= 0) { spawnJumper(pick(['flyer', 'flyer', 'puffer', 'mahi'])); idleJumpT = rand(1.3, 2.4); }
    if (game.t >= WAIT) startRound();
  } else if (game.phase === 'running') {
    game.mult = Math.exp(RATE * game.t);
    if (game.mult >= game.crashAt) { game.mult = game.crashAt; crash(); }
    else {
      while (game.mile < MILESTONES.length && game.mult >= MILESTONES[game.mile].at) {
        const ms = MILESTONES[game.mile++]; showBanner(ms.text);
        if (ms.ev === 'shark') spawnShark(); else if (ms.ev === 'dolphins') dolphinPod(); else if (ms.ev === 'whale') whaleBreach(); else if (ms.ev === 'orcas') orcaPod();
      }
      for (const s of slots) if (s.active && !s.cashed && s.auto.checked) { const a = parseFloat(s.autoAt.value); if (a >= 1.01 && game.mult >= a) cashOut(s, a); }
      for (const b of bots) if (!b.cashed && game.mult >= b.target) { b.cashed = true; b.at = b.target; listDirty = true; }
      spawnT -= dt;
      if (spawnT <= 0) { if (fishes.filter((f) => f.state === 'jump').length < 10) spawnJumper(pickKind(game.mult)); spawnT = clamp(0.95 - 0.22 * Math.log(game.mult), 0.28, 0.95) * rand(0.6, 1.4); }
      if (game.mult >= 2) {
        if (sharks.filter((s) => s.state === 'patrol').length < (game.mult >= 6 ? 2 : 1) && Math.random() < dt * 0.4) spawnShark();
        sharkT -= dt; if (sharkT <= 0) sharkT = sharkLunge() ? rand(3.5, 6.5) : 0.4;
      }
    }
  } else if (game.phase === 'crashed') {
    updateMine(dt);
    if (mine && mine.state === 'boom' && mine.t > 3.6) toWaiting();
  }
  updateBoat(dt); updateGun(dt); updateArrow(dt); updateRod(dt); updateFish(dt);
  updateSardines(dt); updateJellies(dt); updateCritters(dt); updateSharks(dt); updateDolphins(dt); updateWhales(dt); updateSpout(dt); updateParts(dt);
  flash = Math.max(0, flash - dt * 1.6); shake = Math.max(0, shake - dt * 1.3);
  for (const g of gulls) { g.x += g.v * dt; if (g.x > W + 40) { g.x = -40; g.y = H * rand(0.06, 0.2); } }
  for (const c of clouds) { c.x += c.v * dt; if (c.x - 170 * c.s > W) c.x = -170 * c.s; }
}
let last = 0;
function loop(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
  last = now; update(dt); render(); hud();
  requestAnimationFrame(loop);
}

/* ================= persistence ================= */
function persistState() {
  const pending = slots.reduce((t, s) => t + (s.active && !s.cashed && game.phase !== 'crashed' ? s.stake : 0), 0);
  return { bal: r2(bal + pending), history: crashHistory.slice(0, 30), mine: myBets.slice(0, 40), theme: th.idx };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(persistState())); } catch (e) { /* storage unavailable */ } }

/* ================= wiring ================= */
const tabs = [['tab-all', 'pane-all'], ['tab-mine', 'pane-mine'], ['tab-guide', 'pane-guide']];
for (const [t, p] of tabs) $(t).addEventListener('click', () => { for (const [t2, p2] of tabs) { const on = t2 === t; $(t2).setAttribute('aria-selected', String(on)); $(p2).hidden = !on; } if (p === 'pane-guide') guideDirty = true; });
refillBtn.addEventListener('click', () => { bal = START_BAL; save(); renderBalance(); });
skyBtn.addEventListener('click', () => { setTheme(th.idx + 1); save(); });
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn; soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundLabel.textContent = soundOn ? 'Sound on' : 'Sound off'; wavesPath.style.display = soundOn ? '' : 'none';
  if (soundOn) unlockAudio(); applyAudioLevels();
});
const musicBtn = $('musicBtn'), musicLabel = $('musicLabel');
const showMusic = () => { musicBtn.setAttribute('aria-pressed', String(musicOn)); musicLabel.textContent = musicOn ? 'Music on' : 'Music off'; };
showMusic();
musicBtn.addEventListener('click', () => { setMusic(!musicOn); showMusic(); });
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'BUTTON' || t.tagName === 'TEXTAREA')) return;
  e.preventDefault(); act(slots[0]);
});
document.addEventListener('pointerdown', unlockAudio, { passive: true });
if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(wrap); else window.addEventListener('resize', resize);

function start(data) {
  buildSlots();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
  const src = data && typeof data.bal === 'number' ? data : saved;
  if (src && typeof src.bal === 'number') {
    bal = Math.max(0, r2(src.bal));
    crashHistory = Array.isArray(src.history) ? src.history.filter((n) => typeof n === 'number').slice(0, 30) : [];
    myBets = Array.isArray(src.mine) ? src.mine.filter((b) => b && typeof b.stake === 'number').slice(0, 40) : [];
    if (typeof src.theme === 'number') { th.idx = ((src.theme % THEMES.length) + THEMES.length) % THEMES.length; TH = th.from = th.to = THEMES[th.idx]; skyLabel.textContent = TH.name; }
  }
  if (!crashHistory.length) crashHistory = Array.from({ length: 16 }, genCrash);
  resize();
  spawnSardines(false);
  buildIcons(); buildGuide();
  toWaiting();
  renderHistory(); renderBalance();
  const DEV = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (DEV) window.__ffc = { game, jump: (t) => { game.t = t; }, breach: whaleBreach, lunge: sharkLunge, shark: spawnShark, dolphins: dolphinPod, orcas: orcaPod, theme: (i) => { th.idx = i; TH = th.from = th.to = THEMES[i]; } };
  requestAnimationFrame(loop);
}
start({});
