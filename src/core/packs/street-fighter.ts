import type { Pack } from '../teams';

/* Street Fighter, by schools and sides of the series, with the names used in Brazil (the American ones: M. Bison is
   the dictator, Balrog the boxer). Set down from the agent's memory on 18/10/2026, not checked on the web. Only names
   and colours: no image, logo or drawing. */
export const streetFighter: Pack = {
  id: 'street-fighter', kind: 'jogos', kindName: 'Jogos', name: 'Street Fighter', lead: 'líder',
  colors: ['#1e3a8a', '#f59e0b', '#ffffff'],
  groups: [
    { id: 'shotokan', name: 'Shotokan', colors: ['#f5f5f4', '#b91c1c', '#111111'], players: [{ name: 'Ryu', colors: ['#f5f5f4', '#b91c1c', '#111111'] }, { name: 'Ken', colors: ['#b91c1c', '#fde047', '#ffffff'] }, { name: 'Akuma', colors: ['#292524', '#dc2626', '#ffffff'] }] },
    { id: 'shadaloo', name: 'Shadaloo', colors: ['#7f1d1d', '#111111', '#ffffff'], players: [{ name: 'M. Bison', colors: ['#991b1b', '#fbbf24', '#ffffff'] }, { name: 'Vega', colors: ['#4c1d95', '#fde68a', '#ffffff'] }, { name: 'Balrog', colors: ['#1e3a8a', '#fca5a5', '#ffffff'] }] },
    { id: 'forca-aerea', name: 'Força Aérea', colors: ['#3f6212', '#d9f99d', '#ffffff'], players: [{ name: 'Guile', colors: ['#4d7c0f', '#fde68a', '#ffffff'] }, { name: 'Cammy', colors: ['#166534', '#fca5a5', '#ffffff'] }, { name: 'Charlie Nash', colors: ['#365314', '#fde047', '#ffffff'] }] },
    { id: 'mundo', name: 'Lutadores do Mundo', colors: ['#1d4ed8', '#fde047', '#ffffff'], players: [{ name: 'Chun-Li', colors: ['#1e40af', '#fde047', '#ffffff'] }, { name: 'Blanka', colors: ['#15803d', '#fb923c', '#ffffff'] }, { name: 'Zangief', colors: ['#991b1b', '#fde047', '#ffffff'] }] },
    { id: 'asia', name: 'Mestres da Ásia', colors: ['#c2410c', '#fef3c7', '#ffffff'], players: [{ name: 'Sagat', colors: ['#7c2d12', '#fed7aa', '#ffffff'] }, { name: 'Dhalsim', colors: ['#c2410c', '#fef3c7', '#ffffff'] }, { name: 'E. Honda', colors: ['#1e3a8a', '#f8fafc', '#ffffff'] }] }
  ]
};
