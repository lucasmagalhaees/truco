import { Core } from '../core';
import type { Card, Drill, Game, Play, RealTable, Seat, Target, Team, Word } from '../core';
import { $, esc, part } from './format';
import { S, applyClub, table, TABS, ui } from './state';
import type { Tab } from './state';
import { builtFrom, canUpdate } from './update';
import { canListen } from './voice';
import { canPlayOnline, inRoom, net, roomLink } from './net';
import { HAND_PAUSE } from './events';

/* ================= the screen =================
   Rendering is innerHTML from the state. Every text that did not come from the code goes through esc().
   Only what just changed moves: the hand is dealt in a fan when a new hand starts, a card flies in from the seat that
   played it, the card that took a round glows, the score bumps when it changes. A repaint with nothing new moves
   nothing. "Rodinhas" (S.hints, on unless turned off) add the help a beginner needs: the manilhas marked in the hand,
   the strength of each card, who is taking the round, why a round was taken, the ranking with this vira. */
let seenHand = -1, seenPlayed = 0, seenLast = '', seenScore = '';

export function render(): void {
  const view = part('view'), active = document.activeElement;
  if (active && view.contains(active) && active.matches('input')) return;        // never throw away what is being typed
  const online = inRoom(), g = online ? (net.view?.game ?? null) : S.game;
  applyClub(online ? g : undefined);
  seatNames = g ? g.names : table().names;
  const sc = g ? g.score.join('-') : '';
  const bump = !!g && seenScore !== '' && sc !== seenScore; seenScore = sc;
  part('score').innerHTML = !g ? '' : Core.teamsOf(g) === 3
    ? g.score.map((p, t) => `<span class="chip ${TEAM_CLS[t]}${bump ? ' bump' : ''}" id="chip${t}"><span class="nm">${t === 0 ? 'Nós' : esc(pairName(g, t as Team))}</span> ${p}</span>`).join('')
    : (() => { const [a, b] = sideNames(g); return `<span class="chip nos${bump ? ' bump' : ''}" id="chip0"><span class="nm">Nós${a ? `: ${esc(a)}` : ''}</span> ${g.score[0]}</span><span class="chip eles${bump ? ' bump' : ''}" id="chip1"><span class="nm">Eles${b ? `: ${esc(b)}` : ''}</span> ${g.score[1]}</span>`; })();
  const atHome = !online && !g && !ui.drill && !ui.real, tabs = part('tabs');
  tabs.hidden = !atHome; tabs.innerHTML = atHome ? vTabs() : ''; document.body.classList.toggle('tabbed', atHome); document.body.classList.toggle('ingame', !!g);
  view.innerHTML = online ? (g ? vNet() + vGame(g) : vLobby()) : g ? vGame(g) : ui.drill ? vDrill(ui.drill) : ui.real ? vReal(S.real) : vHome();
}

/* ---------- cards ---------- */
export const SUIT: Record<string, string> = { o: '♦', e: '♠', c: '♥', p: '♣' };
const hints = (): boolean => S.hints !== false;
/** The names at the table: the game's, or the ones the chosen club gives. */
let seatNames: string[] = Core.SEATS;
const name = (s: Seat): string => esc(seatNames[s]);
/** The class of each pair's colour: ours, theirs and, with three pairs, the third one. */
const TEAM_CLS = ['nos', 'eles', 't2'];
/** A pair, in words, as it shows in the score of three pairs: the person in it, or its first seat if nobody is. */
function pairName(g: Game, t: Team): string {
  const p = Core.partnerOf(g, t);
  return g.names[g.humans.includes(p) && !g.humans.includes(t) ? p : t];
}
/** Who a pair is, in a sentence: "nós", or (with three pairs) the pair's name; "eles" with two. */
const pairSay = (g: Game, t: Team | null): string => (t === 0 ? 'Nós' : Core.teamsOf(g) === 3 && t !== null ? esc(pairName(g, t)) : 'Eles');
/** Where a card stands with this vira: 1 for the zap, 2 for copas… down to the 4s. */
const place = (c: Card, vira: Card): number => Core.ranking(vira).findIndex(r => r.cards.includes(c)) + 1;
/** A card face. With `vira`, a manilha gets its nickname, and with rodinhas every card gets its place in the ranking. */
export function face(c: Card, vira?: Card, help = false): string {
  const man = !!vira && Core.isManilha(c, vira);
  return `<span class="pc${c[1] === 'o' || c[1] === 'c' ? ' red' : ''}${man ? ' man' : ''}" data-c="${c}" aria-label="${Core.cardName(c)}"><b>${c[0]}</b><i>${SUIT[c[1]]}</i>${man ? `<em>${Core.MANILHA_NAME[c[1]]}</em>` : ''}${help && vira ? `<small>${place(c, vira)}º</small>` : ''}</span>`;
}
const back = (): string => '<span class="pc back" aria-hidden="true"></span>';
const SAY: Record<Word, string[]> = {
  truco: ['TRUCO!', 'TRUCO, ladrão!', 'Truco! Desce!'], seis: ['SEIS!', 'SEIS, marreco!'], nove: ['NOVE!', 'Vai NOVE!'], doze: ['DOZE!', 'DOZE e acabou!'],
  aceito: ['Aceito!', 'Desce!', 'Bora!'], corro: ['Corro.', 'Tô fora.', 'Pode levar.'], jogo: ['Jogo!', 'Vamo nessa!'], fujo: ['Fujo.', 'Essa não dá.']
};
const said = (g: Game, w: Word): string => SAY[w][g.log.length % SAY[w].length];
const WORD: Record<number, string> = { 3: 'Truco', 6: 'Seis', 9: 'Nove', 12: 'Doze' };
const LOUD: Word[] = ['truco', 'seis', 'nove', 'doze'];
/** Who sits at seat `s`, for a sentence (plain text, escape it before drawing): "Você" for the person. */
export const whoIs = (g: Game, s: Seat): string => (s === 0 ? 'Você' : g.names[s] || Core.SEATS[s] || '');
/** Whether the raise open now was asked back, over another one (the answer to a raise was a raise). */
const askedBack = (g: Game): boolean => /aceitou e pediu \w+!$/.test([...g.log].reverse().find(l => / pediu (truco|seis|nove|doze)!$/.test(l)) || '');
/** The raise open now, with the name of who asked: "Biu pediu TRUCO!", "Você pediu SEIS de volta!" (plain text). */
export const askLine = (g: Game): string => (g.ask ? `${whoIs(g, g.ask.by)} pediu ${WORD[g.ask.value].toUpperCase()}${askedBack(g) ? ' de volta' : ''}!` : '');
/** What was just said at the table, with the name of who said it (plain text): a raise, "Biu aceitou", "Você correu". */
export function shoutLine(g: Game): string {
  const sh = g.shout;
  if (!sh) return '';
  const w = whoIs(g, sh.seat);
  if (LOUD.includes(sh.word)) return `${w} pediu ${sh.word.toUpperCase()}${askedBack(g) ? ' de volta' : ''}!`;
  return { aceito: `${w} aceitou`, corro: `${w} correu`, jogo: `${w} topou jogar a mão de onze`, fujo: `${w} correu da mão de onze` }[sh.word as 'aceito'] || '';
}
/** The name of the team on each side of the game (from the colour key the game keeps: a team, a character's team or a
 *  pack); "Eles" without a key of its own plays with the others of our team. Nothing with three pairs. */
function sideNames(g: Game): [string | null, string | null] {
  if (Core.teamsOf(g) === 3) return [null, null];
  const of = (k: string | null): string | null => { if (!k) return null; const c = Core.charById(k); return c ? c.team.name : Core.teamById(k)?.name || Core.packById(k)?.name || null; };
  const a = of(g.sides[0]);
  return [a, of(g.sides[1]) || a];
}

