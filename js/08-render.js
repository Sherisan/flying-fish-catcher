/*
 * Flying Fish Catcher · 08-render.js
 * Frame composition: draws creatures with the right orientation, particles, the water column
 * and fireball of the explosion, and render() which layers everything for one frame.
 */
'use strict';

function drawOriented(obj, ang, fn) {
  ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(ang); if (Math.cos(ang) < -0.001) ctx.scale(1, -1);
  ctx.globalAlpha = clamp(obj.alpha == null ? 1 : obj.alpha, 0, 1); fn(); ctx.restore();
}
function drawCreature(f) {
  const K = KINDS[f.kind];
  let ang;
  if (f.hang) ang = -Math.PI / 2 + Math.sin(T * 14 + f.wig) * 0.35;
  else if (f.state === 'caught') ang = f.spin;
  else if (f.state === 'flee' && f.delay > 0) ang = f.dir < 0 ? Math.PI : 0;
  else if (f.kind === 'puffer') ang = (f.vx < 0 ? Math.PI : 0) + clamp(f.vy / 900, -0.4, 0.4) * (f.vx < 0 ? -1 : 1);
  else ang = Math.atan2(f.vy, f.vx);
  drawOriented(f, ang, () => K.draw(f, f.s, (f.air || f.state === 'caught') ? 1 : 0.2));
}
function drawShark(sh) {
  if (sh.delay > 0) return;
  const ang = sh.state === 'patrol' || sh.state === 'flee' ? (sh.vx < 0 ? Math.PI : 0) + Math.sin(T * 0.9 + sh.ph) * 0.05 : Math.atan2(sh.vy, sh.vx || 0.001);
  drawOriented(sh, ang, () => fishGeneric(sh, sh.s, D[sh.kind || 'shark'], 0));
}
function drawParts(layer) {
  for (const p of parts) {
    const a = clamp(p.life / p.max, 0, 1);
    if (layer === 'back') {
      if (p.type === 'smoke') { ctx.fillStyle = p.light ? `rgba(230,225,220,${a * 0.45})` : `rgba(70,64,80,${a * 0.42})`; circle(p.x, p.y, p.r); ctx.fill(); }
      continue;
    }
    switch (p.type) {
      case 'drop': ctx.fillStyle = TH.bio > 0.5 ? `rgba(150,255,235,${0.35 + a * 0.55})` : `rgba(222,244,255,${0.35 + a * 0.55})`; circle(p.x, p.y, p.r); ctx.fill(); break;
      case 'bubble': case 'suck':
        ctx.strokeStyle = `rgba(205,240,255,${0.25 + a * 0.45})`; ctx.lineWidth = Math.max(0.8, p.r * 0.25); circle(p.x, p.y, p.r); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`; circle(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25); ctx.fill(); break;
      case 'spark': ctx.globalAlpha = a; additive(() => { ctx.fillStyle = p.c; circle(p.x, p.y, p.r); ctx.fill(); }); ctx.globalAlpha = 1; break;
      case 'ember': additive(() => { glow(p.x, p.y, p.r * 4, `rgba(255,${(120 + a * 100) | 0},50,${a * 0.7})`); ctx.fillStyle = `rgba(255,240,200,${a})`; circle(p.x, p.y, p.r * 0.6); ctx.fill(); }); break;
      case 'mist': ctx.fillStyle = `rgba(240,248,255,${a * 0.35})`; circle(p.x, p.y, p.r); ctx.fill(); break;
      case 'silt': ctx.fillStyle = `rgba(120,104,78,${a * 0.32})`; circle(p.x, p.y, p.r); ctx.fill(); ctx.fillStyle = `rgba(170,150,115,${a * 0.18})`; circle(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.6); ctx.fill(); break;
      case 'ink': ctx.fillStyle = `rgba(30,12,40,${a * 0.45})`; circle(p.x, p.y, p.r); ctx.fill(); break;
      case 'foam': { const y = surf(p.x); ctx.fillStyle = TH.bio > 0.5 ? `rgba(140,255,230,${a * 0.6})` : `rgba(240,250,255,${a * 0.55})`; ctx.beginPath(); ctx.ellipse(p.x, y + 1, p.w * (1.2 - a * 0.4), 2.2 * FS, 0, 0, TAU); ctx.fill(); break; }
      case 'debris':
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a;
        ctx.fillStyle = p.c || '#1d2329'; poly([[-p.r, -p.r * 0.4], [p.r * 0.6, -p.r * 0.7], [p.r, p.r * 0.3], [-p.r * 0.3, p.r * 0.6]]); ctx.fill();
        ctx.fillStyle = '#f2c230'; ctx.fillRect(-p.r * 0.3, -p.r * 0.2, p.r * 0.6, p.r * 0.25);
        ctx.restore(); ctx.globalAlpha = 1; break;
      case 'text':
        ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.font = `${Math.round(17 * Math.max(FS, 0.7))}px 'Saira Stencil One', Impact, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = 'rgba(6,16,24,0.6)'; ctx.lineWidth = 3; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); ctx.globalAlpha = 1; break;
    }
  }
}
function drawPlume(t) {
  const t0 = t - 0.12; if (t0 <= 0 || t0 > 3.2 || !blast.blobs) return;
  const rise = t0 < 0.55 ? ease(t0 / 0.55) : 1, fall = t0 > 0.7 ? clamp((t0 - 0.7) / 1.5, 0, 1) : 0, al = 1 - fall;
  const x = blast.x, base = surf(x) + 4, Hc = H * 0.44;
  // water dome bulging up before the column bursts through
  if (t0 < 0.5) { const k = ease(Math.min(1, t0 / 0.25)), q = 1 - clamp((t0 - 0.25) / 0.25, 0, 1); ctx.fillStyle = lin(0, base - 70 * S, 0, base, [[0, `rgba(250,253,255,${0.9 * q})`], [1, `rgba(170,215,235,${0.8 * q})`]]); ctx.beginPath(); ctx.ellipse(x, base, (60 + 50 * k) * S, 70 * S * k, 0, Math.PI, TAU); ctx.fill(); }
  // crown of water spikes thrown up around the base
  if (blast.crown && t0 < 1.2) {
    const cr = ease(Math.min(1, t0 / 0.28)), cd = clamp((t0 - 0.45) / 0.75, 0, 1), ca = 1 - cd;
    for (const c of blast.crown) {
      const bx = x + c.off * (50 + 45 * cr) * S, h = c.h * 95 * S * cr * (1 - cd * cd), tilt = c.off * 0.65, tx = bx + Math.sin(tilt) * h, ty = base - Math.cos(tilt) * h, hw = 6 * S * c.w;
      ctx.fillStyle = lin(0, base, 0, ty, [[0, `rgba(170,215,235,${0.85 * ca})`], [1, `rgba(250,253,255,${0.95 * ca})`]]);
      ctx.beginPath(); ctx.moveTo(bx - hw, base); ctx.quadraticCurveTo(bx + Math.sin(tilt) * h * 0.45 - hw * 0.3, base - h * 0.55, tx, ty); ctx.quadraticCurveTo(bx + Math.sin(tilt) * h * 0.45 + hw * 0.5, base - h * 0.5, bx + hw, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${ca})`; circle(tx + Math.sin(tilt) * 4 * S, ty - 4 * S, 3.2 * S * c.w); ctx.fill();
    }
  }
  const pts = [];
  for (const o of blast.blobs) {
    let bx, by, rr;
    if (!o.jet) {
      const hu = o.u * Hc * rise * (1 - fall * fall * (3 - 2 * fall)), w = (24 + 80 * o.u + 110 * fall * o.u) * S;
      bx = x + o.off * w + Math.sin(T * 1.7 + o.sd) * 5 * S; by = base - hu; rr = (12 + 28 * o.u) * S * o.r * (0.55 + 0.45 * rise) * (1 + fall * 0.9);
    } else {
      const d = o.u * Hc * 0.75 * rise, g = fall * fall * Hc * 0.9 * o.u;
      bx = x + Math.sin(o.jet) * d * 1.25 + Math.sin(o.jet) * fall * 120 * S; by = base - Math.cos(o.jet) * d + g; rr = (3 + 7 * o.u) * S * o.r;
    }
    if (by < base + rr * 0.3) pts.push([bx, Math.min(by, base), rr, o.u]);
  }
  ctx.fillStyle = `rgba(120,165,195,${0.55 * al})`; for (const [px, py, pr] of pts) { circle(px + pr * 0.22, py + pr * 0.25, pr); ctx.fill(); }
  for (const [px, py, pr, u] of pts) { const k = clamp((base - py) / (Hc * 0.35), 0, 1); ctx.fillStyle = `rgba(${(190 + 52 * k) | 0},${(226 + 22 * k) | 0},${(240 + 12 * k) | 0},${0.9 * al})`; circle(px, py, pr * 0.92); ctx.fill(); }
  if (fall > 0.05) { ctx.strokeStyle = `rgba(225,242,252,${0.5 * al})`; ctx.lineWidth = 1.6 * S; ctx.lineCap = 'round'; for (const [px, py, pr, u] of pts) if (u > 0.45) { ctx.beginPath(); ctx.moveTo(px, py + pr * 0.6); ctx.lineTo(px + Math.sin(px) * 3 * S, py + pr + fall * 70 * S * u); ctx.stroke(); } }
  ctx.fillStyle = `rgba(255,255,255,${0.85 * al})`; for (const [px, py, pr] of pts) { circle(px - pr * 0.3, py - pr * 0.32, pr * 0.38); ctx.fill(); }
  // churning white-water skirt where the column meets the sea
  const sw = (70 + 90 * rise + 260 * fall) * S;
  ctx.fillStyle = `rgba(245,250,255,${0.85 * (1 - fall * 0.7)})`; ctx.beginPath(); ctx.ellipse(x, base, sw, (10 + 10 * rise) * S, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = `rgba(200,232,245,${0.6 * (1 - fall)})`; for (let k = -4; k <= 4; k++) { circle(x + k * sw * 0.22, base - 4 * S, (9 + (k & 1) * 6) * S * (0.6 + rise * 0.4)); ctx.fill(); }
}
function drawBlast() {
  const b = blast, t = b.t;
  if (t < 1.3) additive(() => { ctx.save(); surfPath(); ctx.clip(); ctx.fillStyle = `rgba(255,170,90,${0.4 * Math.max(0, 1 - t / 1.3)})`; ctx.fillRect(0, waterY - 20, W, H); ctx.restore(); });
  if (t < 1.4) {
    let r;
    if (t < 0.35) r = ease(t / 0.35) * 130; else if (t < 0.7) r = lerp(130, 52, ease((t - 0.35) / 0.35)); else if (t < 0.95) r = lerp(52, 86, ease((t - 0.7) / 0.25)); else r = lerp(86, 16, clamp((t - 0.95) / 0.45, 0, 1));
    r *= S; const al = t < 0.95 ? 1 : 1 - clamp((t - 0.95) / 0.45, 0, 1), heat = clamp(1 - t / 0.6, 0, 1);
    if (r > 1) {
      // wobbling gas bubble: dark cavity, fiery core, swirling flames and a bright skin
      const wob = (rad) => { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const q = k / 40 * TAU, w = 1 + 0.06 * Math.sin(q * 5 + t * 14) + 0.035 * Math.sin(q * 9 - t * 22); const px = b.x + Math.cos(q) * rad * w, py = b.y + Math.sin(q) * rad * w * 0.94; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); };
      ctx.save(); surfPath(); ctx.clip();
      wob(r); ctx.fillStyle = `rgba(6,26,40,${0.4 * al})`; ctx.fill();
      additive(() => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * (0.55 + 0.4 * heat));
        g.addColorStop(0, `rgba(255,255,236,${al * (0.45 + 0.55 * heat)})`); g.addColorStop(0.45, `rgba(255,180,80,${al * 0.7})`); g.addColorStop(1, 'rgba(255,80,30,0)');
        ctx.fillStyle = g; wob(r); ctx.fill();
        ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,196,110,${al * (0.15 + 0.55 * heat)})`;
        for (let k = 0; k < 6; k++) { const q0 = k * TAU / 6 + t * (k % 2 ? 3 : -2.4), rr0 = r * (0.3 + (k % 3) * 0.16); ctx.lineWidth = (2 + (k % 2) * 2) * S; ctx.beginPath(); ctx.arc(b.x, b.y, rr0, q0, q0 + 1.1); ctx.stroke(); }
      });
      wob(r * 1.05); ctx.strokeStyle = `rgba(120,200,235,${0.35 * al})`; ctx.lineWidth = 7 * S; ctx.stroke();
      wob(r); ctx.strokeStyle = `rgba(235,250,255,${0.85 * al})`; ctx.lineWidth = 3 * S; ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * al})`; ctx.lineWidth = 3.2 * S; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.8, Math.PI * 1.1, Math.PI * 1.42); ctx.stroke();
      ctx.restore();
    }
  }
  if (t < 0.5) additive(() => glow(b.x, b.y, H * (0.25 + t * 1.3), `rgba(255,240,210,${0.9 * (1 - t / 0.5)})`));
  drawPlume(t);
  if (t > 0.2 && t < 3) { const k = (t - 0.2) / 2.8, rx = (60 + k * 400) * S; ctx.strokeStyle = `rgba(240,250,255,${0.65 * (1 - k)})`; ctx.lineWidth = 3 * S * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(b.x, surf(b.x) + 1, rx, 4 * S, 0, 0, TAU); ctx.stroke(); }
}
function drawBreach(b) {
  if (b.ring >= 0 && b.ring < 3) { const k = b.ring / 3; for (const [d, w] of [[0, 3], [0.25, 2]]) { const q = Math.max(0, k - d * 0.4); ctx.strokeStyle = `rgba(240,250,255,${0.6 * (1 - q)})`; ctx.lineWidth = w * FS * (1 - q) + 0.5; ctx.beginPath(); ctx.ellipse(b.x, surf(b.x) + 2, (b.L * 0.4 + q * 380 * FS) * (1 - d), (5 + q * 10) * FS, 0, 0, TAU); ctx.stroke(); } }
  if (b.state === 'shadow') {
    const k = clamp(b.t / 1.1, 0, 1), y = lerp(deepY, waterY + 40 * FS, k);
    ctx.fillStyle = `rgba(6,16,28,${0.18 + 0.32 * k})`; ctx.beginPath(); ctx.ellipse(b.x, y, b.L * (0.12 + 0.1 * k), b.L * (0.05 + 0.05 * k), 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(230,246,255,${0.5 * k})`; ctx.lineWidth = 2 * FS; ctx.beginPath(); ctx.ellipse(b.x, surf(b.x) + 2, b.L * 0.25 * k, 4 * FS * k, 0, 0, TAU); ctx.stroke();
    return;
  }
  const body = () => { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.scale(1, b.twist); fishGeneric({ wig: 0, air: true, state: 'swim' }, b.s, D.whale, 0); ctx.restore(); };
  breachFlap = b.state === 'air' ? -0.3 - 0.8 * Math.sin(Math.PI * clamp(b.ta / b.tAir, 0, 1)) : -0.1;
  const a = clamp(b.alpha, 0, 1);
  // part under the surface: faded and tinted
  ctx.save(); surfPath(); ctx.clip(); ctx.globalAlpha = a * 0.45; body(); ctx.restore();
  // part above the surface: full colour
  ctx.save(); ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(W + 40, -40); for (let x = W + 40; x >= -40; x -= 8) ctx.lineTo(x, surf(x)); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; body(); ctx.restore();
  ctx.globalAlpha = 1; breachFlap = 0;
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 22 * FS, (Math.random() - 0.5) * shake * 22 * FS);
  if (blast && blast.t < 0.45 && !reduceMotion) { const z = 1 + 0.05 * Math.pow(1 - blast.t / 0.45, 2); ctx.translate(blast.x, waterY); ctx.scale(z, z); ctx.translate(-blast.x, -waterY); }
  drawSky();
  drawParts('back');
  drawUnderwater();
  drawShip();
  if (breach) drawBreach(breach);
  for (const d of dolphins) if (!(d.delay > 0)) drawOriented(d, Math.atan2(d.vy, d.vx), () => fishGeneric(d, d.s, D[d.kind || 'dolphin'], 0));
  for (const f of fishes) drawCreature(f);
  if (rod.fish) drawCreature(rod.fish);
  for (const sh of sharks) if (sh.state === 'lunge' || sh.state === 'dive') drawShark(sh);
  drawRodLine();
  if (arrow) { drawRope(arrow); drawArrow(arrow); }
  drawTint();
  drawShipWater();
  if (mine && mine.state !== 'boom') {
    if (mine.y > waterY) {
      additive(() => glow(mine.x, mine.y, mine.R * 5, `rgba(255,40,30,${0.12 + mine.light * 0.18 + mine.heat * 0.2})`));
      ctx.save(); ctx.translate(mine.x, mine.y); ctx.rotate(T * 1.5); ctx.setLineDash([6 * S, 6 * S]);
      ctx.strokeStyle = `rgba(255,70,60,${0.35 + mine.light * 0.3})`; ctx.lineWidth = 2 * S; circle(0, 0, mine.R * (2.1 + mine.heat * 0.5)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    drawMine(mine.x, mine.y, mine.R, mine.rot, mine.light, mine.heat, mine.state === 'armed' ? '0.0' : mine.cd.toFixed(1));
  }
  if (rings.length) {
    ctx.save(); surfPath(); ctx.clip();
    for (const r of rings) {
      if (r.delay > 0) continue;
      if (r.dark) { ctx.strokeStyle = `rgba(0,20,40,${r.life * 0.35})`; ctx.lineWidth = r.w * FS; circle(r.x, r.y, r.r); ctx.stroke(); continue; }
      // shockwave: soft pale band with a crisp bright leading edge
      ctx.strokeStyle = `rgba(190,235,255,${r.life * 0.16})`; ctx.lineWidth = r.w * FS * 6; circle(r.x, r.y, Math.max(1, r.r - r.w * FS * 2)); ctx.stroke();
      ctx.strokeStyle = `rgba(240,252,255,${r.life * 0.7})`; ctx.lineWidth = Math.max(1, r.w * FS * 0.7); circle(r.x, r.y, r.r); ctx.stroke();
    }
    ctx.restore();
  }
  if (blast) drawBlast();
  drawParts('front');
  ctx.restore();
  if (game.phase === 'crashed' && mine && mine.state !== 'boom') {
    const a = 0.1 + 0.08 * Math.sin(T * 12), vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(255,30,30,${a * 2})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  if (flash > 0.4 && !reduceMotion) { ctx.fillStyle = `rgba(255,240,220,${(flash - 0.4) * 0.55})`; ctx.fillRect(0, 0, W, H); }
  const vg = ctx.createRadialGradient(W * 0.45, H * 0.45, Math.min(W, H) * 0.4, W * 0.45, H * 0.45, Math.max(W, H) * 0.8);
  vg.addColorStop(0, 'rgba(3,8,14,0)'); vg.addColorStop(1, 'rgba(3,8,14,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
