/* The rules of truco paulista for four (two pairs, partners facing each other), and the computer players.
   Pure: no page, no network, no storage. Chance comes in as a function (`rand`), so a seeded one makes any game the
   same every time. Every move returns a new Game; a move that is not allowed returns the same object unchanged. */
import type { Ask, Card, Game, HandRecord, Level, Phase, Play, Read, RoundResult, Seat, Team, Watch, Word } from './types';

/** Ranks from weakest to strongest, and suits in the order manilhas rank (ouros < espadas < copas < paus). */
export const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'] as const;
export const SUITS = ['o', 'e', 'c', 'p'] as const;
/** The game ends when a pair reaches 12 points. */
export const WIN_POINTS = 12;
/** Cards in each hand. */
export const HAND_SIZE = 3;
/** What a hand is worth: 1, then truco 3, seis 6, nove 9 and doze 12. */
export const VALUES = [1, 3, 6, 9, 12];
/** A pair with 11 points decides whether to play the hand, and then it is worth 3; running gives the others 1. */
export const ELEVEN = 11, ELEVEN_VALUE = 3;
/** The four seats: the person, the pair on their right, their partner (facing them) and the pair on their left. */
export const SEATS = ['Você', 'Biu', 'Cida', 'Toinho'];

/* ---------- chance ---------- */
/** A seeded source of chance (mulberry32): the same seed gives the same numbers, in [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A shuffled copy (Fisher-Yates). */
export function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- cards ---------- */
export const teamOf = (s: Seat): Team => (s % 2) as Team;
export const nextSeat = (s: Seat): Seat => (s + 1) % 4;
export const other = (t: Team): Team => (1 - t) as Team;
/** The 40 cards: no 8, 9, 10 or jokers. */
export const deck = (): Card[] => RANKS.flatMap(r => SUITS.map(s => r + s));
/** The rank of the manilhas: the one after the vira's (after 3 comes 4 again). */
export const manilhaRank = (vira: Card): string => RANKS[(RANKS.indexOf(vira[0] as typeof RANKS[number]) + 1) % RANKS.length];
export const isManilha = (c: Card, vira: Card): boolean => c[0] === manilhaRank(vira);
/** How strong a card is with this vira: 0 (a 4) to 9 (a 3), and the manilhas above, 10 (ouros) to 13 (paus, the zap). */
export function power(c: Card, vira: Card): number {
  return isManilha(c, vira) ? 10 + SUITS.indexOf(c[1] as typeof SUITS[number]) : RANKS.indexOf(c[0] as typeof RANKS[number]);
}
const RANK_NAME: Record<string, string> = { Q: 'dama', J: 'valete', K: 'rei', A: 'ás' };
const SUIT_NAME: Record<string, string> = { o: 'ouros', e: 'espadas', c: 'copas', p: 'paus' };
/** A card in words: "7 de copas", "ás de espadas". */
export const cardName = (c: Card): string => `${RANK_NAME[c[0]] || c[0]} de ${SUIT_NAME[c[1]]}`;
/** The nickname of each manilha, by suit, from the weakest to the strongest. */
export const MANILHA_NAME: Record<string, string> = { o: 'picafumo', e: 'espadilha', c: 'copas', p: 'zap' };
/** A card in words, with its nickname when it is a manilha: "7 de paus (zap)". */
export const cardSay = (c: Card, vira: Card): string => cardName(c) + (isManilha(c, vira) ? ` (${MANILHA_NAME[c[1]]})` : '');
/** Every card from the strongest to the weakest with this vira: the four manilhas by suit (zap, copas, espadilha,
 *  picafumo), then 3 2 A K J Q 7 6 5 4 without the manilha rank, four cards of each (they tie with each other). */
export function ranking(vira: Card): { rank: string; cards: Card[]; manilha: boolean }[] {
  const m = manilhaRank(vira);
  return [...[...SUITS].reverse().map(s => ({ rank: m, cards: [m + s], manilha: true })),
    ...[...RANKS].reverse().filter(r => r !== m).map(r => ({ rank: r, cards: SUITS.map(s => r + s), manilha: false }))];
}
/** The difficulty levels. */
export const LEVELS: Level[] = ['facil', 'medio', 'dificil'];
const say = (g: Pick<Game, 'names'>, s: Seat): string => g.names[s] || SEATS[s];
const WORD: Record<number, Word> = { 3: 'truco', 6: 'seis', 9: 'nove', 12: 'doze' };
export const nextValue = (v: number): number => VALUES[Math.min(VALUES.length - 1, VALUES.indexOf(v) + 1)];

