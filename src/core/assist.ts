/* The assistant for a game at a real table: the person tells the app the vira, their cards and what falls on the
   table (by tapping or by voice), and the app answers what a seasoned player sees at once. Pure, like the rest of the
   core: the page owns the microphone, this module only reads the words. */
import { cardSay, deck, isManilha, manilhaRank, power } from './game';
import type { Card, RealTable } from './types';

/** Where a told card goes: the vira, the person's hand, or the table (the round being played). A real table as the
 *  person told it is a RealTable (types.ts); `gone` are the cards of earlier rounds of this hand, out of play. */
export type Target = RealTable['target'];
export const emptyTable = (): RealTable => ({ vira: null, hand: [], table: [], gone: [], target: 'vira' });

/** Every card already told, anywhere. */
const told = (t: RealTable): Card[] => [...(t.vira ? [t.vira] : []), ...t.hand, ...t.table, ...t.gone];
/** Puts a card where `target` says (the vira replaces the old one; at most 3 in the hand and 4 on the table). A card
 *  already told elsewhere moves; one told twice in the same place changes nothing. */
export function tell(t: RealTable, card: Card, target: Target = t.target): RealTable {
  if (!deck().includes(card)) return t;
  const without = { ...t, vira: t.vira === card ? null : t.vira, hand: t.hand.filter(c => c !== card), table: t.table.filter(c => c !== card), gone: t.gone.filter(c => c !== card) };
  if (target === 'vira') return { ...without, vira: card, target: 'hand' };
  if (target === 'hand') return without.hand.length >= 3 ? t : { ...without, hand: [...without.hand, card], target: without.hand.length === 2 ? 'table' : 'hand' };
  return without.table.length >= 4 ? t : { ...without, table: [...without.table, card] };
}
/** Takes a card back out. */
export const untell = (t: RealTable, card: Card): RealTable => ({ ...t, vira: t.vira === card ? null : t.vira, hand: t.hand.filter(c => c !== card), table: t.table.filter(c => c !== card), gone: t.gone.filter(c => c !== card) });
/** The round is over: the cards on the table go out of play (the person's own card leaves the hand if it was there). */
export const nextRound = (t: RealTable): RealTable => ({ ...t, hand: t.hand.filter(c => !t.table.includes(c)), gone: [...t.gone, ...t.table], table: [], target: 'table' });

export interface CardAdvice { card: Card; place: number; manilha: boolean; beatenBy: number; sure: boolean; takes: boolean }
/** What the person should know about each of their cards: its place with this vira (1 is the zap), how many cards
 *  that are still out there beat it (0: a sure card), and whether it takes the table as it is now. Also the strongest
 *  card on the table, and the cheapest of the person's cards that takes it. */
export function advise(t: RealTable): { cards: CardAdvice[]; top: Card | null; cheapest: Card | null; tie: Card | null } | null {
  if (!t.vira) return null;
  const vira = t.vira, known = new Set(told(t)), out = deck().filter(c => !known.has(c));
  const places = [...new Set(deck().map(c => power(c, vira)))].sort((a, b) => b - a);
  const top = t.table.length ? t.table.reduce((a, b) => (power(b, vira) > power(a, vira) ? b : a)) : null;
  const tp = top ? power(top, vira) : -1;
  const cards = [...t.hand].sort((a, b) => power(b, vira) - power(a, vira)).map(card => {
    const p = power(card, vira), beatenBy = out.filter(c => power(c, vira) > p).length;
    return { card, place: places.indexOf(p) + 1, manilha: isManilha(card, vira), beatenBy, sure: beatenBy === 0, takes: p > tp };
  });
  const takers = cards.filter(c => c.takes);
  const tie = top && !isManilha(top, vira) ? cards.find(c => power(c.card, vira) === tp)?.card ?? null : null;
  return { cards, top, cheapest: top && takers.length ? takers[takers.length - 1].card : null, tie };
}
/** One line on the table as it is: who is on top and why. */
export function tableSay(t: RealTable): string {
  const a = advise(t);
  if (!a || !t.vira) return 'Diga primeiro a vira.';
  if (!a.top) return `Vira ${cardSay(t.vira, t.vira).split(' (')[0]}: manilha é ${manilhaRank(t.vira)}.`;
  const m = t.table.filter(c => isManilha(c, t.vira as Card));
  return `Na mesa, a mais forte é ${cardSay(a.top, t.vira)}${m.length > 1 ? ' (ganha no naipe das outras manilhas)' : ''}.`;
}

/* ---------- the spoken words ---------- */
const RANK_WORDS: Record<string, string> = {
  quatro: '4', '4': '4', cinco: '5', '5': '5', seis: '6', '6': '6', sete: '7', '7': '7',
  dama: 'Q', rainha: 'Q', q: 'Q', valete: 'J', j: 'J', rei: 'K', k: 'K', as: 'A', a: 'A', '1': 'A', um: 'A',
  dois: '2', '2': '2', tres: '3', '3': '3'
};
const SUIT_WORDS: Record<string, string> = { ouro: 'o', ouros: 'o', espada: 'e', espadas: 'e', copa: 'c', copas: 'c', coracao: 'c', coracoes: 'c', pau: 'p', paus: 'p', zap: 'p' };
const NICK: Record<string, string> = { zap: 'p', espadilha: 'e', picafumo: 'o', 'pica-fumo': 'o' };
const TARGET_WORDS: Record<string, Target> = { vira: 'vira', virou: 'vira', mao: 'hand', minha: 'hand', minhas: 'hand', tenho: 'hand', mesa: 'table', jogou: 'table', jogaram: 'table', caiu: 'table', saiu: 'table' };
/** What was said, read: the cards in order, each with where it goes (a word like "vira", "mão" or "mesa" switches
 *  where the next cards go). A manilha by its nickname ("zap", "espadilha", "picafumo") needs the vira. */
export function hear(text: string, vira: Card | null, start: Target): { card: Card; target: Target }[] {
  const words = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/pica fumo/g, 'picafumo').split(/[^a-z0-9-]+/).filter(Boolean);
  const found: { card: Card; target: Target }[] = [];
  let target = start, v = vira;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (TARGET_WORDS[w]) { target = TARGET_WORDS[w]; continue; }
    if (NICK[w] && v && !(w === 'zap' && i > 0 && RANK_WORDS[words[i - 1]])) {
      const card = manilhaRank(v) + NICK[w]; found.push({ card, target }); continue;
    }
    // "a" and "as" are also articles: they only count as an ace when a suit follows
    const r = RANK_WORDS[w];
    if (!r) continue;
    const next = words[i + 1] === 'de' ? words[i + 2] : words[i + 1], s = next ? SUIT_WORDS[next] : undefined;
    if (!s) continue;
    const card = r + s;
    found.push({ card, target });
    if (target === 'vira') { v = card; target = 'hand'; }
    i += words[i + 1] === 'de' ? 2 : 1;
  }
  return found;
}
