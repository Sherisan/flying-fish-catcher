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
      case 'ink': ctx.fillStyle = `rgba(30,12,40,${a * 0.45})`; circle(p.x, p.y, p.r); ctx.fill(); break;
      case 'foam': { const y = surf(p.x); ctx.fillStyle = TH.bio > 0.5 ? `rgba(140,255,230,${a * 0.6})` : `rgba(240,250,255,${a * 0.55})`; ctx.beginPath(); ctx.ellipse(p.x, y + 1, p.w * (1.2 - a * 0.4), 2.2 * FS, 0, 0, TAU); ctx.fill(); break; }
      case 'debris':
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = a;
        ctx.fillStyle = '#1d2329'; poly([[-p.r, -p.r * 0.4], [p.r * 0.6, -p.r * 0.7], [p.r, p.r * 0.3], [-p.r * 0.3, p.r * 0.6]]); ctx.fill();
        ctx.fillStyle = '#f2c230'; ctx.fillRect(-p.r * 0.3, -p.r * 0.2, p.r * 0.6, p.r * 0.25);
        ctx.restore(); ctx.globalAlpha = 1; break;
      case 'text':
        ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.font = `${Math.round(17 * Math.max(FS, 0.7))}px 'Saira Stencil One', Impact, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = 'rgba(6,16,24,0.6)'; ctx.lineWidth = 3; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); ctx.globalAlpha = 1; break;
    }
  }
}
function drawPlume(t) {
  const t0 = t - 0.15; if (t0 <= 0 || t0 > 2.4) return;
  const rise = t0 < 0.45 ? ease(t0 / 0.45) : 1, fall = t0 > 0.8 ? clamp((t0 - 0.8) / 1.4, 0, 1) : 0;
  const h = H * 0.62 * rise * (1 - fall * 0.9), x = blast.x, base = surf(x) + 4, al = 1 - fall;
  const wB = 70 * S * (1 + fall * 0.8), wT = 150 * S * (0.5 + rise * 0.6 + fall * 1.2);
  ctx.fillStyle = lin(0, base, 0, base - h, [[0, `rgba(240,250,255,${0.92 * al})`], [0.6, `rgba(230,245,255,${0.6 * al})`], [1, 'rgba(230,245,255,0)']]);
  ctx.beginPath(); ctx.moveTo(x - wB / 2, base);
  ctx.bezierCurveTo(x - wB * 0.35, base - h * 0.45, x - wT * 0.45, base - h * 0.75, x - wT / 2, base - h);
  for (let k = 0; k <= 9; k++) ctx.lineTo(x - wT / 2 + wT * k / 9, base - h - (k % 2 ? 24 : 4) * S * rise * (1 - fall));
  ctx.bezierCurveTo(x + wT * 0.45, base - h * 0.75, x + wB * 0.35, base - h * 0.45, x + wB / 2, base);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${0.5 * al})`; ctx.lineWidth = 3 * S;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * wB * 0.15, base); ctx.quadraticCurveTo(x + k * wB * 0.25, base - h * 0.5, x + k * wT * 0.2, base - h * 0.95); ctx.stroke(); }
  ctx.fillStyle = `rgba(240,250,255,${0.75 * al})`; ctx.beginPath(); ctx.ellipse(x, base, wB * (1 + rise), 14 * S * rise, 0, Math.PI, TAU); ctx.fill();
}
function drawBlast() {
  const b = blast, t = b.t;
  if (t < 1.3) additive(() => { ctx.save(); surfPath(); ctx.clip(); ctx.fillStyle = `rgba(255,170,90,${0.4 * Math.max(0, 1 - t / 1.3)})`; ctx.fillRect(0, waterY - 20, W, H); ctx.restore(); });
  if (t < 1.3) {
    let r;
    if (t < 0.35) r = ease(t / 0.35) * 120; else if (t < 0.7) r = lerp(120, 48, ease((t - 0.35) / 0.35)); else if (t < 0.95) r = lerp(48, 80, ease((t - 0.7) / 0.25)); else r = lerp(80, 20, (t - 0.95) / 0.35);
    r *= S; const al = t < 0.95 ? 1 : 1 - (t - 0.95) / 0.35;
    if (r > 1) {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      g.addColorStop(0, `rgba(255,255,240,${0.95 * al})`); g.addColorStop(0.35, `rgba(255,205,110,${0.75 * al})`); g.addColorStop(0.72, `rgba(255,110,50,${0.4 * al})`); g.addColorStop(0.92, `rgba(255,240,220,${0.55 * al})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      additive(() => { ctx.fillStyle = g; circle(b.x, b.y, r); ctx.fill(); });
    }
  }
  if (t < 0.5) additive(() => glow(b.x, b.y, H * (0.25 + t * 1.3), `rgba(255,240,210,${0.9 * (1 - t / 0.5)})`));
  drawPlume(t);
  if (t > 0.2 && t < 3) { const k = (t - 0.2) / 2.8, rx = (60 + k * 400) * S; ctx.strokeStyle = `rgba(240,250,255,${0.65 * (1 - k)})`; ctx.lineWidth = 3 * S * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(b.x, surf(b.x) + 1, rx, 4 * S, 0, 0, TAU); ctx.stroke(); }
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
  if (breach) { const b = breach, ang = clamp(Math.atan2(b.vy, b.vx * 4), -0.95, 0.6); breachFlap = b.state === 'air' ? -0.55 : 0; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang); ctx.globalAlpha = clamp(b.alpha, 0, 1); fishGeneric({ wig: 0, air: true, state: 'swim' }, b.s, D.whale, 0); ctx.restore(); ctx.globalAlpha = 1; breachFlap = 0; }
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
    for (const r of rings) { if (r.delay > 0) continue; ctx.strokeStyle = r.dark ? `rgba(0,20,40,${r.life * 0.35})` : `rgba(220,245,255,${r.life * 0.6})`; ctx.lineWidth = r.w * FS; circle(r.x, r.y, r.r); ctx.stroke(); }
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