/* ---------- before a game: home ---------- */
const LEVEL: Record<string, [string, string]> = {
  facil: ['Fácil', 'Joga às vezes sem pensar, quase não blefa e cai em blefe.'],
  medio: ['Médio', 'Joga como gente de bar: carta certa, truco com mão boa, um blefe de vez em quando.'],
  dificil: ['Difícil', 'Lembra de cada carta que saiu, sabe quando uma carta não perde mais, guarda a garantida, blefa na hora certa e paga blefe.'],
  extremo: ['Extremo', 'Conta as cartas como gente: pelo que saiu e pelo que cada um pediu, faz a conta do que pode estar na mão de quem, e escolhe carta, truco, aceite e blefe por ela. Nunca espia carta de ninguém.']
};
/* ---------- the start screen: five tabs, each a small tree of screens (see nav.ts) ---------- */
const TAB_LABEL: Record<Tab, string> = { jogar: 'Jogar', treinar: 'Treinar', real: 'Mesa real', equipe: 'Equipe', ajustes: 'Ajustes' };
const TAB_ICON: Record<Tab, string> = {
  jogar: '<rect x="4" y="5" width="10" height="14" rx="2"/><path d="M14 7l4 1.2-2.6 11.6-5-1.3"/>',
  treinar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  real: '<ellipse cx="12" cy="12" rx="9" ry="6"/><rect x="9.5" y="9" width="5" height="6" rx="1"/>',
  equipe: '<path d="M8 4l-4 3 2 3 2-1v11h8V9l2 1 2-3-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'
};
/** The tab bar: at the bottom, like an app's, within reach of the thumb. Only on the start screen. */
function vTabs(): string {
  const on = ui.route[0] as Tab;
  return TABS.map(t => `<button role="tab" id="tab-${t}" class="tab${on === t ? ' on' : ''}" data-act="tab" data-v="${t}" aria-selected="${on === t}" aria-controls="panel" tabindex="${on === t ? 0 : -1}"><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON[t]}</svg><span>${TAB_LABEL[t]}</span></button>`).join('');
}
/** A screen: its title, a way back (below the root of a tab), and what is in it. */
interface Screen { title: string; body: string; depth: number }
/** A line that opens another screen. */
const entry = (to: string, title: string, sub = '', mark = ''): string =>
  `<button class="entry" data-act="go" data-v="${esc(to)}">${mark}<span class="etext"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="chev" aria-hidden="true">›</span></button>`;
/** A small strip in a team's colours, the only place the catalogue's colours show outside the masthead and the score. */
const swatch = (c?: [string, string, string] | null): string => (c ? `<span class="sw" style="--a:${esc(c[0])};--b:${esc(c[1])}" aria-hidden="true"></span>` : '<span class="sw none" aria-hidden="true"></span>');
/** Who sits at the table now, team against team, in one sentence: "você e Pedro (Flamengo) contra Vitor Roque e Flaco
 *  López (Palmeiras)". Without a rival team, the others of your own team, and the sentence says so. */
function vsLine(): string {
  const n = table().names.map(esc), t = Core.teamById(S.team), rv = Core.teamById(S.rival);
  if (!t) return `mesa de bar: você e <b>${n[2]}</b> contra <b>${n[1]}</b> e <b>${n[3]}</b>`;
  if (rv) return `você e <b>${n[2]}</b> (${esc(t.name)}) contra <b>${n[1]}</b> e <b>${n[3]}</b> (${esc(rv.name)}${Core.suggestRivals(t.id).some(x => x.id === rv.id) ? ', rival direto' : ''})`;
  return `você e <b>${n[2]}</b> (${esc(t.name)}) contra <b>${n[1]}</b> e <b>${n[3]}</b>, os outros dois da equipe ${esc(t.name)}: nenhuma equipe adversária escolhida`;
}
function tableNow(): string {
  return `<p class="now" id="tablenow">Sua mesa agora: ${vsLine()}.${h2hNote()}</p>`;
}
/** A record "3 a 1" told from the person's side: "pra você", "pra eles" or "empatado". */
function h2hScore(rec: { w: number; l: number }): string {
  return rec.w === rec.l ? `${rec.w} a ${rec.l}, empatado` : rec.w > rec.l ? `${rec.w} a ${rec.l} pra você` : `${rec.l} a ${rec.w} pra eles`;
}
/** The head-to-head of the matchup set now (D22), when a team and a rival are chosen and they have met: " Flamengo x
 *  Fluminense: 3 a 1 pra você." Empty otherwise. */
function h2hNote(): string {
  const t = Core.teamById(S.team), rv = Core.teamById(S.rival);
  const rec = t && rv ? Core.h2hOf(S.h2h, t.id, rv.id) : null;
  if (!t || !rv || !rec || (!rec.w && !rec.l)) return '';
  return ` <span class="h2h" id="h2h">${esc(t.name)} x ${esc(rv.name)}: ${h2hScore(rec)}.</span>`;
}
/** At the end of a game (D22), the updated head-to-head: "Agora 4 a 1 no clássico contra Fluminense." Only off a phone,
 *  with a team and a rival. "no clássico" when the rival is a direct one, else "no retrospecto". */
function h2hEndLine(): string {
  const t = Core.teamById(S.team), rv = Core.teamById(S.rival);
  const rec = t && rv ? Core.h2hOf(S.h2h, t.id, rv.id) : null;
  if (inRoom() || !t || !rv || !rec) return '';
  const direct = Core.suggestRivals(t.id).some(x => x.id === rv.id);
  return `<p class="hint" id="h2hend">Agora ${rec.w} a ${rec.l} ${direct ? 'no clássico' : 'no retrospecto'} contra ${esc(rv.name)}.</p>`;
}
/** A small neutral pill with the record against a team, in the list of possible rivals; empty if they have not met. */
function h2hPill(a: string, b: string): string {
  const rec = Core.h2hOf(S.h2h, a, b);
  return rec && (rec.w || rec.l) ? `<span class="pastilha" aria-label="Seu retrospecto contra: ${rec.w} a ${rec.l}">${rec.w}–${rec.l}</span>` : '';
}
function vHome(): string {
  const sc = screenOf(ui.route), tab = ui.route[0] as Tab;
  const head = sc.depth > 1
    ? `<header class="screenhead"><button class="back" data-act="back"><span aria-hidden="true">‹</span> Voltar</button><h1 id="screentitle">${sc.title}</h1></header>`
    : `<header class="screenhead root"><h1 id="screentitle">${sc.title}</h1></header>`;
  return `<div class="tabpanel" role="tabpanel" id="panel" aria-labelledby="tab-${tab}" data-route="${esc(ui.route.slice(0, sc.depth).join('/'))}">${head}${sc.body}</div>`;
}
/** The screen for a path; a path that goes nowhere stops at the last screen that exists. */
function screenOf(r: string[]): Screen {
  const tab = r[0] as Tab, lv = S.level, t = S.tally, tr = S.train;
  if (tab === 'jogar') {
    if (r[1] === 'online') return { title: 'Jogar online', body: vOnline(), depth: 2 };
    if (r[1] === 'numeros') return { title: 'Números', body: vStats(), depth: 2 };
    const lvBtn = (v: string): string => `<button class="${lv === v ? 'on' : ''}" data-act="level" data-v="${v}" aria-pressed="${lv === v}">${LEVEL[v][0]}</button>`;
    return { title: 'Jogar', depth: 1, body: `${tableNow()}<section class="card" id="start">
    <p id="lineup">Quem fizer ${Core.WIN_POINTS} pontos primeiro leva. Nível da IA:</p>
    <div class="segm" role="group" aria-label="Dificuldade">${Core.LEVELS.map(lvBtn).join('')}</div><p class="hint" id="leveltext">${LEVEL[lv][1]}</p>
    <button class="btn block" data-act="new">Dar as cartas</button>
    <p class="hint" id="tally">${t.w + t.l ? `Neste aparelho: ${t.w} ${t.w === 1 ? 'vitória' : 'vitórias'} e ${t.l} ${t.l === 1 ? 'derrota' : 'derrotas'}.` : 'Nenhuma partida terminada ainda.'}</p></section>
    <nav class="entries">${entry('jogar/online', 'Jogar online', 'Com amigos, cada um no seu celular')}${entry('jogar/numeros', 'Números', 'Vitórias por nível, blefe pago, sua sequência')}${entry('equipe', 'Trocar quem senta na mesa', 'Sua equipe contra a equipe adversária')}</nav>` };
  }
  if (tab === 'treinar') {
    if (r[1] === 'ranking') return { title: 'Ranking da vira', body: vGloss('rank'), depth: 2 };
    if (r[1] === 'glossario') return { title: 'Glossário', body: vGloss('terms'), depth: 2 };
    if (r[1] === 'regras') return { title: 'Como joga', body: vRules(), depth: 2 };
    return { title: 'Treinar', depth: 1, body: `<section class="card" id="train">
    <p>Exercícios rápidos pra ver na hora o que manda na mesa.</p>
    <div class="pick"><button class="btn ghost" data-act="drill" data-k="manilha">Qual é a manilha?</button><button class="btn ghost" data-act="drill" data-k="round">Quem ganha a rodada?</button></div>
    <p class="hint" id="trainstats">${tr.total ? `Acertos: ${tr.ok} de ${tr.total} (${Math.round(100 * tr.ok / tr.total)}%). Melhor sequência: ${tr.best}.` : 'Nenhum exercício feito ainda.'}</p></section>
    <nav class="entries">${entry('treinar/ranking', 'Ranking da vira', 'Escolha a vira e veja da mais forte pra mais fraca')}${entry('treinar/glossario', 'Glossário', 'Zap, espadilha, cangar, mão de ferro…')}${entry('treinar/regras', 'Como joga', 'As regras do truco paulista')}</nav>` };
  }
  if (tab === 'real') return { title: 'Mesa real', depth: 1, body: `<section class="card" id="realcard">
    <p>Jogando de verdade? Diga a vira e suas cartas (num toque ou falando) e o app mostra o ranking, as manilhas, o que ainda pode ganhar de você e qual carta joga.</p>
    <button class="btn block" data-act="real">Abrir o assistente</button></section>` };
  if (tab === 'equipe') return equipeScreen(r);
  return { title: 'Ajustes', body: vSettings(), depth: 1 };
}
/** The suggested rivals of a team (D16): which one is in use ("Rival direto 2 de 3: Vasco — o Clássico dos Milhões"),
 *  or, with a rival chosen by hand or none, the first one as an option; one button goes through them in order. */
