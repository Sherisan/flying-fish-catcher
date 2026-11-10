/*
 * Flying Fish Catcher · 04-world.js
 * World simulation: canvas sizing, scenery layout, wave height, the boat bobbing, Hank's harpoon
 * cannon aiming, Sipho's rod, fish jumping and fleeing, sharks, dolphins and orcas, whales, the sea
 * mine drop and explosion, and every particle (splashes, bubbles, smoke, embers).
 */
'use strict';

/* ================= layout ================= */
function resize() {
  const r = wrap.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  // ship size: 0.75 on desktop, growing to 0.95 on phone-width screens so the boat isn't tiny there
  const baseS = clamp(Math.min(W / 1040, H / 505), 0.3, 1.35); S = baseS * lerp(0.95, 0.75, clamp((W - 480) / 420, 0, 1));
  FS = Math.max(baseS, 0.52);
  waterY = H * 0.56; horizonY = waterY - H * 0.07; deepY = waterY + (H - waterY) * 0.62;
  GRAV = H * 1.5;
  boat.x = W - 272 * S;
  buildScenery();
}
function bedY(x) { return H - (H - waterY) * 0.12 + Math.sin(x * 0.008 / FS) * 7 * FS + Math.sin(x * 0.021 / FS + 1) * 3 * FS; }
function surf(x) {
  let y = waterY + Math.sin(x * 0.011 / FS + T * 1.25) * 5 * FS + Math.sin(x * 0.027 / FS - T * 1.9) * 2.6 * FS;
  if (bump) { const a = bump.t < 0.25 ? bump.t / 0.25 : Math.max(0, 1 - (bump.t - 0.25) / 1.1), dx = (x - bump.x) / (110 * S); y -= 38 * S * a * Math.exp(-dx * dx); }
  return y;
}
function buildScenery() {
  let seed = 17;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  clouds = Array.from({ length: 6 }, (_, i) => ({
    x: (i / 6 + rnd() * 0.12) * W, y: H * (0.07 + rnd() * 0.24), s: (0.5 + rnd() * 0.65) * FS, v: (4 + rnd() * 8) * FS,
    puffs: Array.from({ length: 7 }, () => ({ dx: (rnd() - 0.5) * 150, dy: -rnd() * 20, r: 13 + rnd() * 22 })),
  }));
  stars = Array.from({ length: 80 }, () => ({ x: rnd() * W, y: rnd() * H * 0.4, r: rnd() * 1.2 + 0.3, p: rnd() * 6 }));
  islands = [{ x: W * 0.02, w: W * 0.16, h: H * 0.05, light: true }, { x: W * 0.5, w: W * 0.22, h: H * 0.035 }, { x: W * 0.66, w: W * 0.3, h: H * 0.06 }]
    .map((isl) => ({ ...isl, pts: Array.from({ length: 9 }, (_, k) => ({ t: k / 8, h: k === 0 || k === 8 ? 0 : (0.35 + rnd() * 0.65) * (1 - Math.abs(k - 4) / 5) })), lamps: Array.from({ length: 5 }, () => rnd()) }));
  weeds = [];
  const step = 30 * Math.max(FS, 0.6);
  for (let x = rnd() * step; x < W; x += step * (0.7 + rnd() * 1.1)) weeds.push({ x, h: (34 + rnd() * 70) * FS, ph: rnd() * 6, w: (2.5 + rnd() * 3) * FS, c: rnd() < 0.5 ? '#1d6446' : '#2b7b52' });
  rocks = Array.from({ length: Math.ceil(W / 150) }, () => ({ x: rnd() * W, rx: (14 + rnd() * 28) * FS, ry: (8 + rnd() * 14) * FS }));
  corals = [];
  const types = ['branch', 'fan', 'brain', 'anemone', 'branch', 'star', 'fan', 'anemone'];
  for (let x = 40 * FS + rnd() * 40; x < W - 20; x += (70 + rnd() * 90) * FS) {
    const type = types[(rnd() * types.length) | 0];
    const c = { x, type, s: (0.8 + rnd() * 0.6) * FS, ph: rnd() * 6, col: ['#ff7f61', '#e05a8f', '#ffb04d', '#b07cf0'][(rnd() * 4) | 0] };
    if (type === 'branch') {
      c.segs = [];
      const grow = (x0, y0, a, len, d) => {
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
        c.segs.push([x0, y0, x1, y1, Math.max(1.2, 5 - d * 1.2)]);
        if (d < 3) { grow(x1, y1, a - 0.45 - rnd() * 0.3, len * 0.72, d + 1); grow(x1, y1, a + 0.45 + rnd() * 0.3, len * 0.72, d + 1); }
      };
      grow(0, 0, -Math.PI / 2, 16, 0);
    }
    corals.push(c);
  }
  corals.push({ x: W * 0.16, type: 'anchor', s: FS, ph: 0 });
  plankton = Array.from({ length: 80 }, () => ({ x: rnd() * W, y: waterY + rnd() * (H - waterY), r: 0.6 + rnd() * 1.4, ph: rnd() * 6 }));
  gulls = [{ x: W * 0.18, y: H * 0.15, v: 34 * FS, ph: 0 }, { x: W * 0.5, y: H * 0.09, v: 26 * FS, ph: 2 }, { x: W * 0.32, y: H * 0.2, v: 30 * FS, ph: 4 }];
  if (!jellies.length) jellies = Array.from({ length: 3 }, () => ({ x: rand(0.1, 0.6) * W, y: lerp(waterY + 60, H * 0.88, Math.random()), r: rand(9, 14), ph: rand(0, TAU), vx: rand(-6, 6) }));
  if (!deepWhale) deepWhale = { x: W * 0.2, dir: 1, s: 22, wait: 0, flee: false };
  if (!turtle) turtle = { x: W * 0.1, y: waterY + (H - waterY) * 0.35, vx: 26, s: 18, ph: 0 };
  if (!manta) manta = { x: W * 0.6, y: waterY + (H - waterY) * 0.7, dir: -1, s: 40, ph: 1 };
  if (!octo) octo = { hide: 0, pale: 0 };
  if (!crab) crab = { x: W * 0.3, vx: 14 };
}

