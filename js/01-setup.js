/*
 * Flying Fish Catcher · 01-setup.js
 * Setup: DOM references, tuning constants, colour themes, shared game state and ship geometry.
 * Everything here is plain data or small helpers that later files read.
 */
'use strict';

const $ = (id) => document.getElementById(id);
const wrap = $('seaWrap'), cv = $('sea');
let ctx = cv.getContext('2d');
const multEl = $('mult'), tagEl = $('tag'), roundEl = $('roundNo'), statusEl = $('status'), barEl = $('bar'), barFill = $('barFill');
const bannerEl = $('banner'), haulEl = $('haul'), feedEl = $('feed');
const balEl = $('balance'), histEl = $('history'), playersEl = $('players'), mineEl = $('mine'), guideEl = $('pane-guide');
const crewCount = $('crewCount'), crewTotal = $('crewTotal');
const toastEl = $('toast'), toastText = $('toastText'), liveEl = $('live');
const soundBtn = $('sound'), soundLabel = $('soundLabel'), wavesPath = $('waves'), skyBtn = $('skyBtn'), skyLabel = $('skyLabel');
const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ================= tuning ================= */
// Round timing and the growth rate come from the game server (GetSnapshot config); these are just defaults until it answers.
let RATE = 0.085, WAIT = 6;
const KEY = 'flying-fish-catcher-v2', TAU = Math.PI * 2;
const MILESTONES = [
  { at: 2, text: 'Sharks circling', ev: 'shark' },
  { at: 3, text: 'Dolphin pod', ev: 'dolphins' },
  { at: 6, text: 'Orca pod', ev: 'orcas' },
  { at: 8, text: 'Sailfish frenzy' },
  { at: 15, text: 'Golden waters' },
];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const norm = (a) => { a %= TAU; return a < 0 ? a + TAU : a; };
const r2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ================= colour themes ================= */
function C(s) {
  if (s[0] === '#') return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
  const m = s.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1];
}
const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? c[3] : c[3] * a})`;
const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const THEME_RAW = [
  { name: 'Golden sunset', sky: ['#0a1a30', '#262b56', '#6c3c6a', '#d9676a', '#ffb066'], far: ['#4a4f78', '#335a80', '#25708c'], water: ['#1c7b93', '#0f5570', '#051a28'], bed: ['#2a4a50', '#0d1f26'],
    haze: 'rgba(14,72,98,0.4)', tint: 'rgba(16,82,110,0.28)', cloud: ['rgba(110,90,150,0.5)', 'rgba(214,128,140,0.5)', 'rgba(255,178,120,0.62)'],
    sunC: ['#fff0b8', '#ff8a4a'], sunGlow: 'rgba(255,150,80,0.34)', glint: '#ffc482', island: '#33294c', gull: 'rgba(28,22,40,0.85)',
    sunX: .36, sunY: 1, sunR: .085, sunA: 1, moonX: .1, moonY: .1, moonR: 11, moonA: 1, stars: .6, rays: .7, lights: 1, aurora: 0, bio: 0, isleLights: .6 },
  { name: 'Tropical noon', sky: ['#1662c4', '#2f86da', '#5fb1ee', '#a6dcf8', '#e4f6ff'], far: ['#6cc4e0', '#3bb0d2', '#1fa9c4'], water: ['#25bccb', '#0f86a4', '#063f58'], bed: ['#cdb98a', '#6f6448'],
    haze: 'rgba(20,120,150,0.32)', tint: 'rgba(20,150,180,0.2)', cloud: ['rgba(255,255,255,0.95)', 'rgba(244,249,255,0.92)', 'rgba(200,222,240,0.88)'],
    sunC: ['#ffffff', '#fff2b8'], sunGlow: 'rgba(255,250,215,0.55)', glint: '#ffffff', island: '#2d7a64', gull: 'rgba(40,50,70,0.8)',
    sunX: .06, sunY: .34, sunR: .055, sunA: 1, moonX: .1, moonY: .1, moonR: 11, moonA: 0, stars: 0, rays: .5, lights: .15, aurora: 0, bio: 0, isleLights: 0 },
  { name: 'Aurora night', sky: ['#01040d', '#04102a', '#08203d', '#0f3150', '#184562'], far: ['#163a55', '#103149', '#0b3045'], water: ['#0b3a4f', '#052538', '#010a13'], bed: ['#132c35', '#04090d'],
    haze: 'rgba(3,26,40,0.5)', tint: 'rgba(2,34,52,0.36)', cloud: ['rgba(40,60,90,0.35)', 'rgba(50,80,110,0.3)', 'rgba(70,110,140,0.32)'],
    sunC: ['#fff0b8', '#ff8a4a'], sunGlow: 'rgba(255,150,80,0)', glint: '#a8e6ff', island: '#0b1828', gull: 'rgba(150,170,200,0.5)',
    sunX: .36, sunY: 1.5, sunR: .085, sunA: 0, moonX: .07, moonY: .2, moonR: 18, moonA: 1, stars: 1, rays: 0, lights: 1.5, aurora: 1, bio: 1, isleLights: 1 },
  { name: 'Coral dawn', sky: ['#33377f', '#7559a8', '#df88ad', '#ffbf9e', '#ffe5c2'], far: ['#9a8fc0', '#7a93c0', '#5a9ab8'], water: ['#3aa3b8', '#1b6a8b', '#0a2c44'], bed: ['#5b5a6a', '#1b1b2a'],
    haze: 'rgba(30,90,120,0.36)', tint: 'rgba(40,110,140,0.24)', cloud: ['rgba(255,205,225,0.6)', 'rgba(255,182,192,0.62)', 'rgba(255,222,182,0.72)'],
    sunC: ['#fff8e6', '#ffae78'], sunGlow: 'rgba(255,170,130,0.4)', glint: '#ffd8b8', island: '#5a4a7a', gull: 'rgba(60,40,70,0.75)',
    sunX: .16, sunY: .97, sunR: .07, sunA: 1, moonX: .78, moonY: .08, moonR: 9, moonA: .5, stars: .15, rays: .8, lights: .6, aurora: 0, bio: .2, isleLights: .3 },
];
const THEMES = THEME_RAW.map((t) => {
  const o = {};
  for (const k in t) {
    const v = t[k];
    if (typeof v === 'string' && k !== 'name') o[k] = C(v);
    else if (Array.isArray(v)) o[k] = v.map(C);
    else o[k] = v;
  }
  return o;
});
function blendTheme(A, B, t) {
  const o = {};
  for (const k in A) {
    const va = A[k], vb = B[k];
    if (typeof va === 'number') o[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && Array.isArray(va[0])) o[k] = va.map((c, i) => mixC(c, vb[i], t));
    else if (Array.isArray(va)) o[k] = mixC(va, vb, t);
    else o[k] = t < 0.5 ? va : vb;
  }
  return o;
}
const th = { idx: 0, from: THEMES[0], to: THEMES[0], t: 1 };
let TH = THEMES[0];
function setTheme(i) { th.from = TH; th.idx = (i + THEMES.length) % THEMES.length; th.to = THEMES[th.idx]; th.t = 0; skyLabel.textContent = th.to.name; }

/* ================= scene state ================= */
let W = 1, H = 1, S = 1, FS = 1, DPR = 1, waterY = 0, horizonY = 0, deepY = 0, GRAV = 900;
let T = 0;
const boat = { x: 0, y: 0, ang: 0, lift: 0, liftV: 0, rock: 0, rockPh: 0, alarm: 0, radar: 0 };
const gun = { ang: 3.75, state: 'idle', timer: 0, target: null, missOff: 0, recoil: 0 };
const crew = { hankHappy: 0, siphoHappy: 0, lever: 0 };
let arrow = null, mine = null, blast = null, breach = null, spout = null, bump = null;
let fishes = [], sharks = [], dolphins = [], sardines = [], jellies = [], parts = [], rings = [], plankton = [];
let clouds = [], gulls = [], stars = [], rocks = [], corals = [], islands = [], weeds = [];
let deepWhale = null, turtle = null, manta = null, octo = null, crab = null, breachFlap = 0;
let flash = 0, shake = 0, spawnT = 0, idleJumpT = 2, smokeT = 0, foamT = 0, sharkT = 4, spoutT = 6;

/* ================= ship geometry (local units, waterline y = 0, bow on the left) ================= */
const SHEER = [[-208, -70], [-60, -46], [192, -56]];
function sheerY(x) {
  const [a, b, c] = SHEER;
  let lo = 0, hi = 1;
  for (let i = 0; i < 22; i++) {
    const t = (lo + hi) / 2, xt = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0];
    if (xt < x) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1];
}
const deckY = (x) => sheerY(x) + 12;
const CAN = { x: -172 }; CAN.deck = deckY(CAN.x); CAN.y = CAN.deck - 36;
const HANK = { x: -140 }; HANK.feet = deckY(HANK.x);
const CRATE = { x: -98 }; CRATE.y = deckY(CRATE.x);
const BONG = { x: 130 }; BONG.feet = deckY(BONG.x);
const CONSOLE = { x: 146 }; CONSOLE.y = deckY(CONSOLE.x);
const ROOF_Y = -170;
const ROD = { x: 14, butt: { x: 4, y: ROOF_Y - 29 }, len: 112 };
const HANG = { x: 228, y: -152 };
const CHAIN = 34, MINE_R = 28, MUZZLE = 64, HANDLE = 30, CK = 1.22;

/* ================= game state ================= */
const game = { phase: 'waiting', t: 0, mult: 1, crashAt: 1, haul: 0, round: 0, mile: 0, msg: '', msgT: 0, catches: {}, rounds: 0 };
// bal is the server wallet balance (null until the server answers)
let bal = null, crashHistory = [], myBets = [], bots = [], listDirty = true, mineDirty = true, guideDirty = true;
const NICKS = ['SaltyPete', 'Marlin Mo', 'KelpQueen', 'ReelDeal', 'Bilge Rat', 'Mackerel Max', 'Barnacle Bea', 'Captain Clam', 'Snoek Sam', 'Old Gil',
  'DeckHand Dan', 'Tidewalker', 'Bait & Wait', 'Hooked_On_U', 'Gaffer', 'Wave Rider', 'Thabo M.', 'Lerato K.', 'Naledi', 'Pieter v.', 'Anele', 'Zanele',
  'Kagiso', 'Ruan', 'Ayesha', 'Mpho', 'Jabu', 'Riaan', 'Tumi', 'Bongani', 'Yusuf', 'Karabo', 'Megan'];
const BOT_COLORS = ['#6aa6c6', '#e0a24a', '#9c8ce6', '#5fd0a8', '#e07a7a', '#c9c06a', '#7fc4e8', '#e6a0c8'];