function suggestCard(team: string, rv: { id: string; name: string } | null): string {
  const list = Core.suggestRivals(team), i = rv ? list.findIndex(x => x.id === rv.id) : -1;
  if (!list.length) return rv ? `<p class="now">Adversária agora: <b>${esc(rv.name)}</b>.</p>` : '';
  const say = (k: number): string => `<b>${esc((Core.teamById(list[k].id) as { name: string }).name)}</b> — ${esc(list[k].why)}`;
  const now = i >= 0 ? `<p class="now" id="rivalnow">Rival direto ${i + 1} de ${list.length}: ${say(i)}.</p>`
    : `${rv ? `<p class="now" id="rivalnow">Adversária agora: <b>${esc(rv.name)}</b>, escolhida por você.</p>` : ''}<p class="hint" id="rivalhint">Rival direto sugerido: ${say(0)}.</p>`;
  return `<section class="card" id="suggest">${now}<button class="btn block" data-act="suggest" id="suggestbtn">Escolher rival sugerido</button>${list.length > 1 ? `<p class="hint">Cada toque passa para o próximo dos ${list.length} sugeridos.</p>` : ''}</section>`;
}
/** The Equipe tab (D15): the main way is team against team. (a) your team, kind → universe → team, whose first is your
 *  partner; (b) the other team, whole, by the same tree, whose first two play against you; (c) the table in one sentence.
 *  Without a rival team, the other two of your own team play against you, and the sentence says so. A kind with one
 *  universe (football) skips the universe. */
function equipeScreen(r: string[]): Screen {
  const t = Core.teamById(S.team), rv = Core.teamById(S.rival);
  const p = t ? Core.playersOf(t.id, S.custom) : null;
  const pickTeam = (base: 'time' | 'rivais'): Screen => {
    const kinds = Core.kinds(), kind = kinds.find(k => k.id === r[2]), act = base === 'time' ? 'team' : 'rival', cur = base === 'time' ? S.team : S.rival;
    const title = base === 'time' ? 'Sua equipe' : 'Equipe adversária';
    if (!kind) {
      const head = base === 'rivais'
        ? (t && p ? `<p class="hint">A equipe inteira contra a sua: os dois primeiros dela jogam contra você e ${esc(p[0])}. Pode ser de qualquer tema.</p>${suggestCard(t.id, rv)}${rv ? '<button class="btn ghost block" data-act="mode" data-v="own">Sem equipe adversária</button>' : '<p class="hint">Sem escolher, os adversários são os outros dois da sua equipe.</p>'}` : '<p class="hint">Primeiro escolha a sua equipe; depois, a adversária.</p>')
        : `<p class="hint">O primeiro da equipe (o ${t ? esc(t.pack.lead) : 'craque ou o líder'}) é a sua dupla.</p>`;
      if (base === 'rivais' && !t) return { title, depth: 2, body: head + `<nav class="entries">${entry('equipe/time', 'Escolher a sua equipe')}</nav>` };
      // the suggested rival in use: the tree of teams waits behind "Escolher outra"
      if (base === 'rivais' && rv && S.rivalAuto && !ui.otherRival) return { title, depth: 2, body: `${head}<button class="btn ghost block" data-act="otherrival" id="otherrival">Escolher outra</button>` };
      return { title, depth: 2, body: `${head}<nav class="entries" id="kinds">${kinds.map(k => entry(`equipe/${base}/${k.id}`, esc(k.name), k.packs.length > 1 ? k.packs.map(x => esc(x.name)).join(', ') : `${Core.packTeams(k.packs[0]).length} equipes`)).join('')}</nav>` };
    }
    const pack = kind.packs.length === 1 ? kind.packs[0] : kind.packs.find(x => x.id === r[3]);
    if (!pack) return { title: esc(kind.name), depth: 3, body: `<nav class="entries" id="packs">${kind.packs.map(x => entry(`equipe/${base}/${kind.id}/${x.id}`, esc(x.name), `${Core.packTeams(x).length} equipes`, swatch(x.colors))).join('')}</nav>` };
    const depth = kind.packs.length === 1 ? 3 : 4, list = Core.packTeams(pack).filter(x => base === 'time' || x.id !== S.team);
    return { title: esc(pack.name), depth, body: `<div class="list" id="teams">${list.map(x => `<button class="item${cur === x.id ? ' on' : ''}" data-act="${act}" data-v="${esc(x.id)}" data-back="1" aria-pressed="${cur === x.id}">${swatch(x.colors)}<span class="etext"><b>${esc(x.name)}</b><small>${esc(Core.playersOf(x.id, S.custom).join(', '))}</small></span>${base === 'rivais' && S.team ? h2hPill(S.team, x.id) : ''}${cur === x.id ? '<span class="tick" aria-hidden="true">✓</span>' : ''}</button>`).join('')}</div>` };
  };
  if (r[1] === 'time' || r[1] === 'rivais') return pickTeam(r[1]);
  const current = t && p ? `<section class="card" id="club"><p id="squad">${swatch(t.colors)} <b>${esc(t.name)}</b> (${esc(t.pack.name)}): <b>${esc(p[0])}</b> (${esc(t.pack.lead)}), ${esc(p[1])} e ${esc(p[2])}.</p>
      ${ui.editing ? `<div class="edit" id="edit">${p.map((x, i) => `<div class="field"><input id="pl${i}" maxlength="24" autocomplete="off" value="${esc(x)}" aria-label="${i ? `Jogador ${i + 1}` : esc(t.pack.lead)}"></div>`).join('')}
      <div class="pick"><button class="btn" data-act="saveplayers">Salvar nomes</button><button class="btn ghost" data-act="resetplayers">Voltar aos originais</button></div></div>`
      : `<div class="pick"><button class="btn ghost" data-act="editplayers">Trocar os nomes</button><button class="btn ghost" data-act="team" data-v="">Sem equipe</button></div>`}${t.pack.note ? `<p class="hint">${esc(t.pack.note)}</p>` : ''}</section>`
    : '';
  const theirs = rv ? Core.playersOf(rv.id, S.custom) : null;
  const cap = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);
  return { title: 'Equipe', depth: 1, body: `<section class="card" id="vs"><span class="label">Equipe contra equipe</span><p class="now" id="tablenow">${cap(vsLine())}.${h2hNote()}</p></section>
    <nav class="entries" id="steps">
    ${entry('equipe/time', '1. Sua equipe', t && p ? `${esc(t.name)}: ${esc(p[0])} é a sua dupla` : 'Futebol, animes, jogos')}
    ${entry('equipe/rivais', '2. Equipe adversária', rv && theirs ? `${esc(rv.name)}${t && Core.suggestRivals(t.id).some(x => x.id === rv.id) ? ' (rival direto)' : ''}: ${esc(theirs[0])} e ${esc(theirs[1])} contra você` : t ? 'Nenhuma: os outros dois da sua equipe' : 'Depois de escolher a sua')}</nav>
    ${t ? suggestCard(t.id, rv) : ''}${current}` };
}