/* ================= boat ================= */
function toWorld(lx, ly) { const c = Math.cos(boat.ang), s = Math.sin(boat.ang); lx *= S; ly *= S; return { x: boat.x + lx * c - ly * s, y: boat.y + lx * s + ly * c }; }
function pivotW() { return toWorld(CAN.x, CAN.y); }
function muzzle(extra) { const p = pivotW(), d = (MUZZLE + (extra || 0) - gun.recoil * 7) * S; return { x: p.x + Math.cos(gun.ang) * d, y: p.y + Math.sin(gun.ang) * d }; }
const arrowSpeed = () => 1700 * Math.max(S, 0.45);
function updateBoat(dt) {
  const sl = (surf(boat.x + 60 * S) - surf(boat.x - 60 * S)) / (120 * S);
  boat.liftV += (-36 * boat.lift - 5 * boat.liftV) * dt; boat.lift += boat.liftV * dt;
  boat.rock *= Math.exp(-1.0 * dt); boat.rockPh += 6.5 * dt;
  boat.y = surf(boat.x) + 3 * S + boat.lift;
  boat.ang = Math.atan(sl) * 0.7 + boat.rock * Math.sin(boat.rockPh);
  boat.alarm = Math.max(0, boat.alarm - dt); boat.radar += dt * 3.2;
  smokeT -= dt;
  if (smokeT <= 0) { smokeT = 0.11; const p = toWorld(89, -218); parts.push({ type: 'smoke', x: p.x + rand(-2, 2) * S, y: p.y, vx: rand(-26, -12) * FS, vy: rand(-34, -22) * FS, r: rand(4, 6) * S, life: 3.2, max: 3.2 }); }
  foamT -= dt;
  if (foamT <= 0) { foamT = 0.18; for (const lx of [-200, 186]) { const p = toWorld(lx, 0); parts.push({ type: 'foam', x: p.x + rand(-6, 6) * S, w: rand(10, 18) * S, life: 1.4, max: 1.4, vx: (lx < 0 ? -1 : 1) * rand(4, 12) * S }); } }
  crew.hankHappy = Math.max(0, crew.hankHappy - dt); crew.siphoHappy = Math.max(0, crew.siphoHappy - dt);
  const leverTarget = game.phase === 'crashed' && game.t < 1.4 ? 1 : 0;
  crew.lever = lerp(crew.lever, leverTarget, 1 - Math.exp(-12 * dt));
}

/* ================= harpoon cannon (Hank) ================= */
function predict(f, tau) { return { x: f.x + f.vx * tau, y: f.y + f.vy * tau + 0.5 * GRAV * tau * tau }; }
function intercept(f, from) {
  const v = arrowSpeed();
  let tau = Math.hypot(f.x - from.x, f.y - from.y) / v;
  for (let i = 0; i < 5; i++) { const p = predict(f, tau); tau = Math.hypot(p.x - from.x, p.y - from.y) / v; }
  return { p: predict(f, tau), tau };
}
function validAim(ic) { const p = ic.p; return ic.tau < 0.8 && p.x > 18 * FS && p.x < boat.x - 250 * S && p.y > 24 * FS && p.y < waterY - 30 * FS; }
const huntable = (f) => (f.state === 'jump' || f.state === 'flee') && f.air && !(f.delay > 0);
function updateGun(dt) {
  gun.recoil = Math.max(0, gun.recoil - dt * 5);
  const active = game.phase === 'running' || game.phase === 'crashed';
  let desired = 3.7 + Math.sin(T * 0.8) * 0.05;
  if (gun.state === 'idle' && active) {
    const from = muzzle(40);
    let best = null, bestScore = 1e9;
    for (const f of fishes) {
      if (!huntable(f) || f.claimed) continue;
      const ic = intercept(f, from);
      if (!validAim(ic)) continue;
      const score = ic.tau - (f.vy < 0 ? 0.25 : 0) - (f.kind === 'gold' || f.kind === 'sail' ? 0.3 : 0);
      if (score < bestScore) { best = f; bestScore = score; }
    }
    if (best) {
      gun.state = 'aim'; gun.target = best; gun.timer = 0; best.claimed = true;
      gun.missOff = Math.random() < (game.phase === 'crashed' ? 0.35 : 0.2) ? (Math.random() < 0.5 ? -1 : 1) * rand(40, 64) * FS : 0;
    }
  }
  if (gun.state === 'aim') {
    const f = gun.target;
    if (!f || !active || !huntable(f)) { if (f) f.claimed = false; gun.state = 'idle'; gun.target = null; }
    else {
      const ic = intercept(f, muzzle(40));
      if (!validAim(ic)) { f.claimed = false; gun.state = 'idle'; gun.target = null; }
      else {
        const pv = pivotW();
        desired = norm(Math.atan2(ic.p.y + gun.missOff - pv.y, ic.p.x - pv.x));
        gun.timer += dt;
        if (Math.abs(desired - gun.ang) < 0.035 && gun.timer > 0.08) fire();
      }
    }
  } else if (gun.state === 'fly' || gun.state === 'reel') {
    desired = gun.ang;
    if (gun.state === 'reel' && arrow && arrow.fish) { const pv = pivotW(); desired = norm(Math.atan2(arrow.fish.y - pv.y, arrow.fish.x - pv.x)); }
  } else if (gun.state === 'reload') {
    gun.timer -= dt; if (gun.timer <= 0) gun.state = 'idle';
  }
  desired = clamp(desired, 2.8, 4.6);
  gun.ang += clamp(desired - gun.ang, -10 * dt, 10 * dt);
}
function fire() {
  const m = muzzle(40), v = arrowSpeed();
  arrow = { x: m.x, y: m.y, vx: Math.cos(gun.ang) * v, vy: Math.sin(gun.ang) * v, ang: gun.ang, state: 'fly', t: 0, fish: null, p: 0 };
  if (gun.target) gun.target.claimed = gun.missOff === 0;
  gun.state = 'fly'; gun.recoil = 1;
  const mz = muzzle(0);
  for (let i = 0; i < 7; i++) parts.push({ type: 'smoke', x: mz.x, y: mz.y, vx: Math.cos(gun.ang) * rand(30, 90) * S + rand(-20, 20) * S, vy: Math.sin(gun.ang) * rand(30, 90) * S - 10 * S, r: rand(2, 4) * S, life: 0.7, max: 0.7, light: true });
  sparkBurst(mz.x, mz.y, 5, '#ffd27a');
  sfx.shoot();
}
function updateArrow(dt) {
  const a = arrow;
  if (!a) return;
  a.t += dt;
  if (a.state === 'fly') {
    a.x += a.vx * dt; a.y += a.vy * dt;
    for (const f of fishes) { if (!huntable(f)) continue; if (Math.hypot(f.x - a.x, f.y - a.y) < f.s * 1.2) { hitFish(f); return; } }
    const sy = surf(a.x);
    if (a.y > sy) { splash(a.x, sy, 6, 0.55); a.state = 'back'; a.t = 0; sfx.plip(); }
    else if (a.x < -40 || a.y < -40 || a.t > 1.1) { a.state = 'back'; a.t = 0; }
  } else if (a.state === 'reel') {
    const f = a.fish;
    a.p = Math.min(1, a.p + dt / 1.15);
    const crate = toWorld(CRATE.x, CRATE.y - 44), m = muzzle(34);
    if (a.p < 0.78) {
      // reeled in along the rope, wriggling and dripping, sagging a little under its own weight
      const q = a.p / 0.78, e = q * q * (3 - 2 * q);
      f.x = lerp(a.sx, m.x, e); f.y = lerp(a.sy, m.y, e) + Math.sin(Math.PI * q) * 26 * S;
      if (Math.random() < 0.35) parts.push({ type: 'drop', x: f.x + rand(-1, 1) * f.s * 0.5, y: f.y + f.s * 0.3, vx: rand(-20, 20) * FS, vy: rand(10, 60) * FS, r: rand(1, 2) * FS, life: 0.7, max: 0.7 });
    } else {
      // swung off the line into the crate
      const q = (a.p - 0.78) / 0.22, e = ease(q);
      f.x = lerp(m.x, crate.x, e); f.y = lerp(m.y, crate.y, e) - Math.sin(Math.PI * q) * 40 * S;
    }
    f.spin = a.ang + Math.sin(T * 22) * 0.45; a.x = f.x; a.y = f.y;
    if (a.p >= 1) { landFish(f, 'Hank', game.phase === 'crashed' ? 'snagged' : 'harpooned'); crew.hankHappy = 1.2; arrow = null; gun.state = 'reload'; gun.timer = game.phase === 'crashed' ? 0.12 : 0.24; }
  } else if (a.state === 'back') {
    const m = muzzle(40), k = 1 - Math.exp(-dt * 10);
    a.x += (m.x - a.x) * k; a.y += (m.y - a.y) * k;
    if (Math.hypot(m.x - a.x, m.y - a.y) < 14 * S || a.t > 1) { arrow = null; gun.state = 'reload'; gun.timer = game.phase === 'crashed' ? 0.12 : 0.25; }
  }
}
function hitFish(f) {
  f.state = 'caught'; f.claimed = true; f.spin = arrow.ang; f.delay = 0;
  arrow.state = 'reel'; arrow.fish = f; arrow.p = 0; arrow.sx = f.x; arrow.sy = f.y;
  sparkBurst(f.x, f.y, 12, f.kind === 'gold' ? '#ffe28a' : '#ffffff');
  gun.state = 'reel'; sfx.hit();
}
function landFish(f, who, verb) {
  const i = fishes.indexOf(f); if (i >= 0) fishes.splice(i, 1);
  game.haul++; game.catches[f.kind] = (game.catches[f.kind] || 0) + 1; guideDirty = true;
  const name = KINDS[f.kind].name;
  say(game.phase === 'crashed' ? `${who} ${verb} a ${name} in the chaos!` : `${who} ${verb} a ${name}`);
  const p = toWorld(CRATE.x, CRATE.y - 60), rare = f.kind === 'gold' || f.kind === 'sail';
  parts.push({ type: 'text', x: p.x, y: p.y, text: `+ ${name}`, life: 1.3, max: 1.3, c: rare ? '#ffd76a' : '#eef3ec' });
  addFeed(f.kind, who, verb, name);
  sfx.land();
}
function say(msg) { game.msg = msg; game.msgT = 2.6; }

