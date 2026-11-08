/*
 * Flying Fish Catcher · 06-crew.js
 * The crew: outfits (KITS) and each one's look (Hank's belly, bushy brows and red nose; Sipho's goatee;
 * Bongani's shades and moustache; Naledi's bun, shoulder boards and binoculars), two-bone arm IK, the
 * person drawing with faces and moods, and
 * crewState() which decides who is focused, happy or alarmed each frame.
 */
'use strict';

/* ---- crew ---- */
const KITS = {
  hank: { coat: '#f2b82a', coatDark: '#c98d12', pants: '#e8ac22', pantsDark: '#b98510', collar: '#26364a', skin: '#e6ad86', skinLight: '#f6caa6', skinDark: '#cf9270', brow: '#dcd6ca', glove: '#f06a2a', hat: 'souwester', hatColor: '#f2b82a', beard: true, strip: true, pipe: true, belly: true, bushy: true, redNose: true },
  sipho: { coat: '#2f6150', coatDark: '#1f4438', pants: '#e86a24', pantsDark: '#b8501a', bib: '#ff7a2f', collar: '#d9d2c4', skin: '#8a5636', skinLight: '#a46c48', skinDark: '#6b3f25', brow: '#1a120c', glove: '#33383d', hat: 'beanie', hatColor: '#d9473a', hair: '#1a120c', goatee: true },
  bongani: { coat: '#2b3a4a', coatDark: '#1c2733', pants: '#2b3a4a', pantsDark: '#1c2733', vest: true, collar: '#e8e3d6', skin: '#6e4128', skinLight: '#8a5638', skinDark: '#55301c', brow: '#140d08', glove: '#e8b52c', hat: 'hardhat', hatColor: '#f2c230', hair: '#140d08', strip: true, shades: true, moustache: true },
  naledi: { coat: '#1d2c44', coatDark: '#121c2e', pants: '#1d2c44', pantsDark: '#121c2e', buttons: true, collar: '#f2efe6', skin: '#7b4a2e', skinLight: '#93603f', skinDark: '#5e351f', brow: '#140d08', glove: '#7b4a2e', hat: 'captain', hatColor: '#f4f1ea', earring: true, hair: '#140d08', bun: true, epaulettes: true, binos: true, lips: '#a8323e' },
};
function ik(sx, sy, tx, ty, a, b, bend) {
  const dx = tx - sx, dy = ty - sy, d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 0.01, a + b - 0.01), base = Math.atan2(dy, dx);
  const off = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const ex = sx + Math.cos(base + bend * off) * a, ey = sy + Math.sin(base + bend * off) * a, ha = Math.atan2(ty - ey, tx - ex);
  return { ex, ey, hx: ex + Math.cos(ha) * b, hy: ey + Math.sin(ha) * b };
}
function drawArm(sx, sy, tx, ty, kit, bend, k) {
  k = k || CK;
  const j = ik(sx, sy, tx, ty, 12.5 * k, 12.5 * k, bend);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(j.ex, j.ey); ctx.lineTo(j.hx, j.hy);
  ctx.strokeStyle = 'rgba(16,14,14,0.65)'; ctx.lineWidth = 7.6 * k; ctx.stroke();
  ctx.strokeStyle = kit.coat; ctx.lineWidth = 6 * k; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.4 * k;
  ctx.beginPath(); ctx.moveTo(sx, sy - 2 * k); ctx.lineTo(j.ex, j.ey - 2 * k); ctx.stroke();
  ctx.strokeStyle = kit.coatDark; ctx.lineWidth = 6.6 * k; ctx.beginPath(); ctx.moveTo(lerp(j.ex, j.hx, 0.78), lerp(j.ey, j.hy, 0.78)); ctx.lineTo(lerp(j.ex, j.hx, 0.9), lerp(j.ey, j.hy, 0.9)); ctx.stroke();
  ctx.fillStyle = kit.glove; circle(j.hx, j.hy, 3.4 * k); ctx.fill(); ctx.strokeStyle = 'rgba(16,14,14,0.65)'; ctx.lineWidth = 1; ctx.stroke();
}
function personShoulder(x, feet, k) { k = k || CK; return { x: x - 1.5 * k, y: feet - 48 * k }; }
function drawPerson(x, feet, kit, o) {
  const k = o.k || CK, mood = o.mood || 'idle';
  ctx.save(); ctx.translate(x, feet); ctx.scale(k, k); ctx.rotate(o.lean || 0);
  const OL = 'rgba(16,14,14,0.62)'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1; ctx.strokeStyle = OL;
  // rubber sea boots: a chunky foot, a turned-down cuff and a dark sole
  const boot = (bx, c) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx + 9, 0); ctx.lineTo(bx + 9, -12); ctx.lineTo(bx - 0.5, -12); ctx.lineTo(bx - 1, -5.5);
    ctx.quadraticCurveTo(bx - 6, -5, bx - 6, -1.5); ctx.lineTo(bx - 6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b424b'; rr(bx - 1.2, -13.6, 10.8, 3.4, 1.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx - 0.6, -13.2, 9.6, 0.9);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(bx - 6, -1.8, 15, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(bx - 3, -3.8, 2, 0.9, -0.3, 0, TAU); ctx.fill();
  };
  if (!o.noLegs) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0.5, 15, 2.6, 0, 0, TAU); ctx.fill();
    // far leg, then the near one: trousers that taper into the boots, with a crease at the knee
    ctx.fillStyle = kit.pantsDark; poly([[0, -31], [9.8, -31], [9.2, -12], [0.8, -12]]); ctx.fill(); ctx.stroke(); boot(2, '#15181c');
    ctx.fillStyle = kit.pants; poly([[-10, -31], [0.8, -31], [0.4, -12], [-9, -12]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-9.2, -30, 1.4, 17);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(-7, -23.5); ctx.quadraticCurveTo(-4.6, -21.4, -2.4, -23); ctx.stroke(); ctx.strokeStyle = OL;
    boot(-8, '#1f2328');
  }
  const ty = Math.sin(T * 2.2 + x * 0.1) * 0.6;
  ctx.save(); ctx.translate(0, ty);
  // the jacket: broad shoulders, a rounded hem, and (for Hank) a belly pushing out the front
  const front = kit.belly ? -18 : -14.6;
  const jacket = () => {
    ctx.beginPath(); ctx.moveTo(-13.6, -26.4); ctx.quadraticCurveTo(front, -37, -12.6, -46.6); ctx.quadraticCurveTo(-10.8, -52.2, -4.6, -53.2);
    ctx.lineTo(4.6, -53.2); ctx.quadraticCurveTo(11.6, -52.2, 12.6, -46.6); ctx.quadraticCurveTo(14, -37, 13.2, -26.4); ctx.quadraticCurveTo(0, -24.4, -13.6, -26.4); ctx.closePath();
  };
  ctx.fillStyle = lin(-15, 0, 13, 0, [[0, kit.coat], [1, kit.coatDark]]); jacket(); ctx.fill(); ctx.stroke();
  ctx.save(); jacket(); ctx.clip();
  // light across the chest, shadow under the arm and along the hem
  ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.beginPath(); ctx.ellipse(-8, -43, 5.5, 8, -0.25, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(10, -38, 4, 13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(-19, -30.6, 34, 4.6);
  if (kit.bib) {
    ctx.fillStyle = kit.bib; rr(-9.5, -44, 14.5, 18, 2.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = kit.bib; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-8, -43); ctx.lineTo(-7, -52); ctx.moveTo(4, -43); ctx.lineTo(6, -52); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; rr(-6.5, -40, 8.5, 6, 1.4); ctx.fill();
    ctx.fillStyle = '#d8d2c4'; circle(-7.5, -42, 1); ctx.fill(); circle(3.5, -42, 1); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1;
  } else if (kit.vest) {
    ctx.fillStyle = '#ff7a1a'; poly([[-14, -27], [-1, -27], [-1, -50], [-10, -48]]); ctx.fill(); ctx.stroke(); poly([[1, -27], [14, -27], [11, -48], [1, -50]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8eef2'; ctx.fillRect(-15, -37, 30, 2.4); ctx.fillRect(-14, -43, 28, 2.4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-15, -37, 30, 0.7); ctx.fillRect(-14, -43, 28, 0.7);
    // a radio clipped to the vest
    ctx.fillStyle = '#22262c'; rr(-9, -50.5, 4, 6.5, 1); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7fe08a'; ctx.fillRect(-8.2, -49.4, 1.2, 1);
    ctx.strokeStyle = '#22262c'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-6, -50.5); ctx.lineTo(-6, -54); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  } else {
    // a zip, a chest pocket with its flap
    ctx.beginPath(); ctx.moveTo(-3, -52); ctx.lineTo(-3, -26); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-2.3, -51); ctx.lineTo(-2.3, -27); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; rr(2, -42, 7, 7, 1.5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; rr(1.6, -43, 7.8, 2.6, 1); ctx.fill();
    if (kit.buttons) { ctx.fillStyle = '#d8b46f'; for (const yy of [-47, -41, -35, -29]) { circle(-5.6, yy, 1.1); ctx.fill(); } }
  }
  if (kit.strip) { ctx.fillStyle = 'rgba(236,242,246,0.88)'; ctx.fillRect(-19, -34.5, 34, 1.9); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-19, -34.5, 34, 0.6); }
  if (!kit.bib && !kit.vest) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; rr(-11, -38.5, 6, 5.5, 1); ctx.fill(); ctx.beginPath(); ctx.moveTo(-11, -38.5); ctx.lineTo(-5, -38.5); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-13.2, -28.5); ctx.quadraticCurveTo(front + 0.8, -37, -12, -46); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  // gold shoulder boards for the skipper
  if (kit.epaulettes) {
    for (const ex of [-12.4, 4.8]) { ctx.fillStyle = '#1a1d22'; rr(ex, -54.2, 7.6, 3, 1.2); ctx.fill(); ctx.fillStyle = '#e2bf68'; ctx.fillRect(ex + 1, -53.6, 5.6, 0.7); ctx.fillRect(ex + 1, -52.4, 5.6, 0.7); }
  }
  // collar: a thick knit roll for Hank, a plain collar for the rest
  ctx.fillStyle = kit.collar; rr(-8, -55.2, 15, 5.4, 2.6); ctx.fill(); ctx.stroke();
  if (kit.belly) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.7; for (let q = -6; q <= 5; q += 2.2) { ctx.beginPath(); ctx.moveTo(q, -54.4); ctx.lineTo(q + 0.6, -50.6); ctx.stroke(); } ctx.strokeStyle = OL; ctx.lineWidth = 1; }
  // binoculars on a strap round the skipper's neck
  if (kit.binos) {
    ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-6, -51); ctx.lineTo(-4, -44); ctx.moveTo(5, -51); ctx.lineTo(1.5, -44); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
    ctx.fillStyle = '#2a2d33'; rr(-6.6, -45, 4.4, 7, 1.4); ctx.fill(); ctx.stroke(); rr(-1.6, -45, 4.4, 7, 1.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7fb8d8'; circle(-4.4, -38.6, 1.4); ctx.fill(); circle(0.6, -38.6, 1.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; circle(-4.8, -39, 0.45); ctx.fill(); circle(0.2, -39, 0.45); ctx.fill();
  }
  ctx.restore();

  const hx = -1, hy = -64 + ty;
  ctx.fillStyle = kit.skinDark; rr(hx - 3.6, hy + 5, 7.2, 6.4, 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; rr(hx - 3.6, hy + 9.4, 7.2, 2, 1); ctx.fill();
  if (kit.hair) { ctx.fillStyle = kit.hair; ctx.beginPath(); ctx.ellipse(hx + 3.2, hy - 2, 8.8, 9, 0, 0, TAU); ctx.fill(); }
  if (kit.bun) { ctx.fillStyle = kit.hair || '#140d08'; circle(hx + 9.6, hy - 0.4, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(hx + 9.6, hy - 0.4, 2.6, -2.4, -0.8); ctx.stroke(); ctx.strokeStyle = OL; }
  // the ear, with a fold inside it
  ctx.fillStyle = kit.skinDark; ctx.beginPath(); ctx.ellipse(hx + 6.2, hy + 0.6, 2.6, 3.4, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(hx + 6.4, hy + 0.8, 1.4, -1.6, 1.4); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  if (kit.earring) { ctx.fillStyle = '#d8b46f'; circle(hx + 6.5, hy + 4.4, 1.1); ctx.fill(); }
  // the face: a round head with a jaw that comes forward to a chin (he faces left)
  const face = () => {
    ctx.beginPath(); ctx.arc(hx, hy, 9.4, -Math.PI * 0.95, Math.PI * 0.25);
    ctx.quadraticCurveTo(hx + 1.4, hy + 11.8, hx - 4.6, hy + 10.4); ctx.quadraticCurveTo(hx - 9.8, hy + 8.4, hx - 9.6, hy + 1.6); ctx.closePath();
  };
  ctx.fillStyle = lin(hx - 9, hy - 9, hx + 9, hy + 9, [[0, kit.skinLight], [1, kit.skin]]); face(); ctx.fill(); ctx.stroke();
  ctx.save(); face(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 2, 5, 10, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(230,90,80,0.26)'; circle(hx - 5.4, hy + 3.4, 2.7); ctx.fill();
  if (kit.beard) {
    ctx.fillStyle = '#ece6d9'; ctx.beginPath(); ctx.moveTo(hx - 10, hy + 0.5);
    ctx.quadraticCurveTo(hx - 12, hy + 11, hx - 5, hy + 15); ctx.quadraticCurveTo(hx - 1, hy + 16.6, hx + 3.4, hy + 13.4);
    ctx.quadraticCurveTo(hx + 7.4, hy + 9.6, hx + 7.6, hy + 2); ctx.quadraticCurveTo(hx + 1, hy + 7, hx - 10, hy + 0.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,150,135,0.7)'; ctx.lineWidth = 0.7;
    for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(hx - 8.4 + q * 3, hy + 7); ctx.quadraticCurveTo(hx - 7.4 + q * 3, hy + 10.5, hx - 8.4 + q * 3, hy + 13); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 1;
  }
  if (kit.goatee) {
    ctx.fillStyle = kit.hair; ctx.beginPath(); ctx.moveTo(hx - 7.6, hy + 7.4); ctx.quadraticCurveTo(hx - 6.6, hy + 12.4, hx - 3.6, hy + 11.2); ctx.quadraticCurveTo(hx - 2.6, hy + 8.4, hx - 3.4, hy + 7.4); ctx.closePath(); ctx.fill();
  }
  const mx = hx - 4.6, my = hy + 5;
  const lips = kit.lips || '#3a1612';
  ctx.strokeStyle = lips; ctx.lineWidth = kit.lips ? 1.5 : 1.15;
  if (mood === 'alarm') { ctx.fillStyle = '#3a1612'; ctx.beginPath(); ctx.ellipse(mx, my + 0.8, 1.7, 2.4, 0, 0, TAU); ctx.fill(); if (kit.lips) ctx.stroke(); }
  else if (mood === 'happy') { ctx.fillStyle = '#3a1612'; ctx.beginPath(); ctx.moveTo(mx - 2.8, my - 0.6); ctx.quadraticCurveTo(mx, my + 3.8, mx + 3, my - 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(mx - 2.2, my - 0.5, 4.4, 1); ctx.fillStyle = '#d4575a'; ctx.beginPath(); ctx.ellipse(mx + 0.2, my + 1.8, 1.4, 0.7, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'focus') { ctx.beginPath(); ctx.moveTo(mx - 2.2, my + 0.4); ctx.lineTo(mx + 2.4, my - 0.1); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(mx - 2.2, my); ctx.quadraticCurveTo(mx, my + 1.7, mx + 2.5, my - 0.3); ctx.stroke(); }
  if (kit.beard) { ctx.fillStyle = '#f2ede2'; ctx.beginPath(); ctx.ellipse(mx - 0.4, my - 1.8, 4, 1.7, -0.1, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(160,150,135,0.8)'; ctx.lineWidth = 0.6; ctx.stroke(); }
  if (kit.moustache) { ctx.fillStyle = kit.hair; ctx.beginPath(); ctx.moveTo(mx - 3.6, my - 0.2); ctx.quadraticCurveTo(mx - 3, my - 2.6, mx, my - 2.2); ctx.quadraticCurveTo(mx + 2.8, my - 2.4, mx + 3.4, my - 0.4); ctx.quadraticCurveTo(mx, my - 1.2, mx - 3.6, my - 0.2); ctx.fill(); }
  ctx.strokeStyle = OL; ctx.lineWidth = 1;
  if (kit.pipe && (mood === 'idle' || mood === 'focus')) {
    ctx.strokeStyle = '#3b2414'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 0.5, my + 0.6); ctx.lineTo(mx - 6.4, my + 2.4); ctx.stroke();
    ctx.fillStyle = '#6b3f1c'; rr(mx - 9.8, my - 1.6, 4.6, 5.2, 1.3); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#ff8a3a'; ctx.fillRect(mx - 9.2, my - 1.8, 3.4, 1.1);
    for (let q = 0; q < 3; q++) { const u = ((T * 0.6 + q / 3) % 1); ctx.fillStyle = `rgba(225,225,230,${0.45 * (1 - u)})`; circle(mx - 7.4 + Math.sin(T * 2 + q * 2) * 2 * u, my - 3 - u * 14, 1.2 + u * 2.4); ctx.fill(); }
  }
  // the nose: a red bulb on the old salt, a rounded one on everyone else
  const nr = kit.redNose ? 3.2 : 2.6;
  ctx.fillStyle = kit.redNose ? '#e48a76' : kit.skinDark; ctx.beginPath(); ctx.ellipse(hx - 8, hy + 1.4, nr, nr * 0.92, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(16,14,14,0.35)'; ctx.lineWidth = 0.7; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; circle(hx - 8.8, hy + 0.3, 0.9); ctx.fill();
  const ey = hy - 2.2;
  const shades = kit.shades && !o.noShades;
  for (const [ex, sc] of [[hx - 4.2, 1], [hx + 2.2, 0.82]]) {
    if (o.blink) { ctx.strokeStyle = '#1b1410'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 2 * sc, ey); ctx.quadraticCurveTo(ex, ey + 1.1, ex + 2 * sc, ey); ctx.stroke(); }
    else {
      const big = (mood === 'alarm' ? 1.3 : 1) * sc;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.3 * big, 2.2 * big, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(16,14,14,0.4)'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = '#2b1d12'; circle(ex - 0.6 * sc, ey + 0.15, 1.35 * sc); ctx.fill(); ctx.fillStyle = '#fff'; circle(ex - 1.1 * sc, ey - 0.5, 0.5 * sc); ctx.fill();
      // the upper lid: heavy when he concentrates, lifted when alarmed
      ctx.strokeStyle = '#1b1410'; ctx.lineWidth = (mood === 'focus' ? 1.4 : 1) * sc; ctx.beginPath();
      ctx.ellipse(ex, ey + (mood === 'focus' ? 0.5 : 0), 2.35 * big, 2.2 * big, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      if (kit.bushy) { ctx.strokeStyle = 'rgba(120,80,60,0.45)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(ex, ey + 1.2, 2.2 * sc, 0.4, Math.PI - 0.4); ctx.stroke(); }
    }
    // brows: a white bushy thatch for Hank, a firm stroke for the rest
    if (kit.bushy) {
      const by = mood === 'alarm' ? ey - 5.6 : mood === 'focus' ? ey - 3.4 : ey - 4.3, tilt = mood === 'focus' ? 0.9 : 0;
      ctx.fillStyle = '#f2ede2'; ctx.beginPath(); ctx.moveTo(ex - 3.4 * sc, by + 1.2 - tilt); ctx.lineTo(ex - 2.6 * sc, by - 1.6); ctx.lineTo(ex - 1.2 * sc, by - 0.6);
      ctx.lineTo(ex, by - 2); ctx.lineTo(ex + 1.2 * sc, by - 0.6 + tilt * 0.5); ctx.lineTo(ex + 2.8 * sc, by - 1.2 + tilt); ctx.lineTo(ex + 3 * sc, by + 1 + tilt); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,150,135,0.8)'; ctx.lineWidth = 0.6; ctx.stroke();
    } else {
      ctx.strokeStyle = kit.brow; ctx.lineWidth = 1.9 * sc; ctx.beginPath();
      if (mood === 'alarm') { ctx.moveTo(ex - 2.8 * sc, ey - 5); ctx.quadraticCurveTo(ex, ey - 6.8, ex + 2.6 * sc, ey - 4.8); }
      else if (mood === 'focus') { ctx.moveTo(ex - 2.8 * sc, ey - 2.8); ctx.lineTo(ex + 2.6 * sc, ey - 4.2); }
      else { ctx.moveTo(ex - 2.8 * sc, ey - 3.8); ctx.quadraticCurveTo(ex, ey - 5, ex + 2.6 * sc, ey - 4); }
      ctx.stroke();
    }
  }
  // sunglasses: over the eyes, or slid down his nose when he gets a fright
  if (shades) {
    const sy = ey + (mood === 'alarm' ? 3.4 : 0.1);
    ctx.fillStyle = '#141a22'; ctx.strokeStyle = '#0a0d12'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(hx - 4.4, sy, 3.2, 2.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx + 2.3, sy, 2.6, 2.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - 1.3, sy - 0.6); ctx.lineTo(hx - 0.2, sy - 0.8); ctx.moveTo(hx + 4.8, sy - 0.6); ctx.lineTo(hx + 6.4, sy - 0.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,210,255,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx - 6, sy - 0.8); ctx.lineTo(hx - 4.4, sy - 1.8); ctx.moveTo(hx + 1.2, sy - 0.6); ctx.lineTo(hx + 2.4, sy - 1.5); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 1;
  }
  ctx.save(); ctx.translate(0, -(o.hatPop || 0) + ty); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  const hc = kit.hatColor;
  if (kit.hat === 'souwester') {
    ctx.fillStyle = '#d8d2c6'; ctx.beginPath(); ctx.ellipse(hx + 5, -61, 4, 3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(0, -80, 0, -66, [[0, hc], [1, '#c98d12']]);
    ctx.beginPath(); ctx.arc(hx + 1, -72, 9.4, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(hx - 15, -70.5); ctx.quadraticCurveTo(hx - 2, -75, hx + 11, -72); ctx.lineTo(hx + 18, -60); ctx.quadraticCurveTo(hx + 12, -64, hx + 7, -67.5); ctx.quadraticCurveTo(hx - 4, -68, hx - 15, -70.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(hx - 8, -76); ctx.quadraticCurveTo(hx + 1, -82, hx + 9, -75); ctx.stroke();
    ctx.strokeStyle = '#c98d12'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hx + 7, -67); ctx.quadraticCurveTo(hx + 4, -54, hx - 4, -53); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(hx - 3, -77, 3.5, 1.4, -0.4, 0, TAU); ctx.fill();
  } else if (kit.hat === 'beanie') {
    ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(hx, -68, 9.7, Math.PI * 1.02, -0.02); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; rr(hx - 10.5, -70, 21, 4.5, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(hx + q * 2.6, -70); ctx.lineTo(hx + q * 2.2, -76); ctx.stroke(); }
    ctx.fillStyle = '#f4efe4'; circle(hx, -78.5, 3); ctx.fill(); ctx.strokeStyle = OL; ctx.stroke();
  } else if (kit.hat === 'hardhat') {
    ctx.fillStyle = lin(0, -80, 0, -67, [[0, '#ffe066'], [1, hc]]); ctx.beginPath(); ctx.arc(hx, -68.5, 10, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(hx - 1, -68.5, 13.5, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(hx, -78.5); ctx.lineTo(hx, -69); ctx.stroke();
  } else if (kit.hat === 'captain') {
    ctx.fillStyle = '#1a1d22'; ctx.beginPath(); ctx.moveTo(hx - 13, -69); ctx.quadraticCurveTo(hx - 9, -73, hx - 3, -71); ctx.lineTo(hx - 3, -69); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1d22'; rr(hx - 9, -72, 18, 4, 1.5); ctx.fill();
    ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(hx - 10, -72); ctx.quadraticCurveTo(hx - 12, -81, hx + 1, -81); ctx.quadraticCurveTo(hx + 12, -80, hx + 10, -72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8b46f'; circle(hx - 5, -74.5, 1.8); ctx.fill();
    ctx.fillStyle = '#140d08'; ctx.beginPath(); ctx.ellipse(hx + 8.6, -64, 2.6, 3, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if (o.alarmBubble) {
    ctx.save(); ctx.translate(hx + 12, -96); const sc = 1 + clamp(o.alarmBubble - 1.8, 0, 0.6); ctx.scale(sc, sc);
    ctx.fillStyle = '#fff'; rr(-8, -12, 16, 20, 5); ctx.fill(); poly([[-5, 7], [-10, 14], [1, 7]]); ctx.fill();
    ctx.fillStyle = '#e23b3b'; ctx.font = "bold 15px 'Saira Stencil One', Impact, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, -1.5);
    ctx.restore();
  }
  ctx.restore();
}
function crewState() {
  const crashed = game.phase === 'crashed', armed = crashed && mine && mine.state !== 'boom', shocked = crashed && mine && mine.state === 'boom' && mine.t < 1.1;
  const hatPop = crashed && mine && mine.state === 'boom' && mine.t < 0.7 ? Math.sin(Math.PI * mine.t / 0.7) * 16 : 0;
  const blink = (off) => ((T + off) % 4.3) < 0.13;
  const bubble = boat.alarm > 0 && (armed || shocked) ? boat.alarm : 0;
  return {
    hank: { mood: armed ? 'alarm' : crew.hankHappy > 0 ? 'happy' : gun.state === 'aim' || gun.state === 'fly' ? 'focus' : shocked ? 'alarm' : 'idle', blink: blink(0), lean: gun.recoil * 0.07 - (gun.state === 'aim' ? 0.04 : 0), hatPop, alarmBubble: armed ? bubble : 0 },
    sipho: { mood: armed || shocked ? 'alarm' : crew.siphoHappy > 0 ? 'happy' : rod.state === 'bite' || rod.state === 'reel' ? 'focus' : 'idle', blink: blink(1.7), hatPop, alarmBubble: bubble },
    bongani: { mood: armed || shocked ? 'alarm' : crew.lever > 0.3 ? 'focus' : 'idle', blink: blink(2.9), hatPop, alarmBubble: bubble },
    naledi: { mood: armed || shocked ? 'alarm' : 'idle', blink: blink(0.9), hatPop: hatPop * 0.5, k: 0.95, noLegs: true },
  };
}
