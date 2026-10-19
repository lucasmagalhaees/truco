/* What was saved on the device, read back. A saved game that does not hold together is dropped, so a damaged state
   never breaks the page: the tally, the level and the settings still come back. */
import { LEVELS, VALUES, WIN_POINTS } from './game';
import { colorsOf, qualify, readSeats, sidedPacks } from './teams';
import type { AppState, Game, Level, Phase, RealTable, Speed } from './types';

const PHASES: Phase[] = ['eleven', 'play', 'truco', 'handEnd', 'over'];
const SPEEDS: Speed[] = ['calma', 'normal', 'rapida'];
const isCard = (x: unknown): x is string => typeof x === 'string' && /^[4567QJKA23][oecp]$/.test(x);
const isCards = (x: unknown, max: number): x is string[] => Array.isArray(x) && x.length <= max && x.every(isCard);
const isPts = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= WIN_POINTS;

/** A saved game, or null if it does not hold together. A game of four, or one of three pairs (`teams: 3`, six seats). */
export function readGame(x: unknown): Game | null {
  const g = x as Game;
  if (!g || typeof g !== 'object' || !(g.teams === undefined || g.teams === 3)) return null;
  const T = g.teams === 3 ? 3 : 2, N = T * 2;
  const isSeat = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < N;
  const isTeam = (x: unknown): x is 0 | 1 | 2 => Number.isInteger(x) && (x as number) >= 0 && (x as number) < T;
  const isPlays = (x: unknown): boolean => Array.isArray(x) && x.length <= N && x.every(p => p && typeof p === 'object' && isSeat(p.seat) && isCard(p.card));
  if (!Array.isArray(g.names) || g.names.length !== N || !g.names.every(x => typeof x === 'string' && x.length <= 24)) return null;
  if (!(g.out === undefined || (T === 3 && Array.isArray(g.out) && g.out.length < T && g.out.every(isTeam)))) return null;
  if (g.humans === undefined) g.humans = [0];                                   // saved before rooms existed
  if (!Array.isArray(g.humans) || !g.humans.length || g.humans.length > N || !g.humans.every(isSeat) || new Set(g.humans).size !== g.humans.length) return null;
  if (!Array.isArray(g.sides) || g.sides.length !== 2) return null;
  const sides = g.sides.map(x => (x === null ? null : qualify(x)));            // a bare club id was saved before themes
  if (!sides.every((x, i) => x !== null ? !!colorsOf(x) : g.sides[i] === null)) return null;
  g.sides = sides as [string | null, string | null];
  if (!LEVELS.includes(g.level) || typeof g.blind !== 'boolean' || !isCards(g.played, 3 * N)) return null;
  if (!Array.isArray(g.score) || g.score.length !== T || !g.score.every(isPts) || !isSeat(g.dealer) || !Number.isInteger(g.n) || g.n < 1) return null;
  if (!Array.isArray(g.hands) || g.hands.length !== N || !g.hands.every(h => isCards(h, 3)) || !isCard(g.vira)) return null;
  if (!isPlays(g.table) || !(g.last === null || (g.last && isPlays(g.last.plays) && (g.last.winner === -1 || isSeat(g.last.winner))))) return null;
  if (!Array.isArray(g.rounds) || g.rounds.length > 3 || !g.rounds.every(r => r === -1 || isTeam(r)) || !isSeat(g.starter) || !isSeat(g.turn)) return null;
  if (!VALUES.includes(g.value) || !(g.raisedBy === null || isTeam(g.raisedBy)) || !(g.eleven === null || isTeam(g.eleven)) || !PHASES.includes(g.phase)) return null;
  if (!(g.ask === null || (g.ask && isSeat(g.ask.by) && VALUES.includes(g.ask.value) && (g.ask.wait === undefined || (T === 3 && Array.isArray(g.ask.wait) && g.ask.wait.length && g.ask.wait.every(isTeam)))))) return null;
  if (g.phase === 'truco' && !g.ask) return null;
  if (g.phase === 'eleven' && g.eleven === null) return null;
  if (!(g.shout === null || (g.shout && isSeat(g.shout.seat) && typeof g.shout.word === 'string'))) return null;
  if (!(g.result === null || (g.result && typeof g.result.why === 'string' && Number.isInteger(g.result.points)))) return null;
  if (!(g.winner === null || isTeam(g.winner)) || !Array.isArray(g.hist) || !Array.isArray(g.log) || !g.log.every(l => typeof l === 'string')) return null;
  // what the table has seen of each seat: a game saved before it, or with it damaged, just starts unread
  const count = (x: unknown): boolean => Number.isInteger(x) && (x as number) >= 0;
  if (!(Array.isArray(g.reads) && g.reads.length === N && g.reads.every(r => r && count(r.shown) && count(r.weak) && r.weak <= r.shown && count(r.answers) && count(r.runs) && r.runs <= r.answers))) delete g.reads;
  if (!(Array.isArray(g.watch) && g.watch.length <= 8 && g.watch.every(w => w && isSeat(w.by) && count(w.held) && w.held <= 3 && typeof w.stand === 'number' && VALUES.includes(w.value) && isCards(w.seen, 3)))) delete g.watch;
  return g;
}

