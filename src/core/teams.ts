/* The catalogue of themes: who the computer players are and which colours the app takes. A theme is a pack (the Série A,
   Blue Lock, Street Fighter…) of a kind (futebol, anime, jogos…); a pack has groups of three characters, the first
   being the star. The data live in src/core/packs/, one file per pack, registered in src/core/packs/index.ts: nothing
   here or on the screen names a pack or a kind, so a new theme is a new file there and nothing else.
   Ids are qualified: a pack is `futebol`, a group `futebol/flamengo`, a character `futebol/flamengo/0` (by place).
   Colours are [main, second, text on the main]; a character without colours takes its group's, a group without them
   takes its pack's. Nothing but names and colours: no crest, logo, image or drawing. */
import { PACKS } from './packs';

export type Colors = [string, string, string];
/** Which side of the story a character is on, where the story has sides (none in football). */
export type Side = 'heroi' | 'vilao';
export type Character = string | { name: string; colors?: Colors; side?: Side };
export interface Group { id: string; name: string; colors?: Colors; side?: Side; players: [Character, Character, Character] }
export interface Pack {
  id: string; kind: string; kindName: string; name: string;
  /** What the first of a group is called: "craque", "líder". */
  lead: string;
  colors: Colors;
  /** A line shown under the pack (where the names came from, when they were checked). */
  note?: string;
  groups: Group[];
}
/** A group as the app uses it: qualified id, the colours it ends up with, the three names. */
export interface Team { id: string; name: string; colors: Colors; players: [string, string, string]; pack: Pack }
/** The table the person put together seat by seat: the partner and the two opponents, characters of any pack. */
export interface Seats { partner: string; opp: [string, string] }
/** Which colours the app takes: the pack's, the team's, or the partner's own. */
export type ColorBy = 'pack' | 'team' | 'char';
export const COLOR_BY: ColorBy[] = ['pack', 'team', 'char'];

export { PACKS };
export { TEAMS_CHECKED } from './packs';
const nameOf = (c: Character): string => (typeof c === 'string' ? c : c.name);
const ownColors = (c: Character): Colors | undefined => (typeof c === 'string' ? undefined : c.colors);

/** Every group of every pack, in the order of the packs. */
export const TEAMS: Team[] = PACKS.flatMap(p => p.groups.map(g => ({ id: `${p.id}/${g.id}`, name: g.name, colors: g.colors || p.colors, players: g.players.map(nameOf) as [string, string, string], pack: p })));
/** The kinds, in the order their first pack was registered, each with its packs: the tabs of the screen. */
export function kinds(): { id: string; name: string; packs: Pack[] }[] {
  const out: { id: string; name: string; packs: Pack[] }[] = [];
  for (const p of PACKS) {
    const k = out.find(x => x.id === p.kind);
    if (k) k.packs.push(p); else out.push({ id: p.kind, name: p.kindName, packs: [p] });
  }
  return out;
}
export const packById = (id: string | undefined | null): Pack | null => PACKS.find(p => p.id === id) || null;
export const teamById = (id: string | undefined | null): Team | null => TEAMS.find(t => t.id === id) || null;
export const teamsOf = (pack: Pack): Team[] => TEAMS.filter(t => t.pack === pack);
/** A character by id: its team, its place in it, its name and its own colours (if any). */
export function charById(id: string | undefined | null): { id: string; team: Team; i: number; name: string; colors?: Colors; side?: Side } | null {
  const m = typeof id === 'string' ? id.match(/^(.+)\/([012])$/) : null;
  const t = m ? teamById(m[1]) : null;
  if (!m || !t) return null;
  const i = Number(m[2]), g = t.pack.groups.find(x => `${t.pack.id}/${x.id}` === t.id) as Group, c = g.players[i];
  const side = (typeof c === 'string' ? undefined : c.side) || g.side;
  return { id: id as string, team: t, i, name: nameOf(c), ...(ownColors(c) ? { colors: ownColors(c) } : {}), ...(side ? { side } : {}) };
}
/** An id saved before themes existed was a bare club id: it is the football pack's. A known id stays as it is; anything
 *  else is null. Works for groups and characters. */
