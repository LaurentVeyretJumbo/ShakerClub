// src/fx.js — Effets sonores (Web Audio API) et haptiques (Vibration API)
// iOS ne supporte pas navigator.vibrate : les appels échouent silencieusement.

let _ctx = null;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

/** À appeler sur le premier geste utilisateur pour débloquer l'AudioContext. */
export function resume() {
  if (_ctx?.state === 'suspended') _ctx.resume();
}

// ─── Helpers internes ────────────────────────────────────────────────────────

function tone(freq, type, dur, vol = 0.25, delay = 0) {
  const c = ac();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

function noiseBurst(dur, vol = 0.25, filterFreq = 600, delay = 0) {
  const c = ac();
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t);
}

// ─── FX publics ──────────────────────────────────────────────────────────────

let _lastShakeAt = 0;

/** Tick court pendant le shake actif — throttlé à ~6/s max. */
export function playShakeTick() {
  const now = performance.now();
  if (now - _lastShakeAt < 160) return;
  _lastShakeAt = now;
  const c = ac();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.07);
  g.gain.setValueAtTime(0.18, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.08);
  navigator.vibrate?.(20);
}

/** Sweep ascendant + impact quand la jauge atteint 100 %. */
export function playBuildUp() {
  const c = ac();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.35);
  g.gain.setValueAtTime(0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.36);
  noiseBurst(0.12, 0.2, 500);
  navigator.vibrate?.([80, 30, 120]);
}

/**
 * Tick du compte à rebours — synchro avec les delays CSS de .lottery-countdown.
 * @param {0|1|2} step  0 = "3", 1 = "2", 2 = "1"
 */
export function playTick(step) {
  const freqs = [440, 523, 784];
  const vols  = [0.22, 0.26, 0.35];
  tone(freqs[step], 'sine', 0.12, vols[step]);
  navigator.vibrate?.(step === 2 ? 70 : 35);
}

/** Arpège ascendant court — tentative réussie. */
export function playSuccess() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.18, 0.22, i * 0.09));
  navigator.vibrate?.([60, 30, 100]);
}

/** Descente chromatique — tentative ratée. */
export function playFail() {
  [392, 311, 220].forEach((f, i) => tone(f, 'sawtooth', 0.32, 0.2, i * 0.2));
  noiseBurst(0.4, 0.1, 300, 0.1);
  navigator.vibrate?.([150, 80, 150, 80, 350]);
}

/** Fanfare — toutes les 5 tentatives réussies. */
export function playVictory() {
  const notes = [
    [523, 0], [659, 0.1], [784, 0.2],
    [1047, 0.35], [784, 0.55], [880, 0.65], [1047, 0.78],
  ];
  notes.forEach(([f, d]) => tone(f, 'sine', 0.22, 0.28, d));
  navigator.vibrate?.([80, 40, 80, 40, 80, 40, 300]);
}
