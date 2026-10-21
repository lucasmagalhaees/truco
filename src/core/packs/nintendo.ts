import type { Pack } from '../teams';

/* Nintendo: the worlds of Mario, Zelda and Donkey Kong, with the names used in Brazil. Set down from the agent's memory
   on 21/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const nintendo: Pack = {
  id: 'nintendo', kind: 'jogos', kindName: 'Jogos', name: 'Nintendo', lead: 'líder',
  colors: ['#b91c1c', '#ffffff', '#ffffff'],
  groups: [
    { id: 'mario', rivals: ['nintendo/bowser', 'nintendo/wario', 'nintendo/kongs'], why: ['Mario × Bowser', 'Mario × Wario', 'Mario × Donkey Kong, o primeiro jogo'], name: 'Irmãos Mario', colors: ['#b91c1c', '#bfdbfe', '#ffffff'], players: [{ name: 'Mario', colors: ['#b91c1c', '#bfdbfe', '#ffffff'] }, { name: 'Luigi', colors: ['#15803d', '#bfdbfe', '#ffffff'] }, { name: 'Peach', colors: ['#f9a8d4', '#9d174d', '#111111'] }] },
    { id: 'bowser', rivals: ['nintendo/mario', 'nintendo/kongs', 'nintendo/wario'], why: ['Bowser × Mario', 'Bowser × Donkey Kong', 'Bowser × Wario'], name: 'Exército do Bowser', colors: ['#14532d', '#fbbf24', '#ffffff'], players: ['Bowser', 'Bowser Jr.', 'Kamek'] },
    { id: 'wario', rivals: ['nintendo/mario', 'nintendo/bowser', 'nintendo/kremling'], why: ['Wario × Mario', 'Wario × Bowser', 'Wario × King K. Rool'], name: 'Turma do Wario', colors: ['#facc15', '#581c87', '#111111'], players: ['Wario', 'Waluigi', 'Rei Boo'] },
    { id: 'hyrule', rivals: ['nintendo/ganon', 'nintendo/bowser', 'nintendo/mario'], why: ['Link × Ganondorf', 'Hyrule × Bowser', 'Zelda × Mario'], name: 'Hyrule', colors: ['#166534', '#fde68a', '#ffffff'], players: [{ name: 'Link', colors: ['#166534', '#fde68a', '#ffffff'] }, { name: 'Zelda', colors: ['#7e22ce', '#fde68a', '#ffffff'] }, 'Impa'] },
    { id: 'ganon', rivals: ['nintendo/hyrule', 'nintendo/bowser', 'nintendo/kremling'], why: ['Ganondorf × Link', 'Ganondorf × Bowser', 'Ganondorf × King K. Rool'], name: 'Forças de Ganon', colors: ['#1c1917', '#dc2626', '#ffffff'], players: ['Ganondorf', 'Vaati', 'Ghirahim'] },
    { id: 'kongs', rivals: ['nintendo/kremling', 'nintendo/mario', 'nintendo/bowser'], why: ['Donkey Kong × King K. Rool', 'Donkey Kong × Mario', 'Donkey Kong × Bowser'], name: 'Família Kong', colors: ['#78350f', '#fcd34d', '#ffffff'], players: ['Donkey Kong', 'Diddy Kong', 'Cranky Kong'] },
    { id: 'kremling', rivals: ['nintendo/kongs', 'nintendo/wario', 'nintendo/ganon'], why: ['King K. Rool × Donkey Kong', 'King K. Rool × Wario', 'King K. Rool × Ganondorf'], name: 'Kremlings', colors: ['#3f6212', '#fde047', '#ffffff'], players: ['King K. Rool', 'Klump', 'Krusha'] }
  ]
};
