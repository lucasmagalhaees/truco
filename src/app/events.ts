import { Core } from '../core';
import type { Answer, DrillKind, Game, Level, RealTable, Speed, Target, Theme } from '../core';
import { buzz, later, sound } from './fx';
import { confetti, lift, render, stamp, toast } from './render';
import { S, applyTheme, saveS, setS, ui } from './state';
import { applyUpdate, checkNow } from './update';
import { listen } from './voice';

/* ================= events =================
   One listener for every tap, by data-act. Chance comes from Math.random here: the core only ever gets it as a
   function. The computer players move on a timer (`schedule`): after every change, if one of them has to act, it does
   after a moment, so the person can follow the table. */
const rand = (): number => Math.random();
/** How long the computer players think, in ms, by speed; a finished round stays on the table a little longer. */
export const THINK: Record<Speed, number> = { calma: 1500, normal: 900, rapida: 400 };
export const ROUND_PAUSE = 700;
const LOUD = ['truco', 'seis', 'nove', 'doze'];

/** A new game state: saved and painted, with the sound and the moment that goes with what changed. */
function play(next: Game): void {
  const before = S.game;
  if (next === before) return;
  setS({ ...S, game: next });
  if (next.phase === 'over' && before && before.phase !== 'over' && next.winner !== null) {
    S.tally = { w: S.tally.w + (next.winner === 0 ? 1 : 0), l: S.tally.l + (next.winner === 1 ? 1 : 0) };
  }
  saveS(); ui.confirmEnd = false;
  render();
  moment(before, next);
  schedule();
}
/** What the table hears and sees when the game moves. */
function moment(before: Game | null, g: Game): void {
  if (!before || before.n !== g.n) { sound('shuffle'); return; }
  if (g.played.length > before.played.length) sound('card');
  if (g.shout && g.shout !== before.shout) {
    if (LOUD.includes(g.shout.word)) {
      stamp(`${g.shout.word.toUpperCase()}!`, Core.teamOf(g.shout.seat)); sound('truco');
      if (Core.teamOf(g.shout.seat) === 1) buzz([50, 40, 50]);
    } else if (g.shout.word === 'corro' || g.shout.word === 'fujo') stamp(g.result?.shown?.bluff ? 'Era blefe!' : 'Correu!', g.result?.team ?? null);
  }
  if (g.phase === 'over' && before.phase !== 'over' && g.winner !== null) {
    if (g.winner === 0) confetti(0);
    sound(g.winner === 0 ? 'win' : 'lose'); buzz([60, 80, 60, 80, 200]);
  } else if (g.phase === 'handEnd' && before.phase !== 'handEnd' && g.result?.team !== null) sound('point');
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** If a computer player has to act, it acts after a moment (and only if nothing else changed the game meanwhile). */
export function schedule(): void {
  clearTimeout(timer);
  const g = S.game, who = g ? Core.whoActs(g) : null;
  if (!g || who === null || who === 0) return;
  let ms = ui.wait ?? THINK[S.speed || 'normal'];
  if (ui.wait === null && g.phase === 'play' && !g.table.length && g.last) ms += ROUND_PAUSE;
  timer = setTimeout(() => { if (S.game === g) play(Core.aiAct(g, rand)); }, ms);
}

function newGame(): void { ui.drill = null; play(Core.newGame(rand, S.level)); toast(`Partida nova, nível ${{ facil: 'fácil', medio: 'médio', dificil: 'difícil' }[S.level]}.`); }
function home(): void { clearTimeout(timer); ui.drill = null; ui.real = false; ui.sheet = null; ui.confirmEnd = false; setS({ ...S, game: null }); saveS(); render(); window.scrollTo(0, 0); }
/** The person plays a card: it lifts off the hand, then lands on the table. Taps wait meanwhile. */
function playMine(g: Game, k: number): void {
  if (Core.whoActs(g) !== 0 || g.phase !== 'play') return;
  ui.busy = true; lift(k);
  later(() => { ui.busy = false; play(Core.playCard(g, 0, k)); }, 180);
}
function drill(kind: DrillKind): void { ui.drill = Core.drill(kind, rand); ui.picked = null; render(); window.scrollTo(0, 0); }
function guess(v: string): void {
  if (!ui.drill || ui.picked !== null) return;
  ui.picked = v;
  const ok = Core.drillOk(ui.drill, v);
  ui.streak = ok ? ui.streak + 1 : 0;
  S.train = { ok: S.train.ok + (ok ? 1 : 0), total: S.train.total + 1, best: Math.max(S.train.best, ui.streak) };
  saveS(); sound(ok ? 'right' : 'wrong'); if (!ok) buzz(80);
  render();
}
/** The real table changed: saved and painted. */
function real(next: RealTable): void { S.real = next; saveS(); render(); }
/** The microphone: what is heard goes to the real table, card by card. */
function voice(): void {
  ui.listening = true; render();
  listen(text => {
    ui.heard = text;
    const cards = Core.hear(text, S.real.vira, S.real.target);
    let t = S.real;
    for (const c of cards) t = Core.tell(t, c.card, c.target);
    if (cards.length) sound('card'); else toast('Não entendi a carta. Tente “sete de copas”.');
    real(t);
  }, error => { ui.listening = false; render(); if (error && error !== 'no-speech' && error !== 'aborted') toast(error === 'not-allowed' ? 'O microfone não foi liberado.' : 'Não deu pra ouvir agora.'); });
}

/** A setting: saved, applied and painted. */
function setting(a: string, v: string): void {
  if (a === 'level') S.level = v as Level;
  else if (a === 'hints') { if (v === 'off') S.hints = false; else delete S.hints; }
  else if (a === 'speed') { if (v === 'normal') delete S.speed; else S.speed = v as Speed; }
  else if (a === 'theme') { if (v === 'auto') delete S.theme; else S.theme = v as Theme; applyTheme(); }
  else if (a === 'fx') { if (v === 'off') S.quiet = true; else { delete S.quiet; buzz(30); sound('card'); } }
  saveS(); render();
}

export function initEvents(): void {
  document.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!b || ui.busy) return;
    const a = b.dataset.act as string, d = b.dataset, g = S.game;
    if (['level', 'hints', 'speed', 'theme', 'fx'].includes(a)) setting(a, d.v || '');
    else if (a === 'vira') { ui.vira = (d.r || '7') + 'o'; render(); }
    else if (a === 'drill') drill(d.k as DrillKind);
    else if (a === 'guess') guess(d.v || '');
    else if (a === 'new' || a === 'again') newGame();
    else if (a === 'home') home();
    else if (a === 'real') { ui.real = true; render(); window.scrollTo(0, 0); }
    else if (a === 'sheet') { ui.sheet = d.v as Target; render(); }
    else if (a === 'closesheet') { ui.sheet = null; render(); }
    else if (a === 'pickcard' && ui.sheet) { const t = Core.tell(S.real, d.c || '', ui.sheet); ui.sheet = null; sound('card'); real(t); }
    else if (a === 'untell') real(Core.untell(S.real, d.c || ''));
    else if (a === 'nextround') real(Core.nextRound(S.real));
    else if (a === 'resetreal') { ui.heard = ''; real(Core.emptyTable()); }
    else if (a === 'listen') voice();
    else if (a === 'brand') { if (ui.drill && !g) home(); else window.scrollTo(0, 0); }
    else if (a === 'update') applyUpdate();
    else if (a === 'checkupdate') void checkNow();
    else if (!g) return;
    else if (a === 'play') playMine(g, Number(d.k));
    else if (a === 'truco') play(Core.raise(g, 0));
    else if (a === 'answer') play(Core.answer(g, d.v as Answer));
    else if (a === 'eleven') play(Core.decideEleven(g, d.v === '1'));
    else if (a === 'next') play(Core.nextHand(g, rand));
    else if (a === 'end' && ui.confirmEnd) home();
    else if (a === 'end') { ui.confirmEnd = true; render(); }
  });
  schedule();                      // a saved game may be waiting on a computer player
}
