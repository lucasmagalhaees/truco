import { Core } from '../core';
import type { Answer, DrillKind, Game, Level, RealTable, Speed, Target, Theme } from '../core';
import { buzz, later, sound } from './fx';
import { confetti, lift, render, stamp, toast } from './render';
import { $, valOf } from './format';
import { S, applyTheme, saveS, setS, ui } from './state';
import { applyUpdate, checkNow } from './update';
import { listen } from './voice';
import { connect, inRoom, leave, net, rawSeat, retryNow, roomLink, send } from './net';

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
  if (inRoom()) return;                                  // in a room the server moves the computer players
  const g = S.game, who = g ? Core.whoActs(g) : null;
  if (!g || who === null || Core.isHuman(g, who)) return;
  let ms = ui.wait ?? THINK[S.speed || 'normal'];
  if (ui.wait === null && g.phase === 'play' && !g.table.length && g.last) ms += ROUND_PAUSE;
  timer = setTimeout(() => { if (S.game === g) play(Core.aiAct(g, rand)); }, ms);
}

function newGame(): void { ui.drill = null; ui.editing = false; play(Core.newGame(rand, S.level, Core.lineup(S.team, S.rival, S.custom))); toast(`Partida nova, nível ${{ facil: 'fácil', medio: 'médio', dificil: 'difícil' }[S.level]}.`); }
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

/** The club, the mode and the names of the players. */
function club(a: string, v: string): void {
  if (a === 'team') { if (v) S.team = v; else delete S.team; if (!v || S.rival === v) delete S.rival; ui.editing = false; }
  else if (a === 'mode') { if (v === 'own') delete S.rival; else S.rival = (Core.TEAMS.find(t => t.id !== S.team) as { id: string }).id; }
  else if (a === 'rival') S.rival = v;
  else if (a === 'editplayers') ui.editing = true;
  else if (a === 'saveplayers' && S.team) {
    const names = [0, 1, 2].map(i => valOf(`#pl${i}`).trim().slice(0, 24));
    (document.activeElement as HTMLElement | null)?.blur?.();
    S.custom = { ...(S.custom || {}), [S.team]: names }; ui.editing = false;
  } else if (a === 'resetplayers' && S.team && S.custom) { const c = { ...S.custom }; delete c[S.team]; if (Object.keys(c).length) S.custom = c; else delete S.custom; ui.editing = false; }
  saveS(); render();
}

