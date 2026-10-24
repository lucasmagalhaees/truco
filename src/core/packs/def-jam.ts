import type { Pack } from '../teams';

/* Def Jam: Fight for NY, by the two story crews (D-Mob's against Crow's) and the celebrity guests. The fighters are the
   rappers and artists who appear in the game, by name only, like the footballers of the football pack. The roster and
   who fights for which crew were checked on the web on 24/10/2026 against the game's Wikipedia page
   (https://en.wikipedia.org/wiki/Def_Jam:_Fight_for_NY): Method Man (Blaze), Redman (Doc), Ghostface Killah, Ludacris,
   Scarface and Flavor Flav are D-Mob's side; Snoop Dogg (Crow), Busta Rhymes (Magic), Xzibit, Ice-T, Fat Joe (Crack) and
   Lil' Kim are Crow's side; Danny Trejo, Carmen Electra and Henry Rollins are the celebrity guests. No image, logo or
   drawing. */
export const defJam: Pack = {
  id: 'def-jam', kind: 'jogos', kindName: 'Jogos', name: 'Def Jam: Fight for NY', lead: 'chefe',
  colors: ['#111111', '#dc2626', '#ffffff'],
  groups: [
    { id: 'd-mob', rivals: ['def-jam/crow', 'def-jam/capangas', 'def-jam/convidados'], why: ['D-Mob × Crow, a guerra de Nova York', 'a crew do D-Mob × os capangas do Crow', 'a crew do D-Mob × os convidados'], name: 'Crew do D-Mob', colors: ['#1e3a8a', '#fbbf24', '#ffffff'], players: ['Method Man', 'Redman', 'Ghostface Killah'] },
    { id: 'fieis', rivals: ['def-jam/crow', 'def-jam/capangas', 'def-jam/convidados'], why: ['os fiéis do D-Mob × Crow', 'os fiéis do D-Mob × os capangas do Crow', 'os fiéis do D-Mob × os convidados'], name: 'Fiéis ao D-Mob', colors: ['#facc15', '#111111', '#111111'], players: ['Ludacris', 'Scarface', 'Flavor Flav'] },
    { id: 'crow', rivals: ['def-jam/d-mob', 'def-jam/fieis', 'def-jam/convidados'], why: ['Crow × D-Mob, a guerra de Nova York', 'Crow × os fiéis do D-Mob', 'a crew do Crow × os convidados'], name: 'Crew do Crow', colors: ['#111111', '#dc2626', '#ffffff'], players: ['Snoop Dogg', 'Busta Rhymes', 'Xzibit'] },
    { id: 'capangas', rivals: ['def-jam/d-mob', 'def-jam/fieis', 'def-jam/convidados'], why: ['os capangas do Crow × a crew do D-Mob', 'os capangas do Crow × os fiéis do D-Mob', 'os capangas do Crow × os convidados'], name: 'Capangas do Crow', colors: ['#3f3f46', '#a3e635', '#ffffff'], players: ['Ice-T', 'Fat Joe', 'Lil\' Kim'] },
    { id: 'convidados', rivals: ['def-jam/d-mob', 'def-jam/crow', 'def-jam/capangas'], why: ['os convidados × a crew do D-Mob', 'os convidados × a crew do Crow', 'os convidados × os capangas do Crow'], name: 'Convidados', colors: ['#7f1d1d', '#fde68a', '#ffffff'], players: ['Danny Trejo', 'Carmen Electra', 'Henry Rollins'] }
  ]
};
