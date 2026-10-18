/* Where the person is on the start screen: a tab, and the screens opened inside it, as a path (["equipe", "time",
   "anime", "naruto"]). The path is in the address (#equipe/time/anime/naruto), so the browser's back button and the
   back gesture go one screen back, and a link can open a screen directly. The open tab is also remembered in this
   browser (a convenience, in its own key, never in S): opening the app again goes back to it. */
import { render } from './render';
import { ui, TABS } from './state';
import type { Tab } from './state';

const TAB_KEY = 'truco.tab';
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
  if (h) return h;
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
/** Listens to the browser's back and forward buttons. */
export function initNav(): void {
  try { history.replaceState(null, '', location.search.includes('sala=') ? location.pathname + location.search + hashOf(ui.route) : hashOf(ui.route)); } catch (e) { /* see go */ }
  window.addEventListener('popstate', () => {
    const r = readHash(location.hash) || ['jogar'];
    if (pushed > 0) pushed--;
    ui.route = r; remember(r); render(); window.scrollTo(0, 0);
  });
}
