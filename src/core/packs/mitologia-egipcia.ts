import type { Pack } from '../teams';

/* Mitologia Egípcia, by groups and sides of the myths, with the names used in Brazil. Set down from the agent's memory
   on 24/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const mitologiaEgipcia: Pack = {
  id: 'mitologia-egipcia', kind: 'mitologia', kindName: 'Mitologia', name: 'Mitologia Egípcia', lead: 'líder',
  colors: ['#d4a017', '#1e3a8a', '#111111'],
  groups: [
    { id: 'heliopolis', rivals: ['mitologia-egipcia/submundo'], why: ['os Deuses de Heliópolis × os Deuses do Submundo'], side: 'heroi', name: 'Deuses de Heliópolis', colors: ['#d4a017', '#1e3a8a', '#111111'], players: ['Rá', 'Osíris', 'Ísis'] },
    { id: 'submundo', rivals: ['mitologia-egipcia/heliopolis', 'mitologia-egipcia/protetores', 'mitologia-egipcia/criaturas'], why: ['Set × os Deuses de Heliópolis', 'Set × Hórus e os Protetores', 'o Submundo × as Criaturas'], side: 'vilao', name: 'Deuses do Submundo', colors: ['#111111', '#a3e635', '#ffffff'], players: ['Anúbis', 'Set', 'Néftis'] },
    { id: 'protetores', rivals: ['mitologia-egipcia/submundo'], why: ['Hórus × Set'], side: 'heroi', name: 'Protetores', colors: ['#1e3a8a', '#fcd34d', '#ffffff'], players: ['Hórus', 'Thoth', 'Bastet'] },
    { id: 'criaturas', rivals: ['mitologia-egipcia/protetores', 'mitologia-egipcia/heliopolis', 'mitologia-egipcia/submundo'], why: ['as Criaturas × os Protetores', 'as Criaturas × Heliópolis', 'Apep × o Submundo'], side: 'vilao', name: 'Criaturas', colors: ['#7c2d12', '#f59e0b', '#ffffff'], players: ['Ammit', 'Apep', 'Esfinge'] }
  ]
};
