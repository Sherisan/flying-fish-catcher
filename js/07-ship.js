/*
 * Flying Fish Catcher · 07-ship.js
 * The trawler "Lucky Catch": sea mine artwork, stern crane, wheelhouse with Captain Naledi, mast
 * and radar, string lights, deck gear, hull, floodlights and searchlight, harpoon cannon, harpoon
 * arrow, rope and fishing line. Ship parts are drawn in ship-local units, scaled by S.
 */
'use strict';

/* ---- ship ---- */
function drawMine(x, y, R, rot, light, heat, digits) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const OL = 'rgba(5,8,10,0.85)';
  for (const d of [-90, -45, -135, 0, 180, 45, 135, 90]) {
    ctx.save(); ctx.rotate(d * Math.PI / 180);
    ctx.fillStyle = lin(0, -R * 0.11, 0, R * 0.11, [[0, '#8d99a3'], [0.5, '#56626c'], [1, '#252d33']]);
    poly([[R * 0.82, -R * 0.11], [R * 1.22, -R * 0.075], [R * 1.22, R * 0.075], [R * 0.82, R * 0.11]]); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = R * 0.025; ctx.stroke();
    ctx.fillStyle = heat > 0.05 ? `rgb(${lerp(210, 255, heat) | 0},${lerp(172, 70, heat) | 0},${lerp(103, 40, heat) | 0})` : '#d2ac67';
    circle(R * 1.27, 0, R * 0.115); ctx.fill(); ctx.stroke();
    if (heat > 0.3) additive(() => glow(R * 1.27, 0, R * 0.4 * heat, `rgba(255,90,40,${0.6 * heat})`));
    ctx.restore();
  }
  const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.08, 0, 0, R * 1.05);
  g.addColorStop(0, '#b3bec6'); g.addColorStop(0.3, '#64727d'); g.addColorStop(0.72, '#2b343c'); g.addColorStop(1, '#0d1216');
  ctx.fillStyle = g; circle(0, 0, R); ctx.fill();
  ctx.save(); circle(0, 0, R); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = R * 0.03;
  for (const k of [0.5, 0.85]) { ctx.beginPath(); ctx.ellipse(0, 0, R * k, R, 0, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
  ctx.fillStyle = 'rgba(210,220,228,0.45)';
  for (const k of [0, 0.5, -0.5]) for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 2) continue; const a = i / 5 * Math.PI / 2; circle(Math.sin(a) * 0 + k * R * Math.cos(a), Math.sin(a) * R * 0.95, R * 0.025); ctx.fill(); }
  ctx.fillStyle = 'rgba(150,75,30,0.32)';
  for (const [a, b, r] of [[-0.5, 0.5, 0.18], [0.55, 0.45, 0.12], [0.3, -0.7, 0.1], [-0.65, -0.35, 0.09]]) { ctx.beginPath(); ctx.ellipse(R * a, R * b, R * r * 1.4, R * r, 0.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = lin(0, 0, R, R, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(90,170,210,0.28)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
  const band = () => rr(-R * 1.06, -R * 0.17, R * 2.12, R * 0.34, R * 0.15);
  band(); ctx.fillStyle = '#f2c230'; ctx.fill();
  ctx.save(); band(); ctx.clip();
  ctx.fillStyle = '#14181c';
  for (let k = -6; k < 6; k++) { const x0 = k * R * 0.3; poly([[x0, -R * 0.2], [x0 + R * 0.15, -R * 0.2], [x0 + R * 0.03, R * 0.2], [x0 - R * 0.12, R * 0.2]]); ctx.fill(); }
  ctx.fillStyle = lin(0, -R * 0.17, 0, R * 0.17, [[0, 'rgba(255,255,255,0.35)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.45)']]); ctx.fillRect(-R * 1.1, -R * 0.2, R * 2.2, R * 0.4);
  ctx.fillStyle = lin(-R, 0, R, 0, [[0, 'rgba(0,0,0,0.6)'], [0.22, 'rgba(0,0,0,0)'], [0.78, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.65)']]); ctx.fillRect(-R * 1.1, -R * 0.2, R * 2.2, R * 0.4);
  ctx.restore();
  band(); ctx.strokeStyle = OL; ctx.lineWidth = R * 0.03; ctx.stroke();
  ctx.fillStyle = 'rgba(230,236,240,0.7)';
  for (let i = -5; i <= 5; i++) { const xx = i * R * 0.18, k = Math.sqrt(Math.max(0, 1 - (xx / (R * 1.05)) ** 2)); circle(xx, -R * 0.13, R * 0.025 * k); ctx.fill(); circle(xx, R * 0.13, R * 0.025 * k); ctx.fill(); }
  ctx.fillStyle = '#e9e4d6'; rr(-R * 0.3, R * 0.3, R * 0.6, R * 0.32, R * 0.05); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = R * 0.02; ctx.stroke();
  ctx.fillStyle = '#f2c230'; poly([[0, R * 0.34], [R * 0.13, R * 0.57], [-R * 0.13, R * 0.57]]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#14181c'; ctx.fillRect(-R * 0.012, R * 0.4, R * 0.024, R * 0.1); circle(0, R * 0.53, R * 0.015); ctx.fill();
  ctx.fillStyle = '#0b0f12'; rr(-R * 0.36, -R * 0.62, R * 0.72, R * 0.3, R * 0.06); ctx.fill(); ctx.strokeStyle = '#3a444c'; ctx.lineWidth = R * 0.03; ctx.stroke();
  ctx.fillStyle = light > 0.5 ? '#ff4a3a' : '#8a2a22'; ctx.font = `bold ${Math.max(4, R * 0.24)}px 'Courier New', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(digits, R * 0.08, -R * 0.47);
  if (light > 0.5) additive(() => glow(R * 0.08, -R * 0.47, R * 0.5, 'rgba(255,60,40,0.35)'));
  ctx.fillStyle = light > 0.5 ? '#ff4a3a' : light > 0.1 ? '#8a201a' : '#4a1512'; circle(-R * 0.27, -R * 0.47, R * 0.05); ctx.fill();
  for (const [a, b] of [[0.48, -0.42], [-0.55, 0.45], [0.6, 0.55]]) {
    ctx.fillStyle = '#56626c'; circle(R * a, R * b, R * 0.12); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = R * 0.02; ctx.stroke();
    ctx.fillStyle = heat > 0.05 ? `rgb(255,${lerp(170, 80, heat) | 0},60)` : '#d2ac67'; circle(R * a, R * b, R * 0.065); ctx.fill();
  }
  ctx.strokeStyle = '#5d6873'; ctx.lineWidth = R * 0.09; ctx.beginPath(); ctx.arc(0, -R * 1.07, R * 0.15, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#3d474f'; rr(-R * 0.12, -R * 1.0, R * 0.24, R * 0.08, R * 0.02); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-R * 0.42, -R * 0.62, R * 0.24, R * 0.12, -0.7, 0, TAU); ctx.fill();
  if (light > 0.1) additive(() => glow(0, 0, R * (1.4 + light * 0.6), `rgba(255,40,30,${0.12 * light + heat * 0.25})`));
  ctx.restore();
}
function drawCrane() {
  const b1 = [150, deckY(150)], b2 = [178, deckY(178)], ap = [206, -162];
  ctx.lineCap = 'round';
  for (const [w, c] of [[8.5, '#6e520f'], [5.5, '#e8b52c']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
    ctx.moveTo(b1[0], b1[1]); ctx.lineTo(ap[0], ap[1]); ctx.moveTo(b2[0], b2[1]); ctx.lineTo(ap[0] + 2, ap[1] + 2); ctx.moveTo(ap[0], ap[1]); ctx.lineTo(HANG.x, HANG.y); ctx.stroke();
  }
  ctx.strokeStyle = '#14181c'; ctx.lineWidth = 5.5; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(lerp(b1[0], ap[0], 0.18), lerp(b1[1], ap[1], 0.18)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#e8b52c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(178, -106); ctx.lineTo(194, -106); ctx.stroke();
  ctx.strokeStyle = '#9aa5ae'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(188, deckY(188)); ctx.lineTo(200, -120); ctx.stroke();
  ctx.fillStyle = '#2b3138'; circle(HANG.x, HANG.y, 5.5); ctx.fill(); ctx.fillStyle = '#9aa5ae'; circle(HANG.x, HANG.y, 2); ctx.fill();
  const on = game.phase === 'crashed' ? Math.sin(T * 14) > 0 : Math.sin(T * 3) > 0.7;
  ctx.fillStyle = on ? '#ffb020' : '#7a5410'; circle(ap[0], ap[1] - 6, 3); ctx.fill();
  if (on) additive(() => glow(ap[0], ap[1] - 6, 18, 'rgba(255,170,40,0.6)'));
}
function drawChain(x0, y0, x1, y1) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 5)), a = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = '#8b949c'; ctx.lineWidth = 1.6;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; ctx.beginPath(); ctx.ellipse(lerp(x0, x1, t), lerp(y0, y1, t), 3.2, i % 2 ? 1.6 : 0.6, a, 0, TAU); ctx.stroke(); }
}
function drawSuperstructure(cs) {
  ctx.fillStyle = lin(72, 0, 106, 0, [[0, '#e0602f'], [0.6, '#c94a22'], [1, '#8f2f14']]);
  poly([[72, -168], [76, -208], [102, -208], [106, -168]]); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#16191d'; poly([[75.5, -208], [76.5, -216], [101.5, -216], [102.5, -208]]); ctx.fill();
  ctx.fillStyle = '#f4efe4'; circle(89, -189, 8); ctx.fill();
  ctx.fillStyle = '#1b3554'; ctx.beginPath(); ctx.ellipse(90, -189, 5, 2.2, -0.3, 0, TAU); ctx.fill(); poly([[85.5, -187.5], [82, -191], [82.5, -185]]); ctx.fill();
  ctx.fillStyle = lin(0, -116, 0, -46, [[0, '#f4efe4'], [1, '#cfc7b6']]);
  poly([[-18, -46], [-10, -116], [114, -116], [114, -46]]); ctx.fill(); ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#2f6f73'; rr(0, -104, 16, 50, 2); ctx.fill();
  ctx.fillStyle = '#d2ac67'; circle(8, -92, 4.5); ctx.fill(); ctx.fillStyle = '#ffd690'; circle(8, -92, 3); ctx.fill();
  for (const x of [28, 54, 80]) { ctx.fillStyle = lin(0, -104, 0, -88, [[0, '#ffe2a2'], [1, '#ffab5e']]); rr(x, -104, 20, 15, 2); ctx.fill(); ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 1.5; ctx.stroke(); }
  if (TH.lights > 0.4) additive(() => { for (const x of [38, 64, 90]) glow(x, -96, 22, `rgba(255,190,110,${0.18 * TH.lights})`); });
  ctx.fillStyle = '#ff7a2f'; ctx.fillRect(-11, -118, 125, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = 0; x < 110; x += 14) ctx.fillRect(x, -84, 1, 36);
  ctx.fillStyle = '#d9d2c2'; poly([[-32, -119], [-4, -119], [-4, -114], [-32, -114]]); ctx.fill(); ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = '#8a929a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-26, -114); ctx.lineTo(-14, -98); ctx.stroke();
  ctx.strokeStyle = 'rgba(225,232,236,0.95)'; ctx.lineWidth = 1.3; ctx.beginPath(); for (const x of [-32, -23, -14]) { ctx.moveTo(x, -119); ctx.lineTo(x, -131); } ctx.moveTo(-32, -131); ctx.lineTo(-4, -131); ctx.moveTo(-32, -125); ctx.lineTo(-4, -125); ctx.stroke();
  ctx.fillStyle = '#3a4048'; rr(-35, -138, 10, 7, 2); ctx.fill(); ctx.fillStyle = '#fff6d8'; circle(-34.5, -134.5, 2.6); ctx.fill();
  ctx.fillStyle = lin(0, -164, 0, -116, [[0, '#f8f4ec'], [1, '#dcd5c6']]);
  poly([[-6, -116], [10, -164], [110, -164], [110, -116]]); ctx.fill(); ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 1.5; ctx.stroke();
  const win = () => poly([[3, -124], [13, -155], [104, -155], [104, -124]]);
  win(); ctx.fillStyle = lin(0, -156, 0, -124, [[0, '#ffdca0'], [1, '#ff9f5a']]); ctx.fill();
  ctx.save(); win(); ctx.clip();
  drawPerson(52, -80, KITS.naledi, cs.naledi);
  const wa = -boat.ang * 3 + Math.sin(T * 0.5) * 0.3, wx = 30, wy = -131;
  const sh = personShoulder(52, -80, 0.95);
  drawArm(sh.x, sh.y, wx + Math.cos(wa - 1.2) * 8, wy + Math.sin(wa - 1.2) * 8, KITS.naledi, 1, 0.95);
  ctx.strokeStyle = '#6b3f1c'; ctx.lineWidth = 2.2; circle(wx, wy, 8); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = wa + k * Math.PI / 4; ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11); } ctx.stroke();
  ctx.fillStyle = '#d8b46f'; circle(wx, wy, 2); ctx.fill();
  drawArm(sh.x + 2, sh.y + 1, wx + Math.cos(wa + 0.6) * 8, wy + Math.sin(wa + 0.6) * 8, KITS.naledi, 1, 0.95);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(68, -126); ctx.lineTo(78, -153); ctx.moveTo(76, -126); ctx.lineTo(82, -142); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2; ctx.beginPath(); for (const x of [36, 62, 86]) { ctx.moveTo(x, -155); ctx.lineTo(x, -124); } ctx.stroke();
  win(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#2f6f73'; rr(-10, ROOF_Y, 124, 7, 2); ctx.fill();
  ctx.fillStyle = '#ff7a2f'; ctx.fillRect(-10, ROOF_Y + 6, 124, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(-4, ROOF_Y + 7.5, 114, 5);
  ctx.fillStyle = '#3a4048'; rr(56, ROOF_Y - 7, 8, 7, 1.5); ctx.fill();
  const rdg = ctx.createRadialGradient(57, ROOF_Y - 17, 1, 60, ROOF_Y - 13, 10); rdg.addColorStop(0, '#ffffff'); rdg.addColorStop(1, '#b9c3ca');
  ctx.fillStyle = rdg; circle(60, ROOF_Y - 13, 8.5); ctx.fill(); ctx.strokeStyle = 'rgba(40,50,60,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(60, ROOF_Y - 13, 8.5, 2.2, 0, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#d2ac67'; poly([[72, -193], [61, -198], [61, -188]]); ctx.fill(); ctx.fillRect(70, -194.5, 4, 3);
  ctx.strokeStyle = '#9aa5ae'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(116, -46); ctx.lineTo(116, ROOF_Y); ctx.moveTo(122, -46); ctx.lineTo(122, ROOF_Y); for (let y = -54; y > ROOF_Y; y -= 9) { ctx.moveTo(116, y); ctx.lineTo(122, y); } ctx.stroke();
  const on = game.phase === 'crashed' && mine && mine.state !== 'boom';
  ctx.fillStyle = '#3a3f45'; rr(-8, ROOF_Y - 3, 10, 3, 1); ctx.fill();
  ctx.fillStyle = on ? '#ff3b30' : '#7a2420'; ctx.beginPath(); ctx.arc(-3, ROOF_Y - 3, 4.5, Math.PI, 0); ctx.fill();
  if (on) additive(() => glow(-3, ROOF_Y - 5, 46 + 20 * Math.sin(T * 12), 'rgba(255,50,40,0.6)'));
}
function drawMast() {
  ctx.strokeStyle = '#e7ecef'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(36, ROOF_Y); ctx.lineTo(36, -240); ctx.moveTo(24, -214); ctx.lineTo(48, -214); ctx.stroke();
  additive(() => { glow(24, -214, 10, 'rgba(255,60,60,0.7)'); glow(48, -214, 10, 'rgba(60,255,120,0.6)'); glow(36, -222, 12, 'rgba(255,250,230,0.7)'); });
  ctx.fillStyle = '#ff4a4a'; circle(24, -214, 2.2); ctx.fill(); ctx.fillStyle = '#4dff8a'; circle(48, -214, 2.2); ctx.fill(); ctx.fillStyle = '#fffbe6'; circle(36, -222, 2.2); ctx.fill();
  const c = Math.cos(boat.radar), w = Math.max(2, 22 * Math.abs(c));
  ctx.fillStyle = '#3a4048'; rr(32, -246, 8, 5, 1); ctx.fill();
  ctx.fillStyle = c > 0 ? '#f0f3f5' : '#b9c2c9'; rr(36 - w, -251, w * 2, 4.5, 2); ctx.fill();
  const fw = Math.sin(T * 6) * 3;
  ctx.fillStyle = '#ff7a2f'; ctx.beginPath(); ctx.moveTo(36, -236); ctx.quadraticCurveTo(48, -234 + fw, 62, -230 + fw * 0.6); ctx.lineTo(36, -226); ctx.closePath(); ctx.fill();
}
const BULBS = [['#ffe7a8', 'rgba(255,231,168,0.55)'], ['#ffb86b', 'rgba(255,184,107,0.55)'], ['#9fe3ff', 'rgba(159,227,255,0.5)']];
function drawLights() {
  const alarm = game.phase === 'crashed' && mine && mine.state !== 'boom', li = clamp(TH.lights, 0.3, 1.6);
  for (const [a, b, sag] of [[[36, -238], [-206, -72], 46], [[36, -238], [206, -164], 24]]) {
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + sag;
    ctx.strokeStyle = 'rgba(25,25,32,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(cx, cy, b[0], b[1]); ctx.stroke();
    for (let i = 1; i < 13; i++) {
      const t = i / 13, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1] + 2;
      const tw = (0.7 + 0.3 * Math.sin(T * 3 + i * 1.7)) * li;
      const col = alarm ? (i % 2 ? ['#ff4d4d', 'rgba(255,77,77,0.6)'] : ['#ffd27a', 'rgba(255,210,122,0.5)']) : BULBS[i % 3];
      if (!alarm || Math.sin(T * 10 + i) > -0.2) additive(() => glow(x, y, 8 * tw, col[1]));
      ctx.fillStyle = col[0]; circle(x, y, 1.9); ctx.fill();
    }
  }
}
function drawRodGear() {
  const tl = rodTipLocal(), a = rod.ang, cx = ROD.butt.x + Math.cos(a) * ROD.len * 0.55, cy = ROD.butt.y + Math.sin(a) * ROD.len * 0.55;
  ctx.strokeStyle = '#1d242b'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ROD.butt.x, ROD.butt.y); ctx.quadraticCurveTo(cx, cy, tl.x, tl.y); ctx.stroke();
  ctx.strokeStyle = '#b98a55'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ROD.butt.x, ROD.butt.y); ctx.lineTo(ROD.butt.x + Math.cos(a) * 16, ROD.butt.y + Math.sin(a) * 16); ctx.stroke();
  ctx.fillStyle = '#9aa6b0'; circle(ROD.butt.x + Math.cos(a) * 10 + 2, ROD.butt.y + Math.sin(a) * 10 + 4, 3.8); ctx.fill();
  ctx.strokeStyle = '#2b3138'; ctx.lineWidth = 1; ctx.stroke();
}
function drawDeckGear() {
  const cx = CRATE.x, cy = CRATE.y;
  const crate = (x, y, w, h, c) => { ctx.fillStyle = c; rr(x, y, w, h, 2); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,10,0.7)'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); };
  crate(cx - 14, cy - 18, 28, 18, '#9a6a38'); crate(cx - 12, cy - 36, 24, 18, '#875a2d');
  const n = Math.min(game.haul, 6), cols = ['#2563b8', '#1fa07a', '#e0682f', '#d9474f', '#5552c9', '#e3a326'];
  for (let i = 0; i < n; i++) { const x = cx - 9 + i * 4; ctx.fillStyle = cols[i % cols.length]; poly([[x, cy - 35], [x - 3.5, cy - 45], [x, cy - 42], [x + 3.5, cy - 45]]); ctx.fill(); }
  ctx.strokeStyle = '#cdb27c'; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(CAN.x + 18, CAN.deck - 3 - k * 2.2, 9 - k * 2, 3 - k * 0.6, 0, 0, TAU); ctx.stroke(); }
  const nx = -50, ny = deckY(nx);
  ctx.fillStyle = '#2d6b54'; ctx.beginPath(); ctx.ellipse(nx, ny, 18, 20, 0, Math.PI, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(nx, ny, 18, 20, 0, Math.PI, TAU); ctx.clip();
  ctx.strokeStyle = 'rgba(160,220,180,0.35)'; ctx.lineWidth = 0.8;
  for (let k = -20; k <= 20; k += 5) { ctx.beginPath(); ctx.moveTo(nx + k, ny); ctx.lineTo(nx + k + 12, ny - 22); ctx.moveTo(nx + k, ny); ctx.lineTo(nx + k - 12, ny - 22); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#ff7a2f'; for (const [a, b] of [[-8, -10], [5, -16], [12, -6]]) { circle(nx + a, ny + b, 2.4); ctx.fill(); }
  const cy2 = CONSOLE.y;
  ctx.fillStyle = lin(CONSOLE.x - 5, 0, CONSOLE.x + 5, 0, [[0, '#5a6772'], [1, '#2a333b']]); rr(CONSOLE.x - 5, cy2 - 24, 10, 24, 2); ctx.fill(); ctx.strokeStyle = '#14181c'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#ff4a3a'; circle(CONSOLE.x - 1, cy2 - 18, 1.4); ctx.fill(); ctx.fillStyle = '#4dff8a'; circle(CONSOLE.x + 2, cy2 - 18, 1.4); ctx.fill();
  const la = lerp(-1.25, -2.2, crew.lever), lx = CONSOLE.x + Math.cos(la) * 14, ly = cy2 - 24 + Math.sin(la) * 14;
  ctx.strokeStyle = '#c9d1d6'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(CONSOLE.x, cy2 - 24); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = '#e23b3b'; circle(lx, ly, 2.8); ctx.fill();
  return { lx, ly };
}
function hullPath() {
  ctx.beginPath(); ctx.moveTo(-208, -70); ctx.quadraticCurveTo(-60, -46, 192, -56); ctx.lineTo(197, -56); ctx.lineTo(188, 10);
  ctx.quadraticCurveTo(40, 32, -120, 22);
  ctx.bezierCurveTo(-160, 19, -196, 24, -212, 14);
  ctx.bezierCurveTo(-222, 7, -214, -6, -200, -8);
  ctx.bezierCurveTo(-200, -30, -204, -52, -208, -70);
  ctx.closePath();
}
function drawHull() {
  hullPath(); ctx.fillStyle = lin(0, -70, 0, 30, [[0, '#2f5580'], [0.45, '#1b3554'], [1, '#0f2238']]); ctx.fill();
  ctx.save(); hullPath(); ctx.clip();
  ctx.fillStyle = lin(0, -4, 0, 36, [[0, '#c23a30'], [1, '#5e1814']]); ctx.fillRect(-235, -4, 445, 60);
  ctx.fillStyle = 'rgba(60,110,60,0.35)'; ctx.fillRect(-235, 1, 445, 2.5);
  ctx.fillStyle = '#efe8d8'; ctx.fillRect(-235, -7, 445, 3);
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-210, -67); ctx.quadraticCurveTo(-60, -43, 197, -53); ctx.stroke();
  ctx.strokeStyle = '#efe8d8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-210, -61); ctx.quadraticCurveTo(-60, -37, 197, -47); ctx.stroke();
  ctx.strokeStyle = '#ff7a2f'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-210, -55); ctx.quadraticCurveTo(-60, -31, 197, -41); ctx.stroke();
  for (const x of [-150, -96, -30, 60, 140]) { const sy = sheerY(x) + 16; ctx.fillStyle = lin(0, sy, 0, sy + 30, [[0, 'rgba(160,85,40,0.55)'], [1, 'rgba(160,85,40,0)']]); ctx.fillRect(x - 1.5, sy, 3, 30); }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let x = -180; x <= 180; x += 32) { ctx.beginPath(); ctx.moveTo(x, -80); ctx.lineTo(x, 30); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-230, -20); ctx.lineTo(210, -20); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let x = -176; x <= 184; x += 8) { circle(x, -13, 0.8); ctx.fill(); }
  ctx.fillStyle = lin(0, -14, 0, -4, [[0, 'rgba(160,220,255,0)'], [1, 'rgba(160,220,255,0.25)']]); ctx.fillRect(-235, -14, 445, 8);
  ctx.fillStyle = lin(-215, 0, -150, 0, [[0, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-235, -80, 90, 110);
  ctx.strokeStyle = 'rgba(239,232,216,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-204, 9, 5, 0, TAU); ctx.stroke();
  ctx.restore();
  hullPath(); ctx.strokeStyle = '#0b1724'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#e9e3d4'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-208, -70); ctx.quadraticCurveTo(-60, -46, 192, -56); ctx.lineTo(197, -56); ctx.stroke();
  for (const x of [10, 38, 66, 94]) {
    ctx.fillStyle = '#d2ac67'; circle(x, -28, 5.6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = lin(0, -32, 0, -24, [[0, '#ffe2a2'], [1, '#ff9f5a']]); circle(x, -28, 3.9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; circle(x - 1.3, -29.5, 1); ctx.fill();
    if (TH.lights > 0.4) additive(() => glow(x, -28, 14, `rgba(255,190,110,${0.22 * TH.lights})`));
  }
  ctx.fillStyle = '#0d1824'; circle(-183, -52, 3.6); ctx.fill();
  ctx.strokeStyle = '#59636c'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-183, -50); ctx.lineTo(-183, -33); ctx.moveTo(-188, -46); ctx.lineTo(-178, -46); ctx.stroke();
  ctx.beginPath(); ctx.arc(-183, -38, 6, 0.3, Math.PI - 0.3); ctx.stroke();
  ctx.fillStyle = '#ff7a2f'; circle(-160, -31, 8); ctx.fill(); ctx.strokeStyle = '#efe8d8'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-159, -31, 4.5, 2, -0.35, 0, TAU); ctx.fill(); poly([[-163, -29.5], [-167, -33], [-166.5, -27]]); ctx.fill();
  ctx.font = "15px 'Saira Stencil One', Impact, sans-serif"; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText('LUCKY CATCH', -145, -29);
  ctx.fillStyle = '#efe8d8'; ctx.fillText('LUCKY CATCH', -146, -30);
  ctx.font = "10px 'Saira Stencil One', Impact, sans-serif"; ctx.fillText('CT-77', 150, -28);
  ctx.font = "7px 'Barlow Semi Condensed', Arial, sans-serif"; ctx.fillStyle = 'rgba(239,232,216,0.85)';
  for (const [y, n] of [[-10, '2M'], [-19, '4M']]) { ctx.fillRect(-199, y, 4, 0.9); ctx.fillText(n, -194, y); }
  for (const x of [-26, 132]) {
    const sy = sheerY(x);
    ctx.strokeStyle = '#cdb27c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + 10); ctx.stroke();
    ctx.fillStyle = '#121619'; ctx.beginPath(); ctx.ellipse(x, sy + 18, 6, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a3036'; ctx.beginPath(); ctx.ellipse(x, sy + 18, 2.5, 5, 0, 0, TAU); ctx.fill();
  }
  for (const x of [-8, 108]) {
    const sy = sheerY(x);
    ctx.strokeStyle = '#cdb27c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, sy - 14); ctx.lineTo(x, sy + 2); ctx.stroke();
    ctx.fillStyle = '#ff7a2f'; circle(x, sy + 8, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, sy + 7, 12, 2);
  }
  ctx.strokeStyle = 'rgba(225,232,236,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = -196; x <= 142; x += 22) { const sy = sheerY(x); ctx.moveTo(x, sy); ctx.lineTo(x, sy - 15); }
  ctx.moveTo(-196, sheerY(-196) - 15); for (let x = -190; x <= 142; x += 6) ctx.lineTo(x, sheerY(x) - 15);
  ctx.stroke();
}
function drawShipLights() {
  const k = clamp((TH.lights - 0.3) / 1.2, 0, 1);
  ctx.fillStyle = '#2b3138'; rr(30, -206, 12, 6, 2); ctx.fill(); rr(98, -177, 10, 6, 2); ctx.fill();
  ctx.fillStyle = k > 0.05 ? '#fff6d8' : '#9aa5ae'; ctx.fillRect(31, -201.5, 10, 1.6); ctx.fillRect(99, -172.5, 8, 1.6);
  if (k < 0.05) return;
  additive(() => {
    const cone = (x, y, pts, a) => { const g = ctx.createRadialGradient(x, y, 2, x, y, 260); g.addColorStop(0, `rgba(255,236,190,${a})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; poly([[x, y], ...pts]); ctx.fill(); };
    cone(36, -200, [[-200, -62], [-60, -46]], 0.2 * k);
    cone(103, -171, [[118, -44], [196, -54]], 0.2 * k);
    const sa = Math.PI - 0.32 + Math.sin(T * 0.35) * 0.18, sl = 700, ox = -35, oy = -134.5;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(sa) * sl, oy + Math.sin(sa) * sl); g.addColorStop(0, `rgba(255,248,220,${0.3 * k})`); g.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(sa - 0.06) * sl, oy + Math.sin(sa - 0.06) * sl); ctx.lineTo(ox + Math.cos(sa + 0.06) * sl, oy + Math.sin(sa + 0.06) * sl); ctx.closePath(); ctx.fill();
    glow(ox, oy, 14, `rgba(255,248,220,${0.8 * k})`);
  });
}
function drawShipWater() {
  const k = clamp((TH.lights - 0.3) / 1.2, 0, 1);
  if (k > 0.05) additive(() => {
    for (const lx of [10, 38, 66, 94, -150, -100]) {
      const p = toWorld(lx, 6), fl = 0.6 + 0.4 * Math.sin(T * 7 + lx);
      ctx.fillStyle = lin(0, p.y, 0, p.y + 34 * S, [[0, `rgba(255,190,110,${0.35 * k * fl})`], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(p.x - 3 * S, p.y, 6 * S, 34 * S);
    }
  });
  const bw = toWorld(-206, -2);
  ctx.fillStyle = TH.bio > 0.5 ? 'rgba(160,255,235,0.8)' : 'rgba(240,250,255,0.85)';
  for (let i = 0; i < 7; i++) { const ph = T * 3 + i * 1.1, x = bw.x - (i * 6 + 3) * S + Math.sin(ph) * 2 * S; circle(x, surf(x) - 1 * S - Math.abs(Math.sin(ph)) * 3 * S, (2.5 + (i % 3)) * S * (0.8 + 0.3 * Math.sin(ph))); ctx.fill(); }
  const sw = toWorld(192, 2);
  for (let i = 0; i < 6; i++) { const ph = T * 4 + i, x = sw.x + i * 7 * S; circle(x, surf(x) - Math.abs(Math.sin(ph)) * 3 * S, (2.2 + (i % 2)) * S); ctx.fill(); }
}
function drawShip() {
  const cs = crewState();
  ctx.save(); ctx.translate(boat.x, boat.y); ctx.rotate(boat.ang); ctx.scale(S, S);
  ctx.lineJoin = 'round';
  drawCrane();
  if (!mine && game.phase !== 'crashed') {
    const p = minePose(), top = { x: HANG.x + Math.sin(p.sw) * CHAIN, y: HANG.y + Math.cos(p.sw) * CHAIN };
    drawChain(HANG.x, HANG.y, top.x, top.y);
    drawMine(p.x, p.y, MINE_R, -p.sw, (T % 1.6) < 0.14 ? 0.6 : 0, 0, '--');
  } else drawChain(HANG.x, HANG.y, HANG.x, HANG.y + 14);
  drawSuperstructure(cs);
  drawMast();
  drawLights();
  drawRodGear();
  drawPerson(ROD.x, ROOF_Y, KITS.sipho, cs.sipho);
  const g1 = { x: ROD.butt.x + Math.cos(rod.ang) * 10, y: ROD.butt.y + Math.sin(rod.ang) * 10 };
  let g2 = { x: ROD.butt.x + Math.cos(rod.ang) * 26, y: ROD.butt.y + Math.sin(rod.ang) * 26 };
  const sS = personShoulder(ROD.x, ROOF_Y);
  if (rod.state === 'reel') { const rc = { x: g1.x + 2, y: g1.y + 4 }; g2 = { x: rc.x + Math.cos(T * 18) * 5, y: rc.y + Math.sin(T * 18) * 5 }; drawArm(sS.x + 2, sS.y + 1, g2.x, g2.y, KITS.sipho, 1); drawArm(sS.x, sS.y, g1.x + Math.cos(rod.ang) * 14, g1.y + Math.sin(rod.ang) * 14, KITS.sipho, 1); }
  else { drawArm(sS.x + 2, sS.y + 1, g1.x, g1.y, KITS.sipho, 1); drawArm(sS.x, sS.y, g2.x, g2.y, KITS.sipho, 1); }
  ctx.strokeStyle = 'rgba(225,232,236,0.9)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); for (const x of [-8, 6, 20, 34]) { ctx.moveTo(x, ROOF_Y); ctx.lineTo(x, ROOF_Y - 12); } ctx.moveTo(-8, ROOF_Y - 12); ctx.lineTo(34, ROOF_Y - 12); ctx.stroke();
  const lev = drawDeckGear();
  drawPerson(BONG.x, BONG.feet, KITS.bongani, cs.bongani);
  const bS = personShoulder(BONG.x, BONG.feet);
  drawArm(bS.x + 2, bS.y + 1, BONG.x + 6, BONG.feet - 28, KITS.bongani, -1);
  drawArm(bS.x, bS.y, lev.lx, lev.ly, KITS.bongani, 1);
  drawPerson(HANK.x, HANK.feet, KITS.hank, cs.hank);
  drawCannon();
  const hp = handlePoint(), la = gun.ang - boat.ang, px = -Math.sin(la) * 4, py = Math.cos(la) * 4, hS = personShoulder(HANK.x, HANK.feet);
  drawArm(hS.x + 2, hS.y + 1, hp.x + px, hp.y + py, KITS.hank, 1);
  drawArm(hS.x, hS.y, hp.x - px, hp.y - py, KITS.hank, 1);
  drawHull();
  drawShipLights();
  ctx.restore();
}
function loadedHarpoon() { return gun.state === 'idle' || gun.state === 'aim' || (gun.state === 'reload' && gun.timer < 0.14); }
function handlePoint() { const la = gun.ang - boat.ang, d = -HANDLE - gun.recoil * 7; return { x: CAN.x + Math.cos(la) * d, y: CAN.y + Math.sin(la) * d }; }
function drawCannon() {
  const px = CAN.x, py = CAN.y, dk = CAN.deck;
  ctx.fillStyle = lin(px - 8, 0, px + 8, 0, [[0, '#2a333b'], [0.5, '#5a6772'], [1, '#20282f']]);
  poly([[px - 8, dk], [px - 5, py + 6], [px + 5, py + 6], [px + 8, dk]]); ctx.fill();
  ctx.fillStyle = '#46525d'; rr(px - 13, dk - 4, 26, 5, 2); ctx.fill();
  ctx.save(); ctx.translate(px, py); ctx.rotate(gun.ang - boat.ang); ctx.scale(1, -1); ctx.translate(-gun.recoil * 7, 0);
  ctx.fillStyle = lin(0, -16, 0, 16, [[0, '#6f7c88'], [1, '#2f3942']]); rr(3, -17, 5, 34, 2); ctx.fill();
  ctx.fillStyle = lin(0, -9, 0, 9, [[0, '#8b98a3'], [0.45, '#4b5762'], [1, '#1f262c']]); rr(-22, -8.5, 36, 17, 6); ctx.fill();
  ctx.fillStyle = lin(0, -5, 0, 5, [[0, '#9aa6b0'], [0.5, '#56636e'], [1, '#252d34']]); ctx.fillRect(12, -5, 46, 10); rr(55, -7, 9, 14, 2); ctx.fill();
  ctx.fillStyle = '#d2ac67'; ctx.fillRect(-2, -8.5, 3, 17); ctx.fillRect(34, -5, 2.5, 10);
  ctx.strokeStyle = '#1c2227'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-HANDLE, 0); ctx.moveTo(-HANDLE, -7); ctx.lineTo(-HANDLE, 7); ctx.stroke();
  ctx.fillStyle = '#2a3238'; circle(0, 0, 5); ctx.fill(); ctx.fillStyle = '#d2ac67'; circle(0, 0, 2); ctx.fill();
  if (loadedHarpoon()) { ctx.strokeStyle = '#d5dde3'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(96, 0); ctx.stroke(); ctx.fillStyle = '#eef2f4'; poly([[96, -5], [110, 0], [96, 5], [99, 0]]); ctx.fill(); }
  ctx.restore();
}
function drawArrow(a) {
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); ctx.scale(S, S);
  if (a.state === 'reel' && a.fish) ctx.translate(a.fish.s / S * 0.7, 0);
  ctx.strokeStyle = '#d5dde3'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-6, 0); ctx.stroke();
  ctx.fillStyle = '#eef2f4'; poly([[4, 0], [-10, -5], [-7, 0], [-10, 5]]); ctx.fill();
  ctx.strokeStyle = '#eef2f4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(-16, -8); ctx.moveTo(-10, 5); ctx.lineTo(-16, 8); ctx.stroke();
  ctx.fillStyle = '#ff7a2f'; poly([[-52, 0], [-44, -4], [-42, 0], [-44, 4]]); ctx.fill();
  ctx.restore();
}
function drawRope(a) {
  const m = muzzle(0), off = a.state === 'reel' && a.fish ? a.fish.s * 0.7 : 0;
  const tx = a.x + Math.cos(a.ang) * (off - 52 * S), ty = a.y + Math.sin(a.ang) * (off - 52 * S);
  const d = Math.hypot(tx - m.x, ty - m.y), sag = a.state === 'fly' ? Math.min(46 * S, d * 0.14) : d * 0.04;
  ctx.strokeStyle = 'rgba(214,190,140,0.9)'; ctx.lineWidth = Math.max(1, 1.5 * S);
  ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.quadraticCurveTo((m.x + tx) / 2, (m.y + ty) / 2 + sag, tx, ty); ctx.stroke();
}
function drawRodLine() {
  const tl = rodTipLocal(), tip = toWorld(tl.x, tl.y), end = rod.fish ? { x: rod.fish.x, y: rod.fish.y - rod.fish.s * 0.9 } : rod.bob;
  if (!end) return;
  const d = Math.hypot(end.x - tip.x, end.y - tip.y), sag = rod.state === 'wait' ? d * 0.12 : d * 0.03;
  ctx.strokeStyle = 'rgba(235,240,245,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo((tip.x + end.x) / 2, (tip.y + end.y) / 2 + sag, end.x, end.y); ctx.stroke();
  if (rod.bob && !rod.fish) { const r = 4 * FS; ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(rod.bob.x, rod.bob.y, r, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rod.bob.x, rod.bob.y, r, 0, Math.PI); ctx.fill(); }
}