/* ---------- a game ---------- */
/** Deals a new hand on top of what the game already has: score, history, log and the next dealer. */
function deal(base: Pick<Game, 'score' | 'dealer' | 'n' | 'hist' | 'log' | 'level' | 'names' | 'sides' | 'humans' | 'reads'>, rand: () => number): Game {
  const d = shuffle(deck(), rand), starter = nextSeat(base.dealer);
  const at = [base.score[0] === ELEVEN, base.score[1] === ELEVEN];
  const eleven: Team | null = at[0] !== at[1] ? (at[0] ? 0 : 1) : null;
  const vira = d[HAND_SIZE * 4];
  const log = [...base.log, `Mão ${base.n}: ${say(base, base.dealer)} deu as cartas. Vira: ${cardName(vira)}.`];
  if (eleven !== null) log.push(`Mão de onze: ${eleven === 0 ? 'nós' : 'eles'} ${eleven === 0 ? 'decidimos se jogamos' : 'decidem se jogam'}.`);
  else if (at[0] && at[1]) log.push('Mão de ferro: os dois com 11. Todo mundo joga às cegas, sem ver as próprias cartas; quem levar a mão leva o jogo.');
  return {
    names: base.names, sides: base.sides, humans: base.humans, level: base.level, blind: at[0] && at[1], played: [],
    score: base.score, dealer: base.dealer, n: base.n, hist: base.hist, log,
    hands: [0, 1, 2, 3].map(i => d.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE)), vira,
    table: [], last: null, rounds: [], starter, turn: starter, value: 1, raisedBy: null, ask: null,
    eleven, phase: eleven !== null ? 'eleven' : 'play', shout: null, result: null, winner: null,
    reads: base.reads || unread(), watch: []
  };
}
/** A new game: nobody has points, the first dealer is drawn. */
export function newGame(rand: () => number, level: Level = 'medio', table?: { names: string[]; sides: [string | null, string | null]; humans?: Seat[] }): Game {
  const names = table && table.names.length === 4 ? table.names.map((x, i) => String(x || SEATS[i]).slice(0, 24)) : [...SEATS];
  return deal({ score: [0, 0], dealer: Math.floor(rand() * 4), n: 1, hist: [], log: [], level: LEVELS.includes(level) ? level : 'medio', names, sides: table ? table.sides : [null, null], humans: table && table.humans && table.humans.length ? [...table.humans].sort() : [0] }, rand);
}
/** After a hand: the next one, dealt by the next seat. */
export function nextHand(g: Game, rand: () => number): Game {
  if (g.phase !== 'handEnd') return g;
  return deal({ score: g.score, dealer: nextSeat(g.dealer), n: g.n + 1, hist: g.hist, log: g.log, level: g.level, names: g.names, sides: g.sides, humans: g.humans, reads: g.reads }, rand);
}

/** Who has to act now: the seat whose turn it is, the one who answers a raise, or the one who decides a hand of eleven
 *  for their pair. A pair with a person in it answers and decides through that person; a pair of computer players,
 *  through the one after who asked (on a raise) or its first seat (on a hand of eleven). Null when nobody has to. */
export function whoActs(g: Game): Seat | null {
  if (g.phase === 'play') return g.turn;
  if (g.phase === 'truco') return responder(g, g.ask as Ask);
  if (g.phase === 'eleven') return speaker(g, g.eleven as Team, g.eleven as Team);
  return null;
}
/** The seat that speaks for pair `t`: its person (the first one, if both are people), or `fallback`. */
const speaker = (g: Game, t: Team, fallback: Seat): Seat => { const h = (g.humans || [0]).filter(s => teamOf(s) === t).sort()[0]; return h === undefined ? fallback : h; };
const responder = (g: Game, a: Ask): Seat => speaker(g, other(teamOf(a.by)), nextSeat(a.by));
/** Whether `seat` is played by a person. */
export const isHuman = (g: Game, seat: Seat): boolean => (g.humans || [0]).includes(seat);

/** Who takes a round: the seat with the strongest card, or -1 when the strongest cards tie between the two pairs (two
 *  equal cards of the same pair are not a tie: that pair takes it). */
export function roundWinner(plays: Play[], vira: Card): Seat | -1 {
  const best = Math.max(...plays.map(p => power(p.card, vira)));
  const tops = plays.filter(p => power(p.card, vira) === best);
  return tops.every(p => teamOf(p.seat) === teamOf(tops[0].seat)) ? tops[0].seat : -1;
}
/** Who takes the hand from the rounds played so far: a pair, null (nobody: every round tied), or undefined when it is
 *  not decided yet. Two rounds win it; a tie goes to whoever took the other round, and a tie in the third round goes
 *  to whoever took the first. */