/* ================= rod (Sipho) ================= */
const rod = { state: 'idle', t: 0, ang: -2.9, bend: 0, bob: null, fish: null, wait: 0, from: null, to: 0 };
function rodTipLocal() { const a = rod.ang + rod.bend * 0.3; return { x: ROD.butt.x + Math.cos(a) * ROD.len, y: ROD.butt.y + Math.sin(a) * ROD.len }; }
function updateRod(dt) {
  rod.t += dt;
  const tl = rodTipLocal(), tip = toWorld(tl.x, tl.y), crashed = game.phase === 'crashed';
  let target = -2.9;
  if (rod.state === 'idle') {
    rod.bob = null;
    if (!crashed && rod.t > 1.2) { rod.state = 'cast'; rod.t = 0; rod.from = { x: tip.x, y: tip.y }; rod.to = clamp(boat.x - rand(300, 440) * S, 30 * FS, boat.x - 270 * S); sfx.cast(); }
  } else if (rod.state === 'cast') {
    const p = Math.min(1, rod.t / 0.75);
    target = p < 0.2 ? -2.3 : -3.0;
    rod.bob = { x: lerp(rod.from.x, rod.to, p), y: lerp(rod.from.y, surf(rod.to), p) - Math.sin(Math.PI * p) * 70 * S };
    if (p >= 1) { rod.state = 'wait'; rod.t = 0; rod.wait = rand(2, 5); splash(rod.to, surf(rod.to), 5, 0.4); }
  } else if (rod.state === 'wait' || rod.state === 'bite') {
    const biting = rod.state === 'bite';
    rod.bob = { x: rod.to, y: surf(rod.to) + (biting && Math.sin(rod.t * 28) > 0 ? 6 * FS : -1 * FS) };
    if (biting) rod.bend = 0.5 + 0.3 * Math.sin(rod.t * 24);
    if (crashed) { rod.state = 'retrieve'; rod.t = 0; rod.from = { ...rod.bob }; }
    else if (!biting && rod.t > rod.wait) { rod.state = 'bite'; rod.t = 0; }
    else if (biting && rod.t > 0.5) {
      const kind = pick(['snapper', 'snapper', 'snapper', 'sardine', 'puffer']);
      rod.fish = makeFish(kind, rod.to + rand(-20, 20) * FS, surf(rod.to) + rand(50, 80) * FS); rod.fish.state = 'hooked'; rod.fish.hang = false; rod.fish.alpha = 0.6;
      rod.from = { x: rod.fish.x, y: rod.fish.y }; rod.state = 'reel'; rod.t = 0; rod.up = false; splash(rod.to, surf(rod.to), 9, 0.7); sfx.reel();
    }
  } else if (rod.state === 'reel') {
    const f = rod.fish, FIGHT = 1.2, AIR = 1.6;
    rod.bob = null; target = -2.6;
    let p = 0;
    if (!rod.up) {
      // under water: the fish darts side to side while the line drags it up to the surface
      const k = Math.min(1, rod.t / FIGHT), ox = f.x, oy = f.y;
      f.x = rod.from.x + Math.sin(rod.t * 7) * 22 * FS * (1 - k * 0.6); f.y = lerp(rod.from.y, surf(f.x) + 2 * FS, k * k);
      f.vx = (f.x - ox) / Math.max(dt, 1e-3); f.vy = (f.y - oy) / Math.max(dt, 1e-3); f.alpha = 0.6;
      rod.bend = 0.75 + 0.2 * Math.sin(rod.t * 18);
      if (Math.random() < 0.5) parts.push({ type: 'bubble', x: f.x + rand(-4, 4) * FS, y: f.y - f.s * 0.3, vx: rand(-10, 10) * FS, vy: -rand(40, 90) * FS, r: rand(1, 2.4) * FS, life: 0.8, max: 0.8, seed: rand(0, 6) });
      if (Math.random() < 0.25) parts.push({ type: 'foam', x: rod.to + rand(-10, 10) * FS, w: rand(6, 12) * FS, life: 0.6, max: 0.6, vx: 0 });
      if (k >= 1) {
        // bursts out of the water
        rod.up = true; rod.t = 0; rod.from = { x: f.x, y: surf(f.x) }; f.hang = true; f.alpha = 1; f.vx = 0; f.vy = 0;
        splash(f.x, surf(f.x), 16, 1.1); sfx.splash(0.15);
      }
    } else {
      p = Math.min(1, rod.t / AIR);
      rod.bend = 1 - p * 0.7;
      if (p < 0.72) { const q = ease(p / 0.72); f.x = lerp(rod.from.x, tip.x, q); f.y = lerp(rod.from.y, tip.y + 18 * FS, q); }
      else { const q = ease((p - 0.72) / 0.28), crate = toWorld(CRATE.x, CRATE.y - 44); f.x = lerp(tip.x, crate.x, q); f.y = lerp(tip.y + 18 * FS, crate.y, q) - Math.sin(Math.PI * q) * 30 * S; }
      if (p < 0.5 && Math.random() < 0.6) parts.push({ type: 'drop', x: f.x + rand(-1, 1) * f.s * 0.4, y: f.y + f.s * 0.6, vx: rand(-15, 15) * FS, vy: rand(20, 70) * FS, r: rand(1, 2.2) * FS, life: 0.8, max: 0.8 });
    }
    if (p >= 1) { landFish(f, 'Sipho', 'reeled in'); crew.siphoHappy = 1.4; rod.fish = null; rod.state = 'idle'; rod.t = 0; }
  } else if (rod.state === 'retrieve') {
    const p = Math.min(1, rod.t / 0.5);
    rod.bob = { x: lerp(rod.from.x, tip.x, ease(p)), y: lerp(rod.from.y, tip.y, ease(p)) - Math.sin(Math.PI * p) * 30 * S };
    if (p >= 1) { rod.state = 'idle'; rod.t = 0; rod.bob = null; }
  }
  if (rod.state !== 'bite' && rod.state !== 'reel') rod.bend = lerp(rod.bend, 0, 1 - Math.exp(-6 * dt));
  rod.ang = lerp(rod.ang, target, 1 - Math.exp(-10 * dt));
}

