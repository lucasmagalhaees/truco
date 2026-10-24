import type { Pack } from '../teams';

/* Piratas do Caribe, by crews and sides of the films, with the names used in Brazil. Set down from the agent's memory on
   21/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const piratas: Pack = {
  id: 'piratas', kind: 'filmes', kindName: 'Filmes', name: 'Piratas do Caribe', lead: 'capitão', fx: 'agua',
  colors: ['#1c1917', '#d4a017', '#ffffff'],
  groups: [
    { id: 'perola', rivals: ['piratas/holandes', 'piratas/companhia', 'piratas/barba-negra'], why: ['Jack Sparrow × Davy Jones', 'Jack Sparrow × Beckett', 'Jack Sparrow × Barba Negra'], name: 'Tripulação do Pérola Negra', colors: ['#1c1917', '#d4a017', '#ffffff'], players: ['Jack Sparrow', 'Will Turner', 'Elizabeth Swann'] },
    { id: 'barbossa', rivals: ['piratas/perola', 'piratas/barba-negra', 'piratas/marinha'], why: ['Barbossa × Jack Sparrow, pelo Pérola', 'Barbossa × Barba Negra', 'os amaldiçoados × a Marinha'], name: 'Amaldiçoados de Barbossa', colors: ['#3f3f46', '#a3e635', '#ffffff'], players: ['Hector Barbossa', 'Pintel', 'Ragetti'] },
    { id: 'holandes', rivals: ['piratas/perola', 'piratas/companhia', 'piratas/barbossa'], why: ['Davy Jones × Jack Sparrow', 'Davy Jones × Beckett', 'o Holandês × Barbossa'], name: 'Holandês Voador', colors: ['#134e4a', '#99f6e4', '#ffffff'], players: ['Davy Jones', 'Bill Turner', 'Maccus'] },
    { id: 'companhia', rivals: ['piratas/perola', 'piratas/holandes', 'piratas/barbossa'], why: ['Beckett × Jack Sparrow', 'Beckett × Davy Jones', 'a Companhia × os piratas'], name: 'Companhia das Índias', colors: ['#7f1d1d', '#fde68a', '#ffffff'], players: ['Lorde Beckett', 'Mercer', 'Comodoro Norrington'] },
    { id: 'barba-negra', rivals: ['piratas/perola', 'piratas/barbossa', 'piratas/marinha'], why: ['Barba Negra × Jack Sparrow', 'Barba Negra × Barbossa', 'Barba Negra × a Marinha'], name: 'Vingança da Rainha Ana', colors: ['#111111', '#f97316', '#ffffff'], players: ['Barba Negra', 'Angélica', 'Scrum'] },
    { id: 'marinha', rivals: ['piratas/perola', 'piratas/barbossa', 'piratas/barba-negra'], why: ['a Marinha × Jack Sparrow', 'a Marinha × os amaldiçoados', 'a Marinha × Barba Negra'], name: 'Marinha Real', colors: ['#1e3a8a', '#f5f5f4', '#ffffff'], players: ['Governador Swann', 'Tenente Gillette', 'Murtogg'] }
  ]
};
