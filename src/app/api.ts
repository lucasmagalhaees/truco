import { Core } from '../core';
import type { Entry, Json } from '../core';

/* ================= the outside source =================
   Every call goes through getJSON. What comes back is read only by the normalisers of src/core/source.ts. There is no
   source yet: SOURCE is empty and nothing is asked. */
export const SOURCE = '';
/** How long a call may take before it is given up. */
export const TIMEOUT = 12000;
export async function getJSON(url: string, ms?: number): Promise<Json> {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || TIMEOUT);
  try { const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
/** The entries the source lists, read; with no source, none. */
export async function loadEntries(): Promise<Entry[]> { return SOURCE ? Core.normEntries(await getJSON(SOURCE)) : []; }
