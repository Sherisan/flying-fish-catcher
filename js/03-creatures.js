/*
 * Flying Fish Catcher · 03-creatures.js
 * Creature artwork. A spine-based renderer bends fish and whale bodies as they swim, then
 * each species (flying fish, tuna, mahi-mahi, sailfish, snapper, sharks, humpback, dolphin, orca)
 * adds its own fins, colours and markings. Also: pufferfish, sardines, turtle, manta, octopus,
 * crab, jellyfish, the KINDS table and the field-guide text.
 */
'use strict';

/* ================= creature renderer ================= */
const SHADE = [[0, 'rgba(255,255,255,0.3)'], [0.2, 'rgba(255,255,255,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']];
function spine(L, amp, ph, waves) {
  const n = 14, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, k = 1 - t; pts.push({ t, x: (t - 0.5) * L, y: amp * L * k * k * Math.sin(ph - t * waves), a: 0 }); }
  for (let i = 0; i <= n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; pts[i].a = Math.atan2(b.y - a.y, b.x - a.x); }
  return pts;
}
function prof(P, t) {
  if (t <= P[0][0]) return [P[0][1], P[0][2]];
  for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const a = P[i - 1], b = P[i], u = (t - a[0]) / (b[0] - a[0]), s = u * u * (3 - 2 * u); return [lerp(a[1], b[1], s), lerp(a[2], b[2], s)]; }
  const l = P[P.length - 1]; return [l[1], l[2]];
}
function frameAt(sp, t) {
  const n = sp.length - 1, f = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i, a = sp[i], b = sp[i + 1];
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), a: lerp(a.a, b.a, u) };
}
function edgeAt(sp, P, L, t, side) {
  const fr = frameAt(sp, t), w = prof(P, t), d = (side < 0 ? -w[0] : w[1]) * L;
  return { x: fr.x - Math.sin(fr.a) * d, y: fr.y + Math.cos(fr.a) * d, a: fr.a };
}
function outlinePts(sp, P, L) {
  const top = [], bot = [];
  for (const p of sp) { const w = prof(P, p.t), nx = -Math.sin(p.a), ny = Math.cos(p.a); top.push([p.x - nx * w[0] * L, p.y - ny * w[0] * L]); bot.push([p.x + nx * w[1] * L, p.y + ny * w[1] * L]); }
  return { top, bot };
}
function bodyPath(o, nose) {
  const { top, bot } = o, n = top.length - 1;
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < n; i++) ctx.quadraticCurveTo(top[i][0], top[i][1], (top[i][0] + top[i + 1][0]) / 2, (top[i][1] + top[i + 1][1]) / 2);
  ctx.quadraticCurveTo(top[n][0], top[n][1], nose[0], nose[1]);
  ctx.quadraticCurveTo(bot[n][0], bot[n][1], (bot[n][0] + bot[n - 1][0]) / 2, (bot[n][1] + bot[n - 1][1]) / 2);
  for (let i = n - 1; i > 0; i--) ctx.quadraticCurveTo(bot[i][0], bot[i][1], (bot[i][0] + bot[i - 1][0]) / 2, (bot[i][1] + bot[i - 1][1]) / 2);
  ctx.lineTo(bot[0][0], bot[0][1]); ctx.closePath();
}
function spineLine(sp, L, yOff, t0, t1) {
  ctx.beginPath(); let first = true;
  for (const p of sp) {
    if (p.t < t0 || p.t > t1) continue;
    const x = p.x - Math.sin(p.a) * yOff * L, y = p.y + Math.cos(p.a) * yOff * L;
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
}
function fin(sp, P, L, t, side, base, height, sweep, fill, stroke, curve) {
  const e = edgeAt(sp, P, L, t, side);
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a); if (side > 0) ctx.scale(1, -1);
  const b = base * L, h = height * L, sw = sweep * L, c = curve == null ? 0.35 : curve;
  ctx.beginPath(); ctx.moveTo(b * 0.5, L * 0.006);
  ctx.quadraticCurveTo(b * 0.25, -h * 0.75, -sw, -h);
  ctx.quadraticCurveTo(-b * 0.3 - sw * 0.25, -h * c, -b * 0.5, L * 0.006);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(0.5, L * 0.008); ctx.stroke(); }
  ctx.restore();
}
function ridge(sp, P, L, t0, t1, side, hFn, fill, stroke, rays) {
  const n = 16, base = [], tip = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, e = edgeAt(sp, P, L, lerp(t0, t1, u), side), h = hFn(u) * L;
    base.push([e.x, e.y]); tip.push([e.x - Math.sin(e.a) * h * side, e.y + Math.cos(e.a) * h * side]);
  }
  const path = () => {
    ctx.beginPath(); ctx.moveTo(base[0][0], base[0][1]);
    for (let i = 0; i <= n; i++) ctx.lineTo(tip[i][0], tip[i][1]);
    for (let i = n; i >= 0; i--) ctx.lineTo(base[i][0], base[i][1]);
    ctx.closePath();
  };
  path(); ctx.fillStyle = fill; ctx.fill();
  if (rays) {
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = rays; ctx.lineWidth = Math.max(0.4, L * 0.005); ctx.beginPath();
    for (let i = 1; i < n; i++) { ctx.moveTo(base[i][0], base[i][1]); ctx.lineTo(tip[Math.min(n, i + 1)][0], tip[Math.min(n, i + 1)][1]); }
    ctx.stroke(); ctx.restore();
  }
  if (stroke) { path(); ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(0.5, L * 0.007); ctx.stroke(); }
}
function sideFin(sp, L, t, yOff, len, wid, ang, fill, stroke) {
  const fr = frameAt(sp, t);
  ctx.save(); ctx.translate(fr.x - Math.sin(fr.a) * yOff * L, fr.y + Math.cos(fr.a) * yOff * L); ctx.rotate(fr.a + ang);
  const l = len * L, w = wid * L;
  ctx.beginPath(); ctx.moveTo(L * 0.01, -w * 0.35); ctx.quadraticCurveTo(-l * 0.45, -w * 1.1, -l, 0); ctx.quadraticCurveTo(-l * 0.5, w * 0.7, L * 0.01, w * 0.35); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(0.5, L * 0.007); ctx.stroke(); }
  ctx.restore();
}
function eyeAt(sp, L, e) {
  const fr = frameAt(sp, e.t), x = fr.x - Math.sin(fr.a) * e.y * L, y = fr.y + Math.cos(fr.a) * e.y * L;
  if (e.black) {
    const r = e.r * L;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; circle(x, y, r * 1.35); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, '#2a3440'); g.addColorStop(1, '#030507');
    ctx.fillStyle = g; circle(x, y, r); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; circle(x - r * 0.3, y - r * 0.35, r * 0.32); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; circle(x + r * 0.35, y + r * 0.3, r * 0.14); ctx.fill(); return;
  }
  const r = e.r * L * 1.15;
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; circle(x, y, r * 1.22); ctx.fill();
  ctx.fillStyle = '#fbfdff'; circle(x, y, r); ctx.fill();
  const ix = x + r * 0.14, ir = r * 0.74, g = ctx.createRadialGradient(ix - ir * 0.3, y - ir * 0.35, 0, ix, y, ir);
  g.addColorStop(0, '#fff6c8'); g.addColorStop(0.45, e.iris); g.addColorStop(1, '#14100a');
  ctx.fillStyle = g; circle(ix, y, ir); ctx.fill();
  ctx.fillStyle = '#05080b'; circle(x + r * 0.22, y, r * 0.44); ctx.fill();
  ctx.fillStyle = '#fff'; circle(x - r * 0.08, y - r * 0.32, r * 0.24); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; circle(x + r * 0.42, y + r * 0.3, r * 0.1); ctx.fill();
}
function gillAt(sp, P, L, t) {
  const fr = frameAt(sp, t), w = prof(P, t);
  ctx.save(); ctx.translate(fr.x, fr.y); ctx.rotate(fr.a);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = Math.max(0.6, L * 0.009);
  ctx.beginPath(); ctx.moveTo(L * 0.01, -w[0] * L * 0.75); ctx.quadraticCurveTo(-L * 0.035, 0, L * 0.01, w[1] * L * 0.8); ctx.stroke();
  ctx.restore();
}
function mouthAt(sp, L, m, nose) {
  const fr = frameAt(sp, m[0]), x = fr.x - Math.sin(fr.a) * m[1] * L, y = fr.y + Math.cos(fr.a) * m[1] * L;
  ctx.strokeStyle = 'rgba(10,10,14,0.55)'; ctx.lineWidth = Math.max(0.6, L * 0.008);
  ctx.beginPath(); ctx.moveTo(nose[0], nose[1] + L * 0.006); ctx.quadraticCurveTo((nose[0] + x) / 2, y + L * 0.004, x, y); ctx.stroke();
}
function drawTail(f, sp, L, d, ph) {
  const tl = d.tail; if (!tl) return;
  const fr = sp[0];
  ctx.save(); ctx.translate(fr.x + Math.cos(fr.a) * L * 0.012, fr.y); ctx.rotate(fr.a);
  if (!d.cetacean) ctx.scale(0.6 + 0.4 * Math.abs(Math.cos(ph * 0.5)), 1);
  const len = tl.len * L, h = tl.h * L;
  const path = () => {
    ctx.beginPath();
    if (tl.type === 'fork') {
      ctx.moveTo(L * 0.02, -h * 0.18); ctx.quadraticCurveTo(-len * 0.5, -h * 0.5, -len, -h); ctx.quadraticCurveTo(-len * 0.6, -h * 0.25, -len * 0.5, 0);
      ctx.quadraticCurveTo(-len * 0.6, h * 0.25, -len, h); ctx.quadraticCurveTo(-len * 0.5, h * 0.5, L * 0.02, h * 0.18);
    } else if (tl.type === 'forkLow') {
      ctx.moveTo(L * 0.02, -h * 0.18); ctx.quadraticCurveTo(-len * 0.45, -h * 0.45, -len * 0.82, -h * 0.85); ctx.quadraticCurveTo(-len * 0.55, -h * 0.2, -len * 0.45, 0);
      ctx.quadraticCurveTo(-len * 0.65, h * 0.3, -len * 1.15, h * 1.1); ctx.quadraticCurveTo(-len * 0.5, h * 0.55, L * 0.02, h * 0.18);
    } else if (tl.type === 'lunate') {
      ctx.moveTo(L * 0.02, -h * 0.12); ctx.quadraticCurveTo(-len * 0.35, -h * 0.4, -len * 0.95, -h * 1.15); ctx.quadraticCurveTo(-len * 0.55, -h * 0.3, -len * 0.45, 0);
      ctx.quadraticCurveTo(-len * 0.55, h * 0.3, -len * 0.95, h * 1.15); ctx.quadraticCurveTo(-len * 0.35, h * 0.4, L * 0.02, h * 0.12);
    } else if (tl.type === 'whaleFluke') {
      ctx.moveTo(L * 0.02, -h * 0.25); ctx.quadraticCurveTo(-len * 0.4, -h * 0.55, -len, -h * 1.15); ctx.quadraticCurveTo(-len * 0.78, -h * 0.25, -len * 0.64, 0);
      ctx.quadraticCurveTo(-len * 0.78, h * 0.3, -len * 0.96, h * 1.0); ctx.quadraticCurveTo(-len * 0.4, h * 0.5, L * 0.02, h * 0.25);
    } else if (tl.type === 'hetero') {
      ctx.moveTo(L * 0.02, -h * 0.2); ctx.quadraticCurveTo(-len * 0.45, -h * 0.55, -len, -h * 1.25); ctx.quadraticCurveTo(-len * 0.72, -h * 0.35, -len * 0.42, h * 0.05);
      ctx.quadraticCurveTo(-len * 0.55, h * 0.35, -len * 0.62, h * 0.75); ctx.quadraticCurveTo(-len * 0.3, h * 0.35, L * 0.02, h * 0.2);
    } else {
      ctx.moveTo(L * 0.02, -h * 0.12); ctx.quadraticCurveTo(-len * 0.3, -h * 0.3, -len * 0.85, -h * 0.95); ctx.quadraticCurveTo(-len * 0.95, -h * 0.35, -len * 0.55, 0);
      ctx.quadraticCurveTo(-len * 0.95, h * 0.35, -len * 0.85, h * 0.95); ctx.quadraticCurveTo(-len * 0.3, h * 0.3, L * 0.02, h * 0.12);
    }
    ctx.closePath();
  };
  const c1 = typeof tl.col === 'function' ? tl.col(f) : tl.col, c2 = typeof tl.col2 === 'function' ? tl.col2(f) : (tl.col2 || c1);
  path(); ctx.fillStyle = lin(0, 0, -len, 0, [[0, c1], [1, c2]]); ctx.fill();
  ctx.strokeStyle = typeof d.outline === 'function' ? d.outline(f) : d.outline; ctx.lineWidth = Math.max(0.6, L * 0.009); ctx.stroke();
  if (tl.rays !== false) {
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = Math.max(0.4, L * 0.005); ctx.beginPath();
    for (let k = -3; k <= 3; k++) { ctx.moveTo(0, 0); ctx.lineTo(-len * 1.1, k * h * 0.36); }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function fishGeneric(f, s, d, open) {
  const L = s * d.len, ph = T * (d.speed || 10) * (f.state === 'flee' ? 1.6 : 1) + (f.wig || 0);
  const amp = d.bend * (f.air && !d.cetacean ? 0.5 : 1);
  const sp = spine(L, amp, ph, d.waves || 3), o = outlinePts(sp, d.P, L);
  const nf = sp[sp.length - 1];
  const nose = [nf.x + Math.cos(nf.a) * d.nose[0] * L, nf.y + Math.sin(nf.a) * d.nose[0] * L + d.nose[1] * L];
  const outCol = typeof d.outline === 'function' ? d.outline(f) : d.outline;
  if (d.back) d.back(f, sp, o, L, ph, open);
  drawTail(f, sp, L, d, ph);
  const top = -d.mt * L, bot = d.mb * L;
  bodyPath(o, nose); ctx.fillStyle = lin(0, top, 0, bot, typeof d.grad === 'function' ? d.grad(f) : d.grad); ctx.fill();
  ctx.save(); bodyPath(o, nose); ctx.clip();
  if (d.pattern) d.pattern(f, sp, o, L, ph);
  if (d.scales) {
    const r = L * 0.022; ctx.strokeStyle = `rgba(255,255,255,${d.scales})`; ctx.lineWidth = Math.max(0.4, L * 0.004); ctx.beginPath();
    for (let row = -3; row <= 3; row++) for (let c = 0; c < 16; c++) {
      const t = 0.14 + c * 0.045 + (row & 1) * 0.022; if (t > 0.86) continue;
      const fr = frameAt(sp, t), y = row * L * 0.03, cx = fr.x - Math.sin(fr.a) * y, cy = fr.y + Math.cos(fr.a) * y;
      ctx.moveTo(cx + Math.cos(Math.PI - 1.1) * r, cy + Math.sin(Math.PI - 1.1) * r); ctx.arc(cx, cy, r, Math.PI - 1.1, Math.PI + 1.1);
    }
    ctx.stroke();
  }
  ctx.fillStyle = lin(0, top, 0, bot, SHADE); ctx.fillRect(-L * 0.75, top - 2, L * 1.6, bot - top + 4);
  const sheen = d.sheen == null ? 1 : d.sheen;
  if (sheen > 0) {
    ctx.lineCap = 'round';
    spineLine(sp, L, -d.mt * 0.5, .18, .86); ctx.strokeStyle = `rgba(255,255,255,${0.16 * sheen})`; ctx.lineWidth = L * 0.028; ctx.stroke();
    ctx.beginPath(); o.top.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.strokeStyle = `rgba(255,255,255,${0.3 * sheen})`; ctx.lineWidth = L * 0.016; ctx.stroke();
    ctx.beginPath(); o.bot.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]))); ctx.strokeStyle = `rgba(150,215,255,${0.22 * sheen})`; ctx.lineWidth = L * 0.012; ctx.stroke();
  }
  ctx.restore();
  bodyPath(o, nose); ctx.strokeStyle = outCol; ctx.lineWidth = Math.max(0.7, L * 0.013); ctx.stroke();
  if (d.gill) gillAt(sp, d.P, L, d.gill);
  if (d.front) d.front(f, sp, o, L, ph, open, nose);
  if (d.mouth) mouthAt(sp, L, d.mouth, nose);
  if (d.eye) eyeAt(sp, L, d.eye);
}

