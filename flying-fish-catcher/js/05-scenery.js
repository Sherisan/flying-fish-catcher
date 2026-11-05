/*
 * Flying Fish Catcher · 05-scenery.js
 * Background: sky colour themes, sun, moon, aurora, clouds, islands and lighthouse, the far sea,
 * the underwater cutaway, seabed, coral and the water surface tint.
 */
'use strict';

/* ---- sky ---- */
function drawSky() {
  ctx.fillStyle = lin(0, 0, 0, horizonY, stops(TH.sky, [0, .35, .6, .82, 1])); ctx.fillRect(-40, -40, W + 80, horizonY + 42);
  if (TH.stars > 0.02) for (const st of stars) { ctx.globalAlpha = clamp((0.3 + 0.35 * Math.sin(T * 1.5 + st.p)) * TH.stars * (1 - st.y / (H * 0.45)), 0, 1); ctx.fillStyle = '#fff'; circle(st.x, st.y, st.r); ctx.fill(); }
  ctx.globalAlpha = 1;
  if (TH.aurora > 0.02) drawAurora(TH.aurora);
  if (TH.moonA > 0.02) {
    const mx = W * TH.moonX, my = H * TH.moonY, mr = Math.max(7, TH.moonR * FS);
    ctx.globalAlpha = TH.moonA;
    additive(() => glow(mx, my, mr * 4, 'rgba(230,225,255,0.16)'));
    ctx.save(); circle(mx, my, mr); ctx.clip();
    ctx.fillStyle = '#f5ecd6'; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.fillStyle = 'rgba(200,190,170,0.5)'; circle(mx - mr * 0.3, my + mr * 0.2, mr * 0.18); ctx.fill(); circle(mx + mr * 0.1, my - mr * 0.35, mr * 0.12); ctx.fill();
    ctx.fillStyle = css(TH.sky[1]); circle(mx + mr * 0.5, my - mr * 0.2, mr * 0.92); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  const sx = W * TH.sunX, sr = H * TH.sunR, sy = horizonY * TH.sunY - sr * 0.3;
  if (TH.sunA > 0.02) {
    ctx.globalAlpha = TH.sunA;
    if (TH.rays > 0.02) additive(() => {
      ctx.fillStyle = `rgba(255,200,140,${0.045 * TH.rays})`;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + T * 0.03, w = 0.09; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a - w) * W, sy + Math.sin(a - w) * W); ctx.lineTo(sx + Math.cos(a + w) * W, sy + Math.sin(a + w) * W); ctx.closePath(); ctx.fill(); }
    });
    additive(() => { glow(sx, sy, sr * 5, css(TH.sunGlow)); glow(sx, sy, sr * 2, css(TH.sunGlow, 1.1)); });
    ctx.fillStyle = lin(0, sy - sr, 0, sy + sr, [[0, css(TH.sunC[0])], [1, css(TH.sunC[1])]]); circle(sx, sy, sr); ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const c of clouds) {
    ctx.beginPath();
    for (const p of c.puffs) { const x = c.x + p.dx * c.s, y = c.y + p.dy * c.s, r = p.r * c.s; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    ctx.moveTo(c.x + 100 * c.s, c.y + 6 * c.s); ctx.ellipse(c.x, c.y + 6 * c.s, 100 * c.s, 12 * c.s, 0, 0, TAU);
    ctx.fillStyle = lin(0, c.y - 42 * c.s, 0, c.y + 18 * c.s, stops(TH.cloud, [0, 0.6, 1])); ctx.fill();
  }
  const isl0 = islands[0], lx = isl0.x + isl0.w * 0.45, ly = horizonY - isl0.h * 0.8 - 34 * FS, ba = T * 0.9, vis = Math.abs(Math.cos(ba));
  const night = clamp(TH.isleLights, 0, 1);
  if (night > 0.05) additive(() => {
    ctx.fillStyle = `rgba(255,236,170,${0.11 * vis * night})`;
    const dir = Math.cos(ba) > 0 ? 1 : -1, len = W * 0.45;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + dir * len, ly - 40 * FS); ctx.lineTo(lx + dir * len, ly + 30 * FS); ctx.closePath(); ctx.fill();
  });
  for (const isl of islands) {
    ctx.fillStyle = css(TH.island); ctx.beginPath(); ctx.moveTo(isl.x, horizonY + 1);
    for (const p of isl.pts) ctx.lineTo(isl.x + p.t * isl.w, horizonY - p.h * isl.h);
    ctx.lineTo(isl.x + isl.w, horizonY + 1); ctx.closePath(); ctx.fill();
    if (!isl.light && night > 0.05) for (let k = 0; k < isl.lamps.length; k++) {
      const t = 0.2 + isl.lamps[k] * 0.6, x = isl.x + t * isl.w;
      ctx.fillStyle = `rgba(255,214,140,${night * (0.6 + 0.4 * Math.sin(T * 2 + k))})`; ctx.fillRect(x, horizonY - 3 * FS - (k % 2) * 3 * FS, Math.max(1, 1.6 * FS), Math.max(1, 1.6 * FS));
    }
  }
  ctx.save(); ctx.translate(lx, horizonY - isl0.h * 0.8);
  const th0 = 34 * FS, tw = 6 * FS;
  ctx.fillStyle = '#e8e2d8'; poly([[-tw, 0], [-tw * 0.65, -th0], [tw * 0.65, -th0], [tw, 0]]); ctx.fill();
  ctx.fillStyle = '#c4473a';
  for (let k = 0; k < 3; k++) { const y0 = -th0 * (0.15 + k * 0.3), y1 = y0 - th0 * 0.12, k0 = 1 - 0.35 * (-y0 / th0), k1 = 1 - 0.35 * (-y1 / th0); poly([[-tw * k0, y0], [-tw * k1, y1], [tw * k1, y1], [tw * k0, y0]]); ctx.fill(); }
  ctx.fillStyle = '#1e1a2c'; rr(-tw * 0.8, -th0 - 6 * FS, tw * 1.6, 6 * FS, 1); ctx.fill();
  ctx.fillStyle = '#ffe7a8'; ctx.fillRect(-tw * 0.5, -th0 - 5 * FS, tw, 4 * FS);
  ctx.fillStyle = '#1e1a2c'; poly([[-tw * 0.9, -th0 - 6 * FS], [0, -th0 - 11 * FS], [tw * 0.9, -th0 - 6 * FS]]); ctx.fill();
  ctx.restore();
  if (night > 0.05) additive(() => glow(lx, ly, 18 * FS * (0.5 + vis), `rgba(255,236,170,${0.9 * night})`));
  const bx = ((T * 6 * FS) % (W + 200)) - 100, by = horizonY + 2;
  ctx.fillStyle = css(TH.island, 0.9);
  poly([[bx - 10 * FS, by - 2 * FS], [bx + 10 * FS, by - 2 * FS], [bx + 7 * FS, by + 1], [bx - 7 * FS, by + 1]]); ctx.fill();
  poly([[bx, by - 22 * FS], [bx, by - 3 * FS], [bx + 9 * FS, by - 3 * FS]]); ctx.fill();
  poly([[bx - 1 * FS, by - 18 * FS], [bx - 1 * FS, by - 3 * FS], [bx - 7 * FS, by - 3 * FS]]); ctx.fill();
  ctx.strokeStyle = css(TH.gull); ctx.lineWidth = Math.max(1.2, 1.8 * FS); ctx.lineCap = 'round';
  for (const gl of gulls) {
    const f = Math.sin(T * 6 + gl.ph) * 6 * FS, x = gl.x, y = gl.y + Math.sin(T * 0.9 + gl.ph) * 6 * FS;
    ctx.beginPath(); ctx.moveTo(x - 12 * FS, y - f); ctx.quadraticCurveTo(x - 6 * FS, y - 7 * FS - f * 0.3, x, y); ctx.quadraticCurveTo(x + 6 * FS, y - 7 * FS - f * 0.3, x + 12 * FS, y - f); ctx.stroke();
  }
  ctx.fillStyle = lin(0, horizonY, 0, waterY + 14 * FS, stops(TH.far)); ctx.fillRect(-40, horizonY, W + 80, waterY - horizonY + 16 * FS);
  const rows = 12, gl = TH.glint, glX = TH.sunA > 0.1 ? sx : W * TH.moonX, glW = TH.sunA > 0.1 ? sr : 10 * FS;
  for (let i = 0; i < rows; i++) {
    const y = horizonY + (i + 0.5) / rows * (waterY - horizonY), w = (glW * 0.8 + i * 5 * FS) * (0.55 + 0.45 * Math.sin(T * 2.6 + i * 1.7));
    ctx.fillStyle = css(gl, Math.max(0.15, 0.55 - i * 0.03) * Math.max(TH.sunA, TH.moonA * 0.6));
    ctx.fillRect(glX - w / 2 + Math.sin(T + i) * 4 * FS, y, w, Math.max(1, 1.6 * FS));
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 18; i++) { const x = (i * 97 + T * 8) % (W + 40) - 20, y = horizonY + ((i * 37) % 100) / 100 * (waterY - horizonY); ctx.fillRect(x, y, 14 * FS, 1); }
  if (spout) { const y = lerp(horizonY, waterY, 0.45), k = Math.sin(clamp(spout.t / 2.6, 0, 1) * Math.PI); ctx.fillStyle = css(TH.island, 0.95); ctx.beginPath(); ctx.ellipse(spout.x, y, 18 * FS, 4 * FS * k, 0, Math.PI, TAU); ctx.fill(); }
}
function drawAurora(a) {
  additive(() => {
    for (let k = 0; k < 3; k++) {
      const baseY = H * (0.06 + k * 0.07), amp = H * 0.04, hgt = H * (0.16 + k * 0.03), col = k === 1 ? '170,110,255' : k === 2 ? '80,200,255' : '60,255,170';
      const pts = [];
      for (let x = -20; x <= W + 20; x += 20) pts.push([x, baseY + Math.sin(x * 0.006 + T * 0.3 + k * 2) * amp + Math.sin(x * 0.017 - T * 0.5 + k) * amp * 0.4]);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + hgt * (0.7 + 0.3 * Math.sin(pts[i][0] * 0.01 + T + k)));
      ctx.closePath();
      ctx.fillStyle = lin(0, baseY - amp, 0, baseY + hgt + amp, [[0, `rgba(${col},0)`], [0.25, `rgba(${col},${0.24 * a})`], [1, `rgba(${col},0)`]]);
      ctx.fill();
    }
  });
}

