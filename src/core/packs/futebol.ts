import type { Pack } from '../teams';

/* The clubs of the Série A 2026, with their colours and three players each, the first being the star.
   Players change clubs every window: these were taken from the probable line-ups published for the Brasileirão from
   July to October 2026 and checked on TEAMS_CHECKED (docs/decisoes.md, D6). The person can rename any of them in the
   app. The colours are the clubs' usual shirt colours; no crest, badge or logo is drawn. */
export const TEAMS_CHECKED = '14/10/2026';
export const futebol: Pack = {
  id: 'futebol', kind: 'futebol', kindName: 'Futebol', name: 'Série A 2026', lead: 'craque',
  colors: ['#14532d', '#f2c94c', '#ffffff'],
  note: `Elencos conferidos em ${TEAMS_CHECKED}, pelas escalações prováveis publicadas. Jogador troca de clube: se algum nome estiver velho, troque acima.`,
  groups: [
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
  ]
};
