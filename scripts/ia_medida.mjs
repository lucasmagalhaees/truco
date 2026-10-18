// Measures the computer players: how often each level accepts a raise, by how strong its hand is, and how pairs of
// different levels do against each other and against a simulated person who bluffs a lot.
//   node scripts/ia_medida.mjs [games]
// Builds src/core by itself (like tests/core.mjs) and plays with fixed seeds, so two runs print the same numbers.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests', '.build-medida');
await build({ root, configFile: false, logLevel: 'silent', build: { outDir, emptyOutDir: true, minify: false, target: 'node22', lib: { entry: path.join(root, 'src', 'core', 'index.ts'), formats: ['es'], fileName: () => 'core.mjs' } } });
const { Core } = await import(pathToFileURL(path.join(outDir, 'core.mjs')).href);
const GAMES = Number(process.argv[2] || 400), ONLY = process.argv[3] || '';   // ONLY: run only the games whose name has it ('pedidos': only the raise table)
const pct = (a, b) => (b ? `${(100 * a / b).toFixed(0)}%` : '-').padStart(5);

// ---------- 1. answering a raise, by hand strength ----------
if (!ONLY) console.log('Aceita o pedido (aceita ou aumenta), pela força da mão de quem responde, no começo da mão, placar 0 a 0:');
const buckets = [[0, 2.5, 'fraca'], [2.5, 4.5, 'média'], [4.5, 7, 'boa'], [7, 99, 'forte']];
for (const [prev, asked] of ONLY ? [] : [[1, 3], [3, 6], [6, 9], [9, 12]]) {
  const row = [];
  for (const level of ['facil', 'medio', 'dificil', 'extremo']) {
    const n = buckets.map(() => [0, 0]), rand = Core.seeded(asked * 7 + level.length);
    for (let i = 0; i < 1500; i++) {
      const g0 = Core.newGame(rand, level);
      if (g0.phase !== 'play') continue;
      // a raise is always watched in a real game (who asked, from how many cards): the extreme player conditions on it
      const g = { ...g0, value: prev, raisedBy: prev > 1 ? 1 : null, phase: 'truco', ask: { by: 0, value: asked }, turn: 0, starter: 0, watch: [{ by: 0, held: 3, stand: 0, value: asked, seen: [] }] };
      const s = Core.strength(g.hands[1], g.vira), b = buckets.findIndex(([lo, hi]) => s >= lo && s < hi);
      n[b][1]++; if (Core.aiAnswer(g, 1, rand) !== 'run') n[b][0]++;
    }
    row.push(`${level.padEnd(7)} ${n.map(([a, t], k) => `${buckets[k][2]} ${pct(a, t)}`).join('  ')}`);
  }
  console.log(`  ${prev}→${asked}`); for (const r of row) console.log(`    ${r}`);
}