/** A saved real table; what does not hold together reads as an empty one. */
export function readReal(x: unknown): RealTable {
  const t = x as RealTable, empty: RealTable = { vira: null, hand: [], table: [], gone: [], target: 'vira' };
  if (!t || typeof t !== 'object' || !(t.vira === null || isCard(t.vira)) || !isCards(t.hand, 3) || !isCards(t.table, 4) || !isCards(t.gone, 40) || !['vira', 'hand', 'table'].includes(t.target)) return empty;
  return { vira: t.vira, hand: t.hand, table: t.table, gone: t.gone, target: t.target };
}

/** The names the person changed, by team: only known teams (old bare club ids move to the football pack), three short
 *  names each. */
function readCustom(x: unknown): { custom?: Record<string, string[]> } {
  if (!x || typeof x !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    const id = qualify(k);
    if (id && id.split('/').length === 2 && Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'string' && n.length <= 24)) out[id] = v as string[];
  }
  return Object.keys(out).length ? { custom: out } : {};
}

/** The team, the rival, the table seat by seat and the choice of colours. Ids saved before themes existed were bare
 *  club ids: they move to the football pack. A team or rival must be a group; a rival equal to the team is none. */
function readTeams(team: unknown, rival: unknown, seats: unknown, by: unknown, hv: unknown, auto: unknown): Pick<AppState, 'team' | 'rival' | 'rivalAuto' | 'seats' | 'colorBy' | 'hv'> {
  const group = (x: unknown): string | null => { const q = qualify(x); return q && q.split('/').length === 2 ? q : null; };
  const t = group(team), r = group(rival), s = readSeats(seats);
  const h = hv as { pack?: unknown; side?: unknown } | null;
  const hvOk = s && h && typeof h === 'object' ? { ...(sidedPacks().some(p => p.id === h.pack) ? { pack: h.pack as string } : {}), ...(h.side === 'vilao' ? { side: 'vilao' as const } : {}) } : null;
  return { ...(t ? { team: t } : {}), ...(r && r !== t ? { rival: r, ...(auto === true ? { rivalAuto: true as const } : {}) } : {}), ...(s ? { seats: s } : {}), ...(hvOk ? { hv: hvOk } : {}), ...(by === 'pack' || by === 'char' ? { colorBy: by } : {}) };
}

/** Everything saved, as it was read from the device. */
export function readState(x: unknown): AppState {
  const o = (x && typeof x === 'object' ? x : {}) as { myName?: unknown; online?: unknown; team?: unknown; rival?: unknown; rivalAuto?: unknown; seats?: unknown; colorBy?: unknown; hv?: unknown; custom?: unknown; real?: unknown; game?: unknown; tally?: { w?: unknown; l?: unknown }; level?: unknown; theme?: unknown; speed?: unknown; quiet?: unknown; hints?: unknown; auto?: unknown; train?: unknown };
  const n = (v: unknown): number => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0);
  const t = o.train as { ok?: unknown; total?: unknown; best?: unknown } | undefined;
  return {
    v: 1, game: readGame(o.game), tally: { w: n(o.tally?.w), l: n(o.tally?.l) },
    level: LEVELS.includes(o.level as Level) ? (o.level as Level) : 'medio',
    train: { ok: n(t?.ok), total: n(t?.total), best: n(t?.best) }, real: readReal(o.real),
    ...(o.theme === 'light' || o.theme === 'dark' ? { theme: o.theme } : {}),
    ...(SPEEDS.includes(o.speed as Speed) ? { speed: o.speed as Speed } : {}),
    ...(o.quiet === true ? { quiet: true as const } : {}),
    ...(o.hints === false ? { hints: false as const } : {}),
    ...(o.auto === false ? { auto: false as const } : {}),
    ...readTeams(o.team, o.rival, o.seats, o.colorBy, o.hv, o.rivalAuto),
    ...readCustom(o.custom),
    ...(typeof o.myName === 'string' && o.myName.trim() ? { myName: o.myName.trim().slice(0, 16) } : {}),
    ...(o.online && typeof o.online === 'object' && /^[A-Z0-9]{5}$/.test(String((o.online as { code?: unknown }).code)) && /^[A-Za-z0-9-]{8,64}$/.test(String((o.online as { token?: unknown }).token))
      ? { online: { code: String((o.online as { code: string }).code), token: String((o.online as { token: string }).token), ...((o.online as { played?: unknown }).played === true ? { played: true as const } : {}) } } : {})
  };
}
