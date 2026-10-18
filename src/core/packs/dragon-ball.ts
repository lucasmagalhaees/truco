import type { Pack } from '../teams';

/* Dragon Ball (the classic and Z), by the groups of the series, with the names of the Brazilian dub. Set down from the
   agent's memory on 18/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const dragonBall: Pack = {
  id: 'dragon-ball', kind: 'anime', kindName: 'Animes', name: 'Dragon Ball', lead: 'líder',
  colors: ['#ea580c', '#1d4ed8', '#111111'],
  groups: [
    { id: 'guerreiros-z', side: 'heroi', name: 'Guerreiros Z', colors: ['#f28c28', '#1f4fa0', '#111111'], players: [{ name: 'Goku', colors: ['#f97316', '#1d4ed8', '#111111'] }, { name: 'Gohan', colors: ['#6d28d9', '#fde68a', '#ffffff'] }, 'Kuririn'] },
    { id: 'saiyajins', side: 'vilao', name: 'Saiyajins', colors: ['#1e3a8a', '#f2f2f2', '#ffffff'], players: [{ name: 'Vegeta', colors: ['#1e40af', '#f5f5f5', '#ffffff'] }, 'Nappa', 'Raditz'] },
    { id: 'kame', side: 'heroi', name: 'Turma do Kame', colors: ['#f59e0b', '#7c2d12', '#111111'], players: ['Mestre Kame', 'Yamcha', 'Bulma'] },
    { id: 'grou', side: 'heroi', name: 'Escola do Grou', colors: ['#7c2d12', '#fde68a', '#ffffff'], players: ['Tenshinhan', 'Chaos', 'Mestre Tsuru'] },
    { id: 'namek', side: 'heroi', name: 'Namekuseijins', colors: ['#166534', '#c4b5fd', '#ffffff'], players: [{ name: 'Piccolo', colors: ['#15803d', '#ede9fe', '#ffffff'] }, 'Kami-Sama', 'Dende'] },
    { id: 'ginyu', side: 'vilao', name: 'Força Ginyu', colors: ['#6b21a8', '#f2f2f2', '#ffffff'], players: ['Capitão Ginyu', 'Rikum', 'Jeice'] },
    { id: 'freeza', side: 'vilao', name: 'Família de Freeza', colors: ['#f3f0ff', '#7c3aed', '#111111'], players: [{ name: 'Freeza', colors: ['#ede9fe', '#7e22ce', '#111111'] }, 'Cooler', 'Rei Cold'] },
    { id: 'androides', side: 'vilao', name: 'Androides', colors: ['#1f2937', '#f97316', '#ffffff'], players: ['Androide 17', 'Androide 18', { name: 'Cell', colors: ['#365314', '#bef264', '#ffffff'] }] },
    { id: 'patrulha', side: 'vilao', name: 'Patrulha Vermelha', colors: ['#b91c1c', '#111111', '#ffffff'], players: ['Comandante Red', 'General Blue', 'Coronel Silver'] },
    { id: 'majin', side: 'vilao', name: 'Majin Boo', colors: ['#f472b6', '#111111', '#111111'], players: ['Majin Boo', 'Babidi', 'Dabura'] }
  ]
};
