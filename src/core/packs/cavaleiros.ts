import type { Pack } from '../teams';

/* Os Cavaleiros do Zodíaco (Saint Seiya), by the orders and sides of the series, with the names used in Brazil. Set
   down from the agent's memory on 24/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const cavaleiros: Pack = {
  id: 'cavaleiros', kind: 'anime', kindName: 'Animes', name: 'Os Cavaleiros do Zodíaco', lead: 'líder',
  colors: ['#1e3a8a', '#d4a017', '#ffffff'],
  groups: [
    { id: 'bronze', rivals: ['cavaleiros/hades'], why: ['Seiya × Hades'], side: 'heroi', name: 'Cavaleiros de Bronze', colors: ['#c2410c', '#fbbf24', '#ffffff'], players: ['Seiya', 'Shiryu', 'Hyoga'] },
    { id: 'ouro', rivals: ['cavaleiros/hades'], why: ['os Cavaleiros de Ouro × os Espectros de Hades'], side: 'heroi', name: 'Cavaleiros de Ouro', colors: ['#d4a017', '#1e3a8a', '#111111'], players: ['Aiolia', 'Mu', 'Milo de Escorpião'] },
    { id: 'hades', rivals: ['cavaleiros/bronze', 'cavaleiros/ouro', 'cavaleiros/asgard'], why: ['Hades × os Cavaleiros de Bronze', 'Hades × os Cavaleiros de Ouro', 'Hades × os Guerreiros Deuses de Asgard'], side: 'vilao', name: 'Espectros de Hades', colors: ['#4c1d95', '#a3e635', '#ffffff'], players: ['Hades', 'Radamanthys', 'Minos'] },
    { id: 'asgard', rivals: ['cavaleiros/hades'], why: ['os Guerreiros Deuses de Asgard × o exército de Hades'], side: 'heroi', name: 'Guerreiros Deuses de Asgard', colors: ['#1e40af', '#bae6fd', '#ffffff'], players: ['Siegfried', 'Hagen', 'Fenrir'] },
    { id: 'poseidon', rivals: ['cavaleiros/bronze', 'cavaleiros/ouro', 'cavaleiros/hades'], why: ['os Generais Marina × os Cavaleiros de Bronze', 'os Generais Marina × os Cavaleiros de Ouro', 'Poseidon × Hades'], side: 'vilao', name: 'Generais de Poseidon', colors: ['#115e59', '#5eead4', '#ffffff'], players: ['Kanon', 'Sorento', 'Isaak'] }
  ]
};