/* ---------- playing online ---------- */
/** The code in the address of an invitation link (?sala=ABCDE), if any. */
const invited = (): string => { const c = new URLSearchParams(location.search).get('sala') || ''; return Core.isCode(c.toUpperCase()) ? c.toUpperCase() : ''; };
function vOnline(): string {
  const off = !canPlayOnline(), inv = invited();
  return `<section class="card" id="online">
    <p>Você e uma IA contra um amigo e outra IA, cada um no seu celular. Cabem até 4 pessoas; lugar vazio fica com a IA.</p>
    ${inv ? `<p class="explain" id="invite">Você foi chamado para a sala <b>${inv}</b>. Escreva seu nome e toque em Entrar.</p>` : ''}
    <div class="field"><input id="oname" maxlength="16" autocomplete="nickname" placeholder="seu nome" value="${esc(S.myName || '')}" aria-label="Seu nome" aria-describedby="oname-err"></div>
    <p class="fielderr" id="oname-err" hidden></p>
    <button class="btn block" data-act="createroom"${off ? ' disabled' : ''}>Criar sala</button>
    <div class="or" aria-hidden="true">ou entre com o código</div>
    <div class="row"><div class="field"><input id="ocode" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="código" value="${esc(inv)}" aria-label="Código da sala" aria-describedby="ocode-err"></div><button class="btn ghost" data-act="joinroom"${off ? ' disabled' : ''}>Entrar</button></div>
    <p class="fielderr" id="ocode-err" hidden></p>
    ${off ? '<p class="hint" id="onlineoff">O servidor de salas ainda não está ligado neste endereço.</p>' : '<p class="hint">Quem cria a sala escolhe o nível das IAs (o da aba Jogar).</p>'}</section>`;
}
/** Who sits where in the room, as this person sees it: themselves at the bottom, the partner in front. */
function seatsOf(): { seat: Seat; label: string; human: boolean; online: boolean }[] {
  const v = net.view as NonNullable<typeof net.view>;
  return [0, 1, 2, 3].map(s => { const m = v.members.find(x => x.seat === s); return { seat: s, label: m ? m.name : `IA (${Core.DEFAULT_NAMES[(s + v.seat) % 4]})`, human: !!m, online: !!m && m.online }; });
}
function vLobby(): string {
  const v = net.view;
  if (!v) return `${vConn()}<section class="card" id="lobby"><span class="label">Sala ${esc(S.online?.code || '')}</span><p class="thinking">Entrando na sala…</p><button class="btn ghost block" data-act="leaveroom">Cancelar</button></section>`;
  const seats = seatsOf(), at = (s: Seat): string => { const x = seats[s]; return `<div class="lseat${x.human ? ' human' : ''}${x.human && !x.online ? ' gone' : ''}" id="lseat${s}"><small>${s === 0 ? 'Você' : s === 2 ? 'Sua dupla' : 'Adversário'}</small><b>${esc(x.label)}</b></div>`; };
  const link = roomLink(v.code);
  return `${vConn()}<section class="card" id="lobby"><span class="label">Sala</span>
    <p class="code" id="code">${v.code}</p>
    <p class="hint">Mande o link para quem vai jogar. Quem entrar senta na ordem: o primeiro contra você, depois sua dupla, depois a dupla dele.</p>
    <p class="link" id="link">${esc(link)}</p>
    <div class="pick"><button class="btn ghost" data-act="copylink">Copiar link</button>${typeof navigator.share === 'function' ? '<button class="btn ghost" data-act="sharelink">Compartilhar</button>' : ''}</div>
    ${v.format === 'tres' && v.members.length === 3 ? '' : `<div class="lseats">${at(2)}<div class="lrow">${at(3)}${at(1)}</div>${at(0)}</div>`}
    ${vFormat()}
    ${v.host ? `<p class="hint">Nível das IAs: <b>${LEVEL[v.level][0]}</b>.</p><button class="btn block" data-act="startroom">Começar ${v.members.length === 1 ? 'só com as IAs' : `com ${v.members.length} pessoas`}</button>` : `<p class="thinking">Esperando quem criou a sala começar…</p>`}
    <button class="btn ghost block" data-act="leaveroom">Sair da sala</button></section>`;
}
/** With three people in the room: how they play. The host chooses (two against one, and who plays with a computer, or
 *  three pairs once the core plays them); the others see the choice. */
function vFormat(): string {
  const v = net.view as NonNullable<typeof net.view>;
  if (v.members.length !== 3) return '';
  const three = v.format === 'tres', alone = v.members.find(m => !v.members.some(x => x.seat === (m.seat + 2) % 4));
  const who = (m: { name: string; seat: number }): string => (m.seat === 0 ? 'Você' : esc(m.name));
  if (!v.host) {
    return `<div id="format"><p class="hint">Como vão jogar</p><p class="explain">${three ? 'Três duplas: cada um com uma IA.' : `Dois contra um: <b>${alone ? who(alone) : ''}</b> joga com a IA.`}</p></div>`;
  }
  const soon = !Core.SUPPORTS_THREE;
  return `<div id="format"><p class="hint">Como vão jogar?</p>
    <div class="segm" role="group" aria-label="Como vão jogar"><button class="${three ? '' : 'on'}" data-act="roomformat" data-f="duplas" aria-pressed="${!three}">2 contra 1</button><button class="${three ? 'on' : ''}" data-act="roomformat" data-f="tres" aria-pressed="${three}"${soon ? ' disabled' : ''}>3 duplas${soon ? ' (em breve)' : ''}</button></div>
    ${three ? `<p class="hint">Cada um com uma IA de parceira, seis na mesa: ${v.members.map(m => `<b>${who(m)}</b>`).join(', ')}.</p>` : `<p class="hint">Quem joga com a IA? Os outros dois fazem dupla.</p>
    <div class="segm small" role="group" aria-label="Quem joga com a IA">${v.members.map(m => `<button class="${m === alone ? 'on' : ''}" data-act="roomalone" data-s="${m.seat}" aria-pressed="${m === alone}">${who(m)}</button>`).join('')}</div>`}</div>`;
}
/** A strip at the top while the connection to the room is down: coming back by itself, or given up with a button. */
function vConn(): string {
  if (net.status === 'parado') return '<p class="netbar off" id="netbar" role="status"><span>Sem conexão.</span><button class="btn ghost" data-act="retryroom">Tentar de novo</button></p>';
  if (net.status === 'caiu' || (net.status === 'conectando' && (net.tries > 0 || net.view))) return '<p class="netbar" id="netbar" role="status"><span>Caiu a conexão, voltando…</span></p>';
  return '';
}
/** During a game in a room: the connection, and who dropped out (the host may hand their seat to the computer). */
function vNet(): string {
  const v = net.view;
  if (net.status !== 'na sala') return vConn();
  const gone = v ? v.members.filter(m => !m.online) : [];
  if (!gone.length || !v) return '';
  return `<p class="explain" id="netstatus">${gone.map(m => `<b>${esc(m.name)}</b> saiu da sala`).join(', ')}. A partida espera voltar.${v.host ? gone.map(m => ` <button class="btn ghost" data-act="botseat" data-s="${m.seat}">IA no lugar de ${esc(m.name)}</button>`).join('') : ''}</p>`;
}