/* ---------- a room on the server ---------- */
/** Refusals that end the attempt to join: the room is full, already playing, or the name is missing. */
const FATAL = ['Essa partida já começou.', 'A sala está cheia.', 'Escreve seu nome.', 'Não deu pra entrar: recarregue a página.'];
/** Refusals that end it even with a game on the screen: coming back to a room that is gone, or to a seat the computer took. */
const GONE = [Core.ROOM_GONE, Core.SEAT_GONE];
/** A new view of the room came: painted, with the moment that goes with it; a game that just ended counts in the tally. */
function onRoom(before: typeof net.view): void {
  const was = before?.game ?? null, now = net.view?.game ?? null;
  if (now && was && now.phase === 'over' && was.phase !== 'over' && now.winner !== null) { S.tally = { w: S.tally.w + (now.winner === 0 ? 1 : 0), l: S.tally.l + (now.winner === 1 ? 1 : 0) }; saveS(); }
  if (!before && net.view && location.search.includes('sala=')) history.replaceState(null, '', location.pathname);
  render();
  if (now) moment(was, now);
}
function onRoomError(why: string): void {
  toast(why);
  if (GONE.includes(why) || (FATAL.includes(why) && !net.view?.game)) { ui.confirmEnd = false; leave(); render(); window.scrollTo(0, 0); }
}
/** A field of the online card marked wrong, with the reason under it, and the focus there to fix it. */
function fieldError(id: 'oname' | 'ocode', why: string): void {
  const input = $<HTMLInputElement>(`#${id}`), err = $<HTMLElement>(`#${id}-err`);
  if (!input || !err) return;
  err.textContent = why; err.hidden = false;
  input.setAttribute('aria-invalid', 'true'); input.parentElement?.classList.add('bad');
  input.focus();
}
/** Typing in a field marked wrong takes the mark away. */
function fieldOk(e: Event): void {
  const input = e.target as HTMLInputElement, err = $<HTMLElement>(`#${input.id}-err`);
  if (!err || input.getAttribute('aria-invalid') !== 'true') return;
  err.hidden = true; input.removeAttribute('aria-invalid'); input.parentElement?.classList.remove('bad');
}
function joinRoom(code: string): void {
  const name = valOf('#oname').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!name) { fieldError('oname', 'Escreve seu nome.'); return; }
  if (!Core.isCode(code)) { fieldError('ocode', 'O código tem 5 letras.'); return; }
  (document.activeElement as HTMLElement | null)?.blur?.();
  ui.drill = null; ui.real = false; ui.confirmEnd = false;
  connect(code, name, onRoom, onRoomError);
  render(); window.scrollTo(0, 0);
}
/** A move in a room goes to the server; the table changes when the server answers. */
function netAct(a: string, d: DOMStringMap): void {
  const g = net.view?.game;
  if (!g) return;
  if (a === 'play') { if (Core.whoActs(g) !== 0 || g.phase !== 'play') return; lift(Number(d.k)); send({ t: 'act', a: 'play', k: Number(d.k) }); }
  else if (a === 'truco') send({ t: 'act', a: 'truco' });
  else if (a === 'answer') send({ t: 'act', a: 'answer', v: d.v as Answer });
  else if (a === 'eleven') send({ t: 'act', a: 'eleven', v: d.v === '1' });
  else if (a === 'next') send({ t: 'act', a: 'next' });
}
function room(a: string, d: DOMStringMap): void {
  const code = net.view?.code || S.online?.code || '';
  if (a === 'createroom') joinRoom(Core.roomCode(rand));
  else if (a === 'joinroom') joinRoom(valOf('#ocode').trim().toUpperCase());
  else if (a === 'startroom') send({ t: 'start' });
  else if (a === 'againroom') send({ t: 'again' });
  else if (a === 'botseat') send({ t: 'bot', seat: rawSeat(Number(d.s)) });
  else if (a === 'roomformat') send({ t: 'format', format: d.f === 'tres' ? 'tres' : 'duplas' });
  else if (a === 'roomalone') send({ t: 'format', format: 'duplas', alone: rawSeat(Number(d.s)) });
  else if (a === 'retryroom') retryNow();
  else if (a === 'leaveroom') {
    if (net.view?.game && net.view.game.phase !== 'over' && !ui.confirmEnd) { ui.confirmEnd = true; render(); return; }
    ui.confirmEnd = false; leave(); render(); window.scrollTo(0, 0);
  } else if (a === 'copylink') {
    const link = roomLink(code);
    navigator.clipboard.writeText(link).then(() => toast('Link copiado. Manda no grupo!'), () => toast(link));
  } else if (a === 'sharelink') navigator.share({ title: 'Truco', text: `Bora jogar truco? Sala ${code}`, url: roomLink(code) }).catch(() => { /* closed without sharing */ });
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
  document.addEventListener('input', fieldOk);
  document.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!b || ui.busy) return;
    const a = b.dataset.act as string, d = b.dataset, g = S.game;
    if (['level', 'hints', 'speed', 'theme', 'fx'].includes(a)) setting(a, d.v || '');
    else if (['team', 'mode', 'rival', 'editplayers', 'saveplayers', 'resetplayers'].includes(a)) club(a, d.v || '');
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
    else if (['createroom', 'joinroom', 'startroom', 'againroom', 'botseat', 'roomformat', 'roomalone', 'leaveroom', 'copylink', 'sharelink', 'retryroom'].includes(a)) room(a, d);
    else if (inRoom() && ['play', 'truco', 'answer', 'eleven', 'next'].includes(a)) netAct(a, d);
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
  if (S.online) connect(S.online.code, S.myName || 'Jogador', onRoom, onRoomError);      // back to the room after a reload
}
