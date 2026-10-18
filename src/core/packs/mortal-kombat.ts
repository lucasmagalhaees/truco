import type { Pack } from '../teams';

/* Mortal Kombat, by clans and sides of the series. Set down from the agent's memory on 18/10/2026, not checked on the
   web. Only names and colours: no image, logo or drawing. */
export const mortalKombat: Pack = {
  id: 'mortal-kombat', kind: 'jogos', kindName: 'Jogos', name: 'Mortal Kombat', lead: 'líder',
  colors: ['#111111', '#facc15', '#ffffff'],
  groups: [
    { id: 'shaolin', name: 'Shaolin', colors: ['#991b1b', '#fde68a', '#ffffff'], players: [{ name: 'Liu Kang', colors: ['#b91c1c', '#111111', '#ffffff'] }, 'Kung Lao', { name: 'Raiden', colors: ['#e0f2fe', '#1d4ed8', '#111111'] }] },
    { id: 'lin-kuei', name: 'Lin Kuei', colors: ['#1e40af', '#bae6fd', '#ffffff'], players: [{ name: 'Sub-Zero', colors: ['#1d4ed8', '#e0f2fe', '#ffffff'] }, { name: 'Smoke', colors: ['#475569', '#e2e8f0', '#ffffff'] }, 'Cyrax'] },
    { id: 'forcas-especiais', name: 'Forças Especiais', colors: ['#3f6212', '#e5e7eb', '#ffffff'], players: ['Sonya Blade', 'Jax', 'Cassie Cage'] },
    { id: 'exoterra', name: 'Exoterra', colors: ['#4c1d95', '#f0abfc', '#ffffff'], players: ['Shao Kahn', { name: 'Kitana', colors: ['#1e3a8a', '#93c5fd', '#ffffff'] }, { name: 'Mileena', colors: ['#9d174d', '#f9a8d4', '#ffffff'] }] },
    { id: 'netherrealm', name: 'Netherrealm', colors: ['#111111', '#facc15', '#ffffff'], players: [{ name: 'Scorpion', colors: ['#facc15', '#111111', '#111111'] }, 'Noob Saibot', 'Quan Chi'] }
  ]
};
