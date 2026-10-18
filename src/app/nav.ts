/* Where the person is on the start screen: a tab, and the screens opened inside it, as a path (["equipe", "time",
   "anime", "naruto"]). The path is in the address (#equipe/time/anime/naruto), so the browser's back button and the
   back gesture go one screen back, and a link can open a screen directly. The open tab is also remembered in this
   browser (a convenience, in its own key, never in S): opening the app again goes back to it. */
import { render } from './render';
import { ui, TABS } from './state';
import type { Tab } from './state';

const TAB_KEY = 'truco.tab';
/** The screens that cover the whole page (a drill, the real-table assistant): they get a place in the history, so the
 *  browser's back closes them, but they are not drawn from the address (what is on them is not in it). */
const OVER = ['exercicio', 'assistente'];
let over = false;
/** A back sent by closeOver and not yet arrived: its popstate only takes the step off (and puts it back if a covering
 *  screen opened again meanwhile, as "Voltar" and then another drill, quickly). */
let closing = false, overSub = '';
/** How many screens this page pushed onto the browser's history: back goes through them, then out of the app. */
let pushed = 0;

/** A path read from the address: only known tabs; the screens inside are checked when they are drawn. */
export function readHash(hash: string): string[] | null {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean).map(p => decodeURIComponent(p)).slice(0, 5);
  return parts.length && TABS.includes(parts[0] as Tab) ? parts : null;
}
/** The first screen: the address's, else the invitation's (Jogar, online), else the tab used last, else Jogar. */
export function firstRoute(): string[] {
  if (/[?&]sala=/.test(location.search)) return ['jogar', 'online'];
  const h = readHash(location.hash);
  if (h) return h.filter(p => !OVER.includes(p));
  try { const t = localStorage.getItem(TAB_KEY) as Tab | null; if (t && TABS.includes(t)) return [t]; } catch (e) { /* storage refused: Jogar */ }
  return ['jogar'];
}
const hashOf = (route: string[]): string => `#${route.map(encodeURIComponent).join('/')}`;
function remember(route: string[]): void {
  try { localStorage.setItem(TAB_KEY, route[0]); } catch (e) { /* the tab is only a convenience */ }
}
/** Opens a screen. `push` adds it to the history (the back button returns here); `replace` takes the current place. */
export function go(route: string[], how: 'push' | 'replace' = 'push'): void {
  ui.route = route; remember(route);
  try {
    if (how === 'push' && location.hash !== hashOf(route)) { history.pushState(null, '', hashOf(route)); pushed++; }
    else history.replaceState(null, '', hashOf(route));
  } catch (e) { /* a page opened from disk in some browsers: the screen still changes */ }
  render(); window.scrollTo(0, 0);
}
/** One screen back: through the history if this page put the screen there, else straight to the parent. */
export function back(): void {
  if (pushed > 0 && ui.route.length > 1) { history.back(); return; }
  go(ui.route.slice(0, Math.max(1, ui.route.length - 1)), 'replace');
}
/** Back to the root of a tab after choosing something deep in it: the screens on the way are taken off the history. */
export function backTo(depth: number): void {
  const n = Math.min(pushed, ui.route.length - depth);
  if (n > 0) { pushed -= n; ui.route = ui.route.slice(0, depth); history.go(-n); render(); window.scrollTo(0, 0); return; }
  go(ui.route.slice(0, depth), 'replace');
}
/** A screen over the whole page opens: one step in the history, under the tab it was opened from. */
export function openOver(sub: string): void {
  if (over) return;
  over = true; overSub = sub;
  if (closing) return;                                   // the step is still there: the pending popstate keeps it
  try { history.pushState(null, '', hashOf([ui.route[0], sub])); pushed++; } catch (e) { /* see go */ }
}
/** It closes from a button: its step leaves the history too (the screen under it is already drawn). */
export function closeOver(): void {
  if (!over) return;
  over = false; closing = true;
  try { history.back(); } catch (e) { closing = false; }
}
/** Listens to the browser's back and forward buttons. */
export function initNav(): void {
  try { history.replaceState(null, '', location.search.includes('sala=') ? location.pathname + location.search + hashOf(ui.route) : hashOf(ui.route)); } catch (e) { /* see go */ }
  window.addEventListener('popstate', () => {
    const r = readHash(location.hash) || ['jogar'];
    if (pushed > 0) pushed--;
    if (closing) {
      closing = false;
      if (over) try { history.pushState(null, '', hashOf([ui.route[0], overSub])); pushed++; } catch (e) { /* see go */ }
      return;
    }
    // back from a drill or the real-table assistant closes it
    if (over || ui.drill || ui.real) { over = false; ui.drill = null; ui.picked = null; ui.real = false; ui.sheet = null; }
    ui.route = r.filter(p => !OVER.includes(p)); remember(r); render(); window.scrollTo(0, 0);
  });
}
