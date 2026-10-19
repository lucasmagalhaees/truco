import { Core } from '../core';
import type { AppState, Drill, Game, Target, Theme } from '../core';

/* ================= what is kept, and what is on screen =================
   This module is one of the two that run code while loading (the other is src/main.ts): it reads what is saved and
   applies the theme. Nothing else in src/app/ calls another module at the top of the file. */
export const LS = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(k: string): any { try { return JSON.parse(localStorage.getItem(k) as string); } catch (e) { return null; } },
  set(k: string, v: unknown): boolean { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
/** Everything kept on the device: the game in course, the tally, the level and the settings. Replacing it goes through setS. */
export let S: AppState = Core.readState(LS.get('truco.v1'));
export const saveS = (): boolean => LS.set('truco.v1', S);
export function setS(next: AppState): void { S = next; }

/** What is on screen, not saved.
 *  `confirmEnd` the first of the two taps that end a game; `busy` holds taps while a played card is still flying;
 *  `drill` the training question on screen and `picked` the answer given to it (null: not answered yet); `streak` right
 *  answers in a row; `vira` the vira chosen in the ranking of the glossary; `wait` a fixed thinking time for the
 *  computer players, in ms, that only the tests set (null: the one of the chosen speed). */
export interface Ui { server: string | null; editing: boolean; kind: Record<string, string>; slot: 0 | 1 | 2; confirmEnd: boolean; busy: boolean; drill: Drill | null; picked: string | null; streak: number; vira: string; wait: number | null; real: boolean; sheet: Target | null; heard: string; listening: boolean; route: string[]; otherRival: boolean }
/** `server` the room server's address, set only by the tests (null: the build's); `editing` the names of the team's players open for changing; `kind` the theme tab open in each picker (team, rival, seat); `slot` the seat being filled when the table is put together (0 partner, 1 and 2 the opponents); `real` the real-table assistant on screen; `sheet` where the card picked in the grid of 40 goes (null: closed);
 *  `heard` the last words the microphone understood; `listening` the microphone is on; `route` the tab and the screens open in it on the start screen (see nav.ts); `otherRival` the tree of teams open under the suggested rival (D16). */
/** The tabs of the start screen. */
export type Tab = 'jogar' | 'treinar' | 'real' | 'equipe' | 'ajustes';
export const TABS: Tab[] = ['jogar', 'treinar', 'real', 'equipe', 'ajustes'];
export const ui: Ui = { route: ['jogar'], server: null, editing: false, kind: {}, slot: 0, confirmEnd: false, busy: false, drill: null, picked: null, streak: 0, vira: '7o', wait: null, real: false, sheet: null, heard: '', listening: false, otherRival: false };

/** The theme: the device's, unless one was chosen. The choice goes on <html> and into the colour of the browser bars. */
export function applyTheme(): void {
  const t: Theme | undefined = S.theme, root = document.documentElement;
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]')) m.content = dark ? '#0b1a12' : '#14532d';
}
/** The table the person chose (theme team, rivals, or seat by seat), with the colours as chosen in the settings. */
export const table = (): { names: string[]; sides: [string | null, string | null] } => Core.lineup(S.team, S.rival, S.custom, S.seats, S.colorBy || 'team');
/** The colours of the theme: the person's pair on the masthead and on "Nós", the other pair's on "Eles". During a
 *  game, the ones of that game; otherwise, the ones chosen. Without a theme, the bar table's own colours. */
export function applyClub(game?: Game | null): void {
  const g = game === undefined ? S.game : game;
  const sides = g ? g.sides : table().sides, root = document.documentElement.style;
  const mine = Core.colorsOf(sides[0]), theirs = Core.colorsOf(sides[1]);
  const set = (k: string, v: string | undefined): void => { if (v) root.setProperty(k, v); else root.removeProperty(k); };
  set('--club', mine?.[0]); set('--club2', mine?.[1]); set('--club-ink', mine?.[2]); set('--club-accent', mine ? Core.accentOn(mine) : undefined);
  set('--rival', theirs?.[0]); set('--rival-ink', theirs?.[2]);
  if (mine) for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]')) m.content = mine[0];
}
applyTheme();
