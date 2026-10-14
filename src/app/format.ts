/* ================= text and the page ================= */

/** Every text that did not come from the code itself goes through here before it goes into the page. */
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const $ = <T extends Element = HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);
/** A fixed part of the page (index.html), by id. */
export const part = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
export const valOf = (sel: string): string => { const el = $<HTMLInputElement>(sel); return el ? el.value : ''; };
