import type { Pack } from '../teams';

/* The clubs of the Série A 2026, with their colours and three players each, the first being the star.
   Players change clubs every window: these were taken from the probable line-ups published for the Brasileirão from
   July to October 2026 and checked on TEAMS_CHECKED (docs/decisoes.md, D6). The person can rename any of them in the
   app. The colours are the clubs' usual shirt colours; no crest, badge or logo is drawn. The rivals (the classics, D16)
   were set down from the agent's memory on 18/10/2026, not checked on the web. */
export const TEAMS_CHECKED = '14/10/2026';
export const futebol: Pack = {
  id: 'futebol', kind: 'futebol', kindName: 'Futebol', name: 'Série A 2026', lead: 'craque',
  colors: ['#14532d', '#f2c94c', '#ffffff'],
  note: `Elencos conferidos em ${TEAMS_CHECKED}, pelas escalações prováveis publicadas. Jogador troca de clube: se algum nome estiver velho, troque acima.`,
  groups: [
    { id: 'athletico', rivals: ['futebol/coritiba', 'futebol/chapecoense', 'futebol/gremio'], why: ['o Atletiba', 'vizinha do Sul, sem clássico na Série A', 'vizinho do Sul'], name: 'Athletico-PR', colors: ['#c8102e', '#111111', '#ffffff'], players: ['Kevin Viveros', 'Luiz Gustavo', 'Kerwin Vargas'] },
    { id: 'atletico-mg', rivals: ['futebol/cruzeiro', 'futebol/flamengo'], why: ['o clássico mineiro', 'a rivalidade dos anos 80'], name: 'Atlético-MG', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Dudu', 'Bernard', 'Reinier'] },
    { id: 'bahia', rivals: ['futebol/vitoria'], why: ['o Ba-Vi'], name: 'Bahia', colors: ['#0055a4', '#e30613', '#ffffff'], players: ['Luciano Juba', 'Erick Pulga', 'Kanu'] },
    { id: 'botafogo', rivals: ['futebol/flamengo', 'futebol/fluminense', 'futebol/vasco'], why: ['o Clássico da Rivalidade', 'o Clássico Vovô', 'clássico carioca'], name: 'Botafogo', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Arthur Cabral', 'Ziyech', 'Alex Telles'] },
    { id: 'bragantino', rivals: ['futebol/mirassol', 'futebol/palmeiras', 'futebol/corinthians'], why: ['nenhum clássico dele na Série A 2026: outro do interior paulista', 'do Paulistão', 'do Paulistão'], name: 'Bragantino', colors: ['#f2f2f2', '#d6001c', '#111111'], players: ['Isidro Pitta', 'Tiago Volpi', 'Eric Ramires'] },
    { id: 'chapecoense', rivals: ['futebol/athletico', 'futebol/gremio', 'futebol/internacional'], why: ['Figueirense e Avaí fora da Série A 2026: o vizinho do Paraná', 'vizinho do Sul', 'vizinho do Sul'], name: 'Chapecoense', colors: ['#00843d', '#ffffff', '#ffffff'], players: ['Giovanni Augusto', 'Yago Felipe', 'Bruno Pacheco'] },
    { id: 'corinthians', rivals: ['futebol/palmeiras', 'futebol/sao-paulo', 'futebol/santos'], why: ['o Derby', 'o Majestoso', 'o Clássico Alvinegro'], name: 'Corinthians', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Yuri Alberto', 'Hugo Souza', 'Breno Bidon'] },
    { id: 'coritiba', rivals: ['futebol/athletico', 'futebol/chapecoense', 'futebol/internacional'], why: ['o Atletiba', 'vizinha do Sul', 'vizinho do Sul'], name: 'Coritiba', colors: ['#00544c', '#ffffff', '#ffffff'], players: ['Josué', 'Pedro Rocha', 'Breno Lopes'] },
    { id: 'cruzeiro', rivals: ['futebol/atletico-mg'], why: ['o clássico mineiro'], name: 'Cruzeiro', colors: ['#003b94', '#ffffff', '#ffffff'], players: ['Kaio Jorge', 'Matheus Pereira', 'Lucas Silva'] },
    { id: 'flamengo', rivals: ['futebol/fluminense', 'futebol/vasco', 'futebol/botafogo'], why: ['o Fla-Flu', 'o Clássico dos Milhões', 'o Clássico da Rivalidade'], name: 'Flamengo', colors: ['#c8102e', '#111111', '#ffffff'], players: ['Pedro', 'Lucas Paquetá', 'Carrascal'] },
    { id: 'fluminense', rivals: ['futebol/flamengo', 'futebol/vasco', 'futebol/botafogo'], why: ['o Fla-Flu', 'o Clássico dos Gigantes', 'o Clássico Vovô'], name: 'Fluminense', colors: ['#7a1f3d', '#00613c', '#ffffff'], players: ['Hulk', 'Thiago Silva', 'Ganso'] },
    { id: 'gremio', rivals: ['futebol/internacional'], why: ['o Gre-Nal'], name: 'Grêmio', colors: ['#0a72ad', '#111111', '#ffffff'], players: ['Carlos Vinícius', 'Weverton', 'Pavón'] },
    { id: 'internacional', rivals: ['futebol/gremio'], why: ['o Gre-Nal'], name: 'Internacional', colors: ['#e2001a', '#ffffff', '#ffffff'], players: ['Alan Patrick', 'Alerrandro', 'Thiago Maia'] },
    { id: 'mirassol', rivals: ['futebol/bragantino', 'futebol/sao-paulo', 'futebol/palmeiras'], why: ['nenhum clássico dele na Série A 2026: outro do interior paulista', 'do Paulistão', 'do Paulistão'], name: 'Mirassol', colors: ['#ffd200', '#00843d', '#111111'], players: ['Reinaldo', 'Edson Carioca', 'Chico Kim'] },
    { id: 'palmeiras', rivals: ['futebol/corinthians', 'futebol/sao-paulo', 'futebol/santos'], why: ['o Derby', 'o Choque-Rei', 'o Clássico da Saudade'], name: 'Palmeiras', colors: ['#006437', '#ffffff', '#ffffff'], players: ['Vitor Roque', 'Flaco López', 'Andreas Pereira'] },
    { id: 'remo', rivals: ['futebol/bahia', 'futebol/vitoria'], why: ['Norte × Nordeste, sem o Paysandu na Série A 2026', 'Norte × Nordeste, sem o Paysandu na Série A 2026'], name: 'Remo', colors: ['#0b2346', '#ffffff', '#ffffff'], players: ['Yago Pikachu', 'Vitor Bueno', 'Alef Manga'] },
    { id: 'santos', rivals: ['futebol/corinthians', 'futebol/palmeiras', 'futebol/sao-paulo'], why: ['o Clássico Alvinegro', 'o Clássico da Saudade', 'o San-São'], name: 'Santos', colors: ['#f2f2f2', '#111111', '#111111'], players: ['Neymar', 'Gabigol', 'Barreal'] },
    { id: 'sao-paulo', rivals: ['futebol/corinthians', 'futebol/palmeiras', 'futebol/santos'], why: ['o Majestoso', 'o Choque-Rei', 'o San-São'], name: 'São Paulo', colors: ['#e10600', '#111111', '#ffffff'], players: ['Calleri', 'Arboleda', 'Marcos Antônio'] },
    { id: 'vasco', rivals: ['futebol/flamengo', 'futebol/fluminense', 'futebol/botafogo'], why: ['o Clássico dos Milhões', 'o Clássico dos Gigantes', 'clássico carioca'], name: 'Vasco', colors: ['#111111', '#f2f2f2', '#ffffff'], players: ['Léo Jardim', 'Thiago Mendes', 'Andrés Gómez'] },
    { id: 'vitoria', rivals: ['futebol/bahia'], why: ['o Ba-Vi'], name: 'Vitória', colors: ['#d71920', '#111111', '#ffffff'], players: ['Matheuzinho', 'Lucas Arcanjo', 'Erick'] }
  ]
};
