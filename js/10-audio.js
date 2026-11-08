/*
 * Flying Fish Catcher · 10-audio.js
 * All sound is synthesised with the Web Audio API (no audio files):
 *   - background music: a relaxed island groove that builds as the multiplier climbs
 *   - ocean ambience: washing waves, gulls and the odd hull creak
 *   - sound effects, layered and sent through a little reverb
 */
'use strict';

/* ================= engine ================= */
let AC = null, master = null, sfxBus = null, musicBus = null, ambBus = null, verbIn = null, noiseBuf = null;
let soundOn = true, musicOn = localStorage.getItem('ffc-music') !== 'off';
function makeImpulse(sec, decay) {
  const len = Math.floor(AC.sampleRate * sec), buf = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return buf;
}
function unlockAudio() {
  if (!soundOn) return;
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(AC.destination);
      master = AC.createGain(); master.gain.value = 0.55; master.connect(comp);
      const verb = AC.createConvolver(); verb.buffer = makeImpulse(2.4, 3); const verbOut = AC.createGain(); verbOut.gain.value = 0.32; verb.connect(verbOut); verbOut.connect(master);
      verbIn = AC.createGain(); verbIn.gain.value = 1; verbIn.connect(verb);
      sfxBus = AC.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      const sfxSend = AC.createGain(); sfxSend.gain.value = 0.22; sfxBus.connect(sfxSend); sfxSend.connect(verbIn);
      musicBus = AC.createGain(); musicBus.gain.value = musicOn ? 0.3 : 0; musicBus.connect(master);
      const musSend = AC.createGain(); musSend.gain.value = 0.3; musicBus.connect(musSend); musSend.connect(verbIn);
      ambBus = AC.createGain(); ambBus.gain.value = 0.55; ambBus.connect(master);
      const len = AC.sampleRate * 2; noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      startAmbience(); startMusic();
    }
    if (AC.state === 'suspended') AC.resume().catch(() => {});
    applyAudioLevels();
  } catch (e) { AC = null; }
}
function applyAudioLevels() {
  if (!AC) return;
  const t = AC.currentTime;
  for (const [p, v, k] of [[master.gain, soundOn ? 0.55 : 0, 0.05], [musicBus.gain, musicOn ? 0.3 : 0, 0.2]]) { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.setTargetAtTime(v, t, k); }
}
const audioReady = () => soundOn && AC && AC.state === 'running';

/* one oscillator voice with a quick attack and exponential decay */
function tone(f0, f1, dur, type, vol, delay, bus, at) {
  if (!audioReady()) return;
  const t = (at != null ? at : AC.currentTime) + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
/* filtered noise burst */
function hiss(dur, vol, f0, f1, type, delay, bus, at, q) {
  if (!audioReady()) return;
  const t = (at != null ? at : AC.currentTime) + (delay || 0), src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; f.type = type || 'lowpass'; f.Q.value = q || 0.8;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1 || f0), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(bus || sfxBus); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}
function droplets(n, vol, delay) { for (let i = 0; i < n; i++) { const f = 1400 + Math.random() * 2200; tone(f, f * 1.6, 0.05, 'sine', vol, (delay || 0) + Math.random() * 0.35); } }

