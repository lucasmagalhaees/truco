import { Core } from '../core';
import type { ClientMsg, RoomView } from '../core';
import { S, saveS, ui } from './state';

/* ================= the room server =================
   One WebSocket to the room server (server/worker.ts on Cloudflare). The server holds the game; this side only sends
   what the person does and paints what comes back (the room as this person sees it, see Core.roomView). A dropped
   connection comes back by itself, with the same token, so the person keeps their seat. The address comes from the
   build (VITE_ROOM_URL, set on Vercel); with none, playing online is off. The tests point it elsewhere with ui.server. */
export const ROOM_URL: string = import.meta.env.VITE_ROOM_URL || '';
/** How long to wait before trying again after the connection drops, by attempt (ms). After the last one the phone stops
 *  trying by itself ('parado') and the screen offers a button to try again. */
export const RETRY = [500, 1000, 2000, 4000];
export type NetStatus = 'off' | 'conectando' | 'na sala' | 'caiu' | 'parado';
export const net: { status: NetStatus; view: RoomView | null; tries: number } = { status: 'off', view: null, tries: 0 };

let ws: WebSocket | null = null, retry: ReturnType<typeof setTimeout> | undefined;
let onChange: (before: RoomView | null) => void = () => { /* set by connect */ };
let onError: (why: string) => void = () => { /* set by connect */ };

export const serverUrl = (): string => (ui.server ?? ROOM_URL).replace(/\/+$/, '');
export const canPlayOnline = (): boolean => !!serverUrl();
/** A token for this person in this room: random, long enough that nobody guesses it. */
export function newToken(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
/** Joins room `code` as `name` (or comes back to it). `changed` runs on every new view, `failed` on every refusal. */
export function connect(code: string, name: string, changed: (before: RoomView | null) => void, failed: (why: string) => void): void {
  onChange = changed; onError = failed;
  S.online = S.online && S.online.code === code ? S.online : { code, token: newToken() }; S.myName = name; saveS();
  net.tries = 0;
  open();
}
function open(): void {
  if (!S.online) return;
  clearTimeout(retry);
  const { code, token, played } = S.online;
  net.status = 'conectando';
  let sock: WebSocket;
  if (!canPlayOnline()) { dropped(); return; }                     // no address for the server in this build
  try { sock = new WebSocket(`${serverUrl()}/salas/${code}`); } catch (e) { dropped(); return; }
  ws = sock;
  sock.onopen = () => send({ t: 'join', name: S.myName || 'Jogador', token, level: S.level, ...(played ? { back: true } : {}) });
  sock.onmessage = e => {
    let m: Record<string, unknown>;
    try { m = JSON.parse(String(e.data)); } catch (err) { return; }
    if (m.t === 'error') { onError(String(m.why || 'Deu erro na sala.')); return; }
    if (m.t !== 'room' || typeof m.code !== 'string') return;
    const before = net.view;
    net.view = m as unknown as RoomView; net.status = 'na sala'; net.tries = 0;
    if (net.view.game && S.online && !S.online.played) { S.online = { ...S.online, played: true }; saveS(); }
    onChange(before);
  };
  sock.onclose = () => { if (ws === sock) dropped(); };
}
function dropped(): void {
  ws = null;
  if (!S.online) return;
  if (net.tries >= RETRY.length) { net.status = 'parado'; onChange(net.view); return; }
  net.status = 'caiu';
  onChange(net.view);
  retry = setTimeout(open, RETRY[net.tries++]);
}
/** Tries the connection again now, after the phone gave up trying by itself. */
export function retryNow(): void {
  if (!S.online || net.status !== 'parado') return;
  net.tries = 0; open(); onChange(net.view);
}
export function send(msg: ClientMsg): void {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}
/** Leaves the room for good: the seat is freed (before the game) or left to the computer (the host decides). */
export function leave(): void {
  send({ t: 'leave' });
  clearTimeout(retry);
  const sock = ws; ws = null;
  try { sock?.close(); } catch (e) { /* already closed */ }
  delete S.online; saveS();
  net.view = null; net.status = 'off'; net.tries = 0;
}
/** Whether this person is in a room right now (connected or trying to). */
export const inRoom = (): boolean => !!S.online;
/** The raw seat on the server of a seat as this person sees it (the view is turned so that they sit at 0). */
export const rawSeat = (v: number): number => ((net.view ? net.view.seat : 0) + v) % 4;
export const roomLink = (code: string): string => `${location.origin}${location.pathname}?sala=${code}`;
export const isRoomCode = Core.isCode;
