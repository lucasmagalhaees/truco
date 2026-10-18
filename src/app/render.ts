import { Core } from '../core';
import type { Card, Drill, Game, Play, RealTable, Seat, Target, Team, Word } from '../core';
import { $, esc, part } from './format';
import { S, applyClub, ui } from './state';
import { builtFrom, canUpdate } from './update';
import { canListen } from './voice';
import { canPlayOnline, inRoom, net, roomLink } from './net';

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
  seatNames = g ? g.names : Core.lineup(S.team, S.rival, S.custom).names;
  const sc = g ? `${g.score[0]}-${g.score[1]}` : '';
  const bump = !!g && seenScore !== '' && sc !== seenScore; seenScore = sc;
  part('score').innerHTML = g ? `<span class="chip nos${bump ? ' bump' : ''}">Nós ${g.score[0]}</span><span class="chip eles${bump ? ' bump' : ''}">Eles ${g.score[1]}</span>` : '';
  view.innerHTML = online ? (g ? vNet() + vGame(g) : vLobby()) : g ? vGame(g) : ui.drill ? vDrill(ui.drill) : ui.real ? vReal(S.real) : vHome();
}

/* ---------- cards ---------- */
export const SUIT: Record<string, string> = { o: '♦', e: '♠', c: '♥', p: '♣' };
const hints = (): boolean => S.hints !== false;
/** The names at the table: the game's, or the ones the chosen club gives. */
let seatNames: string[] = Core.SEATS;
const name = (s: Seat): string => esc(seatNames[s]);
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

/* ---------- before a game: home ---------- */
const LEVEL: Record<string, [string, string]> = {
  facil: ['Fácil', 'Joga às vezes sem pensar, quase não blefa e cai em blefe.'],
  medio: ['Médio', 'Joga como gente de bar: carta certa, truco com mão boa, um blefe de vez em quando.'],
  dificil: ['Difícil', 'Lembra de cada carta que saiu, sabe quando uma carta não perde mais, guarda a garantida, blefa na hora certa e paga blefe.']
};
function vHome(): string {
  const lv = S.level, t = S.tally, tr = S.train;
  const lvBtn = (v: string): string => `<button class="${lv === v ? 'on' : ''}" data-act="level" data-v="${v}" aria-pressed="${lv === v}">${LEVEL[v][0]}</button>`;
  return `<section class="card" id="start"><span class="label">Nova partida</span>
    <p class="big" id="lineup">Você e <b>${(name(2))}</b> contra <b>${(name(1))}</b> e <b>${(name(3))}</b>. Quem fizer ${Core.WIN_POINTS} pontos primeiro leva.</p>
    <div class="segm" role="group" aria-label="Dificuldade">${Core.LEVELS.map(lvBtn).join('')}</div><p class="hint" id="leveltext">${LEVEL[lv][1]}</p>
    <button class="btn block" data-act="new">Dar as cartas</button>
    <p class="hint" id="tally">${t.w + t.l ? `Neste aparelho: ${t.w} ${t.w === 1 ? 'vitória' : 'vitórias'} e ${t.l} ${t.l === 1 ? 'derrota' : 'derrotas'}.` : 'Nenhuma partida terminada ainda.'}</p></section>
  ${vOnline()}
  ${vClub()}
  <section class="card" id="train"><span class="label">Treino</span>
    <p>Exercícios rápidos pra ver na hora o que manda na mesa.</p>
    <div class="pick"><button class="btn ghost" data-act="drill" data-k="manilha">Qual é a manilha?</button><button class="btn ghost" data-act="drill" data-k="round">Quem ganha a rodada?</button></div>
    <p class="hint" id="trainstats">${tr.total ? `Acertos: ${tr.ok} de ${tr.total} (${Math.round(100 * tr.ok / tr.total)}%). Melhor sequência: ${tr.best}.` : 'Nenhum exercício feito ainda.'}</p></section>
  <section class="card" id="realcard"><span class="label">Mesa real</span>
    <p>Jogando de verdade? Diga a vira e suas cartas (num toque ou falando) e o app mostra o ranking, as manilhas, o que ainda pode ganhar de você e qual carta joga.</p>
    <button class="btn ghost block" data-act="real">Abrir o assistente</button></section>
  ${vGloss()}${vRules()}${vSettings()}`;
}

