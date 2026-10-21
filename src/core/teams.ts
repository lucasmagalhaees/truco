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
/** `rivals`: up to RIVALS_MAX direct rivals, qualified ids (`pack/group`), the first being the direct one; `why` the
 *  reason of each, in the same order, a few words ("o Fla-Flu"). */
export interface Group { id: string; name: string; colors?: Colors; side?: Side; players: [Character, Character, Character]; rivals?: string[]; why?: string[] }
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
export const packTeams = (pack: Pack): Team[] => TEAMS.filter(t => t.pack === pack);
/** A character by id: its team, its place in it, its name and its own colours (if any). */
export function charById(id: string | undefined | null): { id: string; team: Team; i: number; name: string; colors?: Colors } | null {
  const m = typeof id === 'string' ? id.match(/^(.+)\/([012])$/) : null;
  const t = m ? teamById(m[1]) : null;
  if (!m || !t) return null;
  const i = Number(m[2]), g = t.pack.groups.find(x => `${t.pack.id}/${x.id}` === t.id) as Group, c = g.players[i];
  return { id: id as string, team: t, i, name: nameOf(c), ...(ownColors(c) ? { colors: ownColors(c) } : {}) };
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
/** The colour key of a character under a choice of colours: itself, its team, or its pack. */
function keyOf(char: string, by: ColorBy): string {
  const c = charById(char) as NonNullable<ReturnType<typeof charById>>;
  return by === 'char' ? c.id : by === 'pack' ? c.team.pack.id : c.team.id;
}
/** Who sits where: the names of the four seats, and the colour key of each pair (null: the app's own).
 *  - a team and no rival: the star is the partner, the other two the opponents;
 *  - a team and a rival: the star is the partner, the rival's first two the opponents;
 *  - nothing: the bar table.
 *  The colours follow `by`: the partner's (or the team's star) own, their team's, or their pack's; the other pair takes
 *  the first opponent's the same way, except a team playing itself, which leaves "Eles" in the app's colours. */
export function lineup(team?: string | null, rival?: string | null, custom?: Record<string, string[]>, by: ColorBy = 'team'): { names: string[]; sides: [string | null, string | null] } {
  const t = teamById(team);
  if (!t) return { names: [...DEFAULT_NAMES], sides: [null, null] };
  const mine = playersOf(t.id, custom), r = teamById(rival);
  if (!r || r.id === t.id) return { names: ['Você', mine[1], mine[0], mine[2]], sides: [keyOf(`${t.id}/0`, by), null] };
  const theirs = playersOf(r.id, custom);
  return { names: ['Você', theirs[0], mine[0], theirs[1]], sides: [keyOf(`${t.id}/0`, by), keyOf(`${r.id}/0`, by)] };
}

/** How many rivals are suggested for a team, at most. */
export const RIVALS_MAX = 3;
/** A suggested rival: the team, why, and where the suggestion came from (the data, the other team's data, the side of
 *  the story, or only the same pack). */
export interface RivalPick { id: string; why: string; how: 'dados' | 'volta' | 'lado' | 'pack' }
/** The side most of a group's characters are on (their own, or the group's); null with no sides or a tie. */
function groupSide(g: Group): Side | null {
  const sides = g.players.map(c => (typeof c === 'string' ? undefined : c.side) || g.side);
  const h = sides.filter(x => x === 'heroi').length, v = sides.filter(x => x === 'vilao').length;
  return h > v ? 'heroi' : v > h ? 'vilao' : null;
}
/** The rivals suggested for a team (D16), 1 to RIVALS_MAX, always of its own pack (Naruto against Naruto: a team of
 *  another pack is chosen by hand only), never itself, never twice, always the same for the same data: (a) the ones its data declares, in order; (b) teams whose data declare it, with their reason; (c) in the same
 *  pack, teams on the other side of the story (heroes against villains, by the side most of each one's characters are
 *  on); (d) the other teams of the pack, in the pack's order from the one after it. Empty only for an unknown id or a
 *  pack with one team. `packs` is for the tests. */
export function suggestRivals(id: string | null | undefined, packs: Pack[] = PACKS): RivalPick[] {
  const all = packs.flatMap(p => p.groups.map(g => ({ p, g, id: `${p.id}/${g.id}` })));
  const me = all.find(x => x.id === id);
  if (!me) return [];
  const out: RivalPick[] = [];
  const add = (rid: string, why: string, how: RivalPick['how']): void => {
    if (out.length < RIVALS_MAX && rid !== me.id && rid.startsWith(`${me.p.id}/`) && !out.some(o => o.id === rid) && all.some(x => x.id === rid)) out.push({ id: rid, why, how });
  };
  (me.g.rivals || []).forEach((r, i) => add(r, (me.g.why || [])[i] || 'rival declarado', 'dados'));
  for (const x of all) { const i = (x.g.rivals || []).indexOf(me.id); if (i >= 0) add(x.id, (x.g.why || [])[i] || 'rival declarado', 'volta'); }
  const mine = me.p.groups, at = mine.indexOf(me.g), order = [...mine.slice(at + 1), ...mine.slice(0, at)];
  const side = groupSide(me.g);
  if (side) for (const g of order) { const s2 = groupSide(g); if (s2 && s2 !== side) add(`${me.p.id}/${g.id}`, side === 'heroi' ? 'vilões contra heróis' : 'heróis contra vilões', 'lado'); }
  for (const g of order) add(`${me.p.id}/${g.id}`, `do mesmo tema (${me.p.name})`, 'pack');
  return out;
}
