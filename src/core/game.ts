/* The rules of truco paulista for four (two pairs, partners facing each other), and for six in three pairs (`teams: 3`,
   online only), and the computer players.
   Pure: no page, no network, no storage. Chance comes in as a function (`rand`), so a seeded one makes any game the
   same every time. Every move returns a new Game; a move that is not allowed returns the same object unchanged. */
import type { Ask, Card, Game, HandRecord, Level, Phase, Play, RoundResult, Seat, Team, Word } from './types';

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
/** The six seats of a game of three pairs: partners face each other (seat i and i + 3), the pairs take turns. */
export const SEATS6 = ['Você', 'Biu', 'Zé', 'Cida', 'Toinho', 'Nena'];

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
/** The pair of a seat: the pairs take turns around the table (with three pairs, seats 0 and 3, 1 and 4, 2 and 5). */
export const teamOf = (s: Seat, teams = 2): Team => (s % teams) as Team;
export const nextSeat = (s: Seat, seats = 4): Seat => (s + 1) % seats;
export const other = (t: Team): Team => (1 - t) as Team;
/** How many pairs play this game (2, or 3 in a game of three pairs), and how many seats. */
export const teamsOf = (g: Pick<Game, 'teams'>): number => (g.teams === 3 ? 3 : 2);
export const seatsOf = (g: Pick<Game, 'teams'>): number => teamsOf(g) * 2;
/** The pair of a seat in this game. */
const tm = (g: Pick<Game, 'teams'>, s: Seat): Team => teamOf(s, teamsOf(g));
/** The partner of a seat: the one facing it. */
export const partnerOf = (g: Pick<Game, 'teams'>, s: Seat): Seat => (s + teamsOf(g)) % seatsOf(g);
/** Whether a seat is still in this hand: with three pairs, a pair that ran from a raise is out of it. */
export const inHand = (g: Pick<Game, 'teams' | 'out'>, s: Seat): boolean => !(g.out || []).includes(tm(g, s));
/** The next seat after `s` still in the hand, and `s` itself if it still is. */
const after = (g: Pick<Game, 'teams' | 'out'>, s: Seat): Seat => { let t = nextSeat(s, seatsOf(g)); while (!inHand(g, t) && t !== s) t = nextSeat(t, seatsOf(g)); return t; };
const from = (g: Pick<Game, 'teams' | 'out'>, s: Seat): Seat => (inHand(g, s) ? s : after(g, s));
/** How many seats are still in the hand. */
const inPlay = (g: Pick<Game, 'teams' | 'out'>): number => Array.from({ length: seatsOf(g) }, (_, s) => s).filter(s => inHand(g, s)).length;
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
/** A pair of a game of three pairs in words: its two names. */
const pairSay = (g: Pick<Game, 'names' | 'teams'>, t: Team): string => `${say(g, t)} e ${say(g, partnerOf(g, t))}`;
const WORD: Record<number, Word> = { 3: 'truco', 6: 'seis', 9: 'nove', 12: 'doze' };
export const nextValue = (v: number): number => VALUES[Math.min(VALUES.length - 1, VALUES.indexOf(v) + 1)];