/* ---------- playing online ---------- */
/** The code in the address of an invitation link (?sala=ABCDE), if any. */
const invited = (): string => { const c = new URLSearchParams(location.search).get('sala') || ''; return Core.isCode(c.toUpperCase()) ? c.toUpperCase() : ''; };
function vOnline(): string {
  const off = !canPlayOnline(), inv = invited();
  return `<section class="card" id="online"><span class="label">Jogar online</span>
    <p>Você e uma IA contra um amigo e outra IA, cada um no seu celular. Cabem até 4 pessoas; lugar vazio fica com a IA.</p>
    ${inv ? `<p class="explain" id="invite">Você foi chamado para a sala <b>${inv}</b>. Escreva seu nome e toque em Entrar.</p>` : ''}
    <div class="field"><input id="oname" maxlength="16" autocomplete="nickname" placeholder="seu nome" value="${esc(S.myName || '')}" aria-label="Seu nome"></div>
    <button class="btn block" data-act="createroom"${off ? ' disabled' : ''}>Criar sala</button>
    <div class="or" aria-hidden="true">ou entre com o código</div>
    <div class="row"><div class="field"><input id="ocode" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="código" value="${esc(inv)}" aria-label="Código da sala"></div><button class="btn ghost" data-act="joinroom"${off ? ' disabled' : ''}>Entrar</button></div>
    ${off ? '<p class="hint" id="onlineoff">O servidor de salas ainda não está ligado neste endereço.</p>' : '<p class="hint">Quem cria a sala escolhe o nível das IAs (o de “Nova partida”).</p>'}</section>`;
}
/** Who sits where in the room, as this person sees it: themselves at the bottom, the partner in front. */
function seatsOf(): { seat: Seat; label: string; human: boolean; online: boolean }[] {
  const v = net.view as NonNullable<typeof net.view>;
  return [0, 1, 2, 3].map(s => { const m = v.members.find(x => x.seat === s); return { seat: s, label: m ? m.name : `IA (${Core.DEFAULT_NAMES[(s + v.seat) % 4]})`, human: !!m, online: !!m && m.online }; });
}
function vLobby(): string {
  const v = net.view;
  if (!v) return `<section class="card" id="lobby"><span class="label">Sala ${esc(S.online?.code || '')}</span><p class="thinking">${net.status === 'caiu' ? 'Sem conexão com o servidor, tentando de novo…' : 'Entrando na sala…'}</p><button class="btn ghost block" data-act="leaveroom">Cancelar</button></section>`;
  const seats = seatsOf(), at = (s: Seat): string => { const x = seats[s]; return `<div class="lseat${x.human ? ' human' : ''}${x.human && !x.online ? ' gone' : ''}" id="lseat${s}"><small>${s === 0 ? 'Você' : s === 2 ? 'Sua dupla' : 'Adversário'}</small><b>${esc(x.label)}</b></div>`; };
  const link = roomLink(v.code);
  return `<section class="card" id="lobby"><span class="label">Sala</span>
    <p class="code" id="code">${v.code}</p>
    <p class="hint">Mande o link para quem vai jogar. Quem entrar senta na ordem: o primeiro contra você, depois sua dupla, depois a dupla dele.</p>
    <p class="link" id="link">${esc(link)}</p>
    <div class="pick"><button class="btn ghost" data-act="copylink">Copiar link</button>${typeof navigator.share === 'function' ? '<button class="btn ghost" data-act="sharelink">Compartilhar</button>' : ''}</div>
    <div class="lseats">${at(2)}<div class="lrow">${at(3)}${at(1)}</div>${at(0)}</div>
    ${v.host ? `<p class="hint">Nível das IAs: <b>${LEVEL[v.level][0]}</b>.</p><button class="btn block" data-act="startroom">Começar ${v.members.length === 1 ? 'só com as IAs' : `com ${v.members.length} pessoas`}</button>` : `<p class="thinking">Esperando quem criou a sala começar…</p>`}
    <button class="btn ghost block" data-act="leaveroom">Sair da sala</button></section>`;
}
/** During a game in a room: the connection, and who dropped out (the host may hand their seat to the computer). */
function vNet(): string {
  const v = net.view;
  if (net.status === 'caiu') return '<p class="explain" id="netstatus">Sem conexão com a sala. Tentando de novo…</p>';
  const gone = v ? v.members.filter(m => !m.online) : [];
  if (!gone.length || !v) return '';
  return `<p class="explain" id="netstatus">${gone.map(m => `<b>${esc(m.name)}</b> saiu da sala`).join(', ')}. A partida espera voltar.${v.host ? gone.map(m => ` <button class="btn ghost" data-act="botseat" data-s="${m.seat}">IA no lugar de ${esc(m.name)}</button>`).join('') : ''}</p>`;
}