/* ---------- the assistant for a real table ---------- */
const TARGET_NAME: Record<Target, string> = { vira: 'a vira', hand: 'sua mão', table: 'a mesa' };
function vReal(t: RealTable): string {
  const a = Core.advise(t), add = (target: Target, label: string): string => `<button class="addcard" data-act="sheet" data-v="${target}" aria-label="Pôr carta em ${TARGET_NAME[target]}">+<small>${label}</small></button>`;
  const vira = t.vira ? `<button class="told" data-act="sheet" data-v="vira" aria-label="Trocar a vira">${face(t.vira)}</button>` : add('vira', 'vira');
  const mine = (a ? a.cards.map(c => `<div class="adv${c.card === a.cheapest ? ' best' : ''}"><button class="told" data-act="untell" data-c="${c.card}" aria-label="Tirar ${Core.cardName(c.card)}">${face(c.card, t.vira as Card, true)}</button><small>${c.sure ? '<b>garantida</b>' : `perde pra ${c.beatenBy}`}</small></div>`).join('')
    : t.hand.map(c => `<div class="adv"><button class="told" data-act="untell" data-c="${c}">${face(c)}</button></div>`).join('')) + (t.hand.length < 3 ? add('hand', 'carta') : '');
  const table = t.table.map(c => `<button class="told${a && a.top === c ? ' top' : ''}" data-act="untell" data-c="${c}" aria-label="Tirar ${Core.cardName(c)}">${face(c, t.vira ?? undefined, false)}</button>`).join('') + (t.table.length < 4 ? add('table', 'carta') : '');
  let tip = '';
  if (a && a.top && t.hand.length) tip = a.cheapest ? `Pra ganhar, a mais barata que leva é ${Core.cardSay(a.cheapest, t.vira as Card)}.` : a.tie ? `Nenhuma sua ganha; ${Core.cardName(a.tie)} canga (empata).` : 'Nenhuma carta sua ganha essa: jogue a mais fraca.';
  else if (a && t.hand.length) { const sure = a.cards.filter(c => c.sure); tip = sure.length ? `${sure.map(c => Core.cardSay(c.card, t.vira as Card)).join(' e ')} não ${sure.length > 1 ? 'perdem' : 'perde'} pra nenhuma carta que ainda pode estar por aí.` : `Sua mais forte é ${Core.cardSay(a.cards[0].card, t.vira as Card)}: ${a.cards[0].beatenBy} ${a.cards[0].beatenBy === 1 ? 'carta ainda ganha' : 'cartas ainda ganham'} dela.`; }
  return `<section class="card" id="real"><span class="label">Mesa real</span>
    <div class="realrow"><div class="realvira"><small>Vira</small>${vira}${t.vira ? `<small>manilha <b>${Core.manilhaRank(t.vira)}</b></small>` : ''}</div>
      <div class="realhand"><small>Sua mão</small><div class="row-cards">${mine}</div></div></div>
    <div class="realtable"><small>Na mesa (esta rodada)</small><div class="row-cards">${table}</div></div>
    <p class="explain" id="realsay">${esc(Core.tableSay(t))}${tip ? ` ${esc(tip)}` : ''}</p>
    ${canListen() ? `<button class="btn ${ui.listening ? '' : 'ghost'} block" data-act="listen" id="mic">${ui.listening ? 'Ouvindo… fale a carta' : '🎤 Falar a carta'}</button><p class="hint">Ex.: “vira sete de copas”, “minha mão zap, três de ouros e rei de espadas”, “mesa dois de paus”.</p>` : ''}
    ${ui.heard ? `<p class="hint" id="heard">Ouvi: “${esc(ui.heard)}”</p>` : ''}
    <div class="pick"><button class="btn ghost" data-act="nextround"${t.table.length ? '' : ' disabled'}>Fim da rodada</button><button class="btn ghost" data-act="resetreal">Nova mão</button></div>
    <button class="btn ghost block" data-act="home">Voltar</button></section>
    ${t.vira ? `<details class="card" id="realrank" open><summary class="label">Ranking com esta vira</summary>${vRanking(t.vira, 'realranking')}</details>` : ''}
    ${ui.sheet ? vSheet(t, ui.sheet) : ''}`;
}
/** The grid of the 40 cards: one tap picks a card for the vira, the hand or the table. Cards already told are off;
 *  with the vira known, the manilhas stand out. */
function vSheet(t: RealTable, target: Target): string {
  const used = new Set([...(t.vira ? [t.vira] : []), ...t.hand, ...t.table, ...t.gone]);
  const rows = Core.RANKS.map(r => `<div class="gridrow">${Core.SUITS.map(s => { const c = r + s, off = used.has(c) && !(target === 'vira' && c === t.vira); return `<button class="gc" data-act="pickcard" data-c="${c}"${off ? ' disabled' : ''} aria-label="${Core.cardName(c)}">${face(c, target === 'vira' ? undefined : t.vira ?? undefined)}</button>`; }).join('')}</div>`).join('');
  return `<div class="sheet" id="sheet" role="dialog" aria-label="Escolher carta"><div class="sheetbox"><div class="sheethead"><b>Carta para ${TARGET_NAME[target]}</b><button class="x" data-act="closesheet" aria-label="Fechar">×</button></div><div class="grid40">${rows}</div></div></div>`;
}
function vRanking(vira: Card, id: string): string {
  const rows = Core.ranking(vira).map((r, i) => `<li class="${r.manilha ? 'man' : ''}"><span class="pos">${i + 1}º</span><span class="cards">${r.cards.map(c => face(c)).join('')}</span><span class="what">${r.manilha ? `${Core.MANILHA_NAME[r.cards[0][1]]}` : ''}</span></li>`).join('');
  return `<ol class="ranking" id="${id}">${rows}</ol><p class="hint">Na mesma linha, empatam: se forem de duplas diferentes, a rodada canga. Só as manilhas desempatam pelo naipe.</p>`;
}
/** The ranking for a chosen vira (`rank`), or the words of the table (`terms`). */
function vGloss(part: 'rank' | 'terms'): string {
  const v = ui.vira, ranks = Core.RANKS.map(r => `<button class="${v[0] === r ? 'on' : ''}" data-act="vira" data-r="${r}" aria-pressed="${v[0] === r}">${r}</button>`).join('');
  if (part === 'rank') return `<section class="card" id="gloss">
    <p>Escolha a vira e veja todas as cartas da mais forte pra mais fraca:</p>
    <div class="segm small" role="group" aria-label="Vira">${ranks}</div>
    <p class="hint">Vira <b>${Core.cardName(v).split(' ')[0]}</b>: a manilha é <b>${Core.manilhaRank(v)}</b>.</p>
    ${vRanking(v, 'glossrank')}</section>`;
  return `<section class="card" id="terms">
    <dl class="gloss">
      <dt>Sequência</dt><dd>Da mais fraca pra mais forte: 4 5 6 7 Q J K A 2 3. Sem manilha, ganha a mais alta.</dd>
      <dt>Vira</dt><dd>A carta virada depois de dar as cartas. Ela não joga: só diz qual é a manilha.</dd>
      <dt>Manilha</dt><dd>As 4 cartas do valor seguinte ao da vira (depois do 3 volta pro 4). Ganham de qualquer outra carta.</dd>
      <dt>Naipe</dt><dd>Só desempata manilha, em ordem crescente: ouros ♦ &lt; espadas ♠ &lt; copas ♥ &lt; paus ♣.</dd>
      <dt>Zap</dt><dd>A manilha de paus ♣. A carta mais forte do jogo.</dd>
      <dt>Copas</dt><dd>A manilha de copas ♥ (tem quem chame de copão). A segunda.</dd>
      <dt>Espadilha</dt><dd>A manilha de espadas ♠. A terceira.</dd>
      <dt>Picafumo</dt><dd>A manilha de ouros ♦ (pica-fumo). A mais fraca das manilhas, mas ganha de qualquer 3.</dd>
      <dt>Cangar (empachar)</dt><dd>Empatar a rodada: as cartas mais fortes têm o mesmo valor e são de duplas diferentes. Naipe não desempata carta comum.</dd>
      <dt>Rodada e mão</dt><dd>Cada mão tem até 3 rodadas; leva a mão quem fizer 2. Empatou a 1ª, quem fizer a 2ª leva. Empatou a 2ª ou a 3ª, leva quem fez a 1ª.</dd>
      <dt>Truco, seis, nove, doze</dt><dd>Pedir pra mão valer mais (3, 6, 9, 12). Quem recebe aceita, corre ou aumenta. Quem pediu por último não pode aumentar de novo: a vez é da outra dupla.</dd>
      <dt>Correr</dt><dd>Desistir do pedido: a outra dupla leva o que a mão valia antes do pedido.</dd>
      <dt>Mão de onze</dt><dd>A dupla com 11 pontos vê as cartas do parceiro e decide se joga (vale 3) ou corre (os outros levam 1). Não tem truco.</dd>
      <dt>Mão de ferro</dt><dd>As duas duplas com 11: todo mundo joga às cegas, sem ver a própria carta. Quem levar a mão leva o jogo.</dd>
      <dt>Pé e mão</dt><dd>Quem deu as cartas é o pé: joga por último na 1ª rodada. Quem está depois dele é a mão: começa.</dd>
      <dt>Blefe</dt><dd>Pedir truco com mão fraca pra fazer os outros correrem.</dd>
    </dl></section>`;
}
function vRules(): string {
  return `<section class="card" id="rules"><ul class="rules">
    <li>Baralho de 40 cartas (sem 8, 9, 10 e coringas). ${Core.HAND_SIZE} cartas pra cada um e uma vira.</li>
    <li>Duplas: você e sua dupla (de frente) contra a outra dupla. Joga-se em roda: você, quem está à sua direita, sua dupla, quem está à sua esquerda.</li>
    <li>Cada rodada, ganha a carta mais forte; quem fez começa a próxima. Quem fizer 2 rodadas leva a mão.</li>
    <li>A mão vale 1. Com truco vale 3, depois seis (6), nove (9) e doze (12).</li>
    <li>Com ${Core.ELEVEN} pontos, mão de onze: vale ${Core.ELEVEN_VALUE}, sem truco. Os dois com ${Core.ELEVEN}: mão de ferro, às cegas.</li>
    <li>Quem chegar a ${Core.WIN_POINTS} pontos vence.</li></ul></section>`;
}

