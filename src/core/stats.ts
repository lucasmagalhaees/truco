/* Records kept on the device beyond the single game in course (D22): the head-to-head of each matchup (your team
   against another), and the game statistics (wins and losses by level, bluffs paid and raises run from, the best
   winning streak). Pure: it only reshapes plain data, so the page and the tests share it. Everything is from the
   person's side (seat 0), the only human on a phone; online games are not counted here. */
import { LEVELS } from './game';
import type { H2H, Level, Stats, WL } from './types';

/** How many matchups are kept: the most recent ones, oldest dropped. */
export const H2H_MAX = 50;

/** The key of a matchup: the two team ids, ordered, so A-against-B and B-against-A are the same record. */
export function h2hKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }

/** The record of a matchup, from the person's side (w won, l lost), or null if they have not met yet. */
export function h2hOf(h2h: H2H | undefined, a: string, b: string): WL | null {
  return (h2h && h2h[h2hKey(a, b)]) || null;
}

/** The head-to-head after one more game, the person having won or lost. The matchup moves to the most recent, and only
 *  the last H2H_MAX are kept (an object keeps its keys in insertion order, so the oldest are the first ones). */
export function bumpH2h(h2h: H2H | undefined, a: string, b: string, youWon: boolean): H2H {
  const key = h2hKey(a, b), prev = (h2h && h2h[key]) || { w: 0, l: 0 };
  const next: H2H = {};
  for (const [k, v] of Object.entries(h2h || {})) if (k !== key) next[k] = v;     // drop it, so it re-enters at the end
  next[key] = { w: prev.w + (youWon ? 1 : 0), l: prev.l + (youWon ? 0 : 1) };
  const keys = Object.keys(next);
  for (const k of keys.slice(0, Math.max(0, keys.length - H2H_MAX))) delete next[k];
  return next;
}

/** Empty statistics. */
export const emptyStats = (): Stats => ({ level: {}, paid: 0, ran: 0, streak: 0, best: 0 });

/** The statistics after one more finished game at a level, won or lost: the level's record, and the winning streak,
 *  which grows on a win and resets to zero on a loss (best keeps the longest ever). */
export function afterGame(s: Stats, level: Level, youWon: boolean): Stats {
  const cur = s.level[level] || { w: 0, l: 0 }, streak = youWon ? s.streak + 1 : 0;
  return {
    ...s,
    level: { ...s.level, [level]: { w: cur.w + (youWon ? 1 : 0), l: cur.l + (youWon ? 0 : 1) } },
    streak, best: Math.max(s.best, streak)
  };
}

/** The sum of a level map, for a total line. */
export function statsTotal(s: Stats): WL {
  return LEVELS.reduce<WL>((a, l) => { const r = s.level[l]; return r ? { w: a.w + r.w, l: a.l + r.l } : a; }, { w: 0, l: 0 });
}
