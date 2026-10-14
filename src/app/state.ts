import { Core } from '../core';
import type { AppState, Drill, Target, Theme } from '../core';

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
export interface Ui { editing: boolean; confirmEnd: boolean; busy: boolean; drill: Drill | null; picked: string | null; streak: number; vira: string; wait: number | null; real: boolean; sheet: Target | null; heard: string; listening: boolean }
/** `editing` the names of the club's players open for changing; `real` the real-table assistant on screen; `sheet` where the card picked in the grid of 40 goes (null: closed);
 *  `heard` the last words the microphone understood; `listening` the microphone is on. */
export const ui: Ui = { editing: false, confirmEnd: false, busy: false, drill: null, picked: null, streak: 0, vira: '7o', wait: null, real: false, sheet: null, heard: '', listening: false };

/** The theme: the device's, unless one was chosen. The choice goes on <html> and into the colour of the browser bars. */
export function applyTheme(): void {
  const t: Theme | undefined = S.theme, root = document.documentElement;
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]')) m.content = dark ? '#0b1a12' : '#14532d';
}
/** The colours of the clubs: the person's on the masthead and on "Nós", the rival's on "Eles". During a game, the clubs
 *  of that game; otherwise, the ones chosen. Without a club, the bar table's own colours. */
export function applyClub(): void {
  const sides = S.game ? S.game.sides : [S.team ?? null, S.rival ?? null], root = document.documentElement.style;
  const mine = Core.teamById(sides[0]), theirs = Core.teamById(sides[1]);
  const set = (k: string, v: string | undefined): void => { if (v) root.setProperty(k, v); else root.removeProperty(k); };
  set('--club', mine?.colors[0]); set('--club2', mine?.colors[1]); set('--club-ink', mine?.colors[2]);
  set('--rival', theirs?.colors[0]); set('--rival-ink', theirs?.colors[2]);
  if (mine) for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]')) m.content = mine.colors[0];
}
applyTheme();