/* ---------- training ---------- */
function vDrill(d: Drill): string {
  const done = ui.picked !== null, cls = (o: string): string => (done ? (o === d.answer ? ' is-right' : o === ui.picked ? ' is-wrong' : ' dim') : '');
  let body: string;
  if (d.kind === 'manilha') {
    body = `<p class="big">Vira na mesa. Qual valor é a manilha?</p><div class="vira-big">${face(d.vira)}</div>
      <div class="pick four">${d.options.map(o => `<button class="btn ghost opt${cls(o)}" data-act="guess" data-v="${o}"${done ? ' disabled' : ''}>${o}</button>`).join('')}</div>`;
  } else {
    body = `<p class="big">Quem ganha esta rodada?</p><div class="drill-row"><span class="vira-mini">Vira ${face(d.vira)}</span></div>
      <div class="drill-plays">${d.plays.map(p => `<button class="dp t${Core.teamOf(p.seat)}${cls(p.card)}" data-act="guess" data-v="${p.card}"${done ? ' disabled' : ''}><small>${name(p.seat)}</small>${face(p.card)}</button>`).join('')}</div>
      <button class="btn ghost block opt${cls('empate')}" data-act="guess" data-v="empate"${done ? ' disabled' : ''}>Empate (cangou)</button>`;
  }
  const verdict = done ? `<div class="verdict ${ui.picked === d.answer ? 'ok' : 'no'}" id="verdict"><b>${ui.picked === d.answer ? 'Isso!' : 'Não foi dessa vez.'}</b> ${esc(d.why)}</div>` : '';
  return `<section class="card${ui.picked === null ? ' enter' : ''}" id="drill"><span class="label">Treino · ${d.kind === 'manilha' ? 'manilha' : 'rodada'} · sequência de ${ui.streak}</span>${body}${verdict}
    <div class="pick">${done ? `<button class="btn" data-act="drill" data-k="${d.kind}">Próxima</button>` : ''}<button class="btn ghost" data-act="home">Voltar</button></div></section>
    ${d.kind === 'round' && done ? `<section class="card"><span class="label">Ranking com esta vira</span>${vRanking(d.vira, 'drillrank')}</section>` : ''}`;
}