export function handWinner(rounds: RoundResult[]): Team | null | undefined {
  const [a, b, c] = rounds;
  if (rounds.length < 2) return undefined;
  if (rounds.length === 2) {
    if (a !== -1 && (a === b || b === -1)) return a;
    if (a === -1 && b !== -1) return b;
    return undefined;
  }
  if (c !== -1) return c;
  return a !== -1 ? a : null;
}

/** A finished round in words; when manilhas met, says that the suit decided it. */
function roundSay(g: Game, table: Play[], w: Seat | -1, n: number): string {
  const vira = g.vira;
  if (w === -1) return `${n}ª rodada empatou (cangou).`;
  const card = (table.find(p => p.seat === w) as Play).card, manilhas = table.filter(p => isManilha(p.card, vira)).length;
  return `${n}ª rodada: ${say(g, w)} fez com ${cardSay(card, vira)}${manilhas > 1 ? ', que ganha no naipe' : ''}.`;
}
/** Which manilhas met in a round, strongest first, when more than one did: the suit decides between them. */
export function suitDuel(plays: Play[], vira: Card): Card[] {
  const m = plays.map(p => p.card).filter(c => isManilha(c, vira)).sort((a, b) => power(b, vira) - power(a, vira));
  return m.length > 1 ? m : [];
}

/** Ends the hand: the points go to `team` (none to anyone when null), and 12 points end the game. */
function endHand(g: Game, team: Team | null, points: number, why: string): Game {
  const score: [number, number] = [g.score[0], g.score[1]];
  if (team !== null) score[team] = Math.min(WIN_POINTS, score[team] + points);
  const rec: HandRecord = { team, points: team === null ? 0 : points, how: why, value: g.value };
  const over = score[0] >= WIN_POINTS || score[1] >= WIN_POINTS;
  const winner: Team | null = over ? (score[0] >= WIN_POINTS ? 0 : 1) : null;
  const log = [...g.log, team === null ? `${why} Ninguém marca.` : `${why} ${team === 0 ? 'Nós' : 'Eles'} +${points}.`];
  if (over) log.push(winner === 0 ? 'Fim de jogo: nós vencemos!' : 'Fim de jogo: eles venceram.');
  let reads = g.reads;
  for (const w of g.watch || []) if (w.seen.length && w.seen.length >= w.held - 1) reads = reveal(reads, w, w.seen, g.vira, team === teamOf(w.by));
  return { ...g, reads, watch: [], score, ask: null, phase: (over ? 'over' : 'handEnd') as Phase, result: { team, points: rec.points, why }, winner, hist: [...g.hist, rec], log };
}

/* ---------- moves ---------- */
/** Plays card `k` of `seat`'s hand, if it is that seat's turn. The fourth card closes the round, and maybe the hand. */
export function playCard(g: Game, seat: Seat, k: number): Game {
  if (g.phase !== 'play' || g.turn !== seat || !Number.isInteger(k) || k < 0 || k >= g.hands[seat].length) return g;
  const card = g.hands[seat][k];
  const hands = g.hands.map((h, i) => (i === seat ? h.filter((_, j) => j !== k) : h));
  const table = [...g.table, { seat, card }];
  const watch = g.watch && g.watch.some(w => w.by === seat) ? g.watch.map(w => (w.by === seat ? { ...w, seen: [...w.seen, card] } : w)) : g.watch;
  const next: Game = { ...g, hands, table, played: [...g.played, card], shout: null, ...(watch ? { watch } : {}) };
  if (table.length < 4) return { ...next, turn: nextSeat(seat) };
  const w = roundWinner(table, g.vira), result: RoundResult = w === -1 ? -1 : teamOf(w);
  const rounds = [...g.rounds, result], n = rounds.length;
  const log = [...g.log, ...table.map(p => `${say(g, p.seat)} jogou ${cardSay(p.card, g.vira)}.`), roundSay(g, table, w, n)];
  const done: Game = { ...next, rounds, table: [], last: { plays: table, winner: w }, log };
  const hw = handWinner(rounds);
  if (hw !== undefined) return endHand(done, hw, g.value, hw === null ? 'As três rodadas empataram.' : `${hw === 0 ? 'Nós levamos' : 'Eles levaram'} a mão.`);
  const starter = w === -1 ? g.starter : w;
  return { ...done, starter, turn: starter };
}

/** Whether `seat` may raise the stakes now: on their turn, before playing, if the hand is not at 12 yet, if the last
 *  accepted raise was not their pair's, and if nobody has 11 points (a hand of eleven or of iron has no truco). */
