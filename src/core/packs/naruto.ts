import type { Pack } from '../teams';

/* Naruto Clássico, by the teams of the Exame Chunin and a few others, with the names of the Brazilian dub. Set down
   from the agent's memory on 18/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const naruto: Pack = {
  id: 'naruto', kind: 'anime', kindName: 'Animes', name: 'Naruto Clássico', lead: 'líder',
  colors: ['#c2410c', '#1b2a4a', '#ffffff'],
  groups: [
    { id: 'time-7', name: 'Time 7', colors: ['#f47b20', '#1b2a4a', '#111111'], players: [{ name: 'Naruto', colors: ['#f97316', '#1e3a8a', '#111111'] }, { name: 'Sasuke', colors: ['#1e1b4b', '#c4b5fd', '#ffffff'] }, { name: 'Sakura', colors: ['#f9a8d4', '#9d174d', '#111111'] }] },
    { id: 'time-8', name: 'Time 8', colors: ['#6b4c9a', '#e7d9b0', '#ffffff'], players: ['Hinata', 'Kiba', 'Shino'] },
    { id: 'time-10', name: 'Time 10', colors: ['#2e7d32', '#f2c94c', '#ffffff'], players: ['Shikamaru', 'Ino', 'Choji'] },
    { id: 'time-gai', name: 'Time Gai', colors: ['#166534', '#fde68a', '#ffffff'], players: [{ name: 'Rock Lee', colors: ['#15803d', '#fb923c', '#ffffff'] }, 'Neji', 'Tenten'] },
    { id: 'areia', name: 'Irmãos da Areia', colors: ['#b8865b', '#7a1f1f', '#111111'], players: [{ name: 'Gaara', colors: ['#7f1d1d', '#d6b98c', '#ffffff'] }, 'Kankuro', 'Temari'] },
    { id: 'som', name: 'Ninjas do Som', colors: ['#4a4a5a', '#c4b5fd', '#ffffff'], players: ['Dosu', 'Zaku', 'Kin'] },
    { id: 'quarteto', name: 'Quarteto do Som', colors: ['#5d3a6e', '#e0c3fc', '#ffffff'], players: ['Kimimaro', 'Tayuya', 'Sakon'] },
    { id: 'jonins', name: 'Jônins de Konoha', colors: ['#3f5872', '#c9d6df', '#ffffff'], players: [{ name: 'Kakashi', colors: ['#334155', '#cbd5e1', '#ffffff'] }, 'Gai', 'Asuma'] },
    { id: 'sannin', name: 'Sannin', colors: ['#7a1f1f', '#e5c07b', '#ffffff'], players: ['Jiraiya', 'Tsunade', { name: 'Orochimaru', colors: ['#3b0764', '#a3e635', '#ffffff'] }] }
  ]
};
