import type { Pack } from '../teams';

/* Sonic, by the teams of the series (Sonic Heroes) and Eggman's side, with the names used in Brazil. Set down from the
   agent's memory on 21/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const sonic: Pack = {
  id: 'sonic', kind: 'jogos', kindName: 'Jogos', name: 'Sonic', lead: 'líder', fx: 'velocidade',
  colors: ['#1d4ed8', '#fde047', '#ffffff'],
  groups: [
    { id: 'sonic', rivals: ['sonic/eggman', 'sonic/dark', 'sonic/chaotix'], why: ['Sonic × Dr. Eggman', 'Sonic × Shadow', 'Team Sonic × Team Chaotix'], name: 'Team Sonic', colors: ['#1d4ed8', '#fde047', '#ffffff'], players: [{ name: 'Sonic', colors: ['#1d4ed8', '#fde047', '#ffffff'] }, { name: 'Tails', colors: ['#c2410c', '#fef3c7', '#ffffff'] }, { name: 'Knuckles', colors: ['#b91c1c', '#fecaca', '#ffffff'] }] },
    { id: 'dark', rivals: ['sonic/sonic', 'sonic/eggman', 'sonic/rose'], why: ['Shadow × Sonic', 'Team Dark × Dr. Eggman', 'Team Dark × Team Rose'], name: 'Team Dark', colors: ['#111111', '#dc2626', '#ffffff'], players: [{ name: 'Shadow', colors: ['#111111', '#dc2626', '#ffffff'] }, 'Rouge', 'E-123 Omega'] },
    { id: 'rose', rivals: ['sonic/eggman', 'sonic/dark', 'sonic/sonic'], why: ['Amy × Dr. Eggman', 'Team Rose × Team Dark', 'Amy correndo atrás do Sonic'], name: 'Team Rose', colors: ['#be185d', '#fce7f3', '#ffffff'], players: ['Amy', 'Cream', 'Big'] },
    { id: 'chaotix', rivals: ['sonic/sonic', 'sonic/eggman', 'sonic/dark'], why: ['Team Chaotix × Team Sonic', 'os detetives × Dr. Eggman', 'Team Chaotix × Team Dark'], name: 'Team Chaotix', colors: ['#166534', '#fde68a', '#ffffff'], players: ['Vector', 'Espio', 'Charmy'] },
    { id: 'eggman', rivals: ['sonic/sonic', 'sonic/rose', 'sonic/dark'], why: ['Dr. Eggman × Sonic', 'Dr. Eggman × Team Rose', 'Dr. Eggman × Team Dark'], name: 'Império Eggman', colors: ['#7f1d1d', '#fde68a', '#ffffff'], players: ['Dr. Eggman', 'Metal Sonic', 'Orbot'] }
  ]
};