/* ---------- a game ---------- */
/** Deals a new hand on top of what the game already has: score, history, log and the next dealer. */
function deal(base: Pick<Game, 'score' | 'dealer' | 'n' | 'hist' | 'log' | 'level' | 'names' | 'sides' | 'humans' | 'teams'>, rand: () => number): Game {
  const T = teamsOf(base), N = T * 2, d = shuffle(deck(), rand), starter = nextSeat(base.dealer, N);
  const at = base.score.map(x => x === ELEVEN), nAt = at.filter(Boolean).length;
  // one pair with 11: a hand of eleven; two or more: a hand of iron
  const eleven: Team | null = nAt === 1 ? (at.indexOf(true) as Team) : null;
  const vira = d[HAND_SIZE * N];
  const log = [...base.log, `Mão ${base.n}: ${say(base, base.dealer)} deu as cartas. Vira: ${cardName(vira)}.`];
  if (eleven !== null) log.push(T === 3 ? `Mão de onze: ${pairSay(base, eleven)} decidem se jogam.` : `Mão de onze: ${eleven === 0 ? 'nós' : 'eles'} ${eleven === 0 ? 'decidimos se jogamos' : 'decidem se jogam'}.`);
  else if (nAt >= 2) log.push(T === 3 ? `Mão de ferro: ${nAt === 3 ? 'as três duplas' : 'duas duplas'} com 11. Todo mundo joga às cegas, sem ver as próprias cartas.` : 'Mão de ferro: os dois com 11. Todo mundo joga às cegas, sem ver as próprias cartas; quem levar a mão leva o jogo.');
  return {
    ...(T === 3 ? { teams: 3 as const } : {}),
    names: base.names, sides: base.sides, humans: base.humans, level: base.level, blind: nAt >= 2, played: [],
    score: base.score, dealer: base.dealer, n: base.n, hist: base.hist, log,
    hands: Array.from({ length: N }, (_, i) => d.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE)), vira,
    table: [], last: null, rounds: [], starter, turn: starter, value: 1, raisedBy: null, ask: null,
    eleven, phase: eleven !== null ? 'eleven' : 'play', shout: null, result: null, winner: null
  };
}
/** A new game: nobody has points, the first dealer is drawn. */
export function newGame(rand: () => number, level: Level = 'medio', table?: { names: string[]; sides: [string | null, string | null]; humans?: Seat[]; teams?: 3 }): Game {
  const T = table && table.teams === 3 ? 3 : 2, N = T * 2, base = T === 3 ? SEATS6 : SEATS;
  const names = table && table.names.length === N ? table.names.map((x, i) => String(x || base[i]).slice(0, 24)) : [...base];
  return deal({ ...(T === 3 ? { teams: 3 as const } : {}), score: Array(T).fill(0), dealer: Math.floor(rand() * N), n: 1, hist: [], log: [], level: LEVELS.includes(level) ? level : 'medio', names, sides: table && T === 2 ? table.sides : [null, null], humans: table && table.humans && table.humans.length ? [...table.humans].sort() : [0] }, rand);
}
/** After a hand: the next one, dealt by the next seat. */
export function nextHand(g: Game, rand: () => number): Game {
  if (g.phase !== 'handEnd') return g;
  return deal({ ...(g.teams === 3 ? { teams: 3 as const } : {}), score: g.score, dealer: nextSeat(g.dealer, seatsOf(g)), n: g.n + 1, hist: g.hist, log: g.log, level: g.level, names: g.names, sides: g.sides, humans: g.humans }, rand);
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
const speaker = (g: Game, t: Team, fallback: Seat): Seat => { const h = (g.humans || [0]).filter(s => tm(g, s) === t).sort()[0]; return h === undefined ? fallback : h; };
/** The pairs that still have to answer a raise, the next one first: the other pair; with three pairs, both others still
 *  in the hand, in the order they play after who asked. */
const waiting = (g: Game, a: Ask): Team[] => a.wait || [other(tm(g, a.by))];
/** Who answers for the pair answering now: its person, or its first seat after who asked. */
const responder = (g: Game, a: Ask): Seat => {
  const t = waiting(g, a)[0];
  let s = nextSeat(a.by, seatsOf(g));
  while (tm(g, s) !== t) s = nextSeat(s, seatsOf(g));
  return speaker(g, t, s);
};
/** Whether `seat` is played by a person. */
export const isHuman = (g: Game, seat: Seat): boolean => (g.humans || [0]).includes(seat);

/** Who takes a round: the seat with the strongest card, or -1 when the strongest cards tie between different pairs (two
 *  equal cards of the same pair are not a tie: that pair takes it). `teams`: how many pairs play. */
export function roundWinner(plays: Play[], vira: Card, teams = 2): Seat | -1 {
  const best = Math.max(...plays.map(p => power(p.card, vira)));
  const tops = plays.filter(p => power(p.card, vira) === best);
  return tops.every(p => teamOf(p.seat, teams) === teamOf(tops[0].seat, teams)) ? tops[0].seat : -1;
}
/** Who takes the hand from the rounds played so far: a pair, null (nobody: every round tied), or undefined when it is
 *  not decided yet. Two rounds win it; a tie goes to whoever took the other round, and a tie in the third round goes
 *  to whoever took the first. With three pairs, one round each (1 a 1 a 1) also goes to whoever took the first. */
export function handWinner(rounds: RoundResult[]): Team | null | undefined {
  const [a, b, c] = rounds;
  if (rounds.length < 2) return undefined;
  if (rounds.length === 2) {
    if (a !== -1 && (a === b || b === -1)) return a;
    if (a === -1 && b !== -1) return b;
    return undefined;
  }
  if (c !== -1 && (a === -1 || c === a || c === b)) return c;
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

/** Ends the hand: the points go to `team` (none to anyone when null), and also to the pairs in `also` (with three pairs,
 *  running from a hand of eleven gives a point to each of the others), and 12 points end the game. */
function endHand(g: Game, team: Team | null, points: number, why: string, also: Team[] = []): Game {
  const score = [...g.score];
  [...(team === null ? [] : [team]), ...also].forEach(t => { score[t] = Math.min(WIN_POINTS, score[t] + points); });
  const rec: HandRecord = { team, points: team === null ? 0 : points, how: why, value: g.value };
  const over = score.some(x => x >= WIN_POINTS);
  const winner: Team | null = over ? (score.findIndex(x => x >= WIN_POINTS) as Team) : null;
  const three = teamsOf(g) === 3, gain = [team, ...also].filter((t): t is Team => t !== null);
  const log = [...g.log, team === null ? `${why} Ninguém marca.` : three ? `${why} ${gain.map(t => pairSay(g, t)).join('; ')} +${points}.` : `${why} ${team === 0 ? 'Nós' : 'Eles'} +${points}.`];
  if (over) log.push(three ? `Fim de jogo: ${pairSay(g, winner as Team)} venceram!` : winner === 0 ? 'Fim de jogo: nós vencemos!' : 'Fim de jogo: eles venceram.');
  return { ...g, score, ask: null, phase: (over ? 'over' : 'handEnd') as Phase, result: { team, points: rec.points, why }, winner, hist: [...g.hist, rec], log };
}

/* ---------- moves ---------- */
/** Plays card `k` of `seat`'s hand, if it is that seat's turn. The fourth card closes the round, and maybe the hand. */
export function playCard(g: Game, seat: Seat, k: number): Game {
  if (g.phase !== 'play' || g.turn !== seat || !Number.isInteger(k) || k < 0 || k >= g.hands[seat].length) return g;
  const card = g.hands[seat][k];
  const hands = g.hands.map((h, i) => (i === seat ? h.filter((_, j) => j !== k) : h));
  const table = [...g.table, { seat, card }];
  const next: Game = { ...g, hands, table, played: [...g.played, card], shout: null };
  if (table.length < inPlay(g)) return { ...next, turn: after(g, seat) };
  const w = roundWinner(table, g.vira, teamsOf(g)), result: RoundResult = w === -1 ? -1 : tm(g, w);
  const rounds = [...g.rounds, result], n = rounds.length;
  const log = [...g.log, ...table.map(p => `${say(g, p.seat)} jogou ${cardSay(p.card, g.vira)}.`), roundSay(g, table, w, n)];
  const done: Game = { ...next, rounds, table: [], last: { plays: table, winner: w }, log };
  const hw = handWinner(rounds);
  if (hw !== undefined) return endHand(done, hw, g.value, handSay(g, hw));
  const starter = w === -1 ? from(g, g.starter) : w;
  return { ...done, starter, turn: starter };
}
/** Who took the hand, in words. */
const handSay = (g: Game, hw: Team | null): string => (hw === null ? 'As três rodadas empataram.' : teamsOf(g) === 3 ? `${pairSay(g, hw)} levaram a mão.` : `${hw === 0 ? 'Nós levamos' : 'Eles levaram'} a mão.`);

/** Whether `seat` may raise the stakes now: on their turn, before playing, if the hand is not at 12 yet, if the last
 *  accepted raise was not their pair's, and if nobody has 11 points (a hand of eleven or of iron has no truco). */
export function canRaise(g: Game, seat: Seat): boolean {
  return g.phase === 'play' && g.turn === seat && g.value < WIN_POINTS && g.raisedBy !== tm(g, seat) && g.score.every(x => x < ELEVEN);
}
/** A raise by `seat`: with three pairs, it says which pairs have to answer, in the order they play after `seat`. */
function askOf(g: Game, seat: Seat, value: number, bluff = false): Ask {
  const base: Ask = bluff ? { by: seat, value, bluff: true } : { by: seat, value };
  if (teamsOf(g) === 2) return base;
  const wait: Team[] = [];
  for (let s = after(g, seat); s !== seat; s = after(g, s)) if (tm(g, s) !== tm(g, seat) && !wait.includes(tm(g, s))) wait.push(tm(g, s));
  return { ...base, wait };
}
/** Truco (or seis, nove, doze): the other pair has to answer. */
export function raise(g: Game, seat: Seat, bluff = false): Game {
  if (!canRaise(g, seat)) return g;
  const value = nextValue(g.value), word = WORD[value];
  return { ...g, phase: 'truco', ask: askOf(g, seat, value, bluff), shout: { seat, word }, log: [...g.log, `${say(g, seat)} pediu ${word}!`] };
}
export type Answer = 'accept' | 'run' | 'raise';
/** The answer to a raise. Accepting makes the hand worth what was asked; running gives the asking pair what the hand
 *  was worth before; raising accepts and asks for the next value, and then the first pair answers. */
export function answer(g: Game, a: Answer): Game {
  if (g.phase !== 'truco' || !g.ask) return g;
  if (teamsOf(g) === 3) return answer3(g, a);
  const ask = g.ask, seat = responder(g, ask);
  if (a === 'accept') return { ...g, phase: 'play', value: ask.value, raisedBy: teamOf(ask.by), ask: null, shout: { seat, word: 'aceito' }, log: [...g.log, `${say(g, seat)} aceitou. Vale ${ask.value}.`] };
  if (a === 'run') {
    const end = endHand(g, teamOf(ask.by), g.value, `${say(g, seat)} correu do ${WORD[ask.value]}.`);
    const shown = { seat: ask.by, cards: g.hands[ask.by], bluff: !!ask.bluff };
    return { ...end, shout: { seat, word: 'corro' }, result: { ...(end.result as NonNullable<Game['result']>), shown }, log: shown.bluff ? [...end.log, `${say(g, ask.by)} estava blefando!`] : end.log };
  }
  if (a === 'raise' && ask.value < WIN_POINTS) {
    const value = nextValue(ask.value), word = WORD[value];
    return { ...g, value: ask.value, raisedBy: teamOf(ask.by), ask: { by: seat, value }, shout: { seat, word }, log: [...g.log, `${say(g, seat)} aceitou e pediu ${word}!`] };
  }
  return g;
}
/** The answer to a raise with three pairs. Each of the other pairs answers in turn: accepting waits for the next one;
 *  running takes the pair out of the hand (its cards leave the game, and the rounds it took count as tied); raising
 *  accepts and asks for the next value, which the pairs still in the hand answer. If everyone ran, the asking pair takes
 *  what the hand was worth before; if one ran and the other accepted, the hand goes on between the two at the new value. */
function answer3(g: Game, a: Answer): Game {
  const ask = g.ask as Ask, seat = responder(g, ask), mine = tm(g, seat), asker = tm(g, ask.by), rest = waiting(g, ask).slice(1);
  if (a === 'raise' && ask.value < WIN_POINTS) {
    const value = nextValue(ask.value), word = WORD[value];
    const back = { ...g, value: ask.value, raisedBy: asker };
    return { ...back, ask: askOf(back, seat, value), shout: { seat, word }, log: [...g.log, `${say(g, seat)} aceitou e pediu ${word}!`] };
  }
  if (a === 'accept') {
    const said: Game = { ...g, shout: { seat, word: 'aceito' }, log: [...g.log, `${say(g, seat)} aceitou.`] };
    return rest.length ? { ...said, ask: { ...ask, wait: rest } } : goOn(said, ask);
  }
  if (a !== 'run') return g;
  const out = [...(g.out || []), mine];
  const gone: Game = {
    ...g, out, hands: g.hands.map((h, i) => (tm(g, i) === mine ? [] : h)), table: g.table.filter(p => tm(g, p.seat) !== mine),
    rounds: g.rounds.map(r => (r === mine ? -1 : r)), shout: { seat, word: 'corro' },
    log: [...g.log, `${say(g, seat)} correu do ${WORD[ask.value]}: ${pairSay(g, mine)} saem da mão.`]
  };
  const left = Array.from({ length: teamsOf(g) }, (_, t) => t as Team).filter(t => t !== asker && !out.includes(t));
  if (!left.length) {
    const end = endHand(gone, asker, g.value, `Todo mundo correu do ${WORD[ask.value]}.`);
    const shown = { seat: ask.by, cards: g.hands[ask.by], bluff: !!ask.bluff };
    return { ...end, result: { ...(end.result as NonNullable<Game['result']>), shown }, log: shown.bluff ? [...end.log, `${say(g, ask.by)} estava blefando!`] : end.log };
  }
  return rest.length ? { ...gone, ask: { ...ask, wait: rest } } : goOn(gone, ask);
}
/** Everyone left in the hand answered and someone accepted: it is worth what was asked, and play goes on (or the hand
 *  is decided already, when a pair that ran had taken a round). */
function goOn(g: Game, ask: Ask): Game {
  const on: Game = { ...g, phase: 'play', value: ask.value, raisedBy: tm(g, ask.by), ask: null, turn: from(g, g.turn), starter: from(g, g.starter), log: [...g.log, `Vale ${ask.value}.`] };
  const hw = handWinner(on.rounds);
  return hw === undefined ? on : endHand(on, hw, on.value, handSay(on, hw));
}
/** A hand of eleven: the pair with 11 plays it (worth 3) or runs (the others get 1: with three pairs, each of them). */
export function decideEleven(g: Game, play: boolean): Game {
  if (g.phase !== 'eleven' || g.eleven === null) return g;
  const t = g.eleven, seat = whoActs(g) as Seat;
  if (teamsOf(g) === 3) {
    if (!play) {
      const others = [0, 1, 2].filter(x => x !== t) as Team[];
      return { ...endHand({ ...g, value: 1 }, others[0], 1, `${pairSay(g, t)} correram da mão de onze.`, others.slice(1)), shout: { seat, word: 'fujo' } };
    }
    return { ...g, phase: 'play', value: ELEVEN_VALUE, shout: { seat, word: 'jogo' }, log: [...g.log, `${pairSay(g, t)} jogam a mão de onze: vale ${ELEVEN_VALUE}.`] };
  }
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
  const t = tm(g, seat);
  let s = strength(g.hands[seat], g.vira) + standing(g, t);
  if (g.level === 'dificil') {
    s += g.hands[seat].filter(c => sure(g, seat, c)).length * 1.5;
    const w = g.table.length ? roundWinner(g.table, g.vira, teamsOf(g)) : -1;
    if (w !== -1 && tm(g, w) === t && sure(g, seat, (g.table.find(p => p.seat === w) as Play).card)) s += 2.5;
  }
  return s;
}
/** Whether `seat` surely takes the hand by playing now: last to play, the round already its pair's or a card that beats
 *  the table, and taking this round decides the hand. */
function sureThing(g: Game, seat: Seat): boolean {
  if (g.table.length !== inPlay(g) - 1) return false;
  const t = tm(g, seat), best = Math.max(...g.table.map(p => power(p.card, g.vira)));
  const top = roundWinner(g.table, g.vira, teamsOf(g)), partnerTop = top !== -1 && tm(g, top) === t;
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
  const w = roundWinner(g.table, g.vira, teamsOf(g)), best = Math.max(...g.table.map(p => power(p.card, g.vira)));
  const beat = order.find(k => pw(k) > best);
  if (w !== -1 && tm(g, w) === tm(g, seat)) {
    // the partner has it: throw the weakest; the hard player covers when an opponent still plays and could beat it
    const top = (g.table.find(p => p.seat === w) as Play).card;
    if (hard && g.table.length < inPlay(g) - 1 && !sure(g, seat, top) && beat !== undefined) return beat;
    return low;
  }
  return beat === undefined ? low : beat;                            // the cheapest card that takes it, or the weakest
}
/** Whether a computer player raises before playing: 'no', 'yes' with a hand that deserves it, or 'bluff'. */
export function aiRaise(g: Game, seat: Seat, rand: () => number): 'no' | 'yes' | 'bluff' {
  if (!canRaise(g, seat)) return 'no';
  if (sureThing(g, seat)) return 'yes';
  const need = { 3: 6.5, 6: 8, 9: 9.5, 12: 11 }[nextValue(g.value)] as number + (g.level === 'facil' ? 1.5 : 0);
  if (judge(g, seat) >= need) return 'yes';
  // the hard player raises once a round is in the pocket and it holds a card nobody can beat
  if (g.level === 'dificil' && standing(g, tm(g, seat)) > 0 && g.hands[seat].some(c => sure(g, seat, c))) return 'yes';
  // a bluff: the hard player bluffs more, and mostly where it works (a round already taken, or last in the hand)
  const odds = g.level === 'facil' ? 0.03 : g.level === 'medio' ? 0.08 : standing(g, tm(g, seat)) > 0 || g.rounds.length === 2 ? 0.2 : 0.03;
  return rand() < odds ? 'bluff' : 'no';
}
/** How a computer player answers a raise. With `rand`, it now and then accepts a raise it would have run from: the
 *  easy one often, the hard one when it suspects a bluff. */
export function aiAnswer(g: Game, seat: Seat, rand?: () => number): Answer {
  if (!g.ask) return 'accept';
  const need = { 3: 4, 6: 5.5, 9: 7, 12: 8.5 }[g.ask.value] as number + (g.level === 'facil' ? 1 : 0);
  const score = judge(g, seat);
  if (score >= need + 3.5 && g.ask.value < WIN_POINTS && g.level !== 'facil') return 'raise';
  if (score >= need) return 'accept';
  // the hard player calls a raise when the one who asked has shown weak cards in this hand
  if (g.level === 'dificil' && rand && score >= need - 2 && rand() < 0.35) return 'accept';
  return rand && rand() < (g.level === 'facil' ? 0.2 : 0.1) ? 'accept' : 'run';
}
/** Whether the computer pair plays a hand of eleven: both hands together, strong enough. */
export const aiEleven = (g: Game, t: Team): boolean => strength([...g.hands[t], ...g.hands[partnerOf(g, t)]], g.vira) >= (g.level === 'facil' ? 6 : 7.5);
/** The move of the computer player who has to act now; the same game when it is the person's move, or nobody's. */
export function aiAct(g: Game, rand: () => number): Game {
  const s = whoActs(g);
  if (s === null || isHuman(g, s)) return g;
  if (g.phase === 'eleven') return decideEleven(g, aiEleven(g, g.eleven as Team));
  if (g.phase === 'truco') return answer(g, aiAnswer(g, s, rand));
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
