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
/** What a phone coming back to its game hears when the room is gone (nobody in it for a day), or its seat went to the computer. */
export const ROOM_GONE = 'A sala anterior acabou.', SEAT_GONE = 'Seu lugar na partida ficou com a IA.';
/** Letters for room codes: no 0/O, 1/I/L, so a code read out loud is not mistaken. */
export const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/* ---------- limits against abuse ----------
   The rules below only see messages that got past these. The server keeps the time and the counts; these say yes or no. */
/** The longest message a phone of ours sends is a join (a NAME_MAX name, a 64-letter token): well under a kilobyte. */
export const MSG_MAX = 1024;
/** Each connection may send RATE_BURST messages at once, earning back RATE_PER_S a second. A person taps a few times a
 *  second at most; the reconnect after a drop sends one join. */
export const RATE_BURST = 20, RATE_PER_S = 5;
/** Connections one room accepts at the same time: four people, each with room for a second tab or a reconnect. */
export const CONN_MAX = 12;
/** WebSocket close codes: 1009 for a message too big, 1008 (policy) for too many too fast. */
export const CLOSE_BIG = 1009, CLOSE_FAST = 1008;
/** A connection's allowance: how many messages it may still send, as of `at` (ms). */
export interface Bucket { left: number; at: number }
export const newBucket = (now: number): Bucket => ({ left: RATE_BURST, at: now });
/** One more message at `now`: the allowance after it, and whether it may go through. A clock going back earns nothing. */
export function allow(b: Bucket, now: number): { bucket: Bucket; ok: boolean } {
  const left = Math.min(RATE_BURST, b.left + Math.max(0, now - b.at) * RATE_PER_S / 1000), at = Math.max(now, b.at);
  return left >= 1 ? { bucket: { left: left - 1, at }, ok: true } : { bucket: { left, at }, ok: false };
}
/** Whether a message of `bytes` is past MSG_MAX. */
export const tooBig = (bytes: number): boolean => !(bytes <= MSG_MAX);
/** Whether a room with `conns` connections open takes no more. */
export const roomFull = (conns: number): boolean => conns >= CONN_MAX;

export interface Member { seat: Seat; name: string; token: string; online: boolean }
/** How three people play: 'duplas' is the table of four, two of them in a pair against the third with a computer
 *  partner; 'tres' is three pairs at a table of six, each person with a computer partner (its rules are not in the core
 *  yet: see SUPPORTS_THREE). With two or four people there is nothing to choose and the format is not looked at. */
export type Format = 'duplas' | 'tres';
export const FORMATS: Format[] = ['duplas', 'tres'];
/** Whether the core plays the 'tres' format. Until it does, the lobby shows it as coming soon and start refuses it. */
export const SUPPORTS_THREE = false;
export interface Room { code: string; level: Level; members: Member[]; game: Game | null; format: Format }
export type Action = { a: 'play'; k: number } | { a: 'truco' } | { a: 'answer'; v: Answer } | { a: 'eleven'; v: boolean } | { a: 'next' };
/** What a phone may send. */
export type ClientMsg =
  | { t: 'join'; name: string; token: string; level?: Level; back?: boolean }   // back: this phone was in a game in this room
  | { t: 'start' } | { t: 'again' } | { t: 'leave' }
  | { t: 'drop' }                                  // the connection closed: sent by the server itself, never read off the wire
  | { t: 'bot'; seat: Seat }                       // the host puts the computer in the seat of someone who left
  | { t: 'format'; format: Format; alone?: Seat }  // the host, with three people: how they play, and who pairs with a computer
  | ({ t: 'act' } & Action);
/** What a phone receives: the room as that person sees it. */
export interface RoomView { t: 'room'; code: string; host: boolean; seat: Seat; level: Level; format: Format; members: { seat: Seat; name: string; online: boolean }[]; game: Game | null }

