/* What was saved on the device, read back. A saved game that does not hold together is dropped, so a damaged state
   never breaks the page: the tally, the level and the settings still come back. */
import { LEVELS, VALUES, WIN_POINTS } from './game';
import { teamById } from './teams';
import type { AppState, Game, Level, Phase, RealTable, Speed } from './types';

const PHASES: Phase[] = ['eleven', 'play', 'truco', 'handEnd', 'over'];
const SPEEDS: Speed[] = ['calma', 'normal', 'rapida'];
const isCard = (x: unknown): x is string => typeof x === 'string' && /^[4567QJKA23][oecp]$/.test(x);
const isCards = (x: unknown, max: number): x is string[] => Array.isArray(x) && x.length <= max && x.every(isCard);
const isSeat = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 3;
const isTeam = (x: unknown): x is 0 | 1 => x === 0 || x === 1;
const isPts = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= WIN_POINTS;
const isPlays = (x: unknown): boolean => Array.isArray(x) && x.length <= 4 && x.every(p => p && typeof p === 'object' && isSeat(p.seat) && isCard(p.card));

/** A saved game, or null if it does not hold together. */
export function readGame(x: unknown): Game | null {
  const g = x as Game;
  if (!g || typeof g !== 'object' || !Array.isArray(g.names) || g.names.length !== 4 || !g.names.every(x => typeof x === 'string' && x.length <= 24)) return null;
  if (!Array.isArray(g.sides) || g.sides.length !== 2 || !g.sides.every(x => x === null || !!teamById(x))) return null;
  if (!LEVELS.includes(g.level) || typeof g.blind !== 'boolean' || !isCards(g.played, 12)) return null;
  if (!Array.isArray(g.score) || g.score.length !== 2 || !g.score.every(isPts) || !isSeat(g.dealer) || !Number.isInteger(g.n) || g.n < 1) return null;
  if (!Array.isArray(g.hands) || g.hands.length !== 4 || !g.hands.every(h => isCards(h, 3)) || !isCard(g.vira)) return null;
  if (!isPlays(g.table) || !(g.last === null || (g.last && isPlays(g.last.plays) && (g.last.winner === -1 || isSeat(g.last.winner))))) return null;
  if (!Array.isArray(g.rounds) || g.rounds.length > 3 || !g.rounds.every(r => r === -1 || isTeam(r)) || !isSeat(g.starter) || !isSeat(g.turn)) return null;
  if (!VALUES.includes(g.value) || !(g.raisedBy === null || isTeam(g.raisedBy)) || !(g.eleven === null || isTeam(g.eleven)) || !PHASES.includes(g.phase)) return null;
  if (!(g.ask === null || (g.ask && isSeat(g.ask.by) && VALUES.includes(g.ask.value)))) return null;
  if (g.phase === 'truco' && !g.ask) return null;
  if (g.phase === 'eleven' && g.eleven === null) return null;
  if (!(g.shout === null || (g.shout && isSeat(g.shout.seat) && typeof g.shout.word === 'string'))) return null;
  if (!(g.result === null || (g.result && typeof g.result.why === 'string' && Number.isInteger(g.result.points)))) return null;
  if (!(g.winner === null || isTeam(g.winner)) || !Array.isArray(g.hist) || !Array.isArray(g.log) || !g.log.every(l => typeof l === 'string')) return null;
  return g;
}

/** A saved real table; what does not hold together reads as an empty one. */
export function readReal(x: unknown): RealTable {
  const t = x as RealTable, empty: RealTable = { vira: null, hand: [], table: [], gone: [], target: 'vira' };
  if (!t || typeof t !== 'object' || !(t.vira === null || isCard(t.vira)) || !isCards(t.hand, 3) || !isCards(t.table, 4) || !isCards(t.gone, 40) || !['vira', 'hand', 'table'].includes(t.target)) return empty;
  return { vira: t.vira, hand: t.hand, table: t.table, gone: t.gone, target: t.target };
}

/** The player names the person changed, by club: only known clubs, three short names each. */
function readCustom(x: unknown): { custom?: Record<string, string[]> } {
  if (!x || typeof x !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (teamById(k) && Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'string' && n.length <= 24)) out[k] = v as string[];
  }
  return Object.keys(out).length ? { custom: out } : {};
}

/** Everything saved, as it was read from the device. */
export function readState(x: unknown): AppState {
  const o = (x && typeof x === 'object' ? x : {}) as { team?: unknown; rival?: unknown; custom?: unknown; real?: unknown; game?: unknown; tally?: { w?: unknown; l?: unknown }; level?: unknown; theme?: unknown; speed?: unknown; quiet?: unknown; hints?: unknown; train?: unknown };
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
    ...(typeof o.team === 'string' && teamById(o.team) ? { team: o.team } : {}),
    ...(typeof o.rival === 'string' && teamById(o.rival) && o.rival !== o.team ? { rival: o.rival } : {}),
    ...readCustom(o.custom)
  };
}
