/* ================= effects: sound, vibration and timing =================
   Sounds are made on the spot with Web Audio (no files, nothing downloaded): a card slapped on the table, the riffle of
   a shuffle, the thump of a "TRUCO!", the click of a point, a right or wrong answer in training, and a short fanfare.
   The phone vibrates on a raise, when a raise is asked of the person and at the end; only Android lets a page do that.
   "Som e vibração" turns both off (`S.quiet`). */
import { S } from './state';
import type { Flavor } from '../core';

/** The device asks for less motion: animations are off in the CSS, and nothing here waits for one to end. */
export const calm = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs `fn` once a short animation has had time to play, or at once when the device asks for less motion. */
export function later(fn: () => void, ms: number): void {
  if (calm()) fn(); else setTimeout(fn, ms);
}

/** A vibration, where the device allows it. */
export function buzz(pattern: number | number[]): void {
  if (S.quiet) return;
  try { navigator.vibrate?.(pattern); } catch (e) { /* not allowed here: no vibration */ }
}

export type Sound = 'card' | 'shuffle' | 'truco' | 'point' | 'right' | 'wrong' | 'win' | 'lose';
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (S.quiet) return null;
  try {
    ctx = ctx || new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch (e) { return null; }
}
/** A note: a frequency for `dur` seconds from `at`, fading out. */
function tone(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number): void {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.destination); o.start(at); o.stop(at + dur + 0.02);
}
/** A burst of filtered noise: paper, the thud of a stamp. */
function hiss(a: AudioContext, at: number, dur: number, vol: number, freq: number): void {
  const n = Math.max(1, Math.floor(a.sampleRate * dur)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(at);
}
/** One of the few sounds of the game. `flavor` (the pack of the side that acted, D24) nudges the "TRUCO!", the point and
 *  the end fanfare: fighting games lower and heavier, Sonic a quick high blip, the rest their own small shade. It is the
 *  same single sound each time, only the wave, the pitch and the length move a little; the card, shuffle and training
 *  sounds carry no flavour. */
export function sound(name: Sound, flavor: Flavor = 'neutro'): void {
  const a = audio(); if (!a) return;
  const t = a.currentTime + 0.01;
  const low = flavor === 'luta', fast = flavor === 'veloz';
  if (name === 'card') { hiss(a, t, 0.06, 0.6, 2400); tone(a, 180, t, 0.05, 'sine', 0.25); }
  else if (name === 'shuffle') for (let i = 0; i < 6; i++) hiss(a, t + i * 0.05, 0.04, 0.3, 3000 + i * 200);
  else if (name === 'truco') {
    const f0 = low ? 70 : flavor === 'futebol' ? 110 : 90, dur = low ? 0.26 : fast ? 0.12 : 0.22;
    tone(a, f0, t, dur, 'sine', 0.6); hiss(a, t, low ? 0.12 : 0.1, 0.6, low ? 520 : fast ? 1600 : 700);
    tone(a, fast ? 1200 : 220, t + 0.02, fast ? 0.1 : 0.18, flavor === 'tinta' ? 'triangle' : 'square', fast ? 0.12 : 0.06);
  }
  else if (name === 'point') { const m = low ? 0.72 : fast ? 1.25 : 1; tone(a, 880 * m, t, 0.08, 'triangle', 0.25); tone(a, 1320 * m, t + 0.07, 0.12, 'triangle', 0.2); }
  else if (name === 'right') { tone(a, 660, t, 0.1, 'sine', 0.3); tone(a, 990, t + 0.09, 0.16, 'sine', 0.3); }
  else if (name === 'wrong') tone(a, 160, t, 0.25, 'sawtooth', 0.12);
  else if (name === 'win') { const m = (low ? 0.75 : 1) * (fast ? 1.3 : 1), ty: OscillatorType = low ? 'sawtooth' : 'square', st = fast ? 0.09 : 0.12; [523, 659, 784, 1047].forEach((f, i) => tone(a, f * m, t + i * st, 0.3, ty, 0.08)); }
  else { const m = low ? 0.8 : 1; [392, 330, 262].forEach((f, i) => tone(a, f * m, t + i * 0.16, 0.35, 'sawtooth', 0.07)); }
}
