import type { Pack } from '../teams';

/* Avatar: A Lenda de Aang, by nations and sides of the story, with the names used in Brazil. Set down from the agent's
   memory on 21/10/2026, not checked on the web. Only names and colours: no image, logo or drawing. */
export const avatar: Pack = {
  id: 'avatar', kind: 'anime', kindName: 'Animes', name: 'Avatar: A Lenda de Aang', lead: 'líder', fx: 'agua',
  colors: ['#0e5a8a', '#fbbf24', '#ffffff'],
  groups: [
    { id: 'time-avatar', rivals: ['avatar/familia-real', 'avatar/azula', 'avatar/zuko'], why: ['Aang × Senhor do Fogo Ozai', 'Aang × Azula', 'Aang × Zuko, no começo'], name: 'Time Avatar', colors: ['#0e5a8a', '#fbbf24', '#ffffff'], players: [{ name: 'Aang', colors: ['#c2410c', '#fde68a', '#ffffff'] }, { name: 'Katara', colors: ['#1e40af', '#bfdbfe', '#ffffff'] }, 'Sokka'] },
    { id: 'zuko', rivals: ['avatar/time-avatar', 'avatar/azula', 'avatar/familia-real'], why: ['Zuko caçando o Avatar', 'Zuko × Azula', 'Zuko × Ozai'], name: 'Zuko e Iroh', colors: ['#991b1b', '#fcd34d', '#ffffff'], players: [{ name: 'Zuko', colors: ['#7f1d1d', '#fca5a5', '#ffffff'] }, { name: 'Iroh', colors: ['#9a3412', '#fed7aa', '#ffffff'] }, 'Tenente Jee'] },
    { id: 'azula', rivals: ['avatar/time-avatar', 'avatar/zuko', 'avatar/kyoshi'], why: ['Azula atrás do Avatar', 'Azula × Zuko', 'Ty Lee × Suki'], name: 'Azula, Mai e Ty Lee', colors: ['#4c1d95', '#f0abfc', '#ffffff'], players: [{ name: 'Azula', colors: ['#3b0764', '#a5f3fc', '#ffffff'] }, 'Mai', 'Ty Lee'] },
    { id: 'familia-real', rivals: ['avatar/time-avatar', 'avatar/lotus', 'avatar/zuko'], why: ['Ozai × Aang', 'Ozai × Iroh e a Lótus Branca', 'Ozai × Zuko'], name: 'Família Real do Fogo', colors: ['#450a0a', '#f59e0b', '#ffffff'], players: ['Senhor do Fogo Ozai', 'Azula', 'Almirante Zhao'] },
    { id: 'terra', rivals: ['avatar/dai-li', 'avatar/familia-real', 'avatar/azula'], why: ['Toph e Bumi × Dai Li', 'Reino da Terra × Nação do Fogo', 'Toph × Azula'], name: 'Reino da Terra', colors: ['#166534', '#fde68a', '#ffffff'], players: [{ name: 'Toph', colors: ['#14532d', '#bbf7d0', '#ffffff'] }, 'Rei Bumi', 'Haru'] },
    { id: 'kyoshi', rivals: ['avatar/azula', 'avatar/familia-real', 'avatar/dai-li'], why: ['Suki × Ty Lee e Azula', 'Guerreiras Kyoshi × Nação do Fogo', 'Kyoshi × Dai Li'], name: 'Guerreiras Kyoshi', colors: ['#14532d', '#fecaca', '#ffffff'], players: ['Suki', 'Avatar Kyoshi', 'Oyaji'] },
    { id: 'lotus', rivals: ['avatar/familia-real', 'avatar/dai-li', 'avatar/azula'], why: ['A Lótus Branca retoma Ba Sing Se', 'Lótus Branca × Dai Li', 'Iroh × Azula'], name: 'Lótus Branca', colors: ['#f5f5f4', '#1e3a8a', '#111111'], players: ['Iroh', 'Mestre Pakku', 'Jeong Jeong'] },
    { id: 'dai-li', rivals: ['avatar/terra', 'avatar/lotus', 'avatar/time-avatar'], why: ['Dai Li × Reino da Terra', 'Dai Li × Lótus Branca', 'Long Feng × Time Avatar'], name: 'Dai Li', colors: ['#1c1917', '#84cc16', '#ffffff'], players: ['Long Feng', 'Agente Dai Li', 'Joo Dee'] }
  ]
};