/* ---- underwater ---- */
function drawUnderwater() {
  surfPath(); ctx.fillStyle = lin(0, waterY, 0, H, [[0, css(TH.water[0])], [0.35, css(TH.water[1])], [1, css(TH.water[2])]]); ctx.fill();
  ctx.save(); surfPath(); ctx.clip();
  additive(() => {
    const ra = TH.sunA > 0.1 ? 0.1 : 0.05;
    for (let i = 0; i < 6; i++) {
      const x0 = W * (0.04 + i * 0.17) + Math.sin(T * 0.3 + i) * 30 * FS, w0 = (24 + i * 5) * FS;
      ctx.fillStyle = lin(0, waterY, 0, H * 0.96, [[0, `rgba(140,220,255,${ra})`], [1, 'rgba(140,220,255,0)']]);
      ctx.beginPath(); ctx.moveTo(x0, waterY - 10); ctx.lineTo(x0 + w0, waterY - 10); ctx.lineTo(x0 + w0 * 2.6 - 90 * FS, H); ctx.lineTo(x0 - 90 * FS, H); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(170,235,255,0.07)'; ctx.lineWidth = 2 * FS;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 14) { const y = waterY + (16 + k * 15) * FS + Math.sin(x * 0.03 / FS + T * 1.5 + k) * 4 * FS + Math.sin(x * 0.07 / FS - T * 2.1 + k * 2) * 2 * FS; x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
  const w = deepWhale;
  if (w.wait <= 0) {
    ctx.save(); ctx.translate(w.x, waterY + (H - waterY) * 0.56 + Math.sin(T * 0.4) * 8 * FS); if (w.dir < 0) ctx.scale(-1, 1);
    fishGeneric({ wig: 0, air: false, state: w.flee ? 'flee' : 'swim' }, w.s * FS, D.whale, 0); ctx.restore();
  }
  drawManta({ ...manta, s: manta.s * FS });
  ctx.fillStyle = css(TH.haze); ctx.fillRect(0, waterY - 20, W, H);
  // ship shadow
  const sh = ctx.createRadialGradient(boat.x - 10 * S, waterY + 20 * S, 10 * S, boat.x - 10 * S, waterY + 60 * S, 230 * S);
  sh.addColorStop(0, 'rgba(0,10,20,0.35)'); sh.addColorStop(1, 'rgba(0,10,20,0)');
  ctx.fillStyle = sh; ctx.fillRect(boat.x - 260 * S, waterY, 520 * S, 300 * S);
  additive(() => {
    const bio = TH.bio;
    for (const p of plankton) {
      const a = (0.15 + 0.15 * Math.sin(T * 1.3 + p.ph)) * (1 + bio * 2.2);
      ctx.fillStyle = bio > 0.3 ? `rgba(110,255,230,${a})` : `rgba(190,240,255,${a})`;
      circle(p.x + Math.sin(T * 0.3 + p.ph) * 6, p.y + Math.cos(T * 0.25 + p.ph) * 5, p.r * (1 + bio * 0.6)); ctx.fill();
    }
  });
  for (const j of jellies) drawJelly(j);
  for (const m of sardines) {
    ctx.save(); ctx.translate(m.x, m.y); if (m.dir < 0) ctx.scale(-1, 1);
    fishSardine(null, m.s);
    if (Math.sin(T * 3 + m.ph * 5) > 0.92) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-m.s * 0.6, -m.s * 0.2, m.s * 1.1, Math.max(0.6, m.s * 0.12)); }
    ctx.restore();
  }
  drawTurtle({ ...turtle, s: turtle.s * FS });
  for (const shk of sharks) if (shk.state === 'patrol' || shk.state === 'flee') drawShark(shk);
  drawSeabed();
  ctx.restore();
}
function drawSeabed() {
  ctx.fillStyle = lin(0, H - (H - waterY) * 0.2, 0, H, [[0, css(TH.bed[0])], [1, css(TH.bed[1])]]);
  ctx.beginPath(); ctx.moveTo(-40, H + 40); for (let x = -40; x <= W + 40; x += 10) ctx.lineTo(x, bedY(x)); ctx.lineTo(W + 40, H + 40); ctx.closePath(); ctx.fill();
  additive(() => {
    ctx.fillStyle = `rgba(170,240,255,${0.06 + 0.05 * TH.sunA})`;
    for (let i = 0; i < 14; i++) { const x = (i * 83 + Math.sin(T * 0.7 + i) * 20 * FS) % W, y = bedY(x) + 4 * FS; ctx.beginPath(); ctx.ellipse(x, y, (14 + (i % 3) * 6) * FS * (0.7 + 0.3 * Math.sin(T * 1.7 + i)), 2.5 * FS, 0, 0, TAU); ctx.fill(); }
  });
  for (const r of rocks) {
    const y = bedY(r.x) + r.ry * 0.3;
    ctx.fillStyle = '#16303a'; ctx.beginPath(); ctx.ellipse(r.x, y, r.rx, r.ry, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,190,210,0.12)'; ctx.beginPath(); ctx.ellipse(r.x - r.rx * 0.2, y - r.ry * 0.6, r.rx * 0.5, r.ry * 0.25, 0, 0, TAU); ctx.fill();
  }
  for (const c of corals) drawCoral(c);
  const ox = Math.min(W * 0.55, boat.x - 300 * S);
  drawOctopus(ox, bedY(ox) - 2 * FS, 15 * FS, octo.hide, octo.pale);
  drawCrab(crab.x, bedY(crab.x) - 6 * FS, 8 * FS, crab.vx);
  ctx.lineCap = 'round';
  for (const wd of weeds) {
    const by = bedY(wd.x) + 2 * FS, n = 8;
    ctx.strokeStyle = wd.c; ctx.lineWidth = wd.w; ctx.beginPath(); ctx.moveTo(wd.x, by);
    for (let k = 1; k <= n; k++) ctx.lineTo(wd.x + Math.sin(T * 1.2 + wd.ph + k * 0.45) * k * 1.7 * FS, by - (k / n) * wd.h);
    ctx.stroke();
  }
}
function drawCoral(c) {
  const by = bedY(c.x) + 2 * FS, s = c.s;
  ctx.save(); ctx.translate(c.x, by);
  if (c.type === 'branch') {
    ctx.strokeStyle = c.col; ctx.lineCap = 'round'; ctx.rotate(Math.sin(T * 0.8 + c.ph) * 0.03);
    for (const [x0, y0, x1, y1, w] of c.segs) { ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(x0 * s * 1.6, y0 * s * 1.6); ctx.lineTo(x1 * s * 1.6, y1 * s * 1.6); ctx.stroke(); }
  } else if (c.type === 'fan') {
    ctx.fillStyle = 'rgba(176,124,240,0.55)'; ctx.beginPath(); ctx.ellipse(0, -22 * s, 22 * s, 22 * s, 0, Math.PI, TAU); ctx.lineTo(3 * s, 0); ctx.lineTo(-3 * s, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,200,255,0.35)'; ctx.lineWidth = 0.8;
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(k * 6 * s, -40 * s + Math.abs(k) * 4 * s); ctx.stroke(); }
  } else if (c.type === 'brain') {
    ctx.fillStyle = '#c98d55'; ctx.beginPath(); ctx.ellipse(0, 0, 16 * s, 11 * s, 0, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-12 * s, -2 * s - k * 2 * s); ctx.bezierCurveTo(-6 * s, -8 * s - k * 2 * s, 6 * s, 2 * s - k * 2 * s, 12 * s, -4 * s - k * 2 * s); ctx.stroke(); }
  } else if (c.type === 'anemone') {
    ctx.fillStyle = '#7b3a5a'; rr(-6 * s, -10 * s, 12 * s, 10 * s, 3 * s); ctx.fill();
    ctx.strokeStyle = '#ff9fb2'; ctx.lineCap = 'round'; ctx.lineWidth = 2.2 * s;
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.28 + Math.sin(T * 1.6 + k + c.ph) * 0.15; ctx.beginPath(); ctx.moveTo((k - 4) * 1.3 * s, -10 * s); ctx.quadraticCurveTo((k - 4) * 2 * s, -16 * s, (k - 4) * 1.3 * s + Math.cos(a) * 12 * s, -10 * s + Math.sin(a) * 12 * s); ctx.stroke(); }
  } else if (c.type === 'star') {
    ctx.fillStyle = '#ff8a4c'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = (k % 2 ? 3 : 8) * s; ctx.lineTo(Math.cos(a) * r, -4 * s + Math.sin(a) * r * 0.6); }
    ctx.closePath(); ctx.fill();
  } else if (c.type === 'anchor') {
    ctx.rotate(-0.5); ctx.strokeStyle = '#5c4334'; ctx.lineCap = 'round'; ctx.lineWidth = 3.5 * s;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -38 * s); ctx.moveTo(-12 * s, -30 * s); ctx.lineTo(12 * s, -30 * s); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -10 * s, 14 * s, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.lineWidth = 2 * s; circle(0, -42 * s, 4 * s); ctx.stroke();
  }
  ctx.restore();
}
function drawTint() {
  surfPath(); ctx.fillStyle = css(TH.tint); ctx.fill();
  ctx.beginPath();
  for (let x = -40; x <= W + 40; x += 8) { const y = surf(x); x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.strokeStyle = 'rgba(170,230,255,0.22)'; ctx.lineWidth = 7 * FS; ctx.stroke();
  ctx.strokeStyle = TH.bio > 0.5 ? 'rgba(150,255,235,0.7)' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = Math.max(1, 2 * FS); ctx.stroke();
  additive(() => {
    for (let i = 0; i < 26; i++) {
      const x = (i * 131 + (T * 20) % 131) % W, tw = Math.sin(T * 3 + i * 2.3);
      if (tw < 0.6) continue;
      ctx.fillStyle = css(TH.glint, (tw - 0.6) * 1.6); ctx.fillRect(x, surf(x) - 1.5 * FS, 8 * FS, Math.max(1, 1.4 * FS));
    }
  });
}
