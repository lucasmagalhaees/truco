/* The record of each match-up, team against team (D17): wins and losses kept on the device, under a key that does not
   depend on which side the person played. Pure: the page keeps it in S.h2h. */
import { qualify } from './teams';

/** How many match-ups are kept: the most recent ones; the oldest is dropped when one more comes in. */
export const H2H_MAX = 200;
/** One match-up: `w` games won by the first team of the key, `l` games won by the second. */
export interface H2hRow { w: number; l: number }
export type H2h = Record<string, H2hRow>;

/** A team id as saved (`pack/group`; an old bare club id moves to the football pack), or null. */
const group = (x: unknown): string | null => { const q = qualify(x); return q && q.split('/').length === 2 ? q : null; };
/** The key of a match-up: the two team ids, sorted, so A against B and B against A are the same. Null if either is not
 *  a team, or both are the same one. */
export function h2hKey(a: unknown, b: unknown): string | null {
  const x = group(a), y = group(b);
  if (!x || !y || x === y) return null;
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}
/** The record seen from `mine`: games won and lost by it against `theirs` (0 and 0 if they never met). */
export function h2hOf(rec: H2h | undefined, mine: unknown, theirs: unknown): H2hRow {
  const k = h2hKey(mine, theirs), row = k && rec ? rec[k] : undefined;
  if (!k || !row) return { w: 0, l: 0 };
  return k.startsWith(`${group(mine)}|`) ? { w: row.w, l: row.l } : { w: row.l, l: row.w };
}
/** One more game of `mine` against `theirs`: a new record, with this match-up moved to the most recent and only the
 *  H2H_MAX most recent kept. A pair that is not a match-up leaves the record as it was. */
export function h2hAdd(rec: H2h | undefined, mine: unknown, theirs: unknown, won: boolean): H2h {
  const k = h2hKey(mine, theirs), base = { ...(rec || {}) };
  if (!k) return base;
  const now = h2hOf(base, mine, theirs), mineFirst = k.startsWith(`${group(mine)}|`);
  const w = now.w + (won ? 1 : 0), l = now.l + (won ? 0 : 1);
  delete base[k];                                   // re-inserted last: object keys keep insertion order
  base[k] = mineFirst ? { w, l } : { w: l, l: w };
  const keys = Object.keys(base);
  for (const old of keys.slice(0, Math.max(0, keys.length - H2H_MAX))) delete base[old];
  return base;
}
/** A saved record: only well-formed keys of two known teams (sorted, different) with whole counts; at most the H2H_MAX
 *  most recent. Anything else is dropped; nothing left reads as no record. */
export function readH2h(x: unknown): { h2h?: H2h } {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return {};
  const out: H2h = {}, n = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 1e6;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    const [a, b, extra] = k.split('|'), row = v as { w?: unknown; l?: unknown } | null;
    if (extra === undefined && h2hKey(a, b) === k && row && typeof row === 'object' && n(row.w) && n(row.l) && row.w + row.l > 0) out[k] = { w: row.w, l: row.l };
  }
  const keys = Object.keys(out);
  for (const old of keys.slice(0, Math.max(0, keys.length - H2H_MAX))) delete out[old];
  return keys.length ? { h2h: out } : {};
}
