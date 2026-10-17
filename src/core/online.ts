/* A room for playing over the internet: up to four people, the empty seats played by the computer. The server holds the
   room and the whole game, deck and hands included; each person only ever receives their own view of it, made by
   viewFor: the table turned so that they sit at seat 0 (the bottom of their screen), with nobody else's cards in it.
   Pure, like the rest of the core: the server (server/worker.ts on Cloudflare, tests/room_server.mjs in the tests)
   only moves messages in and out and keeps the time. */
import { aiAct, answer, decideEleven, newGame, nextHand, playCard, raise, whoActs, isHuman, LEVELS } from './game';
import type { Answer } from './game';
import { DEFAULT_NAMES } from './teams';
import type { Game, Level, Seat, Team } from './types';

/** Seats in the order people take them: the first is the host, the second sits against them (each with a computer
 *  partner), the third is the host's partner and the fourth the second one's. */
export const SEAT_ORDER: Seat[] = [0, 1, 2, 3];
/** How long the computer players think on the server, and the extra pause after a round closes, in ms. */
export const ROOM_THINK = 900, ROOM_ROUND_PAUSE = 700;
export const NAME_MAX = 16, CODE_LEN = 5;
/** Letters for room codes: no 0/O, 1/I/L, so a code read out loud is not mistaken. */
export const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export interface Member { seat: Seat; name: string; token: string; online: boolean }
export interface Room { code: string; level: Level; members: Member[]; game: Game | null }
export type Action = { a: 'play'; k: number } | { a: 'truco' } | { a: 'answer'; v: Answer } | { a: 'eleven'; v: boolean } | { a: 'next' };
/** What a phone may send. */
export type ClientMsg =
  | { t: 'join'; name: string; token: string; level?: Level }
  | { t: 'start' } | { t: 'again' } | { t: 'leave' }
  | { t: 'bot'; seat: Seat }                       // the host puts the computer in the seat of someone who left
  | ({ t: 'act' } & Action);
/** What a phone receives: the room as that person sees it. */
export interface RoomView { t: 'room'; code: string; host: boolean; seat: Seat; level: Level; members: { seat: Seat; name: string; online: boolean }[]; game: Game | null }

export const newRoom = (code: string): Room => ({ code, level: 'medio', members: [], game: null });
/** A room code: CODE_LEN letters that are hard to confuse. */
export const roomCode = (rand: () => number): string => Array.from({ length: CODE_LEN }, () => CODE_ABC[Math.floor(rand() * CODE_ABC.length)]).join('');
export const isCode = (x: unknown): x is string => typeof x === 'string' && new RegExp(`^[${CODE_ABC}]{${CODE_LEN}}$`).test(x);
const host = (r: Room): Member | undefined => r.members.find(m => m.seat === 0) || r.members[0];

/* ---------- each person's view ---------- */
/** "Nós" and "Eles" in the words of the log are from seat 0's side; for the other pair they swap. */
const SWAPS: [string, string][] = [['Nós', 'Eles'], ['nós', 'eles'], ['decidimos', 'decidem'], ['levamos', 'levaram'], ['vencemos', 'venceram'], ['corremos', 'correram'], ['jogamos', 'jogam']];
export function swapSides(text: string): string {
  let out = text;
  SWAPS.forEach(([a, b], i) => { out = out.split(a).join(`\u0001${i}a`).split(b).join(`\u0001${i}b`); });
  SWAPS.forEach(([a, b], i) => { out = out.split(`\u0001${i}a`).join(b).split(`\u0001${i}b`).join(a); });
  return out;
}
/** The game as `seat` sees it: turned so that seat is 0 and its pair is 0 ("Nós"), with the other hands hidden (each card
 *  as "??", so their number still shows). In a hand of eleven, the pair deciding sees both its hands, as the rules say.
 *  A computer player's bluff is not told until it is shown. */