/* ================= sound effects ================= */
const sfx = {
  shoot() { tone(150, 40, 0.28, 'sine', 0.5); hiss(0.25, 0.25, 3200, 700, 'bandpass'); tone(900, 380, 0.32, 'sawtooth', 0.025, 0.04); },
  hit() { tone(300, 110, 0.14, 'triangle', 0.3); hiss(0.06, 0.2, 2500, 900, 'bandpass'); tone(1800, 2600, 0.16, 'sine', 0.05, 0.04); },
  land() { hiss(0.16, 0.22, 900, 260); tone(140, 70, 0.12, 'sine', 0.25); tone(1046, 1046, 0.3, 'sine', 0.07, 0.06); tone(1568, 1568, 0.4, 'sine', 0.06, 0.14); },
  plip() { tone(1200, 380, 0.1, 'sine', 0.1); hiss(0.08, 0.05, 1800, 600); },
  splash(v) { const k = v || 0.15; hiss(0.42, k * 1.2, 2600, 380); hiss(0.2, k * 0.6, 5000, 2500, 'bandpass', 0.03); droplets(4, k * 0.25, 0.08); },
  splashBig() { hiss(1.3, 0.5, 3000, 180); tone(80, 38, 0.8, 'sine', 0.4); hiss(0.6, 0.25, 6000, 2000, 'bandpass', 0.1); droplets(10, 0.05, 0.25); },
  cast() { hiss(0.35, 0.12, 600, 3400, 'bandpass'); for (let i = 0; i < 6; i++) tone(2800, 2600, 0.015, 'square', 0.02, 0.05 + i * 0.03); tone(1500, 600, 0.12, 'sine', 0.05, 0.55); },
  reel() { for (let i = 0; i < 14; i++) { tone(2600, 2400, 0.018, 'square', 0.03, i * 0.05); hiss(0.02, 0.04, 4000, 3000, 'bandpass', i * 0.05); } },
  chomp() { hiss(0.08, 0.35, 1400, 500, 'bandpass'); hiss(0.08, 0.3, 1100, 400, 'bandpass', 0.09); tone(170, 55, 0.18, 'sawtooth', 0.18); },
  whale() { tone(320, 180, 1.8, 'sine', 0.12); tone(240, 300, 1.4, 'sine', 0.07, 0.5); },
  dolphin() { for (let i = 0; i < 3; i++) { tone(3000 + i * 300, 5200, 0.1, 'sine', 0.05, i * 0.17); tone(5200, 3400, 0.12, 'sine', 0.04, i * 0.17 + 0.1); } for (let i = 0; i < 6; i++) hiss(0.01, 0.06, 6000, 6000, 'highpass', 0.6 + i * 0.03); },
  chip() { tone(900, 620, 0.05, 'sine', 0.12); hiss(0.03, 0.06, 3000, 2000, 'bandpass'); },
  cash() { [1318, 1760, 2637].forEach((f, i) => { tone(f, f, 0.5, 'sine', 0.09, i * 0.07); tone(f * 2, f * 2, 0.25, 'sine', 0.025, i * 0.07); }); hiss(0.5, 0.04, 9000, 7000, 'highpass', 0.12); },
  clank() { for (const f of [520, 1347, 2210]) tone(f, f * 0.98, 0.45, 'sine', 0.06); hiss(0.12, 0.2, 3200, 1800, 'bandpass'); },
  siren() { for (let i = 0; i < 2; i++) { tone(660, 990, 0.36, 'triangle', 0.08, i * 0.4); tone(990, 660, 0.04, 'triangle', 0.05, i * 0.4 + 0.36); } },
  beep() { tone(1900, 1900, 0.05, 'sine', 0.07); tone(3800, 3800, 0.03, 'sine', 0.02); },
  boom() { hiss(2.6, 1, 1600, 40); tone(110, 22, 2, 'sine', 0.9); hiss(0.5, 0.35, 5000, 900, 'highpass'); hiss(1.8, 0.3, 900, 160, 'lowpass', 0.35); droplets(14, 0.04, 0.7); },
};

/* ================= ocean ambience ================= */
function startAmbience() {
  const wave = (cut, period, depth, base) => {
    const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut;
    const g = AC.createGain(); g.gain.value = base;
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 1 / period; lg.gain.value = depth; lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(ambBus); src.start(); lfo.start();
  };
  wave(420, 7.3, 0.05, 0.07); wave(1300, 5.1, 0.018, 0.022);
}
function gull(at) { for (let i = 0; i < 3; i++) { const t0 = i * 0.32; tone(1900, 1350, 0.26, 'sine', 0.035, t0, ambBus, at); tone(3800, 2700, 0.2, 'sine', 0.008, t0, ambBus, at); } }
function creak(at) {
  if (!audioReady()) return;
  const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), t = at;
  o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + 0.4); o.frequency.linearRampToValueAtTime(80, t + 0.8);
  f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 6;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  o.connect(f); f.connect(g); g.connect(ambBus); o.start(t); o.stop(t + 0.9);
}