/* ---- species ---- */
const PALS = [
  { dark: '#0f2f6b', back: '#2563b8', mid: '#7fb0dc', belly: '#e8f1f8', fin: 'rgba(130,190,245,0.55)', finTip: 'rgba(40,90,170,0.8)', finFar: 'rgba(30,70,140,0.5)', outline: '#0b2148' },
  { dark: '#0b4d55', back: '#14928a', mid: '#7fd3c4', belly: '#e6f7f2', fin: 'rgba(130,235,215,0.5)', finTip: 'rgba(20,120,120,0.75)', finFar: 'rgba(20,90,90,0.5)', outline: '#07343a' },
  { dark: '#2c2a78', back: '#5552c9', mid: '#a9a6ec', belly: '#efeefe', fin: 'rgba(195,185,255,0.5)', finTip: 'rgba(80,70,180,0.75)', finFar: 'rgba(60,50,140,0.5)', outline: '#1d1b52' },
];
const GOLD = { dark: '#9a6410', back: '#e3a326', mid: '#f6d27a', belly: '#fff6d8', fin: 'rgba(255,228,140,0.6)', finTip: 'rgba(220,150,40,0.8)', finFar: 'rgba(170,110,30,0.5)', outline: '#6b4308', gold: true };
function flyerWing(sp, L, open, near, p, ph, t, k, pelvic) {
  const fr = frameAt(sp, t);
  ctx.save(); ctx.translate(fr.x, fr.y + (pelvic ? 0.05 : -0.005) * L); ctx.rotate(fr.a);
  if (pelvic) ctx.scale(1, -1);
  const fl = Math.sin(ph * 0.35) * 0.03 * open, off = near ? 0 : 0.04;
  const tipX = -L * k * lerp(0.4, 0.56, open), tipY = -L * k * (lerp(0.03, 0.3, open) + fl + off * open);
  const trX = -L * k * lerp(0.42, 0.5, open), trY = -L * k * lerp(0.0, 0.07, open);
  const path = () => {
    ctx.beginPath(); ctx.moveTo(L * 0.02 * k, 0);
    ctx.bezierCurveTo(-L * 0.05 * k, tipY * 0.75, tipX * 0.6, tipY * 1.02, tipX, tipY);
    ctx.quadraticCurveTo(tipX - L * 0.03 * k, (tipY + trY) * 0.45, trX, trY);
    ctx.quadraticCurveTo(-L * 0.16 * k, L * 0.02 * k, L * 0.02 * k, L * 0.015 * k);
    ctx.closePath();
  };
  path(); ctx.fillStyle = near ? lin(0, tipY, 0, 0, [[0, p.finTip], [1, p.fin]]) : p.finFar; ctx.fill();
  if (near) {
    if (open > 0.3) {
      ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = Math.max(0.4, L * 0.005);
      for (let i = 1; i <= 6; i++) { const u = i / 7, ex = lerp(tipX, trX, u * 0.9), ey = lerp(tipY, trY, u * 0.9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ex * 0.5, ey * 0.62, ex, ey); ctx.stroke(); }
    }
    path(); ctx.strokeStyle = p.outline; ctx.globalAlpha *= 0.55; ctx.lineWidth = Math.max(0.5, L * 0.007); ctx.stroke();
  }
  ctx.restore();
}
const D = {};
D.flyer = {
  len: 2.3, P: [[0, .03, .028], [.12, .045, .04], [.4, .088, .08], [.7, .095, .085], [.9, .07, .062], [1, .02, .026]], nose: [.025, .004], bend: .018, waves: 3, speed: 10,
  grad: (f) => [[0, f.pal.dark], [.3, f.pal.back], [.5, f.pal.mid], [.62, f.pal.belly], [1, '#f8fbfd']], outline: (f) => f.pal.outline,
  tail: { type: 'forkLow', len: .3, h: .17, col: (f) => f.pal.back, col2: (f) => f.pal.dark },
  eye: { t: .9, y: -.012, r: .036, iris: '#d4e2ee' }, gill: .84, mouth: [.97, .02],
  back(f, sp, o, L, ph, open) { flyerWing(sp, L, open, false, f.pal, ph, .72, 1); flyerWing(sp, L, open * 0.9, false, f.pal, ph, .42, 0.55, true); },
  pattern(f, sp, o, L) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = L * 0.013; spineLine(sp, L, .008, .1, .88); ctx.stroke();
    ctx.fillStyle = 'rgba(10,30,70,0.25)';
    for (let k = 0; k < 9; k++) { const fr = frameAt(sp, .2 + k * .075); circle(fr.x, fr.y - L * 0.045, L * 0.008); ctx.fill(); }
  },
  front(f, sp, o, L, ph, open) {
    fin(sp, this.P, L, .33, -1, .06, .045, .03, f.pal.finTip, f.pal.outline);
    fin(sp, this.P, L, .3, 1, .05, .04, .03, f.pal.finTip, f.pal.outline);
    flyerWing(sp, L, open * 0.9, true, f.pal, ph, .42, 0.55, true);
    flyerWing(sp, L, open, true, f.pal, ph, .72, 1);
  },
};
D.tuna = {
  len: 2.5, P: [[0, .022, .022], [.1, .035, .035], [.3, .1, .095], [.55, .145, .135], [.78, .14, .125], [.92, .09, .08], [1, .02, .035]], nose: [.02, .008], bend: .012, waves: 2.6, speed: 12,
  grad: [[0, '#0b1d42'], [.28, '#1b3c76'], [.4, '#2f6aa8'], [.47, '#62a8c9'], [.53, '#b7c8d4'], [.68, '#e6edf2'], [1, '#f7f9fb']], outline: '#0a1834',
  tail: { type: 'lunate', len: .24, h: .26, col: '#173669', col2: '#0b1d42' },
  eye: { t: .885, y: -.01, r: .03, iris: '#9fb0bd' }, gill: .82, mouth: [.965, .03],
  back(f, sp, o, L) { sideFin(sp, L, .78, -.01, .2, .045, .18, 'rgba(15,35,80,0.85)'); },
  pattern(f, sp, o, L) {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = L * 0.012;
    for (let k = 0; k < 10; k++) { const fr = frameAt(sp, .22 + k * .058); ctx.beginPath(); ctx.moveTo(fr.x, fr.y + L * 0.015); ctx.lineTo(fr.x - L * 0.01, fr.y + L * 0.085); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(120,220,255,0.4)'; ctx.lineWidth = L * 0.014; spineLine(sp, L, -.02, .15, .85); ctx.stroke();
  },
  front(f, sp, o, L) {
    fin(sp, this.P, L, .63, -1, .12, .05, .04, '#14305e', '#0a1834');
    fin(sp, this.P, L, .42, -1, .06, .11, .07, '#c9a93a', '#5a4410', .15);
    fin(sp, this.P, L, .4, 1, .06, .1, .07, '#c9a93a', '#5a4410', .15);
    for (let k = 0; k < 7; k++) {
      const t = .3 - k * .032;
      fin(sp, this.P, L, t, -1, .018, .026, .012, '#f2c230', '#6b4f0a');
      fin(sp, this.P, L, t, 1, .018, .024, .012, '#f2c230', '#6b4f0a');
    }
    sideFin(sp, L, .79, .005, .24, .05, .2, '#1b3c76', '#0a1834');
  },
};
D.mahi = {
  len: 2.3, P: [[0, .03, .028], [.15, .06, .05], [.5, .12, .1], [.8, .15, .11], [.92, .15, .09], [.975, .12, .06], [1, .03, .035]], nose: [.004, .03], bend: .016, waves: 3, speed: 11,
  grad: [[0, '#07606f'], [.22, '#139a86'], [.42, '#5bbf55'], [.58, '#d5d03a'], [.75, '#f0e27a'], [1, '#fbf3c0']], outline: '#064650',
  tail: { type: 'fork', len: .3, h: .2, col: '#c9c22c', col2: '#2f9c6a' },
  eye: { t: .93, y: .005, r: .03, iris: '#f0d27a' }, gill: .86, mouth: [.985, .04],
  back(f, sp, o, L) { sideFin(sp, L, .8, .02, .12, .04, .25, 'rgba(200,190,50,0.6)'); },
  pattern(f, sp, o, L) {
    for (let k = 0; k < 16; k++) {
      const fr = frameAt(sp, .18 + ((k * 0.053) % .7)), y = (-0.07 + ((k * 37) % 10) / 10 * 0.14) * L;
      ctx.fillStyle = k % 3 ? 'rgba(30,110,230,0.7)' : 'rgba(10,50,40,0.45)'; circle(fr.x, fr.y + y, L * (k % 3 ? 0.008 : 0.006)); ctx.fill();
    }
  },
  front(f, sp, o, L) {
    ridge(sp, this.P, L, .12, .93, -1, (u) => .03 + .05 * Math.sin(Math.PI * Math.min(1, u * 1.15)), '#1c52b8', '#0b2a6b', 'rgba(255,255,255,0.25)');
    ridge(sp, this.P, L, .1, .42, 1, (u) => .025 + .04 * Math.sin(Math.PI * u), '#1c52b8', '#0b2a6b', 'rgba(255,255,255,0.25)');
    sideFin(sp, L, .8, .03, .12, .04, .25, 'rgba(230,215,70,0.9)', '#6b5a10');
  },
};
D.sail = {
  len: 2.7, P: [[0, .02, .02], [.15, .04, .035], [.45, .075, .07], [.75, .08, .07], [.9, .06, .05], [1, .015, .02]], nose: [.01, .0], bend: .012, waves: 2.6, speed: 12,
  grad: [[0, '#0a2158'], [.3, '#1d4d9e'], [.45, '#4f86c8'], [.56, '#cfdde9'], [1, '#f4f7fa']], outline: '#071840',
  tail: { type: 'lunate', len: .2, h: .17, col: '#163f8a', col2: '#0a2158' },
  eye: { t: .9, y: -.008, r: .022, iris: '#8fa6c0' }, gill: .84,
  pattern(f, sp, o, L) {
    ctx.strokeStyle = 'rgba(140,200,255,0.45)'; ctx.lineWidth = L * 0.008;
    for (let k = 0; k < 10; k++) { const fr = frameAt(sp, .2 + k * .065); ctx.setLineDash([L * 0.012, L * 0.008]); ctx.beginPath(); ctx.moveTo(fr.x, fr.y - L * 0.07); ctx.lineTo(fr.x, fr.y + L * 0.01); ctx.stroke(); }
    ctx.setLineDash([]);
  },
  front(f, sp, o, L, ph, open, nose) {
    const sh = 0.45 + 0.55 * open;
    ridge(sp, this.P, L, .3, .86, -1, (u) => (.02 + .2 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.8)) * sh, '#2563c4', '#06123a', 'rgba(170,210,255,0.35)');
    ctx.fillStyle = 'rgba(8,20,60,0.55)';
    for (let k = 0; k < 8; k++) { const e = edgeAt(sp, this.P, L, .4 + k * .055, -1), h = (.04 + (k % 3) * .04) * sh * L; circle(e.x + Math.sin(e.a) * h, e.y - Math.cos(e.a) * h, L * 0.008); ctx.fill(); }
    fin(sp, this.P, L, .78, 1, .02, .14, .07, '#163f8a', '#06123a', .1);
    sideFin(sp, L, .8, .02, .15, .03, .3, '#1d4d9e', '#06123a');
    const nf = frameAt(sp, 1);
    ctx.save(); ctx.translate(nose[0], nose[1]); ctx.rotate(nf.a);
    ctx.fillStyle = '#1c2a44'; ctx.beginPath(); ctx.moveTo(-L * 0.02, -L * 0.012); ctx.lineTo(L * 0.42, 0); ctx.lineTo(-L * 0.02, L * 0.01); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
};
D.snapper = {
  len: 2.0, P: [[0, .04, .04], [.15, .07, .06], [.45, .19, .15], [.72, .2, .14], [.9, .13, .085], [1, .035, .04]], nose: [.01, .02], bend: .016, waves: 3, speed: 11,
  grad: [[0, '#a51f33'], [.3, '#d9434f'], [.55, '#ef7f7a'], [.8, '#f8c3b8'], [1, '#fde4dc']], outline: '#6b1220',
  tail: { type: 'fork', len: .24, h: .2, col: '#d9434f', col2: '#a51f33' },
  eye: { t: .87, y: -.035, r: .045, iris: '#e8452c' }, gill: .8, mouth: [.975, .04],
  pattern(f, sp, o, L) {
    ctx.strokeStyle = 'rgba(255,225,215,0.28)'; ctx.lineWidth = Math.max(0.4, L * 0.006);
    for (let r = -3; r <= 3; r++) for (let c = 0; c < 9; c++) { const fr = frameAt(sp, .15 + c * .075 + (r & 1) * .035); ctx.beginPath(); ctx.arc(fr.x, fr.y + r * L * 0.04, L * 0.022, -1.2, 1.2); ctx.stroke(); }
  },
  front(f, sp, o, L) {
    ridge(sp, this.P, L, .3, .82, -1, (u) => .03 + .06 * Math.abs(Math.sin(u * Math.PI * 6)) * (1 - u * 0.4), 'rgba(200,48,63,0.9)', '#6b1220', 'rgba(255,200,200,0.35)');
    ridge(sp, this.P, L, .15, .32, 1, (u) => .03 + .05 * Math.sin(Math.PI * u), 'rgba(220,70,80,0.9)', '#6b1220');
    fin(sp, this.P, L, .62, 1, .05, .06, .03, 'rgba(240,120,120,0.9)', '#6b1220');
    sideFin(sp, L, .74, .02, .14, .045, .3, 'rgba(255,170,160,0.8)', '#6b1220');
  },
};
function sharkJag(sp, L, col, t0) {
  ctx.fillStyle = col; ctx.beginPath();
  const n = 22, J = [0.012, -0.012, 0.004, -0.016, 0.008, -0.006];
  for (let i = 0; i <= n; i++) { const t = t0 + i * (0.98 - t0) / n, fr = frameAt(sp, t), j = J[i % 6] * L * 1.4 + L * (0.012 + 0.03 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - (t > 0.86 ? (t - 0.86) * 0.25 : 0)); if (i) ctx.lineTo(fr.x, fr.y + j); else ctx.moveTo(fr.x, fr.y + j); }
  for (let i = n; i >= 0; i--) { const t = t0 + i * (0.98 - t0) / n, fr = frameAt(sp, t); ctx.lineTo(fr.x, fr.y + 0.25 * L); }
  ctx.closePath(); ctx.fill();
}
function sharkPec(sp, L, t, y, len, wid, ang, col, tip, out) {
  const fr = frameAt(sp, t);
  ctx.save(); ctx.translate(fr.x - Math.sin(fr.a) * y * L, fr.y + Math.cos(fr.a) * y * L); ctx.rotate(fr.a + ang);
  const l = len * L, w = wid * L;
  ctx.beginPath(); ctx.moveTo(L * 0.015, -w * 0.4); ctx.quadraticCurveTo(-l * 0.35, -w * 1.0, -l, -w * 0.15); ctx.quadraticCurveTo(-l * 0.55, w * 0.55, L * 0.015, w * 0.4); ctx.closePath();
  ctx.fillStyle = lin(0, 0, -l, 0, [[0, col], [0.72, col], [1, tip]]); ctx.fill(); ctx.strokeStyle = out; ctx.lineWidth = Math.max(0.5, L * 0.006); ctx.stroke();
  ctx.restore();
}
function sharkHead(f, sp, L) {
  const mf = frameAt(sp, .9), open = f.chomp > 0 ? f.chomp / 0.35 : (f.gape || 0);
  ctx.save(); ctx.translate(mf.x, mf.y); ctx.rotate(mf.a);
  const hx = -L * 0.045, hy = L * 0.045, fx = L * 0.11, fy = L * 0.022;
  ctx.fillStyle = 'rgba(20,28,36,0.65)'; ctx.beginPath(); ctx.ellipse(L * 0.105, -L * 0.004, L * 0.008, L * 0.004, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(20,28,36,0.35)'; for (const [a, b] of [[0.08, 0.0], [0.07, 0.012], [0.09, 0.014], [0.06, -0.006]]) { circle(L * a, L * b, L * 0.0028); ctx.fill(); }
  if (open > 0.05) {
    const ja = 0.12 + open * 0.6, jl = L * 0.15, jx = hx + Math.cos(ja) * jl, jy = hy + Math.sin(ja) * jl;
    ctx.fillStyle = '#5a1a26'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(hx, hy); ctx.lineTo(jx, jy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c45a6a'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(hx, hy); ctx.lineTo(lerp(fx, hx, 0.2), fy + L * 0.012); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fbfbf7';
    for (let k = 0; k < 6; k++) { const u = (k + 0.5) / 6, x = lerp(fx, hx, u), y = lerp(fy, hy, u); poly([[x + L * 0.007, y], [x, y + L * 0.017], [x - L * 0.007, y]]); ctx.fill(); }
    for (let k = 0; k < 5; k++) { const u = (k + 0.5) / 5, x = lerp(jx, hx, u), y = lerp(jy, hy, u); poly([[x + L * 0.006, y], [x, y - L * 0.015], [x - L * 0.006, y]]); ctx.fill(); }
    ctx.fillStyle = '#e9eef1'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(jx, jy); ctx.quadraticCurveTo(jx - L * 0.02, jy + L * 0.03, hx - L * 0.03, hy + L * 0.04); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,28,36,0.6)'; ctx.lineWidth = Math.max(0.6, L * 0.005); ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(20,28,36,0.7)'; ctx.lineWidth = Math.max(0.6, L * 0.006);
    ctx.beginPath(); ctx.moveTo(fx - L * 0.005, fy + L * 0.004); ctx.quadraticCurveTo(L * 0.03, hy + L * 0.01, hx, hy); ctx.stroke();
    ctx.fillStyle = '#fbfbf7';
    for (let k = 0; k < 5; k++) { const u = 0.2 + k * 0.15, x = lerp(fx, hx, u), y = lerp(fy, hy, u) + L * 0.004; poly([[x + L * 0.005, y], [x, y + L * 0.011], [x - L * 0.005, y]]); ctx.fill(); }
  }
  ctx.restore();
}
function sharkCommon(f, sp, L, P, fin1, out, tip) {
  fin(sp, P, L, .58, -1, .17, .26, .1, fin1, out, .22);
  fin(sp, P, L, .2, -1, .035, .04, .02, fin1, out);
  fin(sp, P, L, .17, 1, .035, .035, .02, fin1, out);
  fin(sp, P, L, .38, 1, .05, .05, .03, fin1, out);
  ctx.strokeStyle = 'rgba(20,28,36,0.55)'; ctx.lineWidth = Math.max(0.5, L * 0.005);
  for (let k = 0; k < 5; k++) { const fr = frameAt(sp, .76 + k * .017); ctx.beginPath(); ctx.moveTo(fr.x, fr.y - L * 0.06); ctx.quadraticCurveTo(fr.x - L * 0.012, fr.y - L * 0.005, fr.x - L * 0.002, fr.y + L * 0.05); ctx.stroke(); }
  sharkPec(sp, L, .74, .165, .3, .08, .8, fin1, tip, out);
  const kf = frameAt(sp, .05); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(kf.x, kf.y, L * 0.06, L * 0.009, kf.a, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(kf.x, kf.y - L * 0.006, L * 0.05, L * 0.003, kf.a, 0, TAU); ctx.fill();
  sharkHead(f, sp, L);
}
D.shark = {
  len: 3.3, P: [[0, .018, .018], [.07, .026, .024], [.22, .07, .06], [.44, .14, .125], [.63, .172, .152], [.79, .158, .138], [.9, .115, .098], [.97, .062, .05], [1, .02, .026]], nose: [.045, -.022], bend: .012, waves: 2.6, speed: 6, sheen: .7,
  grad: [[0, '#1f2f3c'], [.25, '#3b5265'], [.45, '#6a8293'], [.5, '#dfe6ea'], [1, '#f6f8f9']], outline: '#14202b',
  tail: { type: 'lunate', len: .25, h: .25, col: '#45607a', col2: '#2c3f50', rays: false },
  eye: { t: .915, y: -.035, r: .0135, black: true },
  back(f, sp, o, L) { sharkPec(sp, L, .71, .125, .24, .07, .95, '#34495b', '#1b2733', '#172430'); },
  pattern(f, sp, o, L) {
    sharkJag(sp, L, '#e4eaee', .1);
    ctx.fillStyle = 'rgba(15,25,35,0.22)'; for (let k = 0; k < 14; k++) { const fr = frameAt(sp, .2 + k * .05); circle(fr.x, fr.y - L * (0.05 + (k % 3) * 0.02), L * 0.004); ctx.fill(); }
    ctx.strokeStyle = 'rgba(230,236,240,0.45)'; ctx.lineWidth = Math.max(0.5, L * 0.004);
    const s1 = frameAt(sp, .62), s2 = frameAt(sp, .45);
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y - L * 0.07); ctx.quadraticCurveTo(s1.x - L * 0.03, s1.y - L * 0.05, s1.x - L * 0.05, s1.y - L * 0.06); ctx.moveTo(s2.x, s2.y - L * 0.04); ctx.lineTo(s2.x - L * 0.025, s2.y - L * 0.02); ctx.stroke();
  },
  front(f, sp, o, L) { sharkCommon(f, sp, L, this.P, '#45607a', '#172430', '#1b2733'); },
};
D.tiger = {
  len: 3.4, P: [[0, .017, .017], [.07, .026, .024], [.22, .068, .06], [.45, .135, .12], [.66, .158, .142], [.82, .145, .125], [.92, .11, .09], [.98, .075, .06], [1, .045, .04]], nose: [.018, .004], bend: .014, waves: 2.6, speed: 6, sheen: .6,
  grad: [[0, '#3c4535'], [.3, '#5d6950'], [.47, '#8a9478'], [.5, '#e6e2cf'], [1, '#f3f1e6']], outline: '#1f2419',
  tail: { type: 'hetero', len: .36, h: .24, col: '#55604a', col2: '#3c4535', rays: false },
  eye: { t: .925, y: -.03, r: .013, black: true },
  back(f, sp, o, L) { sharkPec(sp, L, .71, .125, .22, .065, .95, '#3e4736', '#20261a', '#1f2419'); },
  pattern(f, sp, o, L) {
    sharkJag(sp, L, '#e9e5d3', .1);
    for (let k = 0; k < 15; k++) {
      const t = .1 + k * .052, fr = frameAt(sp, t), w = prof(this.P, t)[0] * L;
      ctx.fillStyle = `rgba(25,30,18,${Math.max(0.12, 0.5 - k * 0.025)})`;
      ctx.beginPath(); ctx.ellipse(fr.x + Math.sin(k) * L * 0.004, fr.y - w * 0.55, L * 0.007, w * 0.5, 0.15, 0, TAU); ctx.fill();
    }
  },
  front(f, sp, o, L) { sharkCommon(f, sp, L, this.P, '#55604a', '#1f2419', '#2a3122'); },
};
D.whale = {
  len: 5.6, P: [[0, .03, .03], [.1, .042, .044], [.25, .085, .095], [.45, .13, .16], [.62, .148, .19], [.78, .125, .19], [.88, .1, .17], [.94, .075, .13], [.98, .05, .085], [1, .035, .055]], nose: [.012, .02], bend: .03, waves: 2.2, speed: 2.4, cetacean: true, sheen: .5,
  grad: [[0, '#0b121d'], [.3, '#182638'], [.5, '#2a3d55'], [.58, '#7e93a6'], [.75, '#c9d5de'], [1, '#eef3f6']], outline: '#070c14',
  tail: { type: 'whaleFluke', len: .27, h: .12, col: '#1d2c42', col2: '#a9bac8', rays: false },
  eye: { t: .84, y: .07, r: .008, black: true },
  back(f, sp, o, L) { whalePec(sp, L, false); },
  pattern(f, sp, o, L) {
    ctx.strokeStyle = 'rgba(12,18,28,0.38)'; ctx.lineWidth = Math.max(0.6, L * 0.0035);
    for (let k = 0; k < 12; k++) { spineLine(sp, L, .06 + k * .011, .5 + k * .005, .99); ctx.stroke(); }
    ctx.fillStyle = 'rgba(8,14,24,0.35)'; for (let k = 0; k < 16; k++) { const fr = frameAt(sp, .2 + (k * 0.047) % .65); circle(fr.x, fr.y - ((k * 7) % 9) * L * 0.012, L * (0.004 + (k % 3) * 0.002)); ctx.fill(); }
    ctx.fillStyle = 'rgba(225,233,240,0.09)';
    for (const [t, y, r] of [[.6, .03, .032], [.47, .045, .024], [.7, -.015, .018], [.38, .02, .016], [.55, -.04, .012]]) { const fr = frameAt(sp, t); ctx.beginPath(); ctx.ellipse(fr.x, fr.y + y * L, r * L * 1.7, r * L, fr.a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,215,228,0.25)'; for (let k = 0; k < 22; k++) { const fr = frameAt(sp, .15 + (k * 0.037) % .75); circle(fr.x, fr.y + ((k * 13) % 10 - 6) * L * 0.008, L * 0.002); ctx.fill(); }
    for (const [t, y] of [[.93, .07], [.95, .055], [.91, .085], [.97, -.025], [.885, -.07], [.96, .04], [.92, -.06]]) {
      const fr = frameAt(sp, t); ctx.fillStyle = 'rgba(232,236,238,0.75)'; circle(fr.x, fr.y + y * L, L * 0.0045); ctx.fill();
      ctx.fillStyle = 'rgba(150,160,170,0.6)'; circle(fr.x, fr.y + y * L, L * 0.0018); ctx.fill();
    }
  },
  front(f, sp, o, L, ph, open, nose) {
    fin(sp, this.P, L, .3, -1, .06, .03, .02, '#18263a', '#0a1019');
    ctx.fillStyle = 'rgba(8,14,22,0.6)'; ctx.strokeStyle = 'rgba(120,140,160,0.35)'; ctx.lineWidth = Math.max(0.4, L * 0.0015);
    for (let k = 0; k < 8; k++) { const e = edgeAt(sp, this.P, L, .89 + k * .013, -1); circle(e.x, e.y + L * 0.007, L * 0.0055); ctx.fill(); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { const fr = frameAt(sp, .9 + k * .018); circle(fr.x, fr.y + L * 0.045, L * 0.004); ctx.fill(); }
    whalePec(sp, L, true);
    const mf = frameAt(sp, .8);
    ctx.strokeStyle = 'rgba(8,12,20,0.75)'; ctx.lineWidth = Math.max(0.8, L * 0.004);
    ctx.beginPath(); ctx.moveTo(nose[0], nose[1] + L * 0.012); ctx.quadraticCurveTo(mf.x + L * 0.1, mf.y + L * 0.075, mf.x, mf.y + L * 0.05); ctx.stroke();
    const bh = edgeAt(sp, this.P, L, .875, -1); ctx.fillStyle = '#0a1019'; ctx.beginPath(); ctx.ellipse(bh.x, bh.y + L * 0.004, L * 0.009, L * 0.003, 0, 0, TAU); ctx.fill();
    const ef = frameAt(sp, .835); ctx.strokeStyle = 'rgba(150,170,190,0.5)'; ctx.lineWidth = Math.max(0.5, L * 0.002); ctx.beginPath(); ctx.arc(ef.x, ef.y + L * 0.06, L * 0.011, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  },
};
function whalePec(sp, L, near) {
  const fr = frameAt(sp, .74), ang = (near ? -0.5 : -0.32) + Math.sin(T * 0.8) * 0.12 + breachFlap;
  ctx.save(); ctx.translate(fr.x, fr.y + L * (near ? 0.13 : 0.11)); ctx.rotate(fr.a + ang);
  const l = .4 * L, w = .055 * L;
  ctx.beginPath(); ctx.moveTo(L * 0.01, -w * 0.5);
  for (let k = 1; k <= 7; k++) { const u = k / 7; ctx.quadraticCurveTo(-l * (u - 0.07), -w * (1.15 - u * 0.9) - w * 0.25, -l * u, -w * (1.0 - u * 0.95)); }
  ctx.quadraticCurveTo(-l * 0.5, w * 0.9, L * 0.01, w * 0.5); ctx.closePath();
  ctx.fillStyle = near ? lin(0, -w, 0, w, [[0, '#3a4d63'], [0.35, '#b9c8d4'], [1, '#f4f8fa']]) : '#1a2738'; ctx.fill();
  ctx.strokeStyle = '#0a1019'; ctx.lineWidth = Math.max(0.6, L * 0.003); ctx.stroke();
  if (near) { ctx.fillStyle = 'rgba(235,240,245,0.7)'; for (let k = 1; k < 7; k++) { circle(-l * k / 7.3, -w * (0.85 - k * 0.11), L * 0.0045); ctx.fill(); } }
  ctx.restore();
}
D.dolphin = {
  len: 2.6, P: [[0, .022, .022], [.12, .036, .034], [.4, .112, .1], [.62, .138, .118], [.78, .128, .104], [.87, .104, .08], [.915, .08, .056], [.935, .05, .036], [.965, .03, .026], [1, .02, .016]], nose: [.04, .008], bend: .035, waves: 2.4, speed: 7, cetacean: true,
  grad: [[0, '#22364a'], [.3, '#3f5f79'], [.47, '#7c98ae'], [.55, '#e1e9ef'], [1, '#f7fafc']], outline: '#16232f',
  tail: { type: 'whaleFluke', len: .16, h: .1, col: '#3d566b', col2: '#22364a', rays: false },
  eye: { t: .872, y: .006, r: .014, black: true },
  back(f, sp, o, L) { sideFin(sp, L, .74, .07, .12, .038, .75, '#33495d'); },
  pattern(f, sp, o, L) {
    ctx.fillStyle = 'rgba(20,34,48,0.35)'; ctx.beginPath(); const a = frameAt(sp, .3), b = frameAt(sp, .6), c = frameAt(sp, .86);
    ctx.moveTo(a.x, a.y - L * 0.04); ctx.quadraticCurveTo(b.x, b.y + L * 0.03, c.x, c.y - L * 0.02); ctx.lineTo(c.x, c.y - L * 0.2); ctx.lineTo(a.x, a.y - L * 0.2); ctx.closePath(); ctx.fill();
    spineLine(sp, L, -.035, .3, .85); ctx.lineWidth = L * 0.018; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke();
  },
  front(f, sp, o, L) {
    fin(sp, this.P, L, .53, -1, .12, .16, .1, '#2f475c', '#16232f', .22);
    sideFin(sp, L, .74, .085, .14, .045, .65, '#4f6c84', '#16232f');
    const mf = frameAt(sp, .945), melon = frameAt(sp, .925);
    ctx.strokeStyle = 'rgba(20,30,40,0.75)'; ctx.lineWidth = Math.max(0.6, L * 0.006); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mf.x + L * 0.05, mf.y + L * 0.014); ctx.quadraticCurveTo(mf.x, mf.y + L * 0.036, mf.x - L * 0.045, mf.y + L * 0.006); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,30,40,0.35)'; ctx.beginPath(); ctx.arc(melon.x + L * 0.012, melon.y - L * 0.005, L * 0.03, -1.2, 0.5); ctx.stroke();
    const bh = edgeAt(sp, this.P, L, .82, -1); ctx.fillStyle = '#16232f'; ctx.beginPath(); ctx.ellipse(bh.x, bh.y + L * 0.006, L * 0.008, L * 0.004, 0, 0, TAU); ctx.fill();
  },
};
D.orca = {
  len: 3.2, P: [[0, .02, .02], [.1, .032, .032], [.35, .11, .11], [.6, .148, .135], [.8, .135, .122], [.92, .1, .088], [.98, .055, .05], [1, .024, .03]], nose: [.022, .012], bend: .035, waves: 2.4, speed: 6, cetacean: true, sheen: 1.3,
  grad: [[0, '#05070a'], [.5, '#10141a'], [1, '#161b22']], outline: '#000000',
  tail: { type: 'fluke', len: .14, h: .12, col: '#10141a', col2: '#05070a', rays: false },
  eye: { t: .885, y: -.012, r: .009, black: true },
  back(f, sp, o, L) { sideFin(sp, L, .78, .07, .12, .06, .75, '#05070a'); },
  pattern(f, sp, o, L) {
    ctx.fillStyle = '#eef2f5'; ctx.beginPath();
    const pts = [];
    for (let i = 0; i <= 10; i++) { const fr = frameAt(sp, lerp(.97, .55, i / 10)); pts.push([fr.x, fr.y + L * 0.035]); }
    const a = frameAt(sp, .44), b = frameAt(sp, .3);
    ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.quadraticCurveTo(a.x, a.y + L * 0.02, a.x - L * 0.02, a.y - L * 0.03);
    ctx.quadraticCurveTo(b.x, b.y + L * 0.01, b.x - L * 0.02, b.y + L * 0.2);
    ctx.lineTo(pts[0][0], pts[0][1] + L * 0.2); ctx.closePath(); ctx.fill();
    const e = frameAt(sp, .86); ctx.beginPath(); ctx.ellipse(e.x - L * 0.01, e.y - L * 0.035, L * 0.078, L * 0.027, e.a - 0.2, 0, TAU); ctx.fill();
    const sd = frameAt(sp, .47); ctx.fillStyle = 'rgba(165,176,188,0.75)'; ctx.beginPath(); ctx.ellipse(sd.x - L * 0.04, sd.y - L * 0.11, L * 0.1, L * 0.032, sd.a + 0.05, 0, TAU); ctx.fill();
  },
  front(f, sp, o, L) {
    fin(sp, this.P, L, .53, -1, .09, .34, .035, '#07090c', '#000000', .15);
    sideFin(sp, L, .78, .08, .14, .065, .65, '#0b0e12', '#000000');
    const mf = frameAt(sp, .955); ctx.strokeStyle = 'rgba(80,90,100,0.6)'; ctx.lineWidth = Math.max(0.5, L * 0.004);
    ctx.beginPath(); ctx.moveTo(mf.x + L * 0.045, mf.y + L * 0.018); ctx.quadraticCurveTo(mf.x, mf.y + L * 0.035, mf.x - L * 0.05, mf.y + L * 0.02); ctx.stroke();
  },
};
D.flyer.scales = .14; D.tuna.scales = .08; D.mahi.scales = .07; D.sail.scales = .06; D.dolphin.sheen = .9;
for (const k in D) { const d = D[k]; d.mt = Math.max(...d.P.map((p) => p[1])); d.mb = Math.max(...d.P.map((p) => p[2])); }

function fishPuffer(f, s) {
  const target = f.air || f.state === 'caught' || f.hang || f.icon ? 1 : 0.12;
  f.puff = f.puff == null ? target : lerp(f.puff, target, 0.12);
  const pf = f.puff, R = s * (0.72 + 0.42 * pf), ph = T * 14 + (f.wig || 0), OL = '#6b4a12';
  ctx.save(); ctx.translate(-R * 0.88, 0); ctx.scale(0.7 + 0.3 * Math.abs(Math.cos(ph * 0.5)), 1);
  ctx.fillStyle = lin(0, 0, -s * 0.6, 0, [[0, '#d9a43a'], [1, '#f2cf6e']]);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.12); ctx.quadraticCurveTo(-s * 0.5, -s * 0.55, -s * 0.62, -s * 0.12); ctx.quadraticCurveTo(-s * 0.68, 0, -s * 0.62, s * 0.12); ctx.quadraticCurveTo(-s * 0.5, s * 0.55, 0, s * 0.12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.6, s * 0.05); ctx.stroke();
  ctx.restore();
  if (pf > 0.2) {
    ctx.fillStyle = '#c79a3b'; ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.4, s * 0.03);
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU + 0.1, c = Math.cos(a), sn = Math.sin(a), len = R + s * 0.34 * pf, w = s * 0.07;
      ctx.beginPath(); ctx.moveTo(c * R * 0.9 - sn * w, sn * R * 0.9 + c * w); ctx.lineTo(c * len, sn * len); ctx.lineTo(c * R * 0.9 + sn * w, sn * R * 0.9 - c * w); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R);
  g.addColorStop(0, '#ffeca6'); g.addColorStop(0.6, '#e8b84a'); g.addColorStop(1, '#b98a2c');
  ctx.fillStyle = g; circle(0, 0, R); ctx.fill();
  ctx.save(); circle(0, 0, R); ctx.clip();
  ctx.fillStyle = 'rgba(255,248,225,0.95)'; ctx.beginPath(); ctx.ellipse(0, R * 0.55, R * 1.0, R * 0.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(110,75,25,0.55)';
  for (const [a, b, r] of [[-0.3, -0.5, .09], [0.1, -0.62, .07], [-0.62, -0.15, .08], [0.35, -0.3, .06], [-0.1, -0.22, .05], [-0.5, -0.55, .06], [0.55, -0.05, .05]]) { circle(R * a, R * b, R * r); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.6, s * 0.05); circle(0, 0, R); ctx.stroke();
  ctx.save(); ctx.translate(R * 0.05, R * 0.15); ctx.rotate(Math.sin(T * 25 + (f.wig || 0)) * 0.4);
  ctx.fillStyle = 'rgba(240,200,90,0.85)'; ctx.beginPath(); ctx.ellipse(-s * 0.15, 0, s * 0.18, s * 0.09, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.4, s * 0.03); ctx.stroke();
  ctx.restore();
  const ex = R * 0.42, ey = -R * 0.3, er = s * 0.21;
  ctx.fillStyle = '#fff'; circle(ex, ey, er); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.4, s * 0.03); ctx.stroke();
  ctx.fillStyle = '#2aa063'; circle(ex + er * 0.2, ey, er * 0.7); ctx.fill();
  ctx.fillStyle = '#05080b'; circle(ex + er * 0.28, ey, er * 0.42); ctx.fill();
  ctx.fillStyle = '#fff'; circle(ex + er * 0.05, ey - er * 0.3, er * 0.22); ctx.fill();
  ctx.fillStyle = '#c4573a'; ctx.beginPath(); ctx.ellipse(R * 0.97, R * 0.12, s * 0.09, s * 0.07, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a1e10'; circle(R * 1.0, R * 0.12, s * 0.035); ctx.fill();
}
function fishSardine(f, s) {
  const L = s * 1.2, h = s * 0.34;
  ctx.fillStyle = '#58799a'; poly([[-L * 0.8, 0], [-L * 1.3, -h * 1.1], [-L * 1.15, 0], [-L * 1.3, h * 1.1]]); ctx.fill();
  ctx.fillStyle = lin(0, -h, 0, h, [[0, '#2d5a82'], [0.42, '#8fb1c8'], [0.6, '#e2ebf1'], [1, '#f6f9fb']]);
  ctx.beginPath(); ctx.moveTo(L, h * 0.1); ctx.quadraticCurveTo(L * 0.3, -h * 1.2, -L * 0.85, -h * 0.2); ctx.lineTo(-L * 0.85, h * 0.2); ctx.quadraticCurveTo(L * 0.3, h * 1.2, L, h * 0.1); ctx.fill();
  ctx.fillStyle = 'rgba(15,35,60,0.5)'; for (let k = 0; k < 4; k++) { circle(L * (0.35 - k * 0.22), -h * 0.15, Math.max(0.4, s * 0.06)); ctx.fill(); }
  ctx.fillStyle = '#0a1620'; circle(L * 0.62, -h * 0.15, Math.max(0.6, s * 0.1)); ctx.fill();
}

/* ---- other animals ---- */
function drawTurtle(tu) {
  const s = tu.s, st = Math.sin(T * 1.8 + tu.ph), OL = 'rgba(20,26,12,0.75)';
  ctx.save(); ctx.translate(tu.x, tu.y); if (tu.vx < 0) ctx.scale(-1, 1); ctx.rotate(st * 0.04);
  const flipper = (x, y, ang, len, wid, col) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, -wid * 0.5); ctx.quadraticCurveTo(-len * 0.5, -wid * 1.2, -len, wid * 0.2); ctx.quadraticCurveTo(-len * 0.4, wid * 0.8, 0, wid * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.6, s * 0.04); ctx.stroke(); ctx.restore();
  };
  flipper(-s * 0.7, s * 0.15, 0.5 + st * 0.25, s * 0.45, s * 0.18, '#56653a');
  flipper(s * 0.45, s * 0.05, 0.9 + st * 0.7, s * 1.05, s * 0.28, '#56653a');
  ctx.fillStyle = lin(0, -s * 0.25, 0, s * 0.2, [[0, '#8fa063'], [1, '#6a7a45']]);
  ctx.beginPath(); ctx.ellipse(s * 1.12, -s * 0.05, s * 0.33, s * 0.22, -0.12, 0, TAU); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.6, s * 0.04); ctx.stroke();
  ctx.fillStyle = 'rgba(40,50,20,0.4)'; for (const [a, b] of [[1.0, -.12], [1.18, -.16], [1.08, .02]]) { circle(s * a, s * b, s * 0.05); ctx.fill(); }
  ctx.fillStyle = '#05080b'; circle(s * 1.27, -s * 0.1, s * 0.05); ctx.fill(); ctx.fillStyle = '#fff'; circle(s * 1.26, -s * 0.115, s * 0.018); ctx.fill();
  ctx.fillStyle = '#e3d39a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.95, s * 0.26, 0, 0, Math.PI); ctx.fill();
  const shell = () => { ctx.beginPath(); ctx.moveTo(-s, s * 0.08); ctx.bezierCurveTo(-s * 0.95, -s * 0.78, s * 0.85, -s * 0.82, s, s * 0.05); ctx.closePath(); };
  shell(); ctx.fillStyle = lin(0, -s * 0.7, 0, s * 0.1, [[0, '#a8863f'], [0.6, '#6e5426'], [1, '#4a3818']]); ctx.fill();
  ctx.save(); shell(); ctx.clip();
  ctx.strokeStyle = 'rgba(40,28,10,0.6)'; ctx.lineWidth = Math.max(0.6, s * 0.035);
  for (const [cx, cy] of [[-0.45, -0.3], [0, -0.4], [0.45, -0.28]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.lineTo(s * cx + Math.cos(a) * s * 0.22, s * cy + Math.sin(a) * s * 0.18); } ctx.closePath(); ctx.stroke(); }
  for (let k = -8; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(k * s * 0.12, s * 0.1); ctx.lineTo(k * s * 0.13, -s * 0.08); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,170,0.25)'; ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.5, s * 0.5, s * 0.12, -0.05, 0, TAU); ctx.fill();
  ctx.restore();
  shell(); ctx.strokeStyle = OL; ctx.lineWidth = Math.max(0.8, s * 0.05); ctx.stroke();
  flipper(s * 0.35, s * 0.12, 0.6 + st * 0.8, s * 1.15, s * 0.3, '#7f8f55');
  flipper(-s * 0.75, s * 0.12, 0.3 + st * 0.3, s * 0.5, s * 0.2, '#7f8f55');
  ctx.restore();
}
function drawManta(m) {
  const s = m.s, fl = Math.sin(T * 1.3 + m.ph), span = s * (1.2 + 0.15 * fl), curl = fl * s * 0.14;
  ctx.save(); ctx.translate(m.x, m.y + Math.sin(T * 0.5 + m.ph) * 8 * FS); if (m.dir < 0) ctx.scale(-1, 1); ctx.scale(1, 0.7);
  // whip tail
  ctx.strokeStyle = '#141c28'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath(); ctx.moveTo(-s * 0.35, 0); ctx.quadraticCurveTo(-s * 0.9, Math.sin(T * 1.6 + m.ph) * s * 0.08, -s * 1.4, Math.sin(T * 1.6 + m.ph + 1) * s * 0.12); ctx.stroke();
  const body = () => {
    ctx.beginPath(); ctx.moveTo(s * 0.42, 0);
    ctx.bezierCurveTo(s * 0.3, -s * 0.25, s * 0.05, -span * 0.75, -s * 0.12 + curl, -span);
    ctx.bezierCurveTo(-s * 0.18, -span * 0.6, -s * 0.3, -s * 0.2, -s * 0.38, 0);
    ctx.bezierCurveTo(-s * 0.3, s * 0.2, -s * 0.18, span * 0.6, -s * 0.12 + curl, span);
    ctx.bezierCurveTo(s * 0.05, span * 0.75, s * 0.3, s * 0.25, s * 0.42, 0); ctx.closePath();
  };
  body(); ctx.fillStyle = lin(0, -span, 0, span, [[0, '#2b3a50'], [0.5, '#141d2a'], [1, '#2b3a50']]); ctx.fill();
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = 'rgba(235,242,248,0.85)';
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.2, sy * s * 0.12); ctx.quadraticCurveTo(s * 0.02, sy * s * 0.5, -s * 0.05, sy * s * 0.42); ctx.quadraticCurveTo(s * 0.04, sy * s * 0.25, s * 0.2, sy * s * 0.12); ctx.fill(); }
  ctx.fillStyle = 'rgba(160,190,215,0.18)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(190,215,235,0.35)'; ctx.lineWidth = Math.max(1, s * 0.02); body(); ctx.stroke();
  ctx.restore();
  // cephalic horns
  ctx.fillStyle = '#141d2a';
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.36, sy * s * 0.07); ctx.quadraticCurveTo(s * 0.58, sy * s * 0.1, s * 0.56, sy * s * 0.02); ctx.quadraticCurveTo(s * 0.48, sy * s * 0.03, s * 0.4, sy * s * 0.02); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#05080b'; for (const sy of [-1, 1]) { circle(s * 0.36, sy * s * 0.1, s * 0.018); ctx.fill(); }
  ctx.restore();
}
function drawOctopus(x, y, s, hide, pale) {
  if (hide >= 0.98) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 - hide * 0.6, 1 - hide * 0.85); ctx.globalAlpha = 1 - hide;
  const col = pale > 0.5 ? '#f3c3ad' : '#d9573a', dark = pale > 0.5 ? '#c9917c' : '#9c3420';
  ctx.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const side = k < 4 ? -1 : 1, i = k % 4, wav = Math.sin(T * 1.4 + k * 1.3);
    const sx = side * (0.05 + i * 0.07) * s, ex = side * (0.55 + i * 0.28) * s, ey = -s * 0.05 + Math.sin(T + k) * s * 0.04;
    const cx = side * (0.3 + i * 0.12) * s, cy = -s * (0.35 + 0.25 * wav);
    ctx.strokeStyle = dark; ctx.lineWidth = s * 0.2; ctx.beginPath(); ctx.moveTo(sx, -s * 0.3); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.13; ctx.stroke();
    ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(ex + side * s * 0.07, ey - s * 0.07, s * 0.07, side > 0 ? Math.PI : 0, side > 0 ? Math.PI * 2.4 : -Math.PI * 1.4, side < 0); ctx.stroke();
    ctx.fillStyle = '#f9d4c2';
    for (let q = 1; q <= 3; q++) { const u = q / 4, px = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * (-s * 0.3) + 2 * (1 - u) * u * cy + u * u * ey; circle(px, py + s * 0.04, s * 0.025); ctx.fill(); }
  }
  const g = ctx.createRadialGradient(-s * 0.3, -s * 1.0, s * 0.1, -s * 0.1, -s * 0.75, s * 0.75);
  g.addColorStop(0, pale > 0.5 ? '#ffe2d4' : '#f0805c'); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.78, s * 0.52, s * 0.62, -0.35, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,15,8,0.6)'; ctx.lineWidth = Math.max(0.6, s * 0.035); ctx.stroke();
  ctx.fillStyle = 'rgba(120,30,15,0.4)'; for (const [a, b] of [[-0.3, -1.0], [-0.05, -1.1], [-0.4, -0.75], [0.05, -0.85]]) { circle(s * a, s * b, s * 0.05); ctx.fill(); }
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.42, s * 0.13, s * 0.11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#05080b'; ctx.fillRect(s * 0.12, -s * 0.44, s * 0.16, s * 0.04);
  ctx.restore();
}
function drawCrab(x, y, s, vx) {
  const wl = T * 12;
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#a3361d'; ctx.lineWidth = Math.max(1, s * 0.13); ctx.lineCap = 'round';
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const ph = wl * (vx ? 1 : 0) + i * 1.2 + (side > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(ph)) * s * 0.22, bx = side * s * (0.25 + i * 0.18);
    ctx.beginPath(); ctx.moveTo(side * s * 0.4, s * 0.05); ctx.lineTo(bx + side * s * 0.45, -s * 0.2 - lift); ctx.lineTo(bx + side * s * 0.62, s * 0.62 - lift * 0.3); ctx.stroke();
  }
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(side * s * 0.45, -s * 0.15); ctx.lineTo(side * s * 0.85, -s * 0.55); ctx.stroke();
    const open = Math.sin(T * 5 + side) > 0.5 ? 0.5 : 0.15;
    ctx.fillStyle = '#e8613a';
    ctx.save(); ctx.translate(side * s * 0.88, -s * 0.62); ctx.rotate(side * -0.6);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.22, s * 0.15, 0, Math.PI + open, TAU - 0.1); ctx.lineTo(0, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.2, s * 0.12, 0, 0.1, Math.PI - open); ctx.lineTo(0, 0); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = lin(0, -s * 0.6, 0, s * 0.4, [[0, '#ff8550'], [1, '#b13a1f']]);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.72, s * 0.48, 0, Math.PI, TAU); ctx.quadraticCurveTo(0, s * 0.45, -s * 0.72, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(80,20,8,0.7)'; ctx.lineWidth = Math.max(0.6, s * 0.06); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,180,0.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.3, s * 0.25, s * 0.08, -0.2, 0, TAU); ctx.fill();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = '#a3361d'; ctx.lineWidth = Math.max(0.8, s * 0.08); ctx.beginPath(); ctx.moveTo(side * s * 0.18, -s * 0.4); ctx.lineTo(side * s * 0.24, -s * 0.72); ctx.stroke();
    ctx.fillStyle = '#05080b'; circle(side * s * 0.24, -s * 0.76, s * 0.09); ctx.fill(); ctx.fillStyle = '#fff'; circle(side * s * 0.22, -s * 0.79, s * 0.03); ctx.fill();
  }
  ctx.restore();
}
function drawJelly(j) {
  const pulse = 0.5 + 0.5 * Math.sin(T * 2.4 + j.ph), r = j.r * FS, sq = 0.82 + 0.18 * pulse, w = r * (1.05 - 0.1 * pulse);
  ctx.save(); ctx.translate(j.x, j.y);
  ctx.strokeStyle = 'rgba(255,190,235,0.28)'; ctx.lineWidth = Math.max(0.6, 0.8 * FS);
  for (let k = 0; k < 9; k++) {
    const x0 = (-0.85 + k * 0.21) * w; ctx.beginPath(); ctx.moveTo(x0, 0);
    for (let q = 1; q <= 7; q++) ctx.lineTo(x0 + Math.sin(T * 1.8 + q * 0.8 + k) * r * 0.15, q * r * 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,150,210,0.42)'; ctx.lineWidth = Math.max(1.2, 2.4 * FS);
  for (let k = 0; k < 4; k++) {
    const x0 = (-0.3 + k * 0.2) * r; ctx.beginPath(); ctx.moveTo(x0, 0);
    for (let q = 1; q <= 5; q++) ctx.lineTo(x0 + Math.sin(T * 2.2 + q + k * 2) * r * 0.12, q * r * 0.34);
    ctx.stroke();
  }
  additive(() => glow(0, -r * 0.3, r * 2.4, `rgba(255,120,210,${0.12 + 0.08 * pulse + TH.bio * 0.15})`));
  ctx.beginPath(); ctx.ellipse(0, 0, w, r * 0.95 * sq, 0, Math.PI, TAU);
  for (let k = 0; k < 8; k++) { const x1 = w - (k + 1) * (2 * w / 8), xm = w - (k + 0.5) * (2 * w / 8); ctx.quadraticCurveTo(xm, r * 0.18, x1, 0); }
  ctx.closePath();
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.7, r * 0.1, 0, -r * 0.3, r * 1.3);
  g.addColorStop(0, 'rgba(255,225,245,0.85)'); g.addColorStop(0.6, 'rgba(240,140,210,0.45)'); g.addColorStop(1, 'rgba(190,90,180,0.35)');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,220,245,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,160,220,0.6)'; ctx.lineWidth = Math.max(0.8, 1.4 * FS);
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc((k - 1.5) * r * 0.32, -r * 0.35 * sq, r * 0.13, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.6 * sq, r * 0.2, r * 0.1, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ================= kinds, guide ================= */
const KINDS = {
  flyer:   { name: 'flying fish',        size: [18, 25], h: [0.18, 0.38], vx: [60, 190], pals: PALS,   draw: (f, s, o) => fishGeneric(f, s, D.flyer, o), icon: 21 },
  gold:    { name: 'golden flying fish', size: [21, 26], h: [0.25, 0.4],  vx: [80, 190], pals: [GOLD], draw: (f, s, o) => fishGeneric(f, s, D.flyer, o), icon: 21 },
  mahi:    { name: 'mahi-mahi',          size: [22, 28], h: [0.16, 0.3],  vx: [80, 170], draw: (f, s, o) => fishGeneric(f, s, D.mahi, o), icon: 22 },
  tuna:    { name: 'bluefin tuna',       size: [24, 31], h: [0.14, 0.26], vx: [90, 180], draw: (f, s, o) => fishGeneric(f, s, D.tuna, o), icon: 20 },
  puffer:  { name: 'pufferfish',         size: [8, 11] , h: [0.05, 0.1],  vx: [20, 50], draw: fishPuffer, icon: 12 },
  sail:    { name: 'sailfish',           size: [26, 32], h: [0.2, 0.34],  vx: [110, 200], draw: (f, s, o) => fishGeneric(f, s, D.sail, o), icon: 15 },
  snapper: { name: 'red snapper',        size: [14, 18], h: [0.1, 0.2],   vx: [50, 120], draw: (f, s, o) => fishGeneric(f, s, D.snapper, o), icon: 25 },
  sardine: { name: 'sardine',            size: [5, 7],   h: [0.08, 0.16], vx: [60, 120], draw: fishSardine, icon: 14 },
};
const ICONS = {};
const SEA_GUIDE = [
  ['flyer', 'Flying fish', 'Glides on four wing-like fins. The most common catch.', 'Any ×'],
  ['puffer', 'Pufferfish', 'Puffs into a spiky ball when it leaps.', 'Any ×'],
  ['mahi', 'Mahi-mahi', 'Green and gold, with a sail-like back fin.', 'Any ×'],
  ['tuna', 'Bluefin tuna', 'Shows up more as the multiplier climbs.', '1.5× +'],
  ['snapper', 'Red snapper', 'Sipho reels these in with his rod.', 'Rod'],
  ['shark', 'Great white shark', 'Circles the boat and snatches fish in mid-air.', '2× +'],
  ['tiger', 'Tiger shark', 'Striped hunter with a long tail. Lunges with jaws wide open.', '2× +'],
  ['dolphin', 'Dolphin pod', 'Races past the bow, leaping as it goes.', '3×'],
  ['whale', 'Humpback whale', 'Glides slowly through the deep below the boat.', 'Any ×'],
  ['orca', 'Orca pod', 'Black-and-white killer whales race past the bow.', '6×'],
  ['sail', 'Sailfish', 'The fastest fish in the sea. Frenzy at 8×.', '8× +'],
  ['gold', 'Golden flying fish', 'Rare. Common in golden waters.', '15× +'],
  ['turtle', 'Green sea turtle', 'Paddles through the middle depths.', 'Always'],
  ['manta', 'Manta ray', 'Glides through the deep water.', 'Always'],
  ['octopus', 'Octopus', 'Lives on the sea floor. Hides when the mine blows.', 'Always'],
  ['crab', 'Crab', 'Scuttles along the sand.', 'Always'],
];
const CREW_GUIDE = [
  ['hank', 'Hank', 'Harpoon gunner at the bow. Keeps firing even after the blast.'],
  ['sipho', 'Sipho', 'Fishes with a rod from the wheelhouse roof.'],
  ['bongani', 'Bongani', 'Runs the stern crane. His lever drops the mine.'],
  ['naledi', 'Captain Naledi', 'Holds the Lucky Catch steady at the wheel.'],
];

function pickKind(m) {
  const lm = Math.log(Math.max(1, m));
  const w = [['flyer', 50], ['puffer', 9], ['mahi', 13 + 4 * lm], ['tuna', m >= 1.5 ? 8 + 7 * lm : 2], ['sail', m >= 8 ? 12 + 5 * lm : m >= 3 ? 2 : 0], ['gold', m >= 15 ? 14 : 2.2]];
  let total = 0; for (const [, v] of w) total += v;
  let r = Math.random() * total;
  for (const [k, v] of w) { r -= v; if (r <= 0) return k; }
  return 'flyer';
}
