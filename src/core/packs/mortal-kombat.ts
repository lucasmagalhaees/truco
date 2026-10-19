import type { Pack } from '../teams';

/* Mortal Kombat, by clans and sides of the series, with the names as they are known in Brazil. Set down from the agent's
   memory on 18/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const mortalKombat: Pack = {
  id: 'mortal-kombat', kind: 'jogos', kindName: 'Jogos', name: 'Mortal Kombat', lead: 'líder',
  colors: ['#111111', '#facc15', '#ffffff'],
  groups: [
    { id: 'shaolin', rivals: ['mortal-kombat/exoterra', 'mortal-kombat/netherrealm'], why: ['Liu Kang × Shao Kahn', 'Raiden × Shinnok'], side: 'heroi', name: 'Shaolin', colors: ['#991b1b', '#fde68a', '#ffffff'], players: [{ name: 'Liu Kang', colors: ['#b91c1c', '#111111', '#ffffff'] }, { name: 'Kung Lao', colors: ['#1f2937', '#fde68a', '#ffffff'] }, { name: 'Raiden', colors: ['#e0f2fe', '#1d4ed8', '#111111'] }] },
    { id: 'lin-kuei', rivals: ['mortal-kombat/shirai-ryu'], why: ['Sub-Zero × Scorpion'], name: 'Lin Kuei', colors: ['#1e40af', '#bae6fd', '#ffffff'], players: [{ name: 'Sub-Zero', side: 'heroi', colors: ['#1d4ed8', '#e0f2fe', '#ffffff'] }, { name: 'Smoke', colors: ['#475569', '#e2e8f0', '#ffffff'] }, { name: 'Cyrax', colors: ['#facc15', '#111111', '#111111'] }] },
    { id: 'forcas-especiais', rivals: ['mortal-kombat/exoterra'], why: ['o Black Dragon não está aqui: Kano lutava pela Exoterra'], side: 'heroi', name: 'Forças Especiais', colors: ['#3f6212', '#e5e7eb', '#ffffff'], players: [{ name: 'Sonya Blade', colors: ['#365314', '#fde68a', '#ffffff'] }, { name: 'Jax', colors: ['#374151', '#fca5a5', '#ffffff'] }, { name: 'Cassie Cage', colors: ['#1e3a8a', '#fbcfe8', '#ffffff'] }] },
    { id: 'exoterra', rivals: ['mortal-kombat/shaolin', 'mortal-kombat/forcas-especiais'], why: ['Shao Kahn × Liu Kang', 'Exoterra × Sonya e Jax'], side: 'vilao', name: 'Exoterra', colors: ['#4c1d95', '#f0abfc', '#ffffff'], players: [{ name: 'Shao Kahn', colors: ['#7f1d1d', '#d6d3d1', '#ffffff'] }, { name: 'Kitana', side: 'heroi', colors: ['#1e3a8a', '#93c5fd', '#ffffff'] }, { name: 'Mileena', colors: ['#9d174d', '#f9a8d4', '#ffffff'] }] },
    { id: 'shirai-ryu', rivals: ['mortal-kombat/lin-kuei', 'mortal-kombat/netherrealm'], why: ['Scorpion × Sub-Zero', 'Quan Chi enganou o Scorpion'], name: 'Shirai Ryu', colors: ['#facc15', '#111111', '#111111'], players: [{ name: 'Scorpion', colors: ['#facc15', '#111111', '#111111'] }, { name: 'Takeda', colors: ['#854d0e', '#fef08a', '#ffffff'] }, { name: 'Kenshi', colors: ['#1f2937', '#fca5a5', '#ffffff'] }] },
    { id: 'netherrealm', rivals: ['mortal-kombat/shaolin', 'mortal-kombat/shirai-ryu'], why: ['Shinnok × Raiden', 'Quan Chi × Scorpion'], side: 'vilao', name: 'Netherrealm', colors: ['#111111', '#4ade80', '#ffffff'], players: [{ name: 'Shinnok', colors: ['#14532d', '#bbf7d0', '#ffffff'] }, { name: 'Quan Chi', colors: ['#3f3f46', '#fca5a5', '#ffffff'] }, { name: 'Noob Saibot', colors: ['#111111', '#a1a1aa', '#ffffff'] }] }
  ]
};
