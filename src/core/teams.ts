/* The clubs of the Série A 2026, with their colours and three players each, the first being the star. The person picks
   their club: the computer players take those names (the star is the partner) and the app takes the club's colours. In
   the rivals mode, the person and their club's star play against the two first names of another club.
   Players change clubs every window: these were taken from the probable line-ups published for the Brasileirão from
   July to October 2026 and checked on TEAMS_CHECKED (docs/decisoes.md, D6). The person can rename any of them in the
   app. The colours are the clubs' usual shirt colours; no crest, badge or logo is drawn. */
export interface Club {
  id: string; name: string;
  /** The main colour, the second one, and the colour of text on the main one. */
  colors: [string, string, string];
  /** Three players, the star first. */
  players: [string, string, string];
}
export const TEAMS_CHECKED = '14/10/2026';
export const TEAMS: Club[] = [
  { id: 'athletico', name: 'Athletico-PR', colors: ['#c8102e', '#111111', '#ffffff'], players: ['Kevin Viveros', 'Luiz Gustavo', 'Kerwin Vargas'] },
  { id: 'atletico-mg', name: 'Atlético-MG', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Dudu', 'Bernard', 'Reinier'] },
  { id: 'bahia', name: 'Bahia', colors: ['#0055a4', '#e30613', '#ffffff'], players: ['Luciano Juba', 'Erick Pulga', 'Kanu'] },
  { id: 'botafogo', name: 'Botafogo', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Arthur Cabral', 'Ziyech', 'Alex Telles'] },
  { id: 'bragantino', name: 'Bragantino', colors: ['#f2f2f2', '#d6001c', '#111111'], players: ['Isidro Pitta', 'Tiago Volpi', 'Eric Ramires'] },
  { id: 'chapecoense', name: 'Chapecoense', colors: ['#00843d', '#ffffff', '#ffffff'], players: ['Giovanni Augusto', 'Yago Felipe', 'Bruno Pacheco'] },
  { id: 'corinthians', name: 'Corinthians', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Yuri Alberto', 'Hugo Souza', 'Breno Bidon'] },
  { id: 'coritiba', name: 'Coritiba', colors: ['#00544c', '#ffffff', '#ffffff'], players: ['Josué', 'Pedro Rocha', 'Breno Lopes'] },
  { id: 'cruzeiro', name: 'Cruzeiro', colors: ['#003b94', '#ffffff', '#ffffff'], players: ['Kaio Jorge', 'Matheus Pereira', 'Lucas Silva'] },
  { id: 'flamengo', name: 'Flamengo', colors: ['#c8102e', '#111111', '#ffffff'], players: ['Pedro', 'Lucas Paquetá', 'Carrascal'] },
  { id: 'fluminense', name: 'Fluminense', colors: ['#7a1f3d', '#00613c', '#ffffff'], players: ['Hulk', 'Thiago Silva', 'Ganso'] },
  { id: 'gremio', name: 'Grêmio', colors: ['#0d80bf', '#111111', '#ffffff'], players: ['Carlos Vinícius', 'Weverton', 'Pavón'] },
  { id: 'internacional', name: 'Internacional', colors: ['#e2001a', '#ffffff', '#ffffff'], players: ['Alan Patrick', 'Alerrandro', 'Thiago Maia'] },
  { id: 'mirassol', name: 'Mirassol', colors: ['#ffd200', '#00843d', '#111111'], players: ['Reinaldo', 'Edson Carioca', 'Chico Kim'] },
  { id: 'palmeiras', name: 'Palmeiras', colors: ['#006437', '#ffffff', '#ffffff'], players: ['Vitor Roque', 'Flaco López', 'Andreas Pereira'] },
  { id: 'remo', name: 'Remo', colors: ['#0b2346', '#ffffff', '#ffffff'], players: ['Yago Pikachu', 'Vitor Bueno', 'Alef Manga'] },
  { id: 'santos', name: 'Santos', colors: ['#f2f2f2', '#111111', '#111111'], players: ['Neymar', 'Gabigol', 'Barreal'] },
  { id: 'sao-paulo', name: 'São Paulo', colors: ['#e10600', '#111111', '#ffffff'], players: ['Calleri', 'Arboleda', 'Marcos Antônio'] },
  { id: 'vasco', name: 'Vasco', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Léo Jardim', 'Thiago Mendes', 'Andrés Gómez'] },
  { id: 'vitoria', name: 'Vitória', colors: ['#d71920', '#111111', '#ffffff'], players: ['Matheuzinho', 'Lucas Arcanjo', 'Erick'] }
];
/** The default table, with no club chosen. */
export const DEFAULT_NAMES = ['Você', 'Biu', 'Cida', 'Toinho'];
export const teamById = (id: string | undefined | null): Club | null => TEAMS.find(t => t.id === id) || null;
/** The players of a club as the person sees them: the club's, with the names the person changed. */
export function playersOf(id: string, custom?: Record<string, string[]>): [string, string, string] {
  const t = teamById(id), own = custom && custom[id];
  const base = t ? t.players : (['', '', ''] as [string, string, string]);
  return [0, 1, 2].map(i => ((own && typeof own[i] === 'string' && own[i].trim()) ? own[i].trim().slice(0, 24) : base[i])) as [string, string, string];
}
/** Who sits where: the names of the four seats, and the club of each pair (null: none). With no club, the default
 *  table. With a club and no rival, the star is the partner and the other two are the opponents. With a rival, the star
 *  is the partner and the rival's first two are the opponents. */
export function lineup(team?: string | null, rival?: string | null, custom?: Record<string, string[]>): { names: string[]; sides: [string | null, string | null] } {
  const t = teamById(team);
  if (!t) return { names: [...DEFAULT_NAMES], sides: [null, null] };
  const mine = playersOf(t.id, custom), r = teamById(rival);
  if (!r || r.id === t.id) return { names: ['Você', mine[1], mine[0], mine[2]], sides: [t.id, null] };
  const theirs = playersOf(r.id, custom);
  return { names: ['Você', theirs[0], mine[0], theirs[1]], sides: [t.id, r.id] };
}