export function viewFor(g: Game, seat: Seat): Game {
  const r = (s: number): number => (s - seat + 4) % 4, flip = seat % 2 === 1;
  const tm = <T extends Team | null>(t: T): T => (t === null || !flip ? t : ((1 - (t as number)) as T));
  const turn = <T>(xs: T[]): T[] => [0, 1, 2, 3].map(v => xs[(v + seat) % 4]);
  const say = (s: string): string => (flip ? swapSides(s) : s);
  const eleven = tm(g.eleven);
  const hands = turn(g.hands).map((h, v) => (v === 0 || (v === 2 && g.phase === 'eleven' && eleven === 0) ? [...h] : h.map(() => '??')));
  return {
    ...g, hands, names: turn(g.names), sides: flip ? [g.sides[1], g.sides[0]] : [...g.sides] as [string | null, string | null],
    humans: g.humans.map(r).sort(), score: flip ? [g.score[1], g.score[0]] : [...g.score] as [number, number],
    dealer: r(g.dealer), starter: r(g.starter), turn: r(g.turn),
    table: g.table.map(p => ({ seat: r(p.seat), card: p.card })),
    last: g.last ? { plays: g.last.plays.map(p => ({ seat: r(p.seat), card: p.card })), winner: g.last.winner === -1 ? -1 : r(g.last.winner) } : null,
    rounds: g.rounds.map(x => (x === -1 ? -1 : tm(x))), raisedBy: tm(g.raisedBy),
    ask: g.ask ? { by: r(g.ask.by), value: g.ask.value } : null, eleven,
    shout: g.shout ? { seat: r(g.shout.seat), word: g.shout.word } : null,
    result: g.result ? { team: tm(g.result.team), points: g.result.points, why: say(g.result.why), ...(g.result.shown ? { shown: { ...g.result.shown, seat: r(g.result.shown.seat) } } : {}) } : null,
    winner: tm(g.winner), hist: g.hist.map(h => ({ ...h, team: tm(h.team), how: say(h.how) })), log: g.log.map(say)
  };
}
/** The room as the person with `token` sees it; null if they are not in it. */
export function roomView(room: Room, token: string): RoomView | null {
  const me = room.members.find(m => m.token === token);
  if (!me) return null;
  const r = (s: number): number => (s - me.seat + 4) % 4;
  return {
    t: 'room', code: room.code, host: host(room) === me, seat: me.seat, level: room.level,
    members: room.members.map(m => ({ seat: r(m.seat), name: m.name, online: m.online })).sort((a, b) => a.seat - b.seat),
    game: room.game ? viewFor(room.game, me.seat) : null
  };
}

