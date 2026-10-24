import type { Pack } from '../teams';

/* O Senhor dos Anéis, by the peoples and sides of the films, with the names used in Brazil. Set down from the agent's
   memory on 24/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const senhorAneis: Pack = {
  id: 'senhor-aneis', kind: 'filmes', kindName: 'Filmes', name: 'O Senhor dos Anéis', lead: 'líder',
  colors: ['#365314', '#d4a017', '#ffffff'],
  groups: [
    { id: 'sociedade', rivals: ['senhor-aneis/mordor'], why: ['a Sociedade do Anel × Sauron'], side: 'heroi', name: 'Sociedade do Anel', colors: ['#115e59', '#d4a017', '#ffffff'], players: ['Frodo', 'Aragorn', 'Gandalf'] },
    { id: 'rohan', rivals: ['senhor-aneis/mordor'], why: ['Rohan × Mordor, no Abismo de Helm'], side: 'heroi', name: 'Rohan', colors: ['#166534', '#fde047', '#ffffff'], players: ['Théoden', 'Éomer', 'Éowyn'] },
    { id: 'gondor', rivals: ['senhor-aneis/mordor'], why: ['Gondor × Mordor, em Minas Tirith'], side: 'heroi', name: 'Gondor', colors: ['#1e3a8a', '#cbd5e1', '#ffffff'], players: ['Boromir', 'Faramir', 'Denethor'] },
    { id: 'mordor', rivals: ['senhor-aneis/sociedade', 'senhor-aneis/gondor', 'senhor-aneis/rohan'], why: ['Sauron × a Sociedade do Anel', 'Mordor × Gondor', 'Mordor × Rohan'], side: 'vilao', name: 'Mordor', colors: ['#111111', '#dc2626', '#ffffff'], players: ['Sauron', 'Saruman', 'Boca de Sauron'] },
    { id: 'elfos', rivals: ['senhor-aneis/mordor'], why: ['os Elfos × Mordor'], side: 'heroi', name: 'Elfos', colors: ['#047857', '#d1fae5', '#ffffff'], players: ['Legolas', 'Elrond', 'Galadriel'] },
    { id: 'anoes', rivals: ['senhor-aneis/mordor'], why: ['os Anões × Mordor'], side: 'heroi', name: 'Anões', colors: ['#7c2d12', '#fbbf24', '#ffffff'], players: ['Gimli', 'Thorin', 'Balin'] }
  ]
};