/* ================= background music ================= */
// D major island groove, 8 bars: D Bm G A | G D Em A
const BPM = 94, STEP = 60 / BPM / 4;
const CHORDS = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64], [55, 59, 62], [62, 66, 69], [52, 55, 59], [57, 61, 64]];
const ARP = [0, 1, 2, 1, 3, 2, 1, 2];
const MOTIFS = [[74, -1, 76, 78, -1, 76, 74, -1], [78, -1, 81, -1, 78, 76, 74, -1], [69, 71, 74, -1, 76, -1, 74, -1], [81, -1, 78, 76, 78, -1, -1, -1]];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const mus = { started: false, step: 0, next: 0, level: 0.35, lastPhase: '', duck: 0, motif: null, ambT: 0 };
function pluck(m, at, vol) { const f = hz(m); tone(f, f, 0.42, 'triangle', vol, 0, musicBus, at); tone(f * 2, f * 2, 0.18, 'sine', vol * 0.35, 0, musicBus, at); }
function pan(m, at, vol) { const f = hz(m); tone(f, f, 0.7, 'sine', vol, 0, musicBus, at); tone(f * 2.01, f * 2.01, 0.35, 'sine', vol * 0.3, 0, musicBus, at); tone(f * 3.9, f * 3.9, 0.12, 'sine', vol * 0.12, 0, musicBus, at); }
function bassNote(m, at, vol) { const f = hz(m - 24); tone(f, f, 0.42, 'sine', vol, 0, musicBus, at); tone(f, f * 0.98, 0.16, 'triangle', vol * 0.4, 0, musicBus, at); }
function padChord(ch, at, dur, vol) {
  if (!audioReady()) return;
  const f = AC.createBiquadFilter(), g = AC.createGain(); f.type = 'lowpass'; f.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vol, at + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, at + dur);
  f.connect(g); g.connect(musicBus);
  for (const m of ch) for (const d of [-6, 6]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = d; o.connect(f); o.start(at); o.stop(at + dur + 0.05); }
}
function scheduleStep(i, at) {
  const bar = Math.floor(i / 16) % 8, s = i % 16, ch = CHORDS[bar], L = mus.level;
  // plucked chord arpeggio on eighths
  if (s % 2 === 0) { const k = ARP[(s / 2) % 8], m = k < 3 ? ch[k] + 12 : ch[0] + 24; pluck(m, at, 0.05 + 0.025 * L); }
  // bass on 1, the "and" of 2, and 3
  if (s === 0) bassNote(ch[0], at, 0.22); if (s === 6) bassNote(ch[0] + 7, at, 0.12); if (s === 8) bassNote(ch[0], at, 0.18); if (s === 14 && L > 0.5) bassNote(ch[0] + 12, at, 0.1);
  // shaker on every eighth, accented off-beats
  if (s % 2 === 0) hiss(0.04, s % 4 === 2 ? 0.05 : 0.025, 9000, 7000, 'highpass', 0, musicBus, at);
  // congas and a soft kick once the round is running
  if (L > 0.5) { if (s === 0 || s === 8) tone(120, 45, 0.22, 'sine', 0.22, 0, musicBus, at); if (s === 3 || s === 11 || s === 14) tone(s === 14 ? 330 : 240, s === 14 ? 280 : 200, 0.12, 'sine', 0.07, 0, musicBus, at); }
  // warm pad under each chord when things heat up
  if (s === 0 && L > 0.65) padChord(ch, at, STEP * 16, 0.012 + 0.012 * (L - 0.65));
  // steel-pan melody every other bar, busier at high multipliers
  if (s === 0) mus.motif = (bar % 2 === 1 || L > 0.85) && Math.random() < 0.55 + L * 0.3 ? MOTIFS[(Math.random() * MOTIFS.length) | 0] : null;
  if (mus.motif && s % 2 === 0) { const m = mus.motif[s / 2]; if (m > 0) pan(m, at, 0.05 + 0.03 * L); }
}
function musicTick() {
  if (!AC || AC.state !== 'running') return;
  const now = AC.currentTime;
  // intensity follows the game
  const ph = typeof game !== 'undefined' ? game.phase : 'waiting';
  const target = ph === 'running' ? Math.min(1, 0.6 + Math.log10(Math.max(1, game.mult)) * 0.45) : ph === 'crashed' ? 0.3 : 0.4;
  mus.level += (target - mus.level) * 0.05;
  if (ph !== mus.lastPhase) {
    if (ph === 'crashed' && musicOn) {
      // duck the music and play a short falling sting
      musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(0.06, now + 0.15); musicBus.gain.linearRampToValueAtTime(0.3, now + 3.5);
      [74, 70, 67, 62].forEach((m, i) => tone(hz(m), hz(m), 0.5, 'triangle', 0.05, i * 0.14, sfxBus));
    }
    mus.lastPhase = ph;
  }
  if (mus.next < now - 0.2) { const skip = Math.ceil((now - mus.next) / STEP); mus.step += skip; mus.next += skip * STEP; } // tab was asleep: don't burst missed notes
  while (mus.next < now + 0.15) { if (musicOn) scheduleStep(mus.step, Math.max(mus.next, now)); mus.step++; mus.next += STEP; }
  // gulls and hull creaks now and then
  mus.ambT -= 0.025;
  if (mus.ambT <= 0) { mus.ambT = 6 + Math.random() * 12; if (Math.random() < 0.6) gull(now + 0.05); else creak(now + 0.05); }
}
function startMusic() {
  if (mus.started) return; mus.started = true; mus.next = AC.currentTime + 0.2; mus.ambT = 3;
  setInterval(musicTick, 25);
}
function setMusic(on) {
  musicOn = on; localStorage.setItem('ffc-music', on ? 'on' : 'off');
  if (on) unlockAudio(); applyAudioLevels();
}
