/* The readers of the outside source: the one place that knows the shape of what it sends. If the source changes, the
   fix is here. A field is read only after a real answer with it has been recorded in tests/fixtures/source/ and
   checked by tests/contract.py. Until there is a source, this is the pattern to follow. */
import type { Entry, Json } from './types';

/** One entry as the source sends it: `{ id, name, value }`. Anything else, or a field missing, reads as null. */
export function normEntry(j: Json): Entry | null {
  if (!j || typeof j !== 'object') return null;
  const id = j.id != null ? String(j.id) : '', name = typeof j.name === 'string' ? j.name.trim() : '', value = Number(j.value);
  return id && name && Number.isFinite(value) ? { id, name, value } : null;
}
/** A list of entries, as `{ items: [...] }`: what cannot be read is left out. */
export const normEntries = (j: Json): Entry[] => (j && Array.isArray(j.items) ? j.items.map(normEntry).filter((e: Entry | null): e is Entry => !!e) : []);