/* ================= fish & friends ================= */
function makeFish(kind, x, y) {
  const K = KINDS[kind];
  return { kind, x, y, vx: 0, vy: 0, s: rand(K.size[0], K.size[1]) * FS, pal: K.pals ? pick(K.pals) : null, air: false, state: 'jump', alpha: 1, wig: rand(0, TAU), claimed: false };
}
function spawnJumper(kind) {
  const K = KINDS[kind], left = 26 * FS, right = boat.x - 260 * S;
  if (right - left < 60) return;
  const f = makeFish(kind, rand(left, right), waterY + 70 * FS);
  f.vy = -Math.sqrt(2 * GRAV * H * rand(K.h[0], K.h[1])); f.vx = (Math.random() < 0.62 ? 1 : -1) * rand(K.vx[0], K.vx[1]) * FS;
  fishes.push(f);
}
function panic(f, delay, dir) {
  f.state = 'flee'; f.delay = delay; f.claimed = false; f.alpha = 1; f.hang = false;
  f.dir = dir || (f.x < boat.x ? -1 : 1); const slow = f.kind === 'puffer' ? 0.4 : 1; f.speed = rand(300, 520) * FS * slow; f.kick = Math.sqrt(2 * GRAV * H * rand(0.08, 0.22) * slow);
}
function updateFish(dt) {
  for (let i = fishes.length - 1; i >= 0; i--) {
    const f = fishes[i];
    if (f.state === 'caught' || f.state === 'hooked') continue;
    if (f.air && Math.random() < dt * 7) { const v = Math.hypot(f.vx, f.vy) || 1; parts.push({ type: 'drop', x: f.x - f.vx / v * f.s, y: f.y - f.vy / v * f.s, vx: f.vx * 0.2, vy: 20 * FS, r: rand(1, 2) * FS, life: 0.8, max: 0.8 }); }
    if (f.kind === 'gold' && f.air && Math.random() < 0.3) parts.push({ type: 'spark', x: f.x + rand(-6, 6) * FS, y: f.y + rand(-6, 6) * FS, vx: rand(-20, 20) * FS, vy: rand(-20, 20) * FS, r: rand(1, 2) * FS, life: 0.4, max: 0.4, c: '#ffe28a' });
    if (f.state === 'jump') {
      const sy = surf(f.x);
      if (!f.air) { if (f.y < sy) { f.air = true; splash(f.x, sy, 8, 0.8); } }
      else { f.vy += GRAV * dt; if (f.vy > 0 && f.y > sy) { f.air = false; f.state = 'sub'; f.vy *= 0.4; splash(f.x, sy, 10, 1); if (Math.random() < 0.35) sfx.splash(0.05); } }
      f.x += f.vx * dt; f.y += f.vy * dt;
    } else if (f.state === 'sub') {
      f.vy *= Math.exp(-3 * dt); f.vx *= Math.exp(-0.8 * dt); f.x += f.vx * dt; f.y += f.vy * dt; f.alpha -= dt * 0.9;
      if (f.alpha <= 0) { fishes.splice(i, 1); continue; }
    } else if (f.state === 'flee') {
      if (f.delay > 0) { f.delay -= dt; continue; }
      if (f.fadeIn) { f.alpha = Math.min(1, f.alpha + dt * 5); if (f.alpha >= 1) f.fadeIn = false; }
      const sy = surf(f.x);
      if (f.y > sy) {
        f.vy -= GRAV * 1.7 * dt; f.vy *= Math.exp(-1.2 * dt);
        if (f.vy < 0 && f.y + f.vy * dt <= sy) { f.vy = -f.kick * rand(0.8, 1.15); f.air = true; splash(f.x, sy, 6, 0.7); } else f.air = false;
      } else { f.air = true; f.vy += GRAV * dt; if (f.vy > 0 && f.y + f.vy * dt > sy) { splash(f.x, sy, 6, 0.7); f.air = false; } }
      f.vx = lerp(f.vx, f.dir * f.speed, 1 - Math.exp(-3 * dt)); f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -90 * FS || f.x > W + 90 * FS) { if (f.claimed && gun.target === f) { gun.target = null; gun.state = 'idle'; } fishes.splice(i, 1); continue; }
    }
  }
}
function spawnSardines(fromEdge) {
  const n = W < 600 ? 16 : 28;
  sardines = Array.from({ length: n }, () => ({ ox: rand(-1, 1), oy: rand(-1, 1), ph: rand(0, TAU), x: fromEdge ? rand(-W * 0.6, -30) : -1, y: lerp(waterY, H, 0.5), init: !fromEdge, dir: 1, s: rand(5, 7) * FS }));
}
function updateSardines(dt) {
  const cx = W * 0.3 + Math.sin(T * 0.21) * W * 0.2, cy = waterY + (H - waterY) * 0.44 + Math.sin(T * 0.5) * 18 * FS, d = Math.cos(T * 0.21) >= 0 ? 1 : -1;
  for (const m of sardines) {
    const tx = cx + m.ox * 70 * FS + Math.sin(T * 1.3 + m.ph) * 8 * FS, ty = cy + m.oy * 26 * FS + Math.cos(T * 1.1 + m.ph) * 5 * FS;
    if (m.init) { m.x = tx; m.y = ty; m.init = false; }
    const k = Math.min(1, dt * 1.6), dx = tx - m.x;
    m.x += dx * k; m.y += (ty - m.y) * k; m.dir = dx > 3 ? 1 : dx < -3 ? -1 : d;
  }
}
function updateJellies(dt) {
  for (const j of jellies) {
    const pulse = Math.max(0, Math.sin(T * 2.4 + j.ph));
    j.y -= pulse * 10 * FS * dt; j.x += j.vx * FS * dt; j.vx *= Math.exp(-0.3 * dt);
    if (j.y < waterY + 40 * FS) { j.y = H - (H - waterY) * 0.25; j.x = rand(0.05, 0.65) * W; j.vx = rand(-6, 6); }
    if (j.x < -30) j.x = W * 0.6; if (j.x > W + 30) j.x = 10;
  }
}
function updateCritters(dt) {
  const tu = turtle;
  tu.x += tu.vx * FS * dt; tu.y = waterY + (H - waterY) * 0.33 + Math.sin(T * 0.4) * 10 * FS; tu.vx = lerp(tu.vx, Math.sign(tu.vx) * 26, dt * 0.5);
  if (tu.x > W + 60 * FS) { tu.x = -60 * FS; tu.vx = 26; } if (tu.x < -80 * FS) { tu.x = W + 60 * FS; tu.vx = -26; }
  const m = manta;
  m.x += m.dir * 18 * FS * dt; if (m.x < -120 * FS) { m.x = W + 120 * FS; } if (m.x > W + 140 * FS) m.x = -120 * FS;
  const hideTarget = game.phase === 'crashed' && mine && mine.state === 'boom' ? 1 : game.phase === 'waiting' && game.t > 1.5 ? 0 : octo.hide > 0.5 ? 1 : 0;
  octo.hide = lerp(octo.hide, hideTarget, 1 - Math.exp(-(hideTarget > octo.hide ? 8 : 1.5) * dt));
  octo.pale = Math.max(0, octo.pale - dt * 0.4);
  crab.x += crab.vx * FS * dt;
  if (crab.x > W * 0.55) crab.vx = -Math.abs(crab.vx); if (crab.x < W * 0.05) crab.vx = Math.abs(crab.vx);
  crab.vx = lerp(crab.vx, Math.sign(crab.vx) * 14, dt * 0.6);
}
function spawnShark() {
  const dir = Math.random() < 0.5 ? 1 : -1, by = lerp(waterY + 70 * FS, deepY + 10 * FS, Math.random());
  sharks.push({ kind: Math.random() < 0.4 ? 'tiger' : 'shark', x: dir > 0 ? -240 * FS : W + 240 * FS, by, y: by, vx: dir * rand(70, 110) * FS, vy: 0, s: rand(38, 46) * FS, state: 'patrol', ph: rand(0, TAU), wig: rand(0, TAU), chomp: 0, gape: 0, alpha: 1 });
}
function sharkLunge() {
  let best = null;
  for (const f of fishes) if (f.state === 'jump' && f.air && !f.claimed && f.vy < -120 * FS && f.x < boat.x - 300 * S && f.x > 40 * FS) { best = f; break; }
  if (!best) return false;
  const tUp = -best.vy / GRAV, apexY = best.y - (best.vy * best.vy) / (2 * GRAV), ax = best.x + best.vx * tUp, startY = waterY + 150 * FS;
  const v = Math.sqrt(2 * GRAV * Math.min(waterY - H * 0.2, Math.max(H * 0.2, waterY - apexY + 20 * FS))), tt = (startY - waterY) / v + v / GRAV;
  best.claimed = true;
  sharks.push({ kind: Math.random() < 0.4 ? 'tiger' : 'shark', gape: 0, x: ax - best.vx * 0.15, y: startY, vx: best.vx * 0.4, vy: -v, s: rand(40, 48) * FS, state: 'lunge', air: false, delay: Math.max(0, tUp - tt), wig: rand(0, TAU), chomp: 0, alpha: 1, target: best });
  return true;
}
function updateSharks(dt) {
  for (let i = sharks.length - 1; i >= 0; i--) {
    const sh = sharks[i];
    sh.chomp = Math.max(0, sh.chomp - dt);
    if (sh.state === 'patrol') {
      sh.x += sh.vx * dt; sh.y = sh.by + Math.sin(T * 0.9 + sh.ph) * 10 * FS;
      if ((sh.vx > 0 && sh.x > W + 260 * FS) || (sh.vx < 0 && sh.x < -260 * FS)) sharks.splice(i, 1);
    } else if (sh.state === 'flee') {
      sh.vx = lerp(sh.vx, sh.dir * 520 * FS, 1 - Math.exp(-2 * dt)); sh.x += sh.vx * dt; sh.y = lerp(sh.y, deepY + 20 * FS, 1 - Math.exp(-1 * dt));
      if (sh.x < -280 * FS || sh.x > W + 280 * FS) sharks.splice(i, 1);
    } else if (sh.state === 'lunge') {
      if (sh.delay > 0) { sh.delay -= dt; continue; }
      const sy = surf(sh.x);
      if (!sh.air) { if (sh.y < sy) { sh.air = true; splash(sh.x, sy, 16, 1.1); } }
      else {
        sh.vy += GRAV * dt;
        sh.gape = lerp(sh.gape || 0, sh.target && sh.vy < 0 ? 1 : 0, 1 - Math.exp(-8 * dt));
        if (Math.random() < 0.7) { const a = Math.atan2(sh.vy, sh.vx), u = rand(-1.4, 1.4) * sh.s; parts.push({ type: 'drop', x: sh.x + Math.cos(a) * u, y: sh.y + Math.sin(a) * u, vx: rand(-30, 30) * FS, vy: rand(0, 50) * FS, r: rand(1.4, 3) * FS, life: 0.9, max: 0.9 }); }
        const t = sh.target;
        if (t && t.state === 'jump') {
          const a = Math.atan2(sh.vy, sh.vx), hx = sh.x + Math.cos(a) * sh.s * 1.55, hy = sh.y + Math.sin(a) * sh.s * 1.55;
          if (Math.hypot(hx - t.x, hy - t.y) < sh.s * 1.25) {
            const k = fishes.indexOf(t); if (k >= 0) fishes.splice(k, 1);
            if (gun.target === t) { gun.target = null; gun.state = 'idle'; }
            sh.chomp = 0.35; sh.target = null; sh.gape = 0;
            sparkBurst(t.x, t.y, 14, '#ffd0d0');
            parts.push({ type: 'text', x: t.x, y: t.y - 20 * FS, text: 'CHOMP!', life: 1, max: 1, c: '#ff9f8a' });
            say(`A shark snatched a ${KINDS[t.kind].name}`); sfx.chomp();
          }
        }
        if (sh.vy > 0 && sh.y > sy) { sh.state = 'dive'; sh.vy *= 0.4; splash(sh.x, sy, 22, 1.3); sfx.splash(0.2); }
      }
      sh.x += sh.vx * dt; sh.y += sh.vy * dt;
    } else if (sh.state === 'dive') {
      // level out under the surface and swim on
      const dir = sh.vx >= 0 ? 1 : -1, ty = Math.max(waterY + 80 * FS, Math.min(deepY - 10 * FS, sh.y));
      sh.vx = lerp(sh.vx, dir * 110 * FS, 1 - Math.exp(-1.5 * dt));
      sh.vy = lerp(sh.vy, (ty - sh.y) * 1.2, 1 - Math.exp(-2.5 * dt));
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.gape = lerp(sh.gape || 0, 0, 1 - Math.exp(-6 * dt)); sh.swimT = (sh.swimT || 0) + dt;
      if (sh.swimT > 1.5 && Math.abs(sh.vy) < 25 * FS) { sh.state = 'patrol'; sh.ph = rand(0, TAU); sh.by = sh.y - Math.sin(T * 0.9 + sh.ph) * 10 * FS; }
      else if (sh.x < -280 * FS || sh.x > W + 280 * FS) sharks.splice(i, 1);
    }
  }
}
function dolphinPod() {
  const n = 3 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) dolphins.push({ x: boat.x - 240 * S - i * 12 * FS, y: waterY + rand(40, 90) * FS, vx: -rand(270, 330) * FS, vy: -rand(150, 300) * FS, s: rand(20, 25) * FS, delay: i * 0.3, kick: Math.sqrt(2 * GRAV * H * rand(0.12, 0.2)), air: false, wig: rand(0, TAU) });
  sfx.dolphin();
}
function orcaPod() {
  const n = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) dolphins.push({ kind: 'orca', x: boat.x - 250 * S - i * 30 * FS, y: waterY + rand(60, 110) * FS, vx: -rand(220, 260) * FS, vy: -rand(150, 260) * FS, s: rand(30, 36) * FS, delay: i * 0.45, kick: Math.sqrt(2 * GRAV * H * rand(0.08, 0.13)), air: false, wig: rand(0, TAU) });
  sfx.whale();
}
function updateDolphins(dt) {
  for (let i = dolphins.length - 1; i >= 0; i--) {
    const d = dolphins[i];
    if (d.delay > 0) { d.delay -= dt; continue; }
    const sy = surf(d.x);
    if (d.y > sy) { d.vy -= GRAV * 1.6 * dt; d.vy *= Math.exp(-0.8 * dt); if (d.vy < 0 && d.y + d.vy * dt <= sy) { d.vy = -d.kick * rand(0.9, 1.1); d.air = true; splash(d.x, sy, 10, 0.9); } else d.air = false; }
    else { d.air = true; d.vy += GRAV * dt; if (d.vy > 0 && d.y + d.vy * dt > sy) { splash(d.x, sy, 12, 1); d.air = false; } }
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.air && Math.random() < 0.5) parts.push({ type: 'drop', x: d.x + rand(-1, 1) * d.s, y: d.y + rand(0, 0.3) * d.s, vx: rand(-20, 20) * FS, vy: rand(0, 40) * FS, r: rand(1.2, 2.6) * FS, life: 0.8, max: 0.8 });
    if (d.x < -260 * FS) dolphins.splice(i, 1);
  }
}
function whaleBreach() {
  if (breach) return;
  const s = 44 * FS, L = s * 6.4;
  const x = clamp(W * 0.3, 60 * FS + L * 0.45, Math.max(60 * FS + L * 0.45, boat.x - 260 * S - L * 0.45));
  const apex = clamp(H * 0.22, L * 0.3, Math.max(L * 0.3, waterY - L * 0.5 - 16 * FS));
  const v0 = Math.sqrt(2 * GRAV * apex);
  breach = { x, y: waterY + L * 0.56, vx: -26 * FS, vy: -v0, v0, s, L, state: 'shadow', t: 0, ta: 0, tAir: 2 * v0 / GRAV, ang: -1.3, twist: 1, alpha: 1, broke: false, ring: -1 };
  sfx.whale();
}
function breachNose(b) { return { x: b.x + Math.cos(b.ang) * b.L * 0.5, y: b.y + Math.sin(b.ang) * b.L * 0.5 }; }
function breachSheet(b, n) {
  for (let k = 0; k < n; k++) {
    const u = rand(-0.5, 0.5), side = rand(-1, 1) * b.L * 0.1;
    const px = b.x + Math.cos(b.ang) * u * b.L - Math.sin(b.ang) * side, py = b.y + Math.sin(b.ang) * u * b.L + Math.cos(b.ang) * side;
    if (py < surf(px) - 4 * FS) parts.push({ type: 'drop', x: px, y: py, vx: b.vx * 0.3 + rand(-40, 40) * FS, vy: (b.state === 'air' ? b.vy * 0.35 : -b.v0 * 0.2) + rand(0, 80) * FS, r: rand(1.4, 3.8) * FS, life: 1.1, max: 1.1 });
  }
}
function breachImpact(b) {
  const sy = surf(b.x), span = Math.abs(Math.cos(b.ang)) * b.L * 0.5 + 30 * FS;
  for (let i = 0; i < 7; i++) { const sx = b.x + lerp(-span, span, i / 6); splash(sx, surf(sx), 26, 2.1); }
  for (let i = 0; i < 160; i++) {
    const sx = b.x + rand(-span, span), up = Math.sqrt(2 * GRAV * H * rand(0.04, 0.3) * (1 - Math.abs(sx - b.x) / span * 0.6));
    parts.push({ type: 'drop', x: sx, y: surf(sx), vx: (sx - b.x) * rand(0.8, 2.2) + rand(-40, 40) * FS, vy: -up, r: rand(1.8, 5) * FS, life: 2.4, max: 2.4 });
  }
  for (let i = 0; i < 22; i++) parts.push({ type: 'mist', x: b.x + rand(-span, span), y: sy - rand(10, H * 0.22), vx: rand(-40, 40) * FS, vy: -rand(10, 50) * FS, r: rand(18, 40) * FS, life: 2.8, max: 2.8 });
  for (let i = 0; i < 14; i++) parts.push({ type: 'foam', x: b.x + rand(-span * 1.2, span * 1.2), w: rand(26, 60) * FS, life: 4, max: 4, vx: rand(-14, 14) * FS });
  for (let i = 0; i < 60; i++) parts.push({ type: 'bubble', x: b.x + rand(-span, span), y: sy + rand(10, 90) * FS, vx: rand(-40, 40) * FS, vy: -rand(20, 70) * FS, r: rand(2, 6) * FS, life: rand(1.5, 2.8), max: 2.8, seed: rand(0, 6) });
  b.ring = 0; shake = Math.max(shake, reduceMotion ? 0 : 0.5); sfx.splashBig();
}
function updateWhales(dt) {
  const w = deepWhale;
  if (w.wait > 0) w.wait -= dt;
  else {
    w.x += w.dir * (w.flee ? 180 : 20) * FS * dt;
    if ((w.dir > 0 && w.x > W + 260 * FS) || (w.dir < 0 && w.x < -260 * FS)) { w.dir = -w.dir; w.wait = rand(4, 10); w.flee = false; }
  }
  const b = breach;
  if (!b) return;
  b.t += dt; if (b.ring >= 0) b.ring += dt;
  if (b.state === 'shadow') {
    // dark shape rising from the deep: bubbles and an upwelling at the surface
    if (Math.random() < 0.6) parts.push({ type: 'bubble', x: b.x + rand(-0.12, 0.12) * b.L, y: waterY + rand(30, 90) * FS, vx: rand(-10, 10) * FS, vy: -rand(40, 90) * FS, r: rand(1.5, 4) * FS, life: 1.2, max: 1.2, seed: rand(0, 6) });
    if (b.t > 1.1) { b.state = 'rise'; b.t = 0; }
  } else if (b.state === 'rise') {
    b.x += b.vx * dt; b.y += b.vy * dt;
    const n = breachNose(b);
    if (!b.broke && n.y < surf(n.x)) { b.broke = true; splash(n.x, surf(n.x), 40, 1.9); for (let i = 0; i < 8; i++) parts.push({ type: 'mist', x: n.x + rand(-20, 20) * FS, y: surf(n.x) - rand(0, 30) * FS, vx: rand(-30, 30) * FS, vy: -rand(30, 70) * FS, r: rand(10, 22) * FS, life: 1.6, max: 1.6 }); }
    if (b.broke) breachSheet(b, 7);
    if (b.y < surf(b.x)) { b.state = 'air'; b.ta = 0; splash(b.x, surf(b.x), 30, 1.6); }
  } else if (b.state === 'air') {
    b.ta += dt; b.vy += GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const p = clamp(b.ta / b.tAir, 0, 1), e = p * p * (3 - 2 * p);
    b.ang = -1.3 - 1.3 * e;                    // rises nose-up, then tips back
    b.twist = 1 - 0.28 * Math.sin(Math.PI * p); // rolls to show its belly
    breachSheet(b, p < 0.6 ? 9 : 4);
    if (b.vy > 0 && b.y > surf(b.x)) { b.state = 'dive'; b.t = 0; breachImpact(b); }
  } else {
    // roll back upright under the surface and swim away
    const ty = waterY + (H - waterY) * 0.38;
    b.vx = lerp(b.vx, -95 * FS, 1 - Math.exp(-1.2 * dt));
    b.vy = lerp(b.vy, (ty - b.y) * 1.2, 1 - Math.exp(-2 * dt));
    b.x += b.vx * dt; b.y += b.vy * dt;
    let head = Math.atan2(b.vy, b.vx); if (head > 0) head -= TAU;
    b.ang = lerp(b.ang, head, 1 - Math.exp(-1.8 * dt));
    b.twist = lerp(b.twist, -1, 1 - Math.exp(-1.6 * dt));
    if (b.x < -b.L * 0.6) breach = null;
  }
}
function updateSpout(dt) {
  spoutT -= dt;
  if (spoutT <= 0 && !spout && game.phase !== 'crashed') { spoutT = rand(9, 16); spout = { x: rand(0.15, 0.55) * W, t: 0 }; }
  if (spout) {
    spout.t += dt;
    if (spout.t > 0.5 && spout.t < 1.1 && Math.random() < 0.8) parts.push({ type: 'mist', x: spout.x + rand(-2, 2) * FS, y: lerp(horizonY, waterY, 0.45) - 3 * FS, vx: rand(-8, 8) * FS, vy: -rand(50, 80) * FS, r: rand(1.5, 3) * FS, life: 1.2, max: 1.2 });
    if (spout.t > 2.6) spout = null;
  }
}