export const newRoom = (code: string): Room => ({ code, level: 'medio', members: [], game: null, format: 'duplas' });
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
    t: 'room', code: room.code, host: host(room) === me, seat: me.seat, level: room.level, format: room.format,
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
    // coming back to a game this phone was in, but the seat is not there: the room was deleted, or the seat went to the computer
    if (msg.back && !room.members.length) return { room, error: ROOM_GONE };
    if (msg.back && room.game) return { room, error: SEAT_GONE };
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
  // before the game, leaving or dropping frees the seat; the next person keeps theirs, and the host's part passes on
  if ((msg.t === 'leave' || msg.t === 'drop') && !room.game) return { room: { ...room, members: room.members.filter(m => m !== me) } };
  // during it, a dropped connection keeps the seat to come back to; leaving for good puts the computer there at once
  if (msg.t === 'drop') return { room: { ...room, members: room.members.map(m => (m === me ? { ...m, online: false } : m)) } };
  if (msg.t === 'leave') return { room: toComputer(room, me) };
  if (msg.t === 'format') {
    if (!isHost) return { room, error: 'Só quem criou a sala escolhe como vão jogar.' };
    if (room.game) return { room, error: 'A partida já começou.' };
    if (room.members.length !== 3) return { room, error: 'Isso é só para sala com 3 pessoas.' };
    if (msg.format === 'tres') return { room: { ...room, format: 'tres' } };
    const alone = msg.alone === undefined ? null : room.members.find(m => m.seat === msg.alone);
    if (msg.alone !== undefined && !alone) return { room, error: 'Essa pessoa não está na sala.' };
    return { room: { ...room, format: 'duplas', members: alone ? pairUp(room.members, me, alone) : room.members } };
  }
  if (msg.t === 'start' || msg.t === 'again') {
    if (!isHost) return { room, error: 'Só quem criou a sala começa a partida.' };
    if (room.game && room.game.phase !== 'over') return { room, error: 'A partida já está rolando.' };
    if (threeOf(room) && !SUPPORTS_THREE) return { room, error: 'As 3 duplas ainda não estão prontas. Escolha 2 contra 1.' };
    return { room: { ...room, game: startGame(room, rand) } };
  }
  if (msg.t === 'bot') {
    if (!isHost || !room.game) return { room, error: 'Só quem criou a sala faz isso.' };
    const gone = room.members.find(m => m.seat === msg.seat && !m.online);
    if (!gone) return { room, error: 'Esse jogador ainda está na sala.' };
    return { room: toComputer(room, gone) };
  }
  if (msg.t === 'act') {
    const g = room.game;
    if (!g) return { room, error: 'A partida ainda não começou.' };
    const next = act(g, me.seat, msg, rand);
    return next === g ? { room, error: 'Agora não é a sua vez.' } : { room: { ...room, game: next } };
  }
  return { room, error: 'Mensagem desconhecida.' };
}
/** Whether the room plays three pairs: three people, and the host chose it. */
const threeOf = (room: Room): boolean => room.format === 'tres' && room.members.length === 3;
/** Three people seated as two against one: `alone` plays with a computer partner, the other two sit across from each
 *  other. The host keeps seat 0 (that is how the room knows its host): if the host is the one alone, the pair takes 1 and
 *  3 and the computer sits at 2; otherwise the host's partner takes 2, `alone` takes 1 and the computer sits at 3. */
function pairUp(members: Member[], hostM: Member, alone: Member): Member[] {
  const others = members.filter(m => m !== hostM && m !== alone);
  const seatOf = (m: Member): Seat => (m === hostM ? 0 : hostM === alone ? (m === others[0] ? 1 : 3) : m === alone ? 1 : 2);
  return members.map(m => ({ ...m, seat: seatOf(m) }));
}
/** Someone out of the game for good: the computer plays their seat from now on. If the host went, the next person in the
 *  room is the host (see host). */
function toComputer(room: Room, gone: Member): Room {
  const g = room.game as Game;
  return { ...room, members: room.members.filter(m => m !== gone), game: { ...g, humans: g.humans.filter(s => s !== gone.seat), log: [...g.log, `${g.names[gone.seat]} saiu; a IA joga no lugar.`] } };
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
  if (!g || s === null || isHuman(g, s) || !room.members.length) return null;      // nobody left: the computer stops too
  return ROOM_THINK + (g.phase === 'play' && !g.table.length && g.last ? ROOM_ROUND_PAUSE : 0);
}
/** The computer player's move, if one has to move. */
export const aiStep = (room: Room, rand: () => number): Room => (room.game && aiDelay(room) !== null ? { ...room, game: aiAct(room.game, rand) } : room);
/** A message as it arrived over the wire: anything that is not a message reads as null. */
export function readMsg(raw: unknown): ClientMsg | null {
  let o: Record<string, unknown>;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>); } catch (e) { return null; }
  if (!o || typeof o !== 'object' || typeof o.t !== 'string') return null;
  if (o.t === 'join') return { t: 'join', name: String(o.name ?? ''), token: String(o.token ?? ''), ...(LEVELS.includes(o.level as Level) ? { level: o.level as Level } : {}), ...(o.back === true ? { back: true } : {}) };
  if (o.t === 'start' || o.t === 'again' || o.t === 'leave') return { t: o.t };
  if (o.t === 'bot' && Number.isInteger(o.seat)) return { t: 'bot', seat: o.seat as number };
  if (o.t === 'format' && FORMATS.includes(o.format as Format)) return { t: 'format', format: o.format as Format, ...(Number.isInteger(o.alone) ? { alone: o.alone as number } : {}) };
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
  // rooms saved before the format existed play as they did: the table of four
  return { code: r.code, level: r.level, members: r.members, game: r.game && typeof r.game === 'object' ? r.game : null, format: FORMATS.includes(r.format) ? r.format : 'duplas' };
}