export function canRaise(g: Game, seat: Seat): boolean {
  return g.phase === 'play' && g.turn === seat && g.value < WIN_POINTS && g.raisedBy !== teamOf(seat) && g.score[0] < ELEVEN && g.score[1] < ELEVEN;
}
/** Truco (or seis, nove, doze): the other pair has to answer. */
export function raise(g: Game, seat: Seat, bluff = false): Game {
  if (!canRaise(g, seat)) return g;
  const value = nextValue(g.value), word = WORD[value];
  return { ...g, phase: 'truco', ask: bluff ? { by: seat, value, bluff: true } : { by: seat, value }, shout: { seat, word }, watch: watching(g, seat, value), log: [...g.log, `${say(g, seat)} pediu ${word}!`] };
}
export type Answer = 'accept' | 'run' | 'raise';
/** The answer to a raise. Accepting makes the hand worth what was asked; running gives the asking pair what the hand
 *  was worth before; raising accepts and asks for the next value, and then the first pair answers. */
export function answer(g: Game, a: Answer, bluff = false): Game {
  if (g.phase !== 'truco' || !g.ask) return g;
  const ask = g.ask, seat = responder(g, ask), reads = heard(g.reads, seat, a === 'run');
  if (a === 'accept') return { ...g, reads, phase: 'play', value: ask.value, raisedBy: teamOf(ask.by), ask: null, shout: { seat, word: 'aceito' }, log: [...g.log, `${say(g, seat)} aceitou. Vale ${ask.value}.`] };
  if (a === 'run') {
    const end = endHand({ ...g, reads }, teamOf(ask.by), g.value, `${say(g, seat)} correu do ${WORD[ask.value]}.`);
    const shown = { seat: ask.by, cards: g.hands[ask.by], bluff: !!ask.bluff };
    // the one who asked shows the hand: everyone sees whether it was worth the raise
    const w = (g.watch || []).find(x => x.by === ask.by && x.value === ask.value);
    if (w) end.reads = reveal(end.reads, w, g.hands[ask.by], g.vira, false);
    return { ...end, shout: { seat, word: 'corro' }, result: { ...(end.result as NonNullable<Game['result']>), shown }, log: shown.bluff ? [...end.log, `${say(g, ask.by)} estava blefando!`] : end.log };
  }
  if (a === 'raise' && ask.value < WIN_POINTS) {
    const value = nextValue(ask.value), word = WORD[value];
    return { ...g, reads, watch: watching(g, seat, value), value: ask.value, raisedBy: teamOf(ask.by), ask: bluff ? { by: seat, value, bluff: true } : { by: seat, value }, shout: { seat, word }, log: [...g.log, `${say(g, seat)} aceitou e pediu ${word}!`] };
  }
  return g;
}
/* ---------- reading the table ----------
   Everyone sees how each seat raises and answers. A raise whose cards come to light (played out, or shown when the
   others ran) is judged against what it takes to raise with a fair hand; a card held back to the end of the hand is
   taken to be no better than the best one shown. Over the game this gives each seat a bluff rate and a run rate, which
   the medium player leans on a little and the hard one a lot. */
/** What it takes to raise to each value with a fair hand: strength plus how the rounds stand (the medium player's line). */
export const RAISE_NEED: Record<number, number> = { 3: 6.5, 6: 8, 9: 9.5, 12: 11 };
/** How far under that line a raise that did not win the hand must be to count as a bluff. */
export const WEAK_BY = 2;
/** How many raises (or answers) a first guess is worth before what a seat has shown counts more: little for the hard
 *  player, who learns fast, more for the medium one. */
