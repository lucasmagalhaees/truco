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
const GAMES = Number(process.argv[2] || 400), ONLY = process.argv[3] || '';   // ONLY: run only the games whose name has it
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
      const g = { ...g0, value: prev, raisedBy: prev > 1 ? 1 : null, phase: 'truco', ask: { by: 0, value: asked }, turn: 0, starter: 0 };
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
console.log(`\nPartidas inteiras (${GAMES} cada, sementes fixas); a dupla de IA nos assentos 1 e 3:`);
for (const lv of ['facil', 'medio', 'dificil']) series(`${lv} contra a pessoa que blefa`, ['blefador', lv, 'medio', lv]);
series('extremo contra a pessoa que blefa', ['blefador', 'extremo', 'medio', 'extremo']);
series('dificil contra medio', ['medio', 'dificil', 'medio', 'dificil']);
series('extremo contra dificil', ['dificil', 'extremo', 'dificil', 'extremo']);
series('extremo contra medio', ['medio', 'extremo', 'medio', 'extremo']);
series('medio contra facil', ['facil', 'medio', 'facil', 'medio']);
