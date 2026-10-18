import type { Pack } from '../teams';

/* Blue Lock (anime and manga), by teams of the selection and of the Neo Egoist League. Names as the Brazilian
   subtitles write them; the teams were set down from the agent's memory on 18/10/2026, not checked on the web. Only
   names and colours inspired by the teams: no image, logo or drawing of a character. */
export const blueLock: Pack = {
  id: 'blue-lock', kind: 'anime', kindName: 'Animes', name: 'Blue Lock', lead: 'craque',
  colors: ['#1d3fa8', '#9fd3ff', '#ffffff'],
  groups: [
    { id: 'time-z', name: 'Time Z', colors: ['#1d3fa8', '#ffffff', '#ffffff'], players: [{ name: 'Isagi', colors: ['#1e40af', '#93c5fd', '#ffffff'] }, { name: 'Bachira', colors: ['#facc15', '#111111', '#111111'] }, { name: 'Chigiri', colors: ['#b91c1c', '#fecaca', '#ffffff'] }] },
    { id: 'time-v', name: 'Time V', colors: ['#5b2c8f', '#ffffff', '#ffffff'], players: [{ name: 'Nagi', colors: ['#e5e7eb', '#475569', '#111111'] }, 'Reo', 'Zantetsu'] },
    { id: 'bastard-munchen', name: 'Bastard München', colors: ['#b3121f', '#111111', '#ffffff'], players: [{ name: 'Noa', colors: ['#111111', '#e5e7eb', '#ffffff'] }, { name: 'Kaiser', colors: ['#1e3a8a', '#fde047', '#ffffff'] }, 'Ness'] },
    { id: 'manshine-city', name: 'Manshine City', colors: ['#6cabdd', '#1c2c5b', '#111111'], players: ['Chris Prince', 'Nagi', 'Reo'] },
    { id: 'pxg', name: 'PXG', colors: ['#0b1c3d', '#d4af37', '#ffffff'], players: ['Loki', { name: 'Rin', colors: ['#0f766e', '#99f6e4', '#ffffff'] }, 'Karasu'] },
    { id: 'ubers', name: 'Ubers', colors: ['#0a6b37', '#ffffff', '#ffffff'], players: ['Snuffy', 'Barou', 'Aryu'] },
    { id: 'barcha', name: 'Barcha', colors: ['#a50044', '#004d98', '#ffffff'], players: ['Lavinho', 'Bachira', 'Otoya'] },
    { id: 'japao-sub-20', name: 'Japão Sub-20', colors: ['#0b2a6b', '#e60012', '#ffffff'], players: [{ name: 'Sae', colors: ['#7f1d1d', '#fca5a5', '#ffffff'] }, 'Aiku', 'Shidou'] }
  ]
};