export const READ_PRIOR: Record<Level, number> = { facil: 50, medio: 12, dificil: 4 };
/** The first guess before anything is seen: how often a raise is a bluff, and how often a seat runs from a raise. */
export const BLUFF_GUESS = 0.2, RUN_GUESS = 0.35;
const unread = (): Read[] => [0, 1, 2, 3].map(() => ({ shown: 0, weak: 0, answers: 0, runs: 0 }));
const bump = (reads: Read[] | undefined, seat: Seat, f: (r: Read) => Read): Read[] => (reads || unread()).map((r, i) => (i === seat ? f(r) : r));
/** A raise starts being watched: how many cards its seat holds and how the rounds stand are in plain sight. */
const watching = (g: Game, seat: Seat, value: number): Watch[] => [...(g.watch || []), { by: seat, held: g.hands[seat].length, stand: standing(g, teamOf(seat)), value, seen: [] }];
/** A raise answered by `seat`, and whether it ran. */
const heard = (reads: Read[] | undefined, seat: Seat, ran: boolean): Read[] => bump(reads, seat, r => ({ ...r, answers: r.answers + 1, runs: r.runs + (ran ? 1 : 0) }));
/** A raise whose cards came to light: weak when it did not take the hand and the cards were well under the line. */
function reveal(reads: Read[] | undefined, w: Watch, cards: Card[], vira: Card, won: boolean): Read[] {
  const top = Math.max(0, ...cards.map(c => weight(c, vira)));
  const weak = !won && strength(cards, vira) + top * Math.max(0, w.held - cards.length) + w.stand < RAISE_NEED[w.value] - WEAK_BY;
  return bump(reads, w.by, r => ({ ...r, shown: r.shown + 1, weak: r.weak + (weak ? 1 : 0) }));
}
/** How often `seat` seems to bluff, for a player of this game's level: the first guess, moved by what it has shown. */
export function bluffRate(g: Game, seat: Seat): number {
  const r = (g.reads || [])[seat], k = READ_PRIOR[g.level];
  return ((r ? r.weak : 0) + BLUFF_GUESS * k) / ((r ? r.shown : 0) + k);
}
/** How often `seat` seems to run from a raise. */
export function runRate(g: Game, seat: Seat): number {
  const r = (g.reads || [])[seat], k = READ_PRIOR[g.level];
  return ((r ? r.runs : 0) + RUN_GUESS * k) / ((r ? r.answers : 0) + k);
}
/** A hand of eleven: the pair with 11 plays it (worth 3) or runs (the others get 1). */
export function decideEleven(g: Game, play: boolean): Game {
  if (g.phase !== 'eleven' || g.eleven === null) return g;
  const t = g.eleven, seat = whoActs(g) as Seat;
  if (!play) return { ...endHand({ ...g, value: 1 }, other(t), 1, `${t === 0 ? 'Nós corremos' : 'Eles correram'} da mão de onze.`), shout: { seat, word: 'fujo' } };
  return { ...g, phase: 'play', value: ELEVEN_VALUE, shout: { seat, word: 'jogo' }, log: [...g.log, `${t === 0 ? 'Nós jogamos' : 'Eles jogam'} a mão de onze: vale ${ELEVEN_VALUE}.`] };
}

/* ---------- the computer players ----------
   Rules of thumb, the way people play at a bar: lead strong in the first round, take a round with the cheapest card
   that does it, throw the weakest when the partner already has it, raise with a good hand or a round in the pocket,
   bluff now and then, run from a raise with a bad hand. They see their own cards and the table (and, in a hand of
   eleven, the partner's, as the rules allow). The level changes how well they do it:
   - fácil: a third of the time plays any card, raises only with a lot, bluffs little and gets caught;
   - médio: the rules of thumb as they are, a bluff now and then;
   - difícil: remembers every card played this hand, knows when a card can no longer be beaten, keeps a sure card for
     later, covers the partner when an opponent still plays, bluffs more and where a bluff works. */
/** How much a card is worth to hold, roughly: a 4 almost nothing, a 3 a lot, the zap the most. */
export function weight(c: Card, vira: Card): number {
  const p = power(c, vira);
  return p >= 10 ? [3.5, 4, 4.5, 5][p - 10] : [0.2, 0.25, 0.3, 0.4, 0.6, 0.8, 1.1, 1.6, 2.2, 3][p];
}
export const strength = (cards: Card[], vira: Card): number => cards.reduce((s, c) => s + weight(c, vira), 0);
/** How the rounds stand for a pair: +2.5 for each round taken, -2.5 for each one lost. */
const standing = (g: Game, t: Team): number => g.rounds.reduce<number>((s, r) => s + (r === t ? 2.5 : r === -1 ? 0 : -2.5), 0);
/** The cards `seat` has not seen: not in its hand, not played this hand, not the vira. */
export function unseen(g: Game, seat: Seat): Card[] {
  const known = new Set([...g.hands[seat], ...g.played, ...g.table.map(p => p.card), g.vira]);
  return deck().filter(c => !known.has(c));
}
/** Whether no card `seat` has not seen can beat `c`: a sure card. */
export const sure = (g: Game, seat: Seat, c: Card): boolean => unseen(g, seat).every(u => power(u, g.vira) < power(c, g.vira));
/** How strong a hand is for a player of this level: the hard one adds what it knows (sure cards, the partner's card
 *  that already holds the round). */
function judge(g: Game, seat: Seat): number {
  const t = teamOf(seat);
  let s = strength(g.hands[seat], g.vira) + standing(g, t);
  if (g.level === 'dificil') {
    s += g.hands[seat].filter(c => sure(g, seat, c)).length * 1.5;
    const w = g.table.length ? roundWinner(g.table, g.vira) : -1;
    if (w !== -1 && teamOf(w) === t && sure(g, seat, (g.table.find(p => p.seat === w) as Play).card)) s += 2.5;
  }
  return s;
}
/** Whether `seat` surely takes the hand by playing now: last to play, the round already its pair's or a card that beats
 *  the table, and taking this round decides the hand. */