/* ================= sea mine & blast ================= */
function minePose() { const sw = Math.sin(T * 1.6) * 0.08 - boat.ang * 0.8, d = CHAIN + MINE_R; return { x: HANG.x + Math.sin(sw) * d, y: HANG.y + Math.cos(sw) * d, sw }; }
function dropMine() {
  const pose = minePose(), p = toWorld(pose.x, pose.y);
  // lob it in an arc so it splashes down in the middle of the sea
  const tx = W * 0.5, ty = lerp(waterY, bedY(tx), 0.58), vy0 = -H * 0.75, drop = Math.max(10, surf(tx) - p.y);
  const tf = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * GRAV * drop)) / GRAV;
  mine = { x: p.x, y: p.y, vx: (tx - p.x) / tf, vy: vy0, tx, ty, R: MINE_R * S, rot: boat.ang - pose.sw, state: 'air', t: 0, phase: 0, light: 0, cd: 1.9, heat: 0 };
  boat.alarm = 2.2; sfx.clank(); sfx.siren();
}
function updateMine(dt) {
  const m = mine;
  if (!m) return;
  m.t += dt;
  if (m.state !== 'boom') {
    m.cd = Math.max(0, m.cd - dt);
    const depthFrac = clamp((m.y - waterY) / Math.max(1, deepY - waterY), 0, 1);
    const interval = m.state === 'armed' ? 0.07 : m.state === 'air' ? 0.3 : lerp(0.26, 0.1, depthFrac);
    const before = m.phase; m.phase += dt / interval;
    if (Math.floor(m.phase) !== Math.floor(before)) sfx.beep();
    m.light = (m.phase % 1) < 0.5 ? 1 : 0.15;
    m.heat = m.state === 'armed' ? Math.min(1, m.t / 0.5) : m.state === 'sink' ? 0.25 * depthFrac : 0;
  }
  if (m.state === 'air') {
    m.vy += GRAV * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.rot += 1.5 * dt;
    const sy = surf(m.x);
    if (m.vy > 0 && m.y > sy) { m.state = 'sink'; splash(m.x, sy, 28, 1.5); parts.push({ type: 'foam', x: m.x, w: 34 * S, life: 2, max: 2, vx: 0 }); sfx.splash(0.3); m.vx *= 0.25; m.vy = H * 0.25; }
  } else if (m.state === 'sink') {
    m.vy = Math.min(m.vy + H * 0.9 * dt, H * 0.55);
    m.vx += ((m.tx - m.x) * 2.5 - m.vx) * Math.min(1, dt * 3);
    m.x += m.vx * dt; m.y += m.vy * dt; m.rot += 0.8 * dt;
    if (Math.random() < 0.7) parts.push({ type: 'bubble', x: m.x + rand(-8, 8) * S, y: m.y - m.R, vx: 0, vy: -40 * S, r: rand(1.5, 3.5) * FS, life: 2, max: 2, seed: rand(0, 6) });
    if (m.y >= m.ty) { m.y = m.ty; m.state = 'armed'; m.t = 0; }
  } else if (m.state === 'armed') {
    m.x += Math.sin(T * 60) * 0.6 * S;
    for (let k = 0; k < 3; k++) {
      const a = rand(0, TAU), d = rand(70, 120) * S;
      parts.push({ type: 'suck', x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, cx: m.x, cy: m.y, r: rand(1.2, 2.8) * FS, life: 0.4, max: 0.4 });
    }
    if (m.t > 0.55) { explode(m.x, m.y); m.state = 'boom'; m.t = 0; }
  }
}
function explode(x, y) {
  flash = 1; shake = reduceMotion ? 0 : 1.1;
  const blobs = []; for (let i = 0; i < 80; i++) blobs.push({ u: Math.pow(Math.random(), 0.75), off: rand(-1, 1), r: rand(0.6, 1.25), sd: rand(0, TAU), jet: i < 18 ? (i % 2 ? -1 : 1) * rand(0.35, 0.9) : 0 });
  const crown = []; for (let i = 0; i < 16; i++) crown.push({ off: (i / 15) * 2 - 1 + rand(-0.04, 0.04), h: rand(0.55, 1.2), w: rand(0.7, 1.3) });
  blast = { x, y, t: 0, blobs, crown }; bump = { x, t: 0 };
  rings.push({ x, y, r: 10 * S, v: 720 * S, life: 1, delay: 0, w: 4 }, { x, y, r: 0, v: 540 * S, life: 1, delay: 0.08, w: 3 }, { x, y, r: 0, v: 400 * S, life: 1, delay: 0.2, w: 2 }, { x, y, r: 0, v: 300 * S, life: 1, delay: 0.32, w: 6, dark: true });
  for (let i = 0; i < 30; i++) { const side = Math.random() < 0.5 ? -1 : 1, sx = x + side * rand(10, 120) * S; parts.push({ type: 'silt', x: sx, y: bedY(sx) - rand(0, 12) * FS, vx: side * rand(60, 240) * S, vy: -rand(20, 110) * S, r: rand(10, 26) * FS, life: rand(2.6, 4.2), max: 4.2 }); }
  for (let i = 0; i < 80; i++) { const a = rand(0, TAU), sp = rand(60, 520) * S; parts.push({ type: 'bubble', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(2, 10) * FS, life: rand(2, 3.8), max: 3.8, seed: rand(0, 6) }); }
  for (let i = 0; i < 22; i++) { const a = rand(0, TAU), sp = rand(160, 460) * S; parts.push({ type: 'debris', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: rand(0, TAU), vr: rand(-8, 8), r: rand(3, 8) * S, life: 2.8, max: 2.8, c: pick(['#5b4a3c', '#6d6f6a', '#3e4a50', '#8a6b4f', '#c4756a']) }); }
  for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(120, 520) * S; parts.push({ type: 'ember', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(1.5, 3.5) * S, life: rand(0.8, 1.6), max: 1.6 }); }
  setTimeout(() => {
    if (!blast) return;
    for (let i = 0; i < 150; i++) { const sx = x + rand(-100, 100) * S, sp = Math.sqrt(2 * GRAV * H * rand(0.08, 0.6)); parts.push({ type: 'drop', x: sx, y: surf(sx), vx: (sx - x) * 1.8 + rand(-60, 60) * S, vy: -sp, r: rand(2, 5.5) * FS, life: 2.8, max: 2.8 }); }
    for (let i = 0; i < 18; i++) parts.push({ type: 'mist', x: x + rand(-60, 60) * S, y: surf(x) - rand(40, H * 0.4), vx: rand(-30, 30) * S, vy: -rand(10, 40) * S, r: rand(16, 34) * S, life: 2.6, max: 2.6 });
  }, 150);
  for (let i = 0; i < 10; i++) parts.push({ type: 'foam', x: x + rand(-160, 160) * S, w: rand(24, 54) * S, life: 3, max: 3, vx: rand(-24, 24) * S });
  boat.liftV = -H * 0.3; boat.rock = 0.24; boat.alarm = 2.5;
  for (const f of fishes) if (f.state === 'jump' || f.state === 'sub') panic(f, rand(0, 0.5));
  for (const m of sardines) { const f = makeFish('sardine', m.x, m.y); f.s = m.s * 1.3; panic(f, Math.min(0.4, Math.abs(m.x - x) / (W * 1.5))); fishes.push(f); }
  sardines = [];
  for (let i = 0; i < 20; i++) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const f = makeFish(pickKind(game.crashAt), x + dir * rand(20, 280) * S, y + rand(-90, 40) * S);
    f.vx = dir * rand(100, 300) * FS; f.vy = -rand(150, 450) * FS; panic(f, 0.15 + i * 0.09 + rand(0, 0.12), dir); f.speed *= rand(0.55, 1.15); f.kick *= rand(0.7, 1.25); f.alpha = 0; f.fadeIn = true; fishes.push(f);
  }
  for (const sh of sharks) if (sh.state === 'patrol') { sh.state = 'flee'; sh.dir = sh.x < x ? -1 : 1; }
  for (const d of dolphins) d.vx *= 1.6;
  deepWhale.flee = true; deepWhale.dir = deepWhale.x < boat.x ? -1 : 1; deepWhale.wait = 0;
  turtle.vx = (turtle.x < x ? -1 : 1) * 160;
  for (const j of jellies) j.vx = (j.x < x ? -1 : 1) * 60;
  crab.vx = (crab.x < x ? -1 : 1) * 90;
  const ox = Math.min(W * 0.55, boat.x - 300 * S);
  for (let i = 0; i < 12; i++) parts.push({ type: 'ink', x: ox + rand(-10, 10) * FS, y: bedY(ox) - rand(10, 30) * FS, vx: rand(-30, 30) * FS, vy: rand(-30, -5) * FS, r: rand(6, 12) * FS, life: 2.4, max: 2.4 });
  octo.pale = 1;
  sfx.boom();
}