// ---------- 1b. the doze from nove, with and without a bluffing history of the one who asks ----------
// finer bands here: with nove already on the table almost any hand with a 3 or a manilha clears the bar, so the
// interesting bands are the weak ones
const fine = [[0, 1.2, 'lixo'], [1.2, 2.5, 'fraca'], [2.5, 4.5, 'média'], [4.5, 99, 'boa']];
const noHist = [0, 1, 2, 3].map(() => ({ shown: 0, weak: 0, answers: 0, runs: 0 }));
const bluffer = [{ shown: 8, weak: 6, answers: 4, runs: 0 }, ...noHist.slice(1)];
const honest = [{ shown: 8, weak: 0, answers: 4, runs: 1 }, ...noHist.slice(1)];
if (!ONLY) {
  console.log('\nPaga o doze (9→12), pela força da mão, sem histórico / pedinte que só pede com mão / pedinte que blefa (6 de 8 mostrados):');
  for (const level of ['facil', 'medio', 'dificil', 'extremo']) {
    const cells = [];
    for (const [name, reads] of [['sem histórico', noHist], ['honesto', honest], ['blefador', bluffer]]) {
      const n = fine.map(() => [0, 0]), rand = Core.seeded(77 + level.length);
      for (let i = 0; i < 1200; i++) {
        const g0 = Core.newGame(rand, level);
        if (g0.phase !== 'play') continue;
        const g = { ...g0, value: 9, raisedBy: 1, phase: 'truco', ask: { by: 0, value: 12 }, turn: 0, starter: 0, reads, watch: [{ by: 0, held: 3, stand: 0, value: 12, seen: [] }] };
        const s = Core.strength(g.hands[1], g.vira), b = fine.findIndex(([lo, hi]) => s >= lo && s < hi);
        n[b][1]++; if (Core.aiAnswer(g, 1, rand) !== 'run') n[b][0]++;
      }
      cells.push(`${name}: ${n.map(([a, t]) => pct(a, t)).join(' ')}`);
    }
    console.log(`  ${level.padEnd(7)} (lixo fraca média boa)  ${cells.join('   ')}`);
  }
  // how long one decision takes, the slowest kind for each level: three cards to choose from, at the start of a hand
  const t = {};
  for (const level of ['medio', 'dificil', 'extremo']) {
    const rand = Core.seeded(9); let ms = 0, k = 0;
    for (let i = 0; i < 60; i++) {
      const g = Core.newGame(rand, level); if (g.phase !== 'play') continue;
      const a = { ...g, phase: 'truco', ask: { by: g.turn, value: 3 }, watch: [{ by: g.turn, held: 3, stand: 0, value: 3, seen: [] }] }, s = (g.turn + 1) % 4;
      const t0 = performance.now(); Core.aiAnswer(a, s, rand); Core.aiCard({ ...g, turn: s }, s, rand); ms += performance.now() - t0; k++;
    }
    t[level] = (ms / k).toFixed(1);
  }
  console.log(`\nTempo por decisão (responder um truco e escolher a carta, em ms, neste Node): ${JSON.stringify(t)}`);
}

// ---------- 2. whole games, each pair with its own way of playing ----------
// 'blefador': a simulated person who plays the cards like the medium level, raises with a good hand and, with a weak
// one, raises anyway half the time it can, and answers like the medium level.
function act(g, kinds, rand, stats) {
  const s = Core.whoActs(g); if (s === null) return g;
  const kind = kinds[s];
  if (kind !== 'blefador') {
    const lv = { ...g, level: kind, humans: [] };
    const out = Core.aiAct(lv, rand);
    return { ...out, level: g.level, humans: g.humans };
  }
  const lv = { ...g, level: 'medio', humans: [] };
  if (g.phase === 'eleven') return { ...Core.decideEleven(lv, Core.aiEleven(lv, g.eleven)), level: g.level, humans: g.humans };
  if (g.phase === 'truco') return { ...Core.answer(lv, Core.aiAnswer(lv, s, rand)), level: g.level, humans: g.humans };
  if (Core.canRaise(g, s)) {
    const r = Core.aiRaise(lv, s, () => 0.99);
    if (r === 'yes') return Core.raise(g, s);
    if (rand() < 0.5) { stats.bluffs++; return Core.raise(g, s, true); }
  }
  return Core.playCard(g, s, Core.aiCard(lv, s, rand));
}
function match(kinds, seed) {
  const rand = Core.seeded(seed), stats = { bluffs: 0, paid: 0, paidAt12: 0, bluffAt12: 0, pts: [0, 0] };
  let g = Core.newGame(rand, 'medio', { names: ['A', 'B', 'C', 'D'], sides: [null, null], humans: [] });
  g = { ...g, humans: [] };
  for (let steps = 0; g.phase !== 'over' && steps < 5000; steps++) {
    if (g.phase === 'handEnd') { const r = g.result; if (r && r.team !== null) stats.pts[r.team] += r.points; g = Core.nextHand(g, rand); continue; }
    const before = g;
    g = act(g, kinds, rand, stats);
    if (before.phase === 'truco' && before.ask && kinds[before.ask.by] === 'blefador' && before.ask.bluff) {
      if (before.ask.value === 12) stats.bluffAt12++;
      if (g.phase !== 'handEnd' && g.phase !== 'over') { stats.paid++; if (before.ask.value === 12) stats.paidAt12++; }
    }
  }
  if (g.result && g.result.team !== null) stats.pts[g.result.team] += g.result.points;
  return { winner: g.winner, stats };
}
function series(name, kinds) {
  if (ONLY && !name.includes(ONLY)) return;
  let w = 0, bluffs = 0, paid = 0, b12 = 0, p12 = 0, pts = [0, 0];
  for (let i = 0; i < GAMES; i++) {
    const { winner, stats } = match(kinds, 1000 + i);
    if (winner === 1) w++;
    bluffs += stats.bluffs; paid += stats.paid; b12 += stats.bluffAt12; p12 += stats.paidAt12; pts[0] += stats.pts[0]; pts[1] += stats.pts[1];
  }
  const extra = bluffs ? `  blefes da pessoa pagos: ${pct(paid, bluffs)} (no doze: ${pct(p12, b12)} de ${b12})` : '';
  console.log(`  ${name.padEnd(34)} a dupla de IA vence ${pct(w, GAMES)}  pontos por partida ${(pts[1] / GAMES).toFixed(1)} a ${(pts[0] / GAMES).toFixed(1)}${extra}`);
}
if (!ONLY || ONLY !== 'pedidos') console.log(`\nPartidas inteiras (${GAMES} cada, sementes fixas); a dupla de IA nos assentos 1 e 3:`);
for (const lv of ['facil', 'medio', 'dificil']) series(`${lv} contra a pessoa que blefa`, ['blefador', lv, 'medio', lv]);
series('extremo contra a pessoa que blefa', ['blefador', 'extremo', 'medio', 'extremo']);
series('dificil contra medio', ['medio', 'dificil', 'medio', 'dificil']);
series('extremo contra dificil', ['dificil', 'extremo', 'dificil', 'extremo']);
series('extremo contra medio', ['medio', 'extremo', 'medio', 'extremo']);
series('medio contra facil', ['facil', 'medio', 'facil', 'medio']);