function sureThing(g: Game, seat: Seat): boolean {
  if (g.table.length !== 3) return false;
  const t = teamOf(seat), best = Math.max(...g.table.map(p => power(p.card, g.vira)));
  const partnerTop = roundWinner(g.table, g.vira) === nextSeat(nextSeat(seat));
  return handWinner([...g.rounds, t]) === t && (partnerTop || g.hands[seat].some(c => power(c, g.vira) > best));
}

/** The card a computer player plays: its index in the hand. */
export function aiCard(g: Game, seat: Seat, rand: () => number): number {
  const hand = g.hands[seat], pw = (k: number): number => power(hand[k], g.vira);
  if (g.blind || (g.level === 'facil' && rand() < 1 / 3)) return Math.floor(rand() * hand.length);
  const order = hand.map((_, k) => k).sort((a, b) => pw(a) - pw(b));
  const low = order[0], high = order[order.length - 1], hard = g.level === 'dificil';
  if (!g.table.length) {
    // the first round: lead the best card, but keep a manilha back when the second best is strong too (the hard
    // player keeps back any sure card it does not need)
    const second = order[order.length - 2];
    if (!g.rounds.length && order.length > 1 && ((pw(high) >= 10 && pw(second) >= 8) || (hard && sure(g, seat, hand[high]) && pw(second) >= 7))) return second;
    return high;
  }
  const w = roundWinner(g.table, g.vira), best = Math.max(...g.table.map(p => power(p.card, g.vira)));
  const beat = order.find(k => pw(k) > best);
  if (w !== -1 && teamOf(w) === teamOf(seat)) {
    // the partner has it: throw the weakest; the hard player covers when an opponent still plays and could beat it
    const top = (g.table.find(p => p.seat === w) as Play).card;
    if (hard && g.table.length < 3 && !sure(g, seat, top) && beat !== undefined) return beat;
    return low;
  }
  return beat === undefined ? low : beat;                            // the cheapest card that takes it, or the weakest
}
/** Whether a computer player raises before playing: 'no', 'yes' with a hand that deserves it, or 'bluff'. */
export function aiRaise(g: Game, seat: Seat, rand: () => number): 'no' | 'yes' | 'bluff' {
  if (!canRaise(g, seat)) return 'no';
  if (sureThing(g, seat)) return 'yes';
  const need = RAISE_NEED[nextValue(g.value)] + (g.level === 'facil' ? 1.5 : 0);
  if (judge(g, seat) >= need) return 'yes';
  // the hard player raises once a round is in the pocket and it holds a card nobody can beat
  if (g.level === 'dificil' && standing(g, teamOf(seat)) > 0 && g.hands[seat].some(c => sure(g, seat, c))) return 'yes';
  return rand() < bluffOdds(g, seat) ? 'bluff' : 'no';
}
/** How likely a player is to bluff now. The easy one hardly does, the medium one now and then; the hard one mostly
 *  where a bluff works (a round already taken, or the last round), more against a pair that runs a lot and less
 *  against one that pays, and a bit more once the strong cards are out of the hand. */
export function bluffOdds(g: Game, seat: Seat): number {
  if (g.level === 'facil') return 0.03;
  if (g.level === 'medio') return 0.08;
  const where = standing(g, teamOf(seat)) > 0 || g.rounds.length === 2 ? 0.2 : 0.03;
  const foe = speaker(g, other(teamOf(seat)), nextSeat(seat));
  const gone = [...g.played, ...g.table.map(p => p.card)].filter(c => isManilha(c, g.vira)).length >= 2 ? 0.05 : 0;
  return Math.min(BLUFF_MAX, where * runRate(g, foe) / RUN_GUESS + gone);
}
/** The most a hard player bluffs, however much the others run. */
export const BLUFF_MAX = 0.45;
/** How many deals of the unseen cards a player imagines before answering a raise. */
export const SAMPLES: Record<Level, number> = { facil: 0, medio: 30, dificil: 80 };
/** The chance of taking the hand from which a player raises back instead of only accepting. */
export const RAISE_BACK = 0.75;
/** How many cards `s` still holds: three, less the rounds played and a card already on the table. Everyone knows it. */
const holding = (g: Game, s: Seat): number => Math.max(0, HAND_SIZE - g.rounds.length - (g.table.some(p => p.seat === s) ? 1 : 0));
const calm = (): number => 0.5;
/** Plays the rest of the hand out with these hands, every seat the medium way: the pair that takes it, or null. */
function playOut(g: Game, hands: Card[][]): Team | null {
  let h: Game = { ...g, hands, phase: 'play', ask: null, level: 'medio', blind: false, log: [], hist: [], watch: [], score: [0, 0] };
  for (let i = 0; i < 16 && h.phase === 'play'; i++) h = playCard(h, h.turn, aiCard(h, h.turn, calm));
  return h.result ? h.result.team : null;
}
/** The chances of `seat`'s pair taking and losing this hand, for a player that knows only its own cards and the table
 *  (the hard one remembers the whole hand; see unseen): it deals the unseen cards to the others many times and plays
 *  each deal out. A raise in the air says something: unless the one who asked is bluffing, their hand deserves it, so
 *  only those deals count, weighed by how often that seat seems to bluff. */
