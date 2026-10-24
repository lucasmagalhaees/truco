import type { Pack } from '../teams';

/* Dragon Ball (the classic and Z), by the groups of the series, with the names of the Brazilian dub. Set down from the
   agent's memory on 18/10/2026, not checked on the web. Only names and colours: no image or drawing. */
export const dragonBall: Pack = {
  id: 'dragon-ball', kind: 'anime', kindName: 'Animes', name: 'Dragon Ball', lead: 'líder', fx: 'fogo',
  colors: ['#ea580c', '#1d4ed8', '#111111'],
  groups: [
    { id: 'guerreiros-z', rivals: ['dragon-ball/freeza', 'dragon-ball/saiyajins', 'dragon-ball/androides'], why: ['Goku × Freeza em Namekusei', 'Goku × Vegeta', 'a saga Cell'], side: 'heroi', name: 'Guerreiros Z', colors: ['#f28c28', '#1f4fa0', '#111111'], players: [{ name: 'Goku', colors: ['#f97316', '#1d4ed8', '#111111'] }, { name: 'Gohan', colors: ['#6d28d9', '#fde68a', '#ffffff'] }, 'Kuririn'] },
    { id: 'saiyajins', rivals: ['dragon-ball/guerreiros-z', 'dragon-ball/freeza', 'dragon-ball/ginyu'], why: ['Vegeta × Goku', 'Vegeta × Freeza', 'Vegeta contra a Força Ginyu'], side: 'vilao', name: 'Saiyajins', colors: ['#1e3a8a', '#f2f2f2', '#ffffff'], players: [{ name: 'Vegeta', colors: ['#1e40af', '#f5f5f5', '#ffffff'] }, 'Nappa', 'Raditz'] },
    { id: 'kame', rivals: ['dragon-ball/patrulha', 'dragon-ball/grou'], why: ['Goku contra a Patrulha Vermelha', 'Tartaruga × Grou no Tenkaichi'], side: 'heroi', name: 'Turma do Kame', colors: ['#f59e0b', '#7c2d12', '#111111'], players: ['Mestre Kame', 'Yamcha', 'Bulma'] },
    { id: 'grou', rivals: ['dragon-ball/kame'], why: ['Grou × Tartaruga no Tenkaichi'], side: 'heroi', name: 'Escola do Grou', colors: ['#7c2d12', '#fde68a', '#ffffff'], players: ['Tenshinhan', 'Chaos', 'Mestre Tsuru'] },
    { id: 'namek', rivals: ['dragon-ball/freeza', 'dragon-ball/androides', 'dragon-ball/saiyajins'], why: ['Freeza invadiu Namekusei', 'Piccolo × Cell', 'Piccolo × Nappa'], side: 'heroi', name: 'Namekuseijins', colors: ['#166534', '#c4b5fd', '#ffffff'], players: [{ name: 'Piccolo', colors: ['#15803d', '#ede9fe', '#ffffff'] }, 'Kami-Sama', 'Dende'] },
    { id: 'ginyu', rivals: ['dragon-ball/guerreiros-z', 'dragon-ball/saiyajins'], why: ['a luta em Namekusei', 'a Força Ginyu × Vegeta'], side: 'vilao', name: 'Força Ginyu', colors: ['#6b21a8', '#f2f2f2', '#ffffff'], players: ['Capitão Ginyu', 'Rikum', 'Jeice'] },
    { id: 'freeza', rivals: ['dragon-ball/guerreiros-z', 'dragon-ball/saiyajins', 'dragon-ball/namek'], why: ['Freeza × Goku em Namekusei', 'Freeza destruiu o planeta Vegeta', 'Freeza invadiu Namekusei'], side: 'vilao', name: 'Família de Freeza', colors: ['#f3f0ff', '#7c3aed', '#111111'], players: [{ name: 'Freeza', colors: ['#ede9fe', '#7e22ce', '#111111'] }, 'Cooler', 'Rei Cold'] },
    { id: 'androides', rivals: ['dragon-ball/guerreiros-z', 'dragon-ball/namek'], why: ['a saga Cell', 'Cell × Piccolo'], side: 'vilao', name: 'Androides', colors: ['#1f2937', '#f97316', '#ffffff'], players: ['Androide 17', 'Androide 18', { name: 'Cell', colors: ['#365314', '#bef264', '#ffffff'] }] },
    { id: 'patrulha', rivals: ['dragon-ball/kame'], why: ['a Patrulha Vermelha × Goku'], side: 'vilao', name: 'Patrulha Vermelha', colors: ['#b91c1c', '#111111', '#ffffff'], players: ['Comandante Red', 'General Blue', 'Coronel Silver'] },
    { id: 'majin', rivals: ['dragon-ball/guerreiros-z'], why: ['a saga Boo'], side: 'vilao', name: 'Majin Boo', colors: ['#f472b6', '#111111', '#111111'], players: ['Majin Boo', 'Babidi', 'Dabura'] }
  ]
};