// ---------- 3. how each level raises: how often, from what, where, how much of it is a bluff, and how it ends ----------
// Whole games of one level (seats 1 and 3) against another (0 and 2). Every chance to raise (its turn, the rules let it)
// is counted with the strength of what it holds plus how the rounds stand; every raise (and raise back) is followed to
// its end: the others run, or they pay and the hand is won or lost.
function raiseTable(level, against, games) {
  const kinds = [against, level, against, level];
  const bands = [[-99, 2.5, 'fraca'], [2.5, 5.5, 'média'], [5.5, 8, 'boa'], [8, 99, 'forte']];
  const sits = ['1ª rodada', 'ganhou a 1ª', 'perdeu a 1ª', 'cangou a 1ª'];
  const cell = () => ({ chances: 0, asks: 0, bluffs: 0 });
  const byBand = bands.map(cell), bySit = sits.map(cell), byValue = {};
  const end = { run: 0, won: 0, lost: 0, none: 0 }, endBluff = { run: 0, won: 0, lost: 0, none: 0 };
  let hands = 0, handsAsked = 0, blocked = 0, backs = 0, backsBluff = 0, backsWon = 0, backsLost = 0, wins = 0;
  for (let i = 0; i < games; i++) {
    const rand = Core.seeded(7000 + i);
    let g = { ...Core.newGame(rand, 'medio', { names: ['A', 'B', 'C', 'D'], sides: [null, null], humans: [] }), humans: [] };
    let open = [], asked = false;
    for (let steps = 0; g.phase !== 'over' && steps < 5000; steps++) {
      if (g.phase === 'handEnd') { g = Core.nextHand(g, rand); continue; }
      const s = Core.whoActs(g); if (s === null) break;
      const mine = Core.teamOf(s) === 1 && kinds[s] === level;
      const before = g;
      if (mine && g.phase === 'play' && g.turn === s) {
        if (Core.canRaise(g, s)) {
          const st = Core.strength(g.hands[s], g.vira) + g.rounds.reduce((x, r) => x + (r === 1 ? 2.5 : r === -1 ? 0 : -2.5), 0);
          const b = bands.findIndex(([lo, hi]) => st >= lo && st < hi), si = !g.rounds.length ? 0 : g.rounds[0] === 1 ? 1 : g.rounds[0] === -1 ? 3 : 2;
          g = { ...Core.aiAct({ ...g, level }, rand), level: before.level };
          const did = g.phase === 'truco' && g.ask && g.ask.by === s, bl = did && !!g.ask.bluff;
          for (const c of [byBand[b], bySit[si]]) { c.chances++; if (did) c.asks++; if (bl) c.bluffs++; }
          if (did) {
            const v = g.ask.value; byValue[v] = byValue[v] || { asks: 0, bluffs: 0 }; byValue[v].asks++; if (bl) byValue[v].bluffs++;
            open.push({ bluff: bl, back: false }); asked = true;
          }
          continue;
        } else if (g.score.some(x => x >= Core.ELEVEN) && g.value < Core.WIN_POINTS && g.raisedBy !== 1) blocked++;
      }
      // 'corredor' and 'pagador': a simulated person who plays like the medium level but, answering a raise without a
      // strong hand, runs three times in four (corredor) or always pays (pagador)
      const sim = kinds[s] === 'corredor' || kinds[s] === 'pagador';
      if (sim && g.phase === 'truco') {
        const strong = Core.strength(g.hands[s], g.vira) >= 6;
        g = Core.answer(g, strong || kinds[s] === 'pagador' || rand() >= 0.75 ? 'accept' : 'run');
      } else g = { ...Core.aiAct({ ...g, level: sim ? 'medio' : kinds[s] }, rand), level: before.level };
      if (mine && before.phase === 'truco' && g.phase === 'truco' && g.ask && g.ask.by === s && g.ask.value > before.ask.value) {
        backs++; if (g.ask.bluff) backsBluff++; open.push({ bluff: !!g.ask.bluff, back: true }); asked = true;
      }
      if (g.phase === 'handEnd' || g.phase === 'over') {
        const r = g.result, ran = !!(r && r.shown) && before.phase === 'truco' && Core.teamOf(before.ask.by) === 1;
        for (const o of open) {
          const k = ran && o === open[open.length - 1] ? 'run' : !r || r.team === null ? 'none' : r.team === 1 ? 'won' : 'lost';
          if (o.back) { if (k === 'won' || k === 'run') backsWon++; else if (k === 'lost') backsLost++; continue; }
          end[k]++; if (o.bluff) endBluff[k]++;
        }
        hands++; if (asked) handsAsked++;
        open = []; asked = false;
      }
    }
    if (g.winner === 1) wins++;
  }
  const row = (name, c) => `    ${name.padEnd(12)} pede em ${pct(c.asks, c.chances)} das chances (${String(c.chances).padStart(5)})  blefe: ${pct(c.bluffs, c.asks)} dos pedidos`;
  const asks = end.run + end.won + end.lost + end.none, bluffs = endBluff.run + endBluff.won + endBluff.lost + endBluff.none;
  console.log(`\n  ${level} contra ${against} (${games} partidas; vence ${pct(wins, games)}): pediu em ${pct(handsAsked, hands)} das mãos, ${asks} pedidos, ${pct(bluffs, asks)} blefe; ${blocked} vezes sem poder pedir por alguém em 11`);
  for (const [k, [, , n]] of bands.entries()) console.log(row(n, byBand[k]));
  for (const [k, n] of sits.entries()) console.log(row(n, bySit[k]));
  console.log(`    por valor: ${Object.entries(byValue).map(([v, c]) => `${v}: ${c.asks} (${pct(c.bluffs, c.asks).trim()} blefe)`).join('  ')}`);
  const fate = e => { const n = e.run + e.won + e.lost + e.none; return `correram ${pct(e.run, n)}  pagaram e ganhou ${pct(e.won, n)}  pagaram e perdeu ${pct(e.lost, n)}`; };
  console.log(`    pedido com mão:  ${fate({ run: end.run - endBluff.run, won: end.won - endBluff.won, lost: end.lost - endBluff.lost, none: end.none - endBluff.none })}`);
  console.log(`    blefe:           ${fate(endBluff)}`);
  console.log(`    aumentou de volta ${backs} vezes (${pct(backsBluff, backs).trim()} blefe): levou ${pct(backsWon, backs)}, perdeu ${pct(backsLost, backs)}`);
}
if (!ONLY || ONLY === 'pedidos') {
  console.log(`\nPedidos (truco, seis, nove, doze), por força do que tem na mão mais as rodadas (fraca <2,5, média <5,5, boa <8, forte), e por situação:`);
  for (const [lv, vs] of [['extremo', 'dificil'], ['extremo', 'corredor'], ['extremo', 'pagador'], ['dificil', 'extremo'], ['dificil', 'corredor']]) raiseTable(lv, vs, Math.min(GAMES, 300));
}