export function qualify(id: unknown): string | null {
  if (typeof id !== 'string' || !id) return null;
  if (teamById(id) || charById(id) || packById(id)) return id;
  const old = `futebol/${id}`;
  return teamById(old) ? old : null;
}
/** The colours of a pack, a team or a character id (a character without its own takes its team's). */
export function colorsOf(id: string | null | undefined): Colors | null {
  const c = charById(id);
  if (c) return c.colors || c.team.colors;
  return teamById(id)?.colors || packById(id)?.colors || null;
}
/** Contrast ratio between two #rrggbb colours (WCAG). */
export function contrast(a: string, b: string): number {
  const lum = (h: string): number => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** The second colour when it reads on the main one, else the text colour: for words drawn in the second colour. */
export const accentOn = (c: Colors): string => (contrast(c[1], c[0]) >= 3 ? c[1] : c[2]);

/** The default table, with no theme chosen. */
export const DEFAULT_NAMES = ['Você', 'Biu', 'Cida', 'Toinho'];
/** The players of a group as the person sees them: the group's, with the names the person changed. */
export function playersOf(id: string, custom?: Record<string, string[]>): [string, string, string] {
  const t = teamById(id), own = custom && custom[id];
  const base = t ? t.players : (['', '', ''] as [string, string, string]);
  return [0, 1, 2].map(i => ((own && typeof own[i] === 'string' && own[i].trim()) ? own[i].trim().slice(0, 24) : base[i])) as [string, string, string];
}
/** A character's name as the person sees it (renamed in its group, if they did). */
export function charName(id: string, custom?: Record<string, string[]>): string {
  const c = charById(id);
  return c ? playersOf(c.team.id, custom)[c.i] : '';
}
/** The colour key of a character under a choice of colours: itself, its team, or its pack. */
function keyOf(char: string, by: ColorBy): string {
  const c = charById(char) as NonNullable<ReturnType<typeof charById>>;
  return by === 'char' ? c.id : by === 'pack' ? c.team.pack.id : c.team.id;
}
/** Two characters that are the same person: same name (Nagi plays for Time V and for Manshine City). */
export const samePerson = (a: string, b: string): boolean => a === b || (charById(a)?.name ?? a) === (charById(b)?.name ?? b);
/** A table seat by seat that holds together: three known characters, three different people. */
export function readSeats(x: unknown): Seats | null {
  const s = x as Seats;
  if (!s || typeof s !== 'object' || !Array.isArray(s.opp) || s.opp.length !== 2) return null;
  const all = [s.partner, ...s.opp];
  if (!all.every(c => !!charById(c)) || new Set(all.map(c => (charById(c) as { name: string }).name)).size !== 3) return null;
  return { partner: s.partner, opp: [s.opp[0], s.opp[1]] };
}
const allChars = (packs: Pack[] = PACKS): string[] => TEAMS.filter(t => packs.includes(t.pack)).flatMap(t => [0, 1, 2].map(i => `${t.id}/${i}`));
/** Pick from each pool in turn, never the same person twice. */
function drawFrom(rand: () => number, pools: string[][]): string[] {
  const pick: string[] = [];
  for (const pool of pools) {
    const free = pool.filter(c => !pick.some(p => samePerson(p, c)));
    pick.push(free[Math.floor(rand() * free.length) % free.length]);
  }
  return pick;
}
/** Three different people of any pack, drawn with the given random function (0 ≤ rand() < 1). */
export function drawSeats(rand: () => number): Seats {
  const all = allChars(), [a, b, c] = drawFrom(rand, [all, all, all]);
  return { partner: a, opp: [b, c] };
}
/** The side of a character, its own or its group's; null where the story has no sides. */
export const sideOf = (id: string): Side | null => charById(id)?.side || null;
/** The packs where heroes play villains: at least two of each side, so a table of either side can be drawn. */
export const sidedPacks = (): Pack[] => PACKS.filter(p => (['heroi', 'vilao'] as Side[]).every(sd => allChars([p]).filter(c => sideOf(c) === sd).length >= 2));
/** Heroes against villains: the partner on the person's side, the two opponents from the other, in one pack (its id) or
 *  mixed across every pack that has sides (null); never the same person twice. */
export function drawSided(rand: () => number, pack: string | null, mine: Side = 'heroi'): Seats {
  const packs = pack ? sidedPacks().filter(p => p.id === pack) : sidedPacks(), pool = allChars(packs.length ? packs : sidedPacks());
  const ours = pool.filter(c => sideOf(c) === mine), theirs = pool.filter(c => sideOf(c) && sideOf(c) !== mine);
  const [a, b, c] = drawFrom(rand, [ours, theirs, theirs]);
  return { partner: a, opp: [b, c] };
}
/** Who sits where: the names of the four seats, and the colour key of each pair (null: the app's own).
 *  - a table seat by seat: the partner and the two opponents chosen;
 *  - a team and no rival: the star is the partner, the other two the opponents;
 *  - a team and a rival: the star is the partner, the rival's first two the opponents;
 *  - nothing: the bar table.
 *  The colours follow `by`: the partner's (or the team's star) own, their team's, or their pack's; the other pair takes
 *  the first opponent's the same way, except a team playing itself, which leaves "Eles" in the app's colours. */
export function lineup(team?: string | null, rival?: string | null, custom?: Record<string, string[]>, seats?: Seats | null, by: ColorBy = 'team'): { names: string[]; sides: [string | null, string | null] } {
  const s = readSeats(seats);
  if (s) return { names: ['Você', charName(s.opp[0], custom), charName(s.partner, custom), charName(s.opp[1], custom)], sides: [keyOf(s.partner, by), keyOf(s.opp[0], by)] };
  const t = teamById(team);
  if (!t) return { names: [...DEFAULT_NAMES], sides: [null, null] };
  const mine = playersOf(t.id, custom), r = teamById(rival);
  if (!r || r.id === t.id) return { names: ['Você', mine[1], mine[0], mine[2]], sides: [keyOf(`${t.id}/0`, by), null] };
  const theirs = playersOf(r.id, custom);
  return { names: ['Você', theirs[0], mine[0], theirs[1]], sides: [keyOf(`${t.id}/0`, by), keyOf(`${r.id}/0`, by)] };
}
