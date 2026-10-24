import type { Pack } from '../teams';

/* Mitologia Grega, by groups and sides of the myths, with the names used in Brazil. Set down from the agent's memory on
   24/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const mitologiaGrega: Pack = {
  id: 'mitologia-grega', kind: 'mitologia', kindName: 'Mitologia', name: 'Mitologia Grega', lead: 'líder',
  colors: ['#1e40af', '#d4a017', '#ffffff'],
  groups: [
    { id: 'olimpo', rivals: ['mitologia-grega/titas'], why: ['os Deuses do Olimpo × os Titãs, na Titanomaquia'], side: 'heroi', name: 'Deuses do Olimpo', colors: ['#1e40af', '#fde047', '#ffffff'], players: ['Zeus', 'Poseidon', 'Hades'] },
    { id: 'herois', rivals: ['mitologia-grega/monstros'], why: ['os Heróis × os Monstros'], side: 'heroi', name: 'Heróis', colors: ['#c2410c', '#fbbf24', '#ffffff'], players: ['Héracles', 'Perseu', 'Aquiles'] },
    { id: 'titas', rivals: ['mitologia-grega/olimpo', 'mitologia-grega/herois', 'mitologia-grega/monstros'], why: ['os Titãs × os Deuses do Olimpo', 'os Titãs × os Heróis', 'os Titãs × os Monstros'], side: 'vilao', name: 'Titãs', colors: ['#7c2d12', '#fcd34d', '#ffffff'], players: ['Cronos', 'Atlas', 'Prometeu'] },
    { id: 'monstros', rivals: ['mitologia-grega/herois', 'mitologia-grega/olimpo', 'mitologia-grega/titas'], why: ['os Monstros × os Heróis', 'os Monstros × os Deuses do Olimpo', 'os Monstros × os Titãs'], side: 'vilao', name: 'Monstros', colors: ['#115e59', '#a3e635', '#ffffff'], players: ['Medusa', 'Minotauro', 'Hidra'] }
  ]
};
