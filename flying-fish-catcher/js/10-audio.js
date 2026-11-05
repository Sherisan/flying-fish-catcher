/*
 * Flying Fish Catcher · 10-audio.js
 * Sound effects, synthesised with the Web Audio API (no audio files).
 */
'use strict';

/* ================= sound (synthesised) ================= */
let AC = null, master = null, noiseBuf = null, soundOn = true;
function unlockAudio() {
  if (!soundOn) return;
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination);
      const len = AC.sampleRate * 2; noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume().catch(() => {});
  } catch (e) { AC = null; }
}
const audioReady = () => soundOn && AC && AC.state === 'running';
function tone(f0, f1, dur, type, vol, delay) {
  if (!audioReady()) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function hiss(dur, vol, f0, f1, type, delay) {
  if (!audioReady()) return;
  const t = AC.currentTime + (delay || 0), src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; f.type = type || 'lowpass'; f.Q.value = 0.8;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1 || f0), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}
const sfx = {
  shoot() { tone(220, 70, 0.18, 'triangle', 0.3); hiss(0.12, 0.2, 3000, 900, 'bandpass'); },
  hit() { tone(320, 760, 0.09, 'sine', 0.22); },
  land() { tone(660, 990, 0.07, 'sine', 0.1); },
  plip() { tone(900, 300, 0.08, 'sine', 0.1); },
  splash(v) { hiss(0.32, v || 0.15, 1600, 400); },
  splashBig() { hiss(0.9, 0.4, 2200, 250); },
  cast() { hiss(0.28, 0.08, 700, 3200, 'bandpass'); },
  reel() { for (let i = 0; i < 8; i++) tone(2400, 2200, 0.02, 'square', 0.025, i * 0.07); },
  chomp() { tone(180, 60, 0.12, 'sawtooth', 0.16); hiss(0.1, 0.15, 900, 300); },
  whale() { tone(190, 110, 1.7, 'sine', 0.12); tone(250, 150, 1.4, 'sine', 0.06, 0.35); },
  dolphin() { for (let i = 0; i < 3; i++) tone(2600 + i * 400, 4200, 0.12, 'sine', 0.04, i * 0.16); },
  chip() { tone(1500, 900, 0.05, 'square', 0.05); },
  cash() { tone(880, 880, 0.12, 'square', 0.07); tone(1320, 1320, 0.22, 'square', 0.07, 0.09); },
  clank() { tone(500, 320, 0.15, 'square', 0.08); hiss(0.1, 0.15, 3000, 2000, 'bandpass'); },
  siren() { for (let i = 0; i < 2; i++) { tone(880, 880, 0.18, 'sawtooth', 0.04, i * 0.36); tone(660, 660, 0.18, 'sawtooth', 0.04, i * 0.36 + 0.18); } },
  beep() { tone(1900, 1900, 0.04, 'square', 0.04); },
  boom() { hiss(2.4, 0.95, 1600, 45); tone(110, 24, 1.8, 'sine', 0.85); hiss(0.5, 0.35, 5000, 900, 'highpass'); hiss(1.6, 0.25, 900, 200, 'lowpass', 0.35); },
};