/* ================= particles ================= */
function splash(x, y, n, power) {
  for (let i = 0; i < n; i++) { const sp = rand(120, 380) * FS * power, a = -Math.PI / 2 + rand(-0.7, 0.7); parts.push({ type: 'drop', x: x + rand(-6, 6) * FS, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(1.4, 3.2) * FS, life: 1.3, max: 1.3 }); }
  for (let i = 0; i < n / 2; i++) parts.push({ type: 'bubble', x: x + rand(-8, 8) * FS, y: y + rand(6, 26) * FS, vx: rand(-30, 30) * FS, vy: -20 * FS, r: rand(1.4, 3) * FS, life: 1.2, max: 1.2, seed: rand(0, 6) });
  if (n >= 8) parts.push({ type: 'foam', x, w: (8 + n) * FS, life: 1.2, max: 1.2, vx: 0 });
}
function sparkBurst(x, y, n, c) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(60, 220) * FS; parts.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(1.2, 2.6) * FS, life: rand(.25, .5), max: .5, c }); }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    let dead = p.life <= 0;
    switch (p.type) {
      case 'drop': p.vy += GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vy > 0 && p.y > surf(p.x)) dead = true; break;
      case 'bubble':
        p.vx *= Math.exp(-2.5 * dt); p.vy += (-H * 0.3 - p.vy) * Math.min(1, dt * 2);
        p.x += (p.vx + Math.sin(T * 5 + p.seed) * 12 * FS) * dt; p.y += p.vy * dt; if (p.y < surf(p.x)) dead = true; break;
      case 'spark': p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * FS * dt; break;
      case 'ember': p.vx *= Math.exp(-2.2 * dt); p.vy = p.vy * Math.exp(-2.2 * dt) + 30 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; break;
      case 'text': p.y -= 38 * FS * dt; break;
      case 'smoke': p.x += p.vx * dt; p.y += p.vy * dt; p.r += 7 * S * dt; p.vx -= 4 * S * dt; break;
      case 'mist': p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * FS * dt; p.r += 6 * FS * dt; break;
      case 'silt': p.vx *= Math.exp(-1.3 * dt); p.vy = p.vy * Math.exp(-1.6 * dt) + 5 * FS * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 9 * FS * dt; break;
      case 'ink': p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-dt); p.vy *= Math.exp(-dt); p.r += 10 * FS * dt; break;
      case 'suck': { const k = 1 - p.life / p.max; p.x = lerp(p.x, p.cx, k * 0.25); p.y = lerp(p.y, p.cy, k * 0.25); break; }
      case 'foam': p.x += p.vx * dt; break;
      case 'debris': p.vx *= Math.exp(-2 * dt); p.vy += (H * 0.12 - p.vy) * Math.min(1, dt * 1.5); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; break;
    }
    if (dead) parts.splice(i, 1);
  }
  if (parts.length > 1400) parts.splice(0, parts.length - 1400);
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (r.delay > 0) { r.delay -= dt; continue; }
    r.r += r.v * dt; r.life -= dt * 0.9; if (r.life <= 0) rings.splice(i, 1);
  }
  if (blast) {
    blast.t += dt;
    if (blast.t > 0.3 && blast.t < 1.8 && Math.random() < 0.85) parts.push({ type: 'bubble', x: blast.x + rand(-24, 24) * S, y: blast.y - rand(0, 30) * S, vx: rand(-15, 15) * FS, vy: -rand(90, 220) * FS, r: rand(2, 7) * FS, life: 2.4, max: 2.4, seed: rand(0, 6) });
    if (blast.t > 4.2) blast = null;
  }
  if (bump) { bump.t += dt; if (bump.t > 1.5) bump = null; }
}
