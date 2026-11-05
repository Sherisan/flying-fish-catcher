/*
 * Flying Fish Catcher · 02-draw-helpers.js
 * Canvas drawing helpers: rounded rects, circles, polygons, gradients, glows and the sea-surface path.
 */
'use strict';

/* ================= drawing helpers ================= */
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); }
function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function lin(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
function glow(x, y, r, color) { if (!(r > 0)) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
function additive(fn) { const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; fn(); ctx.globalCompositeOperation = prev; }
function surfPath() { ctx.beginPath(); ctx.moveTo(-40, H + 40); for (let x = -40; x <= W + 40; x += 8) ctx.lineTo(x, surf(x)); ctx.lineTo(W + 40, H + 40); ctx.closePath(); }
const stops = (cols, at) => cols.map((c, i) => [at ? at[i] : i / (cols.length - 1), css(c)]);