/* ---------- what people do ---------- */
export type Outcome = { room: Room; error?: string };
const cleanName = (x: unknown): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '');
/** A message from the person with `token`. Errors say why in words the person can read; the room is then unchanged. */
export function handle(room: Room, token: string, msg: ClientMsg, rand: () => number): Outcome {
  const me = room.members.find(m => m.token === token);
  if (msg.t === 'join') {
    if (me) return { room: { ...room, members: room.members.map(m => (m === me ? { ...m, online: true } : m)) } };
    const name = cleanName(msg.name);
    if (!name) return { room, error: 'Escreve seu nome.' };
    if (typeof token !== 'string' || token.length < 8 || token.length > 64) return { room, error: 'Não deu pra entrar: recarregue a página.' };
    if (room.game) return { room, error: 'Essa partida já começou.' };
    const free = SEAT_ORDER.find(s => !room.members.some(m => m.seat === s));
    if (free === undefined) return { room, error: 'A sala está cheia.' };
    const level = !room.members.length && msg.level && LEVELS.includes(msg.level) ? msg.level : room.level;
    return { room: { ...room, level, members: [...room.members, { seat: free, name, token, online: true }] } };
  }
  if (!me) return { room, error: 'Você não está nessa sala.' };
  const isHost = host(room) === me;
  if (msg.t === 'leave') {
    if (!room.game) {
      // before the game, leaving frees the seat; the next person keeps theirs, and seat 0 passes on if the host left
      const rest = room.members.filter(m => m !== me);
      return { room: { ...room, members: rest } };
    }
    return { room: { ...room, members: room.members.map(m => (m === me ? { ...m, online: false } : m)) } };
  }
  if (msg.t === 'start' || msg.t === 'again') {
    if (!isHost) return { room, error: 'Só quem criou a sala começa a partida.' };
    if (room.game && room.game.phase !== 'over') return { room, error: 'A partida já está rolando.' };
    return { room: { ...room, game: startGame(room, rand) } };
  }
  if (msg.t === 'bot') {
    if (!isHost || !room.game) return { room, error: 'Só quem criou a sala faz isso.' };
    const gone = room.members.find(m => m.seat === msg.seat && !m.online);
    if (!gone) return { room, error: 'Esse jogador ainda está na sala.' };
    const g = room.game;
    return { room: { ...room, members: room.members.filter(m => m !== gone), game: { ...g, humans: g.humans.filter(s => s !== gone.seat), log: [...g.log, `${g.names[gone.seat]} saiu; a IA joga no lugar.`] } } };
  }
  if (msg.t === 'act') {
    const g = room.game;
    if (!g) return { room, error: 'A partida ainda não começou.' };
    const next = act(g, me.seat, msg, rand);
    return next === g ? { room, error: 'Agora não é a sua vez.' } : { room: { ...room, game: next } };
  }
  return { room, error: 'Mensagem desconhecida.' };
}
/** A new game for the people in the room; the empty seats are computer players with the bar's names. */
function startGame(room: Room, rand: () => number): Game {
  const names = [0, 1, 2, 3].map(s => room.members.find(m => m.seat === s)?.name || DEFAULT_NAMES[s]);
  return newGame(rand, room.level, { names, sides: [null, null], humans: room.members.map(m => m.seat) });
}
/** A person's move, only when it is theirs to make; anyone may deal the next hand. */
function act(g: Game, seat: Seat, x: Action, rand: () => number): Game {
  if (x.a === 'next') return nextHand(g, rand);
  if (whoActs(g) !== seat) return g;
  if (x.a === 'play') return playCard(g, seat, Number(x.k));
  if (x.a === 'truco') return raise(g, seat);
  if (x.a === 'answer') return ['accept', 'run', 'raise'].includes(x.v) ? answer(g, x.v) : g;
  return decideEleven(g, x.v === true);
}
/** If a computer player has to move, how long to wait first (ms); null when it is a person's move, or nobody's. */
export function aiDelay(room: Room): number | null {
  const g = room.game, s = g ? whoActs(g) : null;
  if (!g || s === null || isHuman(g, s)) return null;
  return ROOM_THINK + (g.phase === 'play' && !g.table.length && g.last ? ROOM_ROUND_PAUSE : 0);
}
/** The computer player's move, if one has to move. */
export const aiStep = (room: Room, rand: () => number): Room => (room.game && aiDelay(room) !== null ? { ...room, game: aiAct(room.game, rand) } : room);
/** A message as it arrived over the wire: anything that is not a message reads as null. */
export function readMsg(raw: unknown): ClientMsg | null {
  let o: Record<string, unknown>;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>); } catch (e) { return null; }
  if (!o || typeof o !== 'object' || typeof o.t !== 'string') return null;
  if (o.t === 'join') return { t: 'join', name: String(o.name ?? ''), token: String(o.token ?? ''), ...(LEVELS.includes(o.level as Level) ? { level: o.level as Level } : {}) };
  if (o.t === 'start' || o.t === 'again' || o.t === 'leave') return { t: o.t };
  if (o.t === 'bot' && Number.isInteger(o.seat)) return { t: 'bot', seat: o.seat as number };
  if (o.t === 'act') {
    if (o.a === 'play' && Number.isInteger(o.k)) return { t: 'act', a: 'play', k: o.k as number };
    if (o.a === 'truco' || o.a === 'next') return { t: 'act', a: o.a };
    if (o.a === 'answer' && ['accept', 'run', 'raise'].includes(o.v as string)) return { t: 'act', a: 'answer', v: o.v as Answer };
    if (o.a === 'eleven' && typeof o.v === 'boolean') return { t: 'act', a: 'eleven', v: o.v };
  }
  return null;
}
/** A saved room, read back; null if it does not hold together. The game in it is not checked again: only the server writes it. */
export function readRoom(x: unknown): Room | null {
  const r = x as Room;
  if (!r || typeof r !== 'object' || !isCode(r.code) || !LEVELS.includes(r.level) || !Array.isArray(r.members)) return null;
  if (!r.members.every(m => m && typeof m.name === 'string' && typeof m.token === 'string' && Number.isInteger(m.seat) && typeof m.online === 'boolean')) return null;
  return { code: r.code, level: r.level, members: r.members, game: r.game && typeof r.game === 'object' ? r.game : null };
}