/* ---------- the club ---------- */
const clubBtn = (act: string, id: string, label: string, on: boolean, colors?: [string, string, string]): string =>
  `<button class="clubbtn${on ? ' on' : ''}" data-act="${act}" data-v="${id}" aria-pressed="${on}"${colors ? ` style="--c:${colors[0]};--c2:${colors[1]};--ci:${colors[2]}"` : ''}>${label}</button>`;
function vClub(): string {
  const t = Core.teamById(S.team), r = Core.teamById(S.rival);
  const grid = (act: string, cur: string | undefined, skip?: string): string => `<div class="clubs">${Core.TEAMS.filter(c => c.id !== skip).map(c => clubBtn(act, c.id, c.name, cur === c.id, c.colors)).join('')}</div>`;
  let h = `<section class="card" id="club"><span class="label">Seu time</span>
    <p class="hint">Escolha o seu time: a IA ganha os nomes do elenco (o craque é sua dupla) e o app fica com as cores do clube.</p>
    ${grid('team', S.team)}<button class="btn ghost block" data-act="team" data-v=""${t ? '' : ' disabled'}>Sem time</button>`;
  if (t) {
    const p = Core.playersOf(t.id, S.custom);
    h += `<p id="squad">Elenco do ${esc(t.name)}: <b>${esc(p[0])}</b> (craque), ${esc(p[1])} e ${esc(p[2])}.</p>`;
    h += ui.editing ? `<div class="edit" id="edit">${p.map((x, i) => `<div class="field"><input id="pl${i}" maxlength="24" autocomplete="off" value="${esc(x)}" aria-label="${i ? `Jogador ${i + 1}` : 'Craque'}"></div>`).join('')}
      <div class="pick"><button class="btn" data-act="saveplayers">Salvar nomes</button><button class="btn ghost" data-act="resetplayers">Voltar aos do clube</button></div></div>`
      : `<button class="btn ghost block" data-act="editplayers">Trocar os nomes</button>`;
    h += `<p class="hint">Modo</p><div class="segm" role="group" aria-label="Modo"><button class="${r ? '' : 'on'}" data-act="mode" data-v="own" aria-pressed="${!r}">Elenco</button><button class="${r ? 'on' : ''}" data-act="mode" data-v="rivals" aria-pressed="${!!r}">Rivais</button></div>`;
    h += r ? `<p class="hint">Rivais: você e ${esc(p[0])} contra os dois principais de outro time. Escolha o adversário:</p>${grid('rival', S.rival, t.id)}`
      : `<p class="hint">Elenco: você e ${esc(p[0])} contra ${esc(p[1])} e ${esc(p[2])}.</p>`;
    h += `<p class="hint">Elencos conferidos em ${Core.TEAMS_CHECKED}, pelas escalações prováveis publicadas. Jogador troca de clube: se algum nome estiver velho, troque acima.</p>`;
  }
  return h + '</section>';
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
function vGloss(): string {
  const v = ui.vira, ranks = Core.RANKS.map(r => `<button class="${v[0] === r ? 'on' : ''}" data-act="vira" data-r="${r}" aria-pressed="${v[0] === r}">${r}</button>`).join('');
  return `<section class="card" id="gloss"><span class="label">Ranking e glossário</span>
    <p>Escolha a vira e veja todas as cartas da mais forte pra mais fraca:</p>
    <div class="segm small" role="group" aria-label="Vira">${ranks}</div>
    <p class="hint">Vira <b>${Core.cardName(v).split(' ')[0]}</b>: a manilha é <b>${Core.manilhaRank(v)}</b>.</p>
    ${vRanking(v, 'glossrank')}
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
  return `<section class="card" id="rules"><span class="label">Como joga (truco paulista)</span><ul class="rules">
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
  return vStatus(g) + vTable(g, fresh, glow) + vHand(g, deal) + vAction(g) + (g.phase === 'over' ? vSummary(g) : '')
    + (hints() ? `<details class="card" id="rank"><summary class="label">Ranking com esta vira</summary>${vRanking(g.vira, 'gamerank')}</details>` : '')
    + vLog(g) + (g.phase === 'over' ? '' : inRoom()
      ? `<section class="card"><button class="btn ghost block" data-act="leaveroom">${ui.confirmEnd ? 'Toque de novo para sair da sala' : 'Sair da sala'}</button></section>`
      : `<section class="card"><button class="btn ghost block" data-act="end">${ui.confirmEnd ? 'Toque de novo para encerrar a partida' : 'Encerrar partida'}</button></section>`);
}
function vStatus(g: Game): string {
  const dots = [0, 1, 2].map(i => { const r = g.rounds[i]; return `<i class="${r === undefined ? '' : r === -1 ? 'tie' : r === 0 ? 'nos' : 'eles'}" title="${i + 1}ª rodada"></i>`; }).join('');
  return `<div class="status" id="status"><span><small>Vale</small><b id="value">${g.value}</b></span><span><small>Mão</small><b>${g.n}</b></span><span><small>Rodadas</small><b class="dots">${dots}</b></span><span><small>Nível</small><b>${LEVEL[g.level][0]}</b></span></div>`;
}
const POS = ['p-bottom', 'p-right', 'p-top', 'p-left'];
function vSeat(g: Game, s: Seat): string {
  const acting = Core.whoActs(g) === s, n = g.hands[s].length;
  const bubble = g.shout && g.shout.seat === s ? `<span class="bubble${['truco', 'seis', 'nove', 'doze'].includes(g.shout.word) ? ' loud' : ''}">${said(g, g.shout.word)}</span>` : '';
  return `<div class="seat ${POS[s]} t${Core.teamOf(s)}${acting ? ' acting' : ''}" id="seat${s}">${bubble}<span class="who">${name(s)}${g.dealer === s ? ' <small title="deu as cartas">pé</small>' : ''}</span>${s ? `<span class="backs">${Array.from({ length: n }, back).join('')}</span>` : ''}</div>`;
}
function vTable(g: Game, fresh: boolean, glow: boolean): string {
  const showing: Play[] = g.table.length ? g.table : g.last ? g.last.plays : [];
  const old = !g.table.length && !!g.last, win = old && g.last ? g.last.winner : -2;
  const lead = g.table.length ? Core.roundWinner(g.table, g.vira) : -2;
  const slots = showing.map((p, i) => {
    const isNew = fresh && i === showing.length - 1;
    return `<div class="slot ${POS[p.seat]}${isNew ? ' fly' : ''}${old && !glow ? ' old' : ''}${p.seat === win ? ` won${glow ? ' glow' : ''}` : ''}${hints() && p.seat === lead ? ' lead' : ''}">${face(p.card, g.vira, hints())}</div>`;
  }).join('');
  return `<section class="felt" id="table">${[2, 3, 1].map(s => vSeat(g, s)).join('')}
    <div class="center" id="center">${slots}</div>
    <div class="vira" id="vira"><small>Vira</small>${face(g.vira)}${hints() ? `<small>manilha: <b>${Core.manilhaRank(g.vira)}</b></small>` : ''}</div>
    ${vSeat(g, 0)}</section>${hints() ? vExplain(g) : ''}`;
}
/** With rodinhas: who is taking the round being played, or why the last round went the way it did. */
function vExplain(g: Game): string {
  let t = '';
  if (g.table.length) {
    const w = Core.roundWinner(g.table, g.vira);
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
    if (who !== 0) return `<p class="thinking" id="action">${name(who as Seat)} está pensando no seu ${WORD[g.ask.value].toLowerCase()}…</p>`;
    // the partner whispers only when the partner is the computer and its cards are known here (not in a room)
    const tip = g.hands[2].some(c => c === '??') || Core.isHuman(g, 2) ? null : Core.aiAnswer(g, 2);
    const tipTxt = tip ? { accept: 'aceita', run: 'corre', raise: `pede ${WORD[Core.nextValue(g.ask.value)].toLowerCase()}` }[tip] : '';
    return `<section class="card ask" id="action"><span class="label">${name(g.ask.by)} pediu ${WORD[g.ask.value].toLowerCase()}</span><p class="big">Se aceitar, a mão vale <b>${g.ask.value}</b>. Se correr, eles levam <b>${g.value}</b>.</p>
      <div class="pick"><button class="btn" data-act="answer" data-v="accept">Aceito</button><button class="btn ghost" data-act="answer" data-v="run">Corro</button>${g.ask.value < Core.WIN_POINTS ? `<button class="btn truco" data-act="answer" data-v="raise">${WORD[Core.nextValue(g.ask.value)]}!</button>` : ''}</div>
      ${tip ? `<p class="hint" id="tip">${(name(2))} cochicha: “eu ${tipTxt}”.</p>` : ''}</section>`;
  }
  if (g.phase === 'eleven') {
    if (who !== 0) return `<p class="thinking" id="action">Eles estão com ${Core.ELEVEN}: decidindo se jogam…</p>`;
    return `<section class="card ask" id="action"><span class="label">Mão de onze</span><p>Vocês estão com ${Core.ELEVEN}. As cartas de ${(name(2))}:</p><div class="hand small" id="partner">${g.hands[2].map(c => face(c, g.vira, hints())).join('')}</div>
      <p class="hint">Jogar: a mão vale ${Core.ELEVEN_VALUE}, sem truco. Correr: eles levam 1.</p><div class="pick"><button class="btn" data-act="eleven" data-v="1">Jogar</button><button class="btn ghost" data-act="eleven" data-v="0">Correr</button></div></section>`;
  }
  const r = g.result;
  if (!r) return '';
  const shown = r.shown ? `<div class="shown" id="shown"><p>${name(r.shown.seat)} ${r.shown.seat === 0 ? 'tinha' : 'mostrou'}:</p><div class="hand small">${r.shown.cards.map(c => face(c, g.vira, hints())).join('')}</div>${r.shown.bluff ? '<p class="bluff">Era blefe!</p>' : ''}</div>` : '';
  const head = r.team === null ? 'Ninguém marcou' : `${r.team === 0 ? 'Nós' : 'Eles'} +${r.points}`;
  if (g.phase === 'handEnd') return `<section class="card result t${r.team ?? 'x'}" id="action"><span class="label">Fim da mão</span><p class="big"><b>${head}</b></p><p>${esc(r.why)}</p>${shown}<button class="btn block" data-act="next">Próxima mão</button></section>`;
  return `<section class="card result win t${g.winner}" id="action"><span class="label">Fim de jogo</span><p class="big"><b>${g.winner === 0 ? 'Vocês venceram!' : 'Eles venceram.'}</b></p><p>${head}. ${esc(r.why)} Placar final: ${g.score[0]} a ${g.score[1]}.</p>${shown}
    ${inRoom() ? (net.view?.host ? '<button class="btn block" data-act="againroom">Jogar de novo com a mesma sala</button>' : `<p class="hint">Quem criou a sala pode começar outra.</p>`) + '<button class="btn ghost block" data-act="leaveroom">Sair da sala</button>'
      : '<button class="btn block" data-act="again">Jogar de novo</button><button class="btn ghost block" data-act="home">Início</button>'}</section>`;
}
function vSummary(g: Game): string {
  const items = g.hist.map((h, i) => `<li class="t${h.team ?? 'x'}"><b>Mão ${i + 1}</b> · ${h.team === null ? 'ninguém' : h.team === 0 ? `nós +${h.points}` : `eles +${h.points}`} · ${esc(h.how)}</li>`).join('');
  return `<section class="card" id="summary"><span class="label">Resumo da partida</span><ol class="timeline">${items}</ol></section>`;
}
function vLog(g: Game): string {
  return `<details class="card" id="log"><summary class="label">O que aconteceu</summary><ol class="log">${[...g.log].reverse().slice(0, 60).map(l => `<li>${esc(l)}</li>`).join('')}</ol></details>`;
}

/* ---------- settings ---------- */
function vSettings(): string {
  const seg = (act: string, cur: string, opts: [string, string][], label: string): string => `<div class="segm" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
  const built = builtFrom();
  return `<section class="card" id="prefs"><span class="label">Ajustes</span>
    <p class="hint">Rodinhas: marcam as manilhas e a força de cada carta, mostram quem está levando a rodada, explicam por que ela foi ganha e deixam o ranking à mão. Tire quando quiser treinar como na mesa de verdade.</p>
    ${seg('hints', hints() ? 'on' : 'off', [['on', 'Com rodinhas'], ['off', 'Sem rodinhas']], 'Rodinhas')}
    <p class="hint">Velocidade das jogadas da IA</p>${seg('speed', S.speed || 'normal', [['calma', 'Calma'], ['normal', 'Normal'], ['rapida', 'Rápida']], 'Velocidade')}
    <p class="hint">Tema</p>${seg('theme', S.theme || 'auto', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']], 'Tema')}
    <p class="hint">Som e vibração</p>${seg('fx', S.quiet ? 'off' : 'on', [['on', 'Ligados'], ['off', 'Desligados']], 'Som e vibração')}</section>
    <section class="card" id="about"><span class="label">Versão do app</span><p class="hint" id="version">${built ? `Versão ${esc(built.slice(0, 7))}.` : 'Versão de desenvolvimento.'} ${canUpdate() ? 'O app fica guardado neste aparelho: abre na hora e também sem internet.' : 'Neste endereço o app não fica guardado no aparelho.'}</p>${canUpdate() ? '<button class="btn ghost block" data-act="checkupdate">Procurar versão nova</button>' : ''}</section>`;
}

/* ---------- moments ---------- */
let stampTimer: ReturnType<typeof setTimeout> | undefined;
/** A word stamped over the screen for a moment: a raise, a run, a bluff caught. */
export function stamp(text: string, team: Team | null): void {
  const s = part('stamp');
  s.textContent = text; s.className = `stamp t${team ?? 'x'}`; s.hidden = false;
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
