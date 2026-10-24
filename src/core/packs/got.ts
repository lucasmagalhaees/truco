import type { Pack } from '../teams';

/* Game of Thrones (A Guerra dos Tronos), by houses and sides of the series, with the names used in Brazil. Set down
   from the agent's memory on 24/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const got: Pack = {
  id: 'got', kind: 'series', kindName: 'Séries', name: 'Game of Thrones', lead: 'líder',
  colors: ['#3f3f46', '#d4a017', '#ffffff'],
  groups: [
    { id: 'stark', rivals: ['got/lannister'], why: ['Stark × Lannister'], side: 'heroi', name: 'Casa Stark', colors: ['#3f3f46', '#e5e7eb', '#ffffff'], players: ['Ned', 'Jon Snow', 'Arya'] },
    { id: 'lannister', rivals: ['got/stark', 'got/baratheon', 'got/targaryen'], why: ['Lannister × Stark', 'Lannister × Baratheon', 'Lannister × Targaryen'], side: 'vilao', name: 'Casa Lannister', colors: ['#991b1b', '#d4a017', '#ffffff'], players: ['Tywin', 'Jaime', 'Cersei'] },
    { id: 'targaryen', rivals: ['got/lannister'], why: ['Targaryen × Lannister, pelo Trono de Ferro'], side: 'heroi', name: 'Casa Targaryen', colors: ['#111111', '#dc2626', '#ffffff'], players: ['Daenerys', 'Viserys', 'Rhaegar'] },
    { id: 'baratheon', rivals: ['got/lannister'], why: ['Baratheon × Lannister, a Guerra dos Cinco Reis'], side: 'heroi', name: 'Casa Baratheon', colors: ['#d4a017', '#111111', '#111111'], players: ['Robert', 'Stannis', 'Renly'] },
    { id: 'patrulha', rivals: ['got/caminhantes'], why: ['a Patrulha da Noite × os Caminhantes Brancos'], side: 'heroi', name: 'Patrulha da Noite', colors: ['#1c1917', '#cbd5e1', '#ffffff'], players: ['Jeor Mormont', 'Samwell', 'Benjen'] },
    { id: 'caminhantes', rivals: ['got/patrulha', 'got/stark', 'got/targaryen'], why: ['os Caminhantes Brancos × a Patrulha da Noite', 'os Caminhantes × Stark, em Winterfell', 'os Caminhantes × os dragões Targaryen'], side: 'vilao', name: 'Caminhantes Brancos', colors: ['#1e40af', '#bae6fd', '#ffffff'], players: ['Rei da Noite', 'Caminhante Branco', 'Viserion'] }
  ]
};
