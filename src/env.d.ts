/// <reference types="vite/client" />
import type { Core } from './core';
import type { AppState, RoomView } from './core';
import type { Ui } from './app/state';

declare global {
  /** The address of the room server, given to the build (on Vercel, an environment variable). */
  interface ImportMetaEnv { readonly VITE_ROOM_URL?: string }
  /** The handle the tests use: the core, what is on screen, what is saved, and the room as the server last sent it. */
  interface Window { __APP: { Core: typeof Core; ui: Ui; readonly S: AppState; readonly room: RoomView | null } }
}
export {};