export function handOdds(g: Game, seat: Seat, rand: () => number, samples = SAMPLES[g.level] || SAMPLES.medio): { win: number; lose: number } {
  const t = teamOf(seat), pool = unseen(g, seat), ask = g.ask, mine = g.hands[seat];
  const r = seeded(Math.floor(rand() * 4294967296));
  const all = { win: 0, lose: 0, n: 0 }, fair = { win: 0, lose: 0, n: 0 };
  for (let i = 0; i < samples; i++) {
    const d = shuffle(pool, r);
    let k = 0;
    const hands = [0, 1, 2, 3].map(s => (s === seat ? [...mine] : d.slice(k, (k += holding(g, s)))));
    const w = playOut(g, hands);
    const deserved = !!ask && strength(hands[ask.by], g.vira) + standing(g, teamOf(ask.by)) >= RAISE_NEED[ask.value] - 1;
    for (const o of deserved ? [all, fair] : [all]) { o.n++; if (w === t) o.win++; else if (w !== null) o.lose++; }
  }
  const odds = (o: { win: number; lose: number; n: number }) => ({ win: o.win / o.n, lose: o.lose / o.n });
  if (!ask || teamOf(ask.by) === t) return odds(all);
  const b = bluffRate(g, ask.by), a = odds(all);
  const f = fair.n >= 4 ? odds(fair) : { win: a.win / 2, lose: 1 - a.win / 2 };   // hardly any deal deserves it: assume the worst
  return { win: b * a.win + (1 - b) * f.win, lose: b * a.lose + (1 - b) * f.lose };
}
/** The chance of winning the game from a score, as a fair coin walk to 12 would give it: by the points still missing. */
export const gameChance = (mine: number, theirs: number): number =>
  (mine >= WIN_POINTS ? 1 : theirs >= WIN_POINTS ? 0 : (WIN_POINTS - theirs) / (2 * WIN_POINTS - mine - theirs));
/** How a computer player answers a raise, and whether raising back is a bluff. The easy one goes by the look of its
 *  hand and now and then pays for no reason. The medium and hard ones weigh it: running gives the others what the hand
 *  was worth, accepting risks what was asked, with the chances of taking the hand (handOdds) and what each outcome does
 *  to the game. So a doze from nove is paid with a fair hand (running loses 9 for sure), and a raise that would end the
 *  game if run from is always paid. */
function answerPlan(g: Game, seat: Seat, rand?: () => number): { a: Answer; bluff: boolean } {
  const ask = g.ask as Ask;
  if (g.level === 'facil') {
    const score = judge(g, seat);
    if (score >= ({ 3: 4, 6: 5.5, 9: 7, 12: 8.5 }[ask.value] as number) + 1) return { a: 'accept', bluff: false };
    return { a: rand && rand() < 0.2 ? 'accept' : 'run', bluff: false };
  }
  const roll = rand || seeded(g.n * 977 + g.played.length * 31 + seat);
  const t = teamOf(seat), m = g.score[t], o = g.score[other(t)];
  const run = gameChance(m, o + g.value);
  if (run === 0) return { a: 'accept', bluff: false };                   // running ends the game: play it
  const { win, lose } = handOdds(g, seat, roll);
  if (ask.value < WIN_POINTS && win >= RAISE_BACK) return { a: 'raise', bluff: false };
  // the hard player now and then raises back on a weak hand, against a seat that runs a lot
  if (g.level === 'dificil' && ask.value < WIN_POINTS && win >= 0.3 && roll() < 0.25 * runRate(g, ask.by) / RUN_GUESS) return { a: 'raise', bluff: true };
  const play = win * gameChance(m + ask.value, o) + lose * gameChance(m, o + ask.value) + (1 - win - lose) * gameChance(m, o);
  if (play >= run) return { a: 'accept', bluff: false };
  return { a: rand && rand() < 0.05 ? 'accept' : 'run', bluff: false };
}
/** How a computer player answers a raise (see answerPlan). */
export const aiAnswer = (g: Game, seat: Seat, rand?: () => number): Answer => (g.ask ? answerPlan(g, seat, rand).a : 'accept');
/** Whether the computer pair plays a hand of eleven: both hands together, strong enough. */
export const aiEleven = (g: Game, t: Team): boolean => strength([...g.hands[t], ...g.hands[t + 2]], g.vira) >= (g.level === 'facil' ? 6 : 7.5);
/** The move of the computer player who has to act now; the same game when it is the person's move, or nobody's. */
export function aiAct(g: Game, rand: () => number): Game {
  const s = whoActs(g);
  if (s === null || isHuman(g, s)) return g;
  if (g.phase === 'eleven') return decideEleven(g, aiEleven(g, g.eleven as Team));
  if (g.phase === 'truco') { const p = answerPlan(g, s, rand); return answer(g, p.a, p.bluff); }
  const r = aiRaise(g, s, rand);
  if (r !== 'no') return raise(g, s, r === 'bluff');
  return playCard(g, s, aiCard(g, s, rand));
}

