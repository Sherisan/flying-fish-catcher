/*
 * Flying Fish Catcher · 06-crew.js
 * The crew: outfits (KITS), two-bone arm IK, the person drawing with faces and moods, and
 * crewState() which decides who is focused, happy or alarmed each frame.
 */
'use strict';

/* ---- crew ---- */
const KITS = {
  hank: { coat: '#f2b82a', coatDark: '#c98d12', pants: '#e8ac22', pantsDark: '#b98510', collar: '#26364a', skin: '#e6ad86', skinLight: '#f6caa6', skinDark: '#cf9270', brow: '#dcd6ca', glove: '#f06a2a', hat: 'souwester', hatColor: '#f2b82a', beard: true },
  sipho: { coat: '#2f6150', coatDark: '#1f4438', pants: '#e86a24', pantsDark: '#b8501a', bib: '#ff7a2f', collar: '#d9d2c4', skin: '#8a5636', skinLight: '#a46c48', skinDark: '#6b3f25', brow: '#1a120c', glove: '#33383d', hat: 'beanie', hatColor: '#d9473a' },
  bongani: { coat: '#2b3a4a', coatDark: '#1c2733', pants: '#2b3a4a', pantsDark: '#1c2733', vest: true, collar: '#e8e3d6', skin: '#6e4128', skinLight: '#8a5638', skinDark: '#55301c', brow: '#140d08', glove: '#e8b52c', hat: 'hardhat', hatColor: '#f2c230' },
  naledi: { coat: '#1d2c44', coatDark: '#121c2e', pants: '#1d2c44', pantsDark: '#121c2e', buttons: true, collar: '#f2efe6', skin: '#7b4a2e', skinLight: '#93603f', skinDark: '#5e351f', brow: '#140d08', glove: '#7b4a2e', hat: 'captain', hatColor: '#f4f1ea', earring: true },
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
  ctx.fillStyle = kit.glove; circle(j.hx, j.hy, 3.4 * k); ctx.fill(); ctx.strokeStyle = 'rgba(16,14,14,0.65)'; ctx.lineWidth = 1; ctx.stroke();
}
function personShoulder(x, feet, k) { k = k || CK; return { x: x - 1.5 * k, y: feet - 48 * k }; }
function drawPerson(x, feet, kit, o) {
  const k = o.k || CK, mood = o.mood || 'idle';
  ctx.save(); ctx.translate(x, feet); ctx.scale(k, k); ctx.rotate(o.lean || 0);
  const OL = 'rgba(16,14,14,0.62)'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1; ctx.strokeStyle = OL;
  const boot = (bx, c) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx + 8.5, 0); ctx.lineTo(bx + 8.5, -11); ctx.lineTo(bx, -11); ctx.lineTo(bx - 1, -5);
    ctx.quadraticCurveTo(bx - 5, -4.5, bx - 5, -1.5); ctx.lineTo(bx - 5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(bx, -11, 8.5, 1.6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx - 5, -1.6, 13.5, 1.6);
  };
  if (!o.noLegs) {
    ctx.fillStyle = kit.pantsDark; rr(0, -31, 9, 22, 3); ctx.fill(); ctx.stroke(); boot(2, '#15181c');
    ctx.fillStyle = kit.pants; rr(-9, -31, 9.5, 22, 3); ctx.fill(); ctx.stroke(); boot(-8, '#1f2328');
  }
  const ty = Math.sin(T * 2.2 + x * 0.1) * 0.6;
  ctx.save(); ctx.translate(0, ty);
  ctx.fillStyle = lin(-12, 0, 12, 0, [[0, kit.coat], [1, kit.coatDark]]);
  ctx.beginPath(); ctx.moveTo(-12.5, -27); ctx.lineTo(12, -27); ctx.lineTo(11, -48); ctx.quadraticCurveTo(0, -55, -11, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(-12.4, -31, 24.3, 4);
  if (kit.bib) {
    ctx.fillStyle = kit.bib; rr(-9, -44, 14, 17, 2.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = kit.bib; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-8, -43); ctx.lineTo(-7, -51); ctx.moveTo(4, -43); ctx.lineTo(6, -51); ctx.stroke();
    ctx.fillStyle = '#d8d2c4'; circle(-7.5, -42, 0.9); ctx.fill(); circle(3.5, -42, 0.9); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 1;
  } else if (kit.vest) {
    ctx.fillStyle = '#ff7a1a'; poly([[-11.5, -29], [-1, -29], [-1, -49], [-9.5, -47]]); ctx.fill(); ctx.stroke(); poly([[1, -29], [11.5, -29], [10, -47], [1, -49]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8eef2'; ctx.fillRect(-11, -37, 22, 2.4); ctx.fillRect(-10.5, -43, 21, 2.4);
  } else {
    ctx.beginPath(); ctx.moveTo(-3, -50); ctx.lineTo(-3, -28); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; rr(2, -40, 7, 6, 1.5); ctx.fill();
    if (kit.buttons) { ctx.fillStyle = '#d8b46f'; for (const yy of [-45, -39, -33]) { circle(-5.5, yy, 1); ctx.fill(); } ctx.fillStyle = '#d8b46f'; ctx.fillRect(7, -48, 5, 1.6); }
  }
  ctx.fillStyle = kit.collar; rr(-7.5, -54.5, 14, 5, 2.4); ctx.fill(); ctx.stroke();
  ctx.restore();
  const hx = -1, hy = -64 + ty;
  ctx.fillStyle = kit.skinDark; rr(hx - 3.5, hy + 5, 7, 6, 2); ctx.fill();
  ctx.fillStyle = kit.skinDark; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 0.5, 2.4, 3.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (kit.earring) { ctx.fillStyle = '#d8b46f'; circle(hx + 6.3, hy + 4, 1); ctx.fill(); }
  ctx.fillStyle = lin(hx - 9, hy - 9, hx + 9, hy + 9, [[0, kit.skinLight], [1, kit.skin]]); circle(hx, hy, 9.2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(230,90,80,0.22)'; circle(hx - 5.2, hy + 3, 2.6); ctx.fill();
  if (kit.beard) {
    ctx.fillStyle = '#ece6d9'; ctx.beginPath(); ctx.moveTo(hx - 9.8, hy + 0.5);
    ctx.quadraticCurveTo(hx - 11.5, hy + 10, hx - 5, hy + 13.5); ctx.quadraticCurveTo(hx - 1, hy + 15, hx + 3, hy + 12.5);
    ctx.quadraticCurveTo(hx + 7, hy + 9, hx + 7.5, hy + 2); ctx.quadraticCurveTo(hx + 1, hy + 7, hx - 9.8, hy + 0.5); ctx.fill();
    ctx.strokeStyle = 'rgba(160,150,135,0.7)'; ctx.lineWidth = 0.7;
    for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(hx - 8 + q * 3, hy + 7); ctx.quadraticCurveTo(hx - 7 + q * 3, hy + 10, hx - 8 + q * 3, hy + 12); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 1;
  }
  const mx = hx - 6.2, my = hy + 4.8;
  ctx.strokeStyle = '#3a1612'; ctx.lineWidth = 1.1;
  if (mood === 'alarm') { ctx.fillStyle = '#3a1612'; ctx.beginPath(); ctx.ellipse(mx, my + 0.6, 1.6, 2.2, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'happy') { ctx.fillStyle = '#3a1612'; ctx.beginPath(); ctx.moveTo(mx - 2.6, my - 0.6); ctx.quadraticCurveTo(mx, my + 3.4, mx + 2.8, my - 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(mx - 2, my - 0.5, 4, 0.9); }
  else if (mood === 'focus') { ctx.beginPath(); ctx.moveTo(mx - 2, my + 0.4); ctx.lineTo(mx + 2.2, my); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(mx - 2, my); ctx.quadraticCurveTo(mx, my + 1.5, mx + 2.3, my - 0.2); ctx.stroke(); }
  if (kit.beard) { ctx.fillStyle = '#f2ede2'; ctx.beginPath(); ctx.ellipse(mx - 0.4, my - 1.7, 3.6, 1.5, -0.1, 0, TAU); ctx.fill(); }
  ctx.fillStyle = kit.skinDark; circle(hx - 9.2, hy + 1.2, 2.6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(hx - 9.8, hy + 0.3, 0.8); ctx.fill();
  const ex = hx - 4.6, ey = hy - 2.2;
  if (o.blink) { ctx.strokeStyle = '#1b1410'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(ex - 1.8, ey); ctx.quadraticCurveTo(ex, ey + 1, ex + 1.8, ey); ctx.stroke(); }
  else {
    const big = mood === 'alarm' ? 1.3 : 1;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.1 * big, 1.8 * big, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b1d12'; circle(ex - 0.7, ey + 0.1, 1.15); ctx.fill(); ctx.fillStyle = '#fff'; circle(ex - 1.1, ey - 0.5, 0.4); ctx.fill();
  }
  ctx.strokeStyle = kit.brow; ctx.lineWidth = 1.5; ctx.beginPath();
  if (mood === 'alarm') { ctx.moveTo(ex - 3, ey - 4.8); ctx.quadraticCurveTo(ex, ey - 6.4, ex + 2.6, ey - 4.6); }
  else if (mood === 'focus') { ctx.moveTo(ex - 3, ey - 2.6); ctx.lineTo(ex + 2.6, ey - 4); }
  else { ctx.moveTo(ex - 3, ey - 3.6); ctx.quadraticCurveTo(ex, ey - 4.7, ex + 2.6, ey - 3.8); }
  ctx.stroke();
  ctx.save(); ctx.translate(0, -(o.hatPop || 0) + ty); ctx.strokeStyle = OL; ctx.lineWidth = 1;
  const hc = kit.hatColor;
  if (kit.hat === 'souwester') {
    ctx.fillStyle = '#d8d2c6'; ctx.beginPath(); ctx.ellipse(hx + 5, -61, 4, 3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(0, -80, 0, -66, [[0, hc], [1, '#c98d12']]);
    ctx.beginPath(); ctx.arc(hx + 1, -72, 9.4, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(hx - 15, -70.5); ctx.quadraticCurveTo(hx - 2, -75, hx + 11, -72); ctx.lineTo(hx + 18, -60); ctx.quadraticCurveTo(hx + 12, -64, hx + 7, -67.5); ctx.quadraticCurveTo(hx - 4, -68, hx - 15, -70.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(hx - 8, -76); ctx.quadraticCurveTo(hx + 1, -82, hx + 9, -75); ctx.stroke();
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
    ctx.fillStyle = '#140d08'; ctx.beginPath(); ctx.ellipse(hx + 7, -63, 3.2, 4, 0, 0, TAU); ctx.fill();
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