/* ---------- the game ---------- */
function vGame(g: Game): string {
  const deal = seenHand !== g.n; seenHand = g.n;
  const fresh = !deal && g.played.length > seenPlayed; seenPlayed = g.played.length;
  const lastKey = g.last ? `${g.n}:${g.rounds.length}` : '';
  const glow = lastKey !== '' && lastKey !== seenLast; seenLast = lastKey;
  // the whole game fits the window with no scrolling (D19): a thin line of facts, the table taking what is left, the
  // card that asks something of the person docked over the bottom of the table, the hand always under it, and the extras
  // (ranking, log, end) as a short bar whose panels open over the table
  const act = vAction(g), docked = act.startsWith('<section');
  const end = inRoom()
    ? `<button class="btn ghost" data-act="leaveroom">${ui.confirmEnd ? 'Toque de novo' : 'Sair da sala'}</button>`
    : `<button class="btn ghost" data-act="end">${ui.confirmEnd ? 'Toque de novo' : 'Encerrar'}</button>`;
  return `<div class="gtop">${vMatchup(g)}${vStatus(g)}</div>`
    + `<div class="tablebox">${vTable(g, fresh, glow)}${docked ? `<div class="dock" id="dock">${act}${g.phase === 'over' ? vSummary(g) : ''}</div>` : ''}</div>`
    + (hints() ? vExplain(g) : '') + vSaid(g) + (docked ? '' : act) + vHand(g, deal)
    + `<div class="gbar">${hints() ? `<details class="pop" id="rank"><summary>Ranking</summary><div class="popin">${vRanking(g.vira, 'gamerank')}</div></details>` : ''}${vLog(g)}${g.phase === 'over' ? '' : end}</div>`;
}
/** The two teams, by name, over the table: "Nós: Time 7 × Eles: Akatsuki" (only when the table has teams). */
function vMatchup(g: Game): string {
  const [a, b] = sideNames(g);
  return a || b ? `<p class="matchup" id="matchup"><span class="nos">Nós: <b>${esc(a || 'sem equipe')}</b></span><span aria-hidden="true">×</span><span class="eles">Eles: <b>${esc(b || 'sem equipe')}</b></span></p>` : '';
}
/** After a raise is answered and play goes on: who accepted, by name, and what the hand is worth now. */
function vSaid(g: Game): string {
  const sh = g.shout;
  if (g.phase !== 'play' || !sh || (sh.word !== 'aceito' && sh.word !== 'jogo')) return '';
  return `<p class="said" id="said">${esc(shoutLine(g))}${sh.word === 'aceito' ? `. A mão vale ${g.value}.` : '.'}</p>`;
}
function vStatus(g: Game): string {
  const dots = [0, 1, 2].map(i => { const r = g.rounds[i]; return `<i class="${r === undefined ? '' : r === -1 ? 'tie' : TEAM_CLS[r]}" title="${i + 1}ª rodada"></i>`; }).join('');
  return `<div class="status" id="status"><span><small>Vale</small> <b id="value">${g.value}</b></span><span><small>Mão</small> <b>${g.n}</b></span><span><small>Rodadas</small> <b class="dots">${dots}</b></span><span><small>Nível</small> <b>${LEVEL[g.level][0]}</b></span></div>`;
}
const POS = ['p-bottom', 'p-right', 'p-top', 'p-left'];
/** With three pairs: you at the bottom, your partner at the top, the others two on each side, in the order of play. */
const POS6 = ['p-bottom', 'p-right p-rb', 'p-right p-rt', 'p-top', 'p-left p-lt', 'p-left p-lb'];
const posOf = (g: Game, s: Seat): string => (Core.teamsOf(g) === 3 ? POS6 : POS)[s];
function vSeat(g: Game, s: Seat): string {
  const acting = Core.whoActs(g) === s, n = g.hands[s].length, out = !Core.inHand(g, s);
  // while a raise is open, the chair of who asked stands out (and says what), and the one who answers says so too
  const asking = g.phase === 'truco' && !!g.ask && g.ask.by === s, answering = g.phase === 'truco' && acting;
  const bubble = g.shout && g.shout.seat === s ? `<span class="bubble${LOUD.includes(g.shout.word) ? ' loud' : ''}">${said(g, g.shout.word)}</span>` : '';
  const tag = asking && g.ask ? `<span class="asktag">pediu ${WORD[g.ask.value].toUpperCase()}</span>` : answering ? '<span class="asktag ans">responde</span>' : '';
  return `<div class="seat ${posOf(g, s)} t${Core.teamOf(s, Core.teamsOf(g))}${acting ? ' acting' : ''}${asking ? ' asking' : ''}${answering ? ' answering' : ''}${out ? ' out' : ''}" id="seat${s}">${bubble}<span class="who">${name(s)}${g.dealer === s ? ' <small title="deu as cartas">pé</small>' : ''}</span>${tag}${out ? '<span class="gone">saiu da mão</span>' : s ? `<span class="backs">${Array.from({ length: n }, back).join('')}</span>` : ''}</div>`;
}
function vTable(g: Game, fresh: boolean, glow: boolean): string {
  const showing: Play[] = g.table.length ? g.table : g.last ? g.last.plays : [];
  const old = !g.table.length && !!g.last, win = old && g.last ? g.last.winner : -2;
  const T = Core.teamsOf(g), lead = g.table.length ? Core.roundWinner(g.table, g.vira, T) : -2;
  const slots = showing.map((p, i) => {
    const isNew = fresh && i === showing.length - 1;
    return `<div class="slot ${posOf(g, p.seat)}${isNew ? ' fly' : ''}${old && !glow ? ' old' : ''}${p.seat === win ? ` won${glow ? ' glow' : ''}` : ''}${hints() && p.seat === lead ? ' lead' : ''}">${face(p.card, g.vira, hints())}</div>`;
  }).join('');
  return `<section class="felt${T === 3 ? ' six' : ''}" id="table">${(T === 3 ? [3, 4, 2, 5, 1] : [2, 3, 1]).map(s => vSeat(g, s)).join('')}
    <div class="center" id="center">${slots}</div>
    <div class="vira" id="vira"><small>Vira</small>${face(g.vira)}${hints() ? `<small>manilha: <b>${Core.manilhaRank(g.vira)}</b></small>` : ''}</div>
    ${vSeat(g, 0)}</section>`;
}
/** With rodinhas: who is taking the round being played, or why the last round went the way it did. */
function vExplain(g: Game): string {
  let t = '';
  if (g.table.length) {
    const w = Core.roundWinner(g.table, g.vira, Core.teamsOf(g));
    t = w === -1 ? 'Por enquanto a rodada está cangada (empate).' : `Por enquanto ${w === 0 ? 'você está' : `${name(w)} está`} levando, com ${Core.cardSay((g.table.find(p => p.seat === w) as Play).card, g.vira)}.`;
  } else if (g.last) {
    const w = g.last.winner, duel = Core.suitDuel(g.last.plays, g.vira);
    t = w === -1 ? 'A rodada cangou: as mais fortes tinham o mesmo valor, de duplas diferentes.'
      : `${w === 0 ? 'Você fez' : `${name(w)} fez`} a rodada${duel.length ? `: manilha contra manilha, decide o naipe (${duel.map(c => Core.MANILHA_NAME[c[1]]).join(' > ')})` : Core.isManilha((g.last.plays.find(p => p.seat === w) as Play).card, g.vira) ? ' com manilha' : ' com a carta mais alta da sequência'}.`;
  }
  return t ? `<p class="explain" id="explain">${esc(t)}</p>` : '';
}
function vHand(g: Game, deal: boolean): string {
  const mine = Core.whoActs(g) === 0 && g.phase === 'play' && !ui.busy;
  const cards = g.hands[0].map((c, k) => `<button class="hc${deal ? ' deal' : ''}" data-act="play" data-k="${k}"${mine ? '' : ' disabled'} aria-label="${g.blind ? `Carta ${k + 1}, virada` : Core.cardName(c)}">${g.blind && g.phase !== 'handEnd' && g.phase !== 'over' ? back() : face(c, g.vira, hints())}</button>`).join('');
  return `<section class="hand" id="hand">${cards || '<p class="hint">Sem cartas na mão.</p>'}</section>${g.blind && g.phase === 'play' ? '<p class="hint center-text">Mão de ferro: ninguém vê as próprias cartas. Escolha uma no escuro.</p>' : ''}`;
}
function vAction(g: Game): string {
  const who = Core.whoActs(g);
  if (g.phase === 'play') {
    if (who !== 0) return `<p class="thinking" id="action">${name(who as Seat)} ${g.table.length || who === g.starter ? 'está pensando…' : 'vai jogar…'}</p>`;
    return `<div class="actions" id="action"><span>Sua vez${g.table.length ? '' : ': você começa a rodada'}.</span>${Core.canRaise(g, 0) ? `<button class="btn truco" data-act="truco">${WORD[Core.nextValue(g.value)]}!</button>` : ''}</div>`;
  }
  if (g.phase === 'truco' && g.ask) {
    // who asked, by name, and who answers for the other pair (D15)
    const asked = `<p class="asked" id="asked">${esc(askLine(g))}</p>`;
    const now = g.shout && !LOUD.includes(g.shout.word) ? `<p class="hint" id="saidnow">${esc(shoutLine(g))}.</p>` : '';
    if (who !== 0) return `<div class="asking" id="action">${asked}${now}<p class="thinking" id="answerer">Responde: ${name(who as Seat)}</p>${Core.teamsOf(g) === 3 ? vWho(g) : ''}</div>`;
    // the partner whispers only when the partner is the computer and its cards are known here (not in a room)
    const three = Core.teamsOf(g) === 3, mate = Core.partnerOf(g, 0);
    const tip = three || g.hands[mate].some(c => c === '??') || Core.isHuman(g, mate) ? null : Core.aiAnswer(g, mate);
    const tipTxt = tip ? { accept: 'aceita', run: 'corre', raise: `pede ${WORD[Core.nextValue(g.ask.value)].toLowerCase()}` }[tip] : '';
    return `<section class="card ask" id="action"><span class="label">Pedido na mesa</span>${asked}${now}<p class="hint" id="answerer">Responde: você, pela sua dupla.</p><p class="big">Se aceitar, a mão vale <b>${g.ask.value}</b>. ${three ? 'Se correr, vocês saem da mão e não marcam.' : `Se correr, eles levam <b>${g.value}</b>.`}</p>${three ? vWho(g) : ''}
      <div class="pick"><button class="btn" data-act="answer" data-v="accept">Aceito</button><button class="btn ghost" data-act="answer" data-v="run">Corro</button>${g.ask.value < Core.WIN_POINTS ? `<button class="btn truco" data-act="answer" data-v="raise">${WORD[Core.nextValue(g.ask.value)]}!</button>` : ''}</div>
      ${tip ? `<p class="hint" id="tip">${(name(2))} cochicha: “eu ${tipTxt}”.</p>` : ''}</section>`;
  }
  if (g.phase === 'eleven') {
    const mate = Core.partnerOf(g, 0), three = Core.teamsOf(g) === 3;
    if (who !== 0) return `<p class="thinking" id="action">${three ? pairSay(g, g.eleven) : 'Eles'} estão com ${Core.ELEVEN}: decidindo se jogam…</p>`;
    return `<section class="card ask" id="action"><span class="label">Mão de onze</span><p>Vocês estão com ${Core.ELEVEN}. As cartas de ${(name(mate))}:</p><div class="hand small" id="partner">${g.hands[mate].map(c => face(c, g.vira, hints())).join('')}</div>
      <p class="hint">Jogar: a mão vale ${Core.ELEVEN_VALUE}, sem truco. Correr: ${three ? 'cada uma das outras duplas leva 1' : 'eles levam 1'}.</p><div class="pick"><button class="btn" data-act="eleven" data-v="1">Jogar</button><button class="btn ghost" data-act="eleven" data-v="0">Correr</button></div></section>`;
  }
  const r = g.result;
  if (!r) return '';
  const shown = r.shown ? `<div class="shown" id="shown"><p>${name(r.shown.seat)} ${r.shown.seat === 0 ? 'tinha' : 'mostrou'}:</p><div class="hand small">${r.shown.cards.map(c => face(c, g.vira, hints())).join('')}</div>${r.shown.bluff ? '<p class="bluff">Era blefe!</p>' : ''}</div>` : '';
  const head = r.team === null ? 'Ninguém marcou' : `${pairSay(g, r.team)} +${r.points}`;
  if (g.phase === 'handEnd') {
    // with "Avançar sozinho" (always, in a room) the next hand comes after a pause, with no button (D15)
    const auto = inRoom() || S.auto !== false, ms = inRoom() ? Core.ROOM_HAND_PAUSE : ui.wait ?? HAND_PAUSE[S.speed || 'normal'];
    const next = auto ? `<p class="autonext" id="autonext"><span>A próxima mão sai sozinha…</span><i style="--t:${ms}ms" aria-hidden="true"></i></p>` : '<button class="btn block" data-act="next">Próxima mão</button>';
    return `<section class="card result t${r.team ?? 'x'}" id="action"><span class="label">Fim da mão</span><p class="big"><b>${head}</b></p><p>${esc(r.why)}</p>${shown}${next}</section>`;
  }
  const nextRival = !inRoom() && !!S.team && Core.suggestRivals(S.team).length > 0;
  return `<section class="card result win t${g.winner}" id="action"><span class="label">Fim de jogo</span><p class="big"><b>${g.winner === 0 ? 'Vocês venceram!' : `${pairSay(g, g.winner)} venceram.`}</b></p><p>${head}. ${esc(r.why)} Placar final: ${g.score.join(' a ')}.</p>${h2hEndLine()}${shown}
    ${inRoom() ? (net.view?.host ? '<button class="btn block" data-act="againroom">Jogar de novo com a mesma sala</button>' : `<p class="hint">Quem criou a sala pode começar outra.</p>`) + '<button class="btn ghost block" data-act="leaveroom">Sair da sala</button>'
      : `<button class="btn block" data-act="again">Revanche</button>${nextRival ? '<button class="btn ghost block" data-act="nextrival">Próximo rival</button>' : ''}<button class="btn ghost block" data-act="home">Início</button>`}</section>`;
}
/** With three pairs, on a raise: which pairs still have to answer, and which ran and are out of the hand. */
function vWho(g: Game): string {
  const ask = g.ask as NonNullable<Game['ask']>, wait = ask.wait || [], out = g.out || [];
  const one = (t: Team): string => (t === 0 ? 'vocês' : pairSay(g, t));
  return `<p class="hint" id="who3">Respondem: ${wait.length ? wait.map(one).join(' e ') : 'ninguém mais'}.${out.length ? ` Saíram da mão: ${out.map(one).join(' e ')}.` : ''}</p>`;
}
function vSummary(g: Game): string {
  const items = g.hist.map((h, i) => `<li class="t${h.team ?? 'x'}"><b>Mão ${i + 1}</b> · ${h.team === null ? 'ninguém' : `${h.team === 0 ? 'nós' : Core.teamsOf(g) === 3 ? pairSay(g, h.team) : 'eles'} +${h.points}`} · ${esc(h.how)}</li>`).join('');
  return `<section class="card" id="summary"><span class="label">Resumo da partida</span><ol class="timeline">${items}</ol></section>`;
}
function vLog(g: Game): string {
  return `<details class="pop" id="log"><summary>Histórico</summary><ol class="log popin">${[...g.log].reverse().slice(0, 60).map(l => `<li>${esc(l)}</li>`).join('')}</ol></details>`;
}

