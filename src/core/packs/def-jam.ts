import type { Pack } from '../teams';

/* Def Jam: Fight for NY, by crews of the story (D-Mob's against Crow's) and the guests. The fighters are the rappers
   and artists who appear in the game, by name only, like the footballers of the football pack. Set down from the agent's
   memory on 21/10/2026 (who is in the game and in which crew), not checked on the web. No image, logo or drawing. */
export const defJam: Pack = {
  id: 'def-jam', kind: 'jogos', kindName: 'Jogos', name: 'Def Jam: Fight for NY', lead: 'chefe',
  colors: ['#111111', '#dc2626', '#ffffff'],
  groups: [
    { id: 'd-mob', rivals: ['def-jam/crow', 'def-jam/brooklyn', 'def-jam/convidados'], why: ['D-Mob × Crow, a guerra de Nova York', 'a crew do D-Mob × Brooklyn', 'D-Mob × os convidados'], name: 'Crew do D-Mob', colors: ['#1e3a8a', '#fbbf24', '#ffffff'], players: ['Ice-T', 'Fat Joe', 'Sticky Fingaz'] },
    { id: 'crow', rivals: ['def-jam/d-mob', 'def-jam/wu', 'def-jam/brooklyn'], why: ['Crow × D-Mob, a guerra de Nova York', 'Crow × Method Man e Redman', 'Crow × Brooklyn'], name: 'Crew do Crow', colors: ['#111111', '#dc2626', '#ffffff'], players: ['Snoop Dogg', 'Busta Rhymes', 'Xzibit'] },
    { id: 'wu', rivals: ['def-jam/crow', 'def-jam/d-mob', 'def-jam/brooklyn'], why: ['Method Man e Redman × Crow', 'Method Man e Redman × D-Mob', 'Nova York × Brooklyn'], name: 'Method & Red', colors: ['#facc15', '#111111', '#111111'], players: ['Method Man', 'Redman', 'Ghostface Killah'] },
    { id: 'brooklyn', rivals: ['def-jam/d-mob', 'def-jam/crow', 'def-jam/wu'], why: ['Brooklyn × a crew do D-Mob', 'Brooklyn × a crew do Crow', 'Brooklyn × Method & Red'], name: 'Brooklyn', colors: ['#7f1d1d', '#fde68a', '#ffffff'], players: ['Lil\' Kim', 'Fabolous', 'Joe Budden'] },
    { id: 'convidados', rivals: ['def-jam/crow', 'def-jam/d-mob', 'def-jam/wu'], why: ['os convidados × Crow', 'os convidados × D-Mob', 'os convidados × Method & Red'], name: 'Convidados', colors: ['#3f3f46', '#a3e635', '#ffffff'], players: ['Ludacris', 'Flavor Flav', 'Henry Rollins'] }
  ]
};