/* ---------- training ----------
   Short drills for what a player has to see at once: which rank is the manilha with this vira (the sequence), and who
   takes a round (manilhas met: the suit decides; equal ranks of the two pairs: it ties). Each drill knows its answer and
   explains it. */
export type DrillKind = 'manilha' | 'round';
export interface Drill { kind: DrillKind; vira: Card; plays: Play[]; options: string[]; answer: string; why: string }
/** Whether an answer to a drill is right. */
export const drillOk = (d: Drill, a: string): boolean => d.answer === a;
/** A drill. 'manilha': the options are ranks. 'round': the options are the four cards played, and "empate". */
export function drill(kind: DrillKind, rand: () => number): Drill {
  const d = shuffle(deck(), rand), vira = d[0], m = manilhaRank(vira);
  if (kind === 'manilha') {
    const opts = shuffle([m, ...shuffle(RANKS.filter(r => r !== m), rand).slice(0, 3)], rand);
    return { kind, vira, plays: [], options: opts, answer: m, why: `Vira ${cardName(vira)}: a manilha é a carta seguinte na sequência 4 5 6 7 Q J K A 2 3${vira[0] === '3' ? ' (depois do 3 volta pro 4)' : ''}, então ${RANK_NAME[m] || m}. Força no naipe: picafumo (ouros) < espadilha (espadas) < copas < zap (paus).` };
  }
  // a round: often with two or more manilhas, so the suits decide; sometimes two equal top cards from both pairs, a tie
  const rest = d.slice(1), mans = shuffle(rest.filter(c => c[0] === m), rand), plain = rest.filter(c => c[0] !== m);
  const roll = rand();
  let cards: Card[];
  if (roll < 0.25) {
    const top = plain[0], twin = plain.find(c => c[0] === top[0] && c !== top) as Card;
    const low = plain.filter(c => power(c, vira) < power(top, vira)).slice(0, 2);
    if (twin && low.length === 2) { const a = Math.floor(rand() * 2) * 2, b = 1 + Math.floor(rand() * 2) * 2; cards = []; cards[a] = top; cards[b] = twin; const free = [0, 1, 2, 3].filter(i => i !== a && i !== b); cards[free[0]] = low[0]; cards[free[1]] = low[1]; }
    else cards = plain.slice(0, 4);
  } else {
    const nM = roll < 0.75 ? 2 + Math.floor(rand() * 2) : roll < 0.88 ? 1 : 0;
    cards = shuffle([...mans.slice(0, nM), ...plain.slice(0, 4 - nM)], rand);
  }
  const plays = cards.map((card, seat) => ({ seat, card }));
  const w = roundWinner(plays, vira);
  // equal top cards of the same pair: that pair takes it, but asking for one card would be unfair; keep the first only
  const best = Math.max(...cards.map(c => power(c, vira)));
  if (w !== -1 && cards.filter(c => power(c, vira) === best).length > 1) return drill(kind, rand);
  const duel = suitDuel(plays, vira), options = [...cards, 'empate'], answer = w === -1 ? 'empate' : plays[w].card;
  const why = w === -1 ? `Cangou: as duas mais fortes são do mesmo valor (${cardName(cards.find(c => power(c, vira) === best) as Card).split(' ')[0]}) e de duplas diferentes. Naipe só desempata manilha.`
    : duel.length ? `${duel.map(c => cardSay(c, vira)).join(' > ')}: manilha contra manilha, decide o naipe (ouros < espadas < copas < paus).`
    : isManilha(plays[w].card, vira) ? `${cardSay(plays[w].card, vira)} é a única manilha: ganha de qualquer outra carta.`
    : `Sem manilha na mesa, vale a sequência 4 5 6 7 Q J K A 2 3: ${cardName(plays[w].card)} é a mais alta.`;
  return { kind, vira, plays, options, answer, why };
}