/** The Números screen (D22): wins and losses by level, bluffs paid and raises run from, the best winning streak, and
 *  the head-to-head of the matchups played, most recent first. Only what the app actually counted. */
function vStats(): string {
  const st = S.stats || Core.emptyStats(), tot = Core.statsTotal(st);
  const wl = (r: { w: number; l: number }): string => `${r.w} ${r.w === 1 ? 'vitória' : 'vitórias'}, ${r.l} ${r.l === 1 ? 'derrota' : 'derrotas'}`;
  const levels = Core.LEVELS.map(l => `<li><b>${LEVEL[l][0]}</b> <span>${wl(st.level[l] || { w: 0, l: 0 })}</span></li>`).join('');
  const h2h = S.h2h || {};
  // most recent first; w/l are always from the person's side, so no flip is needed
  const matches = Object.keys(h2h).reverse().map(k => { const [a, b] = k.split('|'), ta = Core.teamById(a), tb = Core.teamById(b), r = h2h[k];
    return ta && tb ? `<li><b>${esc(ta.name)} × ${esc(tb.name)}</b> <span>${r.w}–${r.l}</span></li>` : ''; }).join('');
  return `<section class="card" id="stats">
    <p class="now" id="statstotal">No total: <b>${wl(tot)}</b>. Melhor sequência de vitórias: <b>${st.best}</b>.</p>
    <span class="label">Por nível</span><ul class="statlist" id="statslevels">${levels}</ul>
    <span class="label">Resposta a truco</span><p id="statsbluff">Blefe pago (você aceitou e era blefe): <b>${st.paid}</b>. Vezes que você correu: <b>${st.ran}</b>.</p>
    ${matches ? `<span class="label">Confrontos (só com equipe e adversária)</span><ul class="statlist" id="statsh2h">${matches}</ul>` : ''}
    <p class="hint">Partidas online não entram nestes números; os confrontos contam só com a sua equipe e a adversária definidas.</p></section>`;
}

/* ---------- settings ---------- */
function vSettings(): string {
  const seg = (act: string, cur: string, opts: [string, string][], label: string): string => `<div class="segm" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
  const built = builtFrom();
  return `<section class="card" id="prefs">
    <p class="hint">Rodinhas: marcam as manilhas e a força de cada carta, mostram quem está levando a rodada, explicam por que ela foi ganha e deixam o ranking à mão. Tire quando quiser treinar como na mesa de verdade.</p>
    ${seg('hints', hints() ? 'on' : 'off', [['on', 'Com rodinhas'], ['off', 'Sem rodinhas']], 'Rodinhas')}
    <p class="hint">Velocidade das jogadas da IA</p>${seg('speed', S.speed || 'normal', [['calma', 'Calma'], ['normal', 'Normal'], ['rapida', 'Rápida']], 'Velocidade')}
    <p class="hint" id="autotext">Avançar sozinho: no fim da mão, a próxima sai depois de uma pausa pra ver as cartas e o placar (${(HAND_PAUSE[S.speed || 'normal'] / 1000).toLocaleString('pt-BR')} s, pela velocidade). O fim da partida sempre espera você.</p>${seg('auto', S.auto === false ? 'off' : 'on', [['on', 'Avançar sozinho'], ['off', 'Esperar meu toque']], 'Avançar sozinho')}
    <p class="hint">Cores do app: as do tema (o jogo, o anime, o campeonato), as da equipe, ou as do personagem que é sua dupla</p>${seg('colorby', S.colorBy || 'team', [['pack', 'Do tema'], ['team', 'Da equipe'], ['char', 'Da dupla']], 'Cores do app')}
    <p class="hint">Tema</p>${seg('theme', S.theme || 'auto', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']], 'Tema')}
    <p class="hint">Som e vibração</p>${seg('fx', S.quiet ? 'off' : 'on', [['on', 'Ligados'], ['off', 'Desligados']], 'Som e vibração')}</section>
    <section class="card" id="about"><span class="label">Versão do app</span><p class="hint" id="version">${built ? `Versão ${esc(built.slice(0, 7))}.` : 'Versão de desenvolvimento.'} ${canUpdate() ? 'O app fica guardado neste aparelho: abre na hora e também sem internet.' : 'Neste endereço o app não fica guardado no aparelho.'}</p>${canUpdate() ? '<button class="btn ghost block" data-act="checkupdate">Procurar versão nova</button>' : ''}</section>`;
}

/* ---------- moments ---------- */
let stampTimer: ReturnType<typeof setTimeout> | undefined;
/** A word stamped over the screen for a moment: a raise, a run, a bluff caught. */
export function stamp(text: string, team: Team | null, sub = ''): void {
  const s = part('stamp');
  s.textContent = text; s.className = `stamp t${team ?? 'x'}`; s.hidden = false;
  if (sub) { const who = document.createElement('small'); who.textContent = sub; s.append(who); }       // who said it, under the word
  void s.offsetWidth; s.classList.add('go');            // restart the animation even when it is the same word again
  clearTimeout(stampTimer); stampTimer = setTimeout(() => { s.hidden = true; }, 1100);
}
/** Confetti in the colours of the pair that won. */
export function confetti(winner: Team): void {
  const c = part('confetti');
  c.innerHTML = Array.from({ length: 48 }, (_, i) => `<i class="t${winner}" style="left:${(i * 37) % 100}%;animation-delay:${(i % 12) * 0.08}s;animation-duration:${1.6 + (i % 5) * 0.25}s;--r:${(i * 53) % 360}deg"></i>`).join('');
  setTimeout(() => { c.innerHTML = ''; }, 4200);
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** A short message at the bottom of the screen. */
export function toast(text: string): void {
  const t = part('toast'); t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}
/** The card being played: marks it so it lifts off the hand before the table repaints. */
export function lift(k: number): void { $(`#hand [data-k="${k}"]`)?.classList.add('out'); }
