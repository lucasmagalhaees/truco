// The cases of the pure core, in one file. Two runners use them: tests/unit.py, in the browser, against the page that
// ships (window.__APP.Core), and tests/core.mjs, in Node, against src/core built by itself. Plain JavaScript on purpose:
// many cases pass data on purpose that the compiler would refuse. A new rule of the core gets its case here first.
export default function cases(Core) {
  const fails = []; let n = 0;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const eq = (name, got, want) => { n++; if (!same(got, want)) fails.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
  const rand = Core.seeded(42);
  const never = () => 0.99, always = () => 0;            // chance that never / always fires (bluffs, random cards)

  /* chance */
  const r1 = Core.seeded(7), r2 = Core.seeded(7), xs = [r1(), r1(), r1()];
  eq('seeded: the same seed gives the same numbers, all in [0, 1)', [same(xs, [r2(), r2(), r2()]), xs.every(x => x >= 0 && x < 1)], [true, true]);
  const sh = Core.shuffle([1, 2, 3, 4, 5], Core.seeded(1));
  eq('shuffle: a copy with the same things', [[...sh].sort(), sh.length], [[1, 2, 3, 4, 5], 5]);

  /* the cards */
  const d = Core.deck();
  eq('deck: 40 cards, no 8, 9 or 10, all different', [d.length, new Set(d).size, d.some(c => /^[89T]/.test(c))], [40, 40, false]);
  eq('the manilha is the rank after the vira; after the 3 comes the 4', ['4o', '7c', 'Qe', 'Jp', 'Ko', 'Ac', '2e', '3p'].map(Core.manilhaRank), ['5', 'Q', 'J', 'K', 'A', '2', '3', '4']);
  eq('sequence without manilha: 4 5 6 7 Q J K A 2 3', ['4o', '5o', '6o', '7o', 'Qo', 'Jo', 'Ko', 'Ao', '2o', '3o'].map(c => Core.power(c, '3e')).slice(1), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  eq('manilhas by suit, rising: ouros < espadas < copas < paus (zap)', ['5o', '5e', '5c', '5p'].map(c => Core.power(c, '4c')), [10, 11, 12, 13]);
  eq('the weakest manilha beats a 3', Core.power('5o', '4p') > Core.power('3p', '4p'), true);
  eq('suit does not matter for a common card', Core.power('3o', '7c') === Core.power('3p', '7c'), true);
  eq('card names, and manilhas with their nickname', [Core.cardName('Qe'), Core.cardName('Ac'), Core.cardSay('5p', '4o'), Core.cardSay('5o', '4o'), Core.cardSay('5e', '4o'), Core.cardSay('5c', '4o'), Core.cardSay('6c', '4o')], ['dama de espadas', 'ás de copas', '5 de paus (zap)', '5 de ouros (picafumo)', '5 de espadas (espadilha)', '5 de copas (copas)', '6 de copas']);
  const rk = Core.ranking('7c');
  eq('ranking with vira 7: the four Q manilhas by suit, then 3 2 A K J 7 6 5 4', [rk.length, rk.slice(0, 4).map(r => r.cards[0]), rk.slice(4).map(r => r.rank), rk.slice(4).every(r => r.cards.length === 4)], [13, ['Qp', 'Qc', 'Qe', 'Qo'], ['3', '2', 'A', 'K', 'J', '7', '6', '5', '4'], true]);
  eq('ranking with vira 3: the 4s are manilhas', Core.ranking('3o').slice(0, 4).map(r => r.cards[0]), ['4p', '4c', '4e', '4o']);

  /* rounds */
  const P = (...cs) => cs.map((card, seat) => ({ seat, card }));
  eq('round: the strongest card takes it', Core.roundWinner(P('4o', '3e', 'Ko', '2c'), '7o'), 1);
  eq('round: a manilha beats any 3', Core.roundWinner(P('3o', '3e', 'Qo', '3c'), '7o'), 2);
  eq('round: manilha against manilha, the suit decides (zap > copas > espadilha > picafumo)', [Core.roundWinner(P('Qo', 'Qe', '3o', '4o'), '7c'), Core.roundWinner(P('Qc', 'Qp', '3o', '4o'), '7c'), Core.roundWinner(P('Qc', 'Qe', 'Qo', '4o'), '7c'), Core.roundWinner(P('4o', 'Qo', '3o', 'Qe'), '7c')], [1, 1, 0, 3]);
  eq('suitDuel: the manilhas that met, strongest first', [Core.suitDuel(P('Qo', 'Qp', 'Qe', '3c'), '7c'), Core.suitDuel(P('Qo', '3p', '2e', '3c'), '7c')], [['Qp', 'Qe', 'Qo'], []]);
  eq('round: equal top cards of the two pairs tie (cangou)', Core.roundWinner(P('3o', '3e', 'Ko', '2c'), '7o'), -1);
  eq('round: equal top cards of the same pair are that pair\'s', Core.roundWinner(P('3o', 'Ke', '3c', '2c'), '7o'), 0);
  /* the hand, from its rounds */
  eq('hand: two rounds win it', [Core.handWinner([0, 0]), Core.handWinner([1, 0, 1]), Core.handWinner([0])], [0, 1, undefined]);
  eq('hand: tie in the 1st, the 2nd decides', [Core.handWinner([-1, 1]), Core.handWinner([-1, 0])], [1, 0]);
  eq('hand: tie in the 2nd, whoever took the 1st', [Core.handWinner([0, -1]), Core.handWinner([1, -1])], [0, 1]);
  eq('hand: 1-1 and a tie in the 3rd, whoever took the 1st', [Core.handWinner([1, 0, -1]), Core.handWinner([0, 1, -1])], [1, 0]);
  eq('hand: two ties, the 3rd decides; three ties, nobody', [Core.handWinner([-1, -1]), Core.handWinner([-1, -1, 1]), Core.handWinner([-1, -1, -1])], [undefined, 1, null]);
  eq('hand: 1-1 goes to the 3rd round', [Core.handWinner([0, 1]), Core.handWinner([0, 1, 1])], [undefined, 1]);

  /* a game */
  const g0 = Core.newGame(Core.seeded(3), 'medio');
  eq('new game: 3 cards each, a vira, no repeats, nobody scored, worth 1', [g0.hands.map(h => h.length), new Set([...g0.hands.flat(), g0.vira]).size, g0.score, g0.value, g0.phase, g0.n, g0.turn === (g0.dealer + 1) % 4, g0.level, g0.blind], [[3, 3, 3, 3], 13, [0, 0], 1, 'play', 1, true, 'medio', false]);
  eq('new game: an unknown level reads as médio', Core.newGame(rand, 'god').level, 'medio');
  // a stacked hand: you lead; vira 4o, so the 5s are manilhas
  const base = { ...g0, vira: '4o', dealer: 3, starter: 0, turn: 0, hands: [['5p', '3o', '4c'], ['5c', '2o', '6e'], ['Ke', 'Ac', '7o'], ['Jo', 'Qe', '6c']], table: [], rounds: [], played: [], log: [] };
  eq('play: only on your turn, only a card you hold', [Core.playCard(base, 1, 0) === base, Core.playCard(base, 0, 3) === base, Core.playCard({ ...base, phase: 'truco' }, 0, 0).phase], [true, true, 'truco']);
  let h = Core.playCard(base, 0, 1);                    // 3o
  eq('play: the card goes to the table, the turn moves on', [h.table, h.hands[0], h.turn, h.played], [[{ seat: 0, card: '3o' }], ['5p', '4c'], 1, ['3o']]);
  h = Core.playCard(h, 1, 1); h = Core.playCard(h, 2, 0); h = Core.playCard(h, 3, 0);    // 2o Ke Jo: 3o takes it
  eq('fourth card: the round is decided, its winner leads', [h.rounds, h.table, h.last.winner, h.turn, h.starter], [[0], [], 0, 0, 0]);
  h = Core.playCard(h, 0, 0); h = Core.playCard(h, 1, 0);             // 5p (zap) vs 5c (copas)
  eq('during a round: who is on top', Core.roundWinner(h.table, h.vira), 0);
  h = Core.playCard(h, 2, 0); h = Core.playCard(h, 3, 0);
  eq('two rounds: the hand ends, worth 1', [h.phase, h.score, h.result.team, h.result.points, h.hist.length, h.hist[0].points], ['handEnd', [1, 0], 0, 1, 1, 1]);
  eq('the log says the suit decided', h.log.some(l => l.includes('zap') && l.includes('ganha no naipe')), true);
  const nx = Core.nextHand(h, rand);
  eq('next hand: the next dealer, fresh cards, the score kept', [nx.dealer, nx.n, nx.score, nx.played, nx.rounds, nx.value, Core.nextHand(base, rand) === base], [0, 2, [1, 0], [], [], 1, true]);
  // a tie leads again from the same starter
  let t = { ...base, hands: [['3o', '4e', '4c'], ['3e', '5e', '6e'], ['Ke', 'Ac', '7o'], ['Jo', 'Qe', '6c']] };
  t = [[0, 0], [1, 0], [2, 0], [3, 0]].reduce((x, [s, k]) => Core.playCard(x, s, k), t);
  eq('a tied round: the one who led it leads again', [t.rounds, t.last.winner, t.turn], [[-1], -1, 0]);

  /* raises */
  eq('truco: on your turn, before playing', [Core.canRaise(base, 0), Core.canRaise(base, 1), Core.canRaise({ ...base, raisedBy: 0 }, 0), Core.canRaise({ ...base, value: 12 }, 0), Core.canRaise({ ...base, score: [11, 3] }, 0), Core.raise(base, 1) === base], [true, false, false, false, false, true]);
  const tr = Core.raise(base, 0);
  eq('truco asked: worth 3 if accepted; Biu answers for them', [tr.phase, tr.ask, Core.whoActs(tr), tr.shout], ['truco', { by: 0, value: 3 }, 1, { seat: 0, word: 'truco' }]);
  const acc = Core.answer(tr, 'accept');
  eq('accepted: worth 3, your turn again, only they may raise now', [acc.phase, acc.value, acc.raisedBy, acc.turn, Core.canRaise(acc, 0)], ['play', 3, 0, 0, false]);
  const run = Core.answer(tr, 'run');
  eq('ran: you take what the hand was worth before', [run.phase, run.score, run.result.points, run.result.shown.seat, run.result.shown.bluff], ['handEnd', [1, 0], 1, 0, false]);
  const six = Core.answer(tr, 'raise');
  eq('raised to seis: worth 3 already, you answer now', [six.value, six.ask, Core.whoActs(six), six.shout.word, six.raisedBy], [3, { by: 1, value: 6 }, 0, 'seis', 0]);
  eq('ran from seis: they take 3', Core.answer(six, 'run').score, [0, 3]);
  const nove = Core.answer(six, 'raise'), doze = Core.answer(Core.answer(nove, 'raise'), 'accept');
  eq('nove, doze, and no raise above 12', [nove.ask.value, doze.value, Core.answer({ ...doze, phase: 'truco', ask: { by: 0, value: 12 } }, 'raise').ask.value, Core.answer(base, 'accept') === base], [9, 12, 12, true]);
  eq('the partner of the asker never answers: the other pair does', Core.whoActs(Core.raise({ ...base, turn: 2 }, 2)), 3);
  eq('a bluff is remembered, and shown when the others run', [Core.raise({ ...base, turn: 1 }, 1, true).ask.bluff, Core.answer(Core.raise({ ...base, turn: 1 }, 1, true), 'run').result.shown], [true, { seat: 1, cards: ['5c', '2o', '6e'], bluff: true }]);

  /* eleven and iron */
  const at11 = Core.nextHand({ ...h, score: [11, 4] }, Core.seeded(5));
  eq('mão de onze: the pair with 11 decides first; no truco', [at11.phase, at11.eleven, Core.whoActs(at11), Core.canRaise({ ...at11, phase: 'play' }, at11.turn)], ['eleven', 0, 0, false]);
  const play11 = Core.decideEleven(at11, true), run11 = Core.decideEleven(at11, false);
  eq('mão de onze: played it is worth 3; run from, the others get 1', [play11.phase, play11.value, run11.score, run11.phase, Core.decideEleven(base, true) === base], ['play', 3, [11, 5], 'handEnd', true]);
  const them11 = Core.nextHand({ ...h, score: [2, 11] }, Core.seeded(5));
  eq('mão de onze for them: Biu decides', [them11.eleven, Core.whoActs(them11)], [1, 1]);
  const iron = Core.nextHand({ ...h, score: [11, 11] }, Core.seeded(5));
  eq('mão de ferro: both with 11, blind, worth 1, no truco, and it ends the game', [iron.phase, iron.blind, iron.value, iron.eleven, Core.canRaise(iron, iron.turn)], ['play', true, 1, null, false]);
  const ironEnd = Core.playCard(Core.playCard({ ...iron, rounds: [0], turn: 0, starter: 0, table: [{ seat: 2, card: iron.hands[2][0] }, { seat: 3, card: iron.hands[3][0] }].slice(0, 0) }, 0, 0), 1, 0);
  eq('mão de ferro: cards still go down one by one', ironEnd.table.length, 2);
  const win = { ...base, score: [10, 4], value: 3, rounds: [0], hands: [['3o'], ['4e'], ['5o'], ['6e']] };
  const won = [0, 1, 2, 3].reduce((x, s) => Core.playCard(x, s, 0), win);
  eq('12 points end the game; the score stops at 12', [won.phase, won.winner, won.score, Core.whoActs(won), Core.nextHand(won, rand) === won], ['over', 0, [12, 4], null, true]);
  const allTie = [0, 1, 2, 3].reduce((x, s) => Core.playCard(x, s, 0), { ...base, rounds: [-1, -1], hands: [['3o'], ['3e'], ['4c'], ['4p']] });
  eq('three tied rounds: nobody scores', [allTie.phase, allTie.score, allTie.result.team], ['handEnd', [0, 0], null]);

  /* the computer players */
  const ai = (hands, extra = {}) => ({ ...base, hands, turn: 1, starter: 1, ...extra });
  eq('AI leads its best card in the first round', Core.aiCard(ai([[], ['4e', '3e', 'Ke'], [], []]), 1, never), 1);
  eq('AI keeps a manilha back when its second card is strong too', Core.aiCard(ai([[], ['4e', '5p', '3e'], [], []]), 1, never), 2);
  eq('AI takes the round with its cheapest winning card', Core.aiCard(ai([[], ['3e', 'Ke', 'Ae'], [], []], { table: [{ seat: 0, card: 'Jc' }] }), 1, never), 1);
  eq('AI throws its weakest when it cannot win, or when the partner has it', [Core.aiCard(ai([[], ['6e', '7e', 'Qe'], [], []], { table: [{ seat: 0, card: '3c' }] }), 1, never), Core.aiCard({ ...ai([[], [], [], ['3e', '6e', 'Ke']]), turn: 3, table: [{ seat: 0, card: 'Jc' }, { seat: 1, card: '3c' }, { seat: 2, card: '4c' }] }, 3, never)], [0, 1]);
  const hardCover = { ...base, level: 'dificil', turn: 2, table: [{ seat: 0, card: 'Ko' }, { seat: 1, card: '7e' }], hands: [[], [], ['6e', 'Ae', '2e'], []] };
  // the hard player covers only when taking this round takes the hand; in the first round it keeps the card
  eq('hard AI covers its partner when an opponent still plays and the round decides the hand; médio throws low', [Core.aiCard({ ...hardCover, rounds: [0] }, 2, never), Core.aiCard({ ...hardCover, rounds: [0], level: 'medio' }, 2, never), Core.aiCard(hardCover, 2, never)], [1, 0, 0]);
  eq('easy AI sometimes plays any card; blind play is always any card', [Core.aiCard({ ...ai([[], ['4e', '3e', 'Ke'], [], []]), level: 'facil' }, 1, always), Core.aiCard({ ...ai([[], ['4e', '3e', 'Ke'], [], []]), blind: true }, 1, always)], [0, 0]);
  const strong = ai([[], ['5p', '5c', '3e'], [], []]), weak = ai([[], ['4e', '6o', '7e'], [], []]);
  eq('AI raises with a strong hand, not with a weak one; bluffs when chance says so', [Core.aiRaise(strong, 1, never), Core.aiRaise(weak, 1, never), Core.aiRaise(weak, 1, always), Core.aiRaise({ ...weak, raisedBy: 1 }, 1, always)], ['yes', 'no', 'bluff', 'no']);
  const sureWin = { ...base, rounds: [1], turn: 3, starter: 0, table: [{ seat: 0, card: '4e' }, { seat: 1, card: '6o' }, { seat: 2, card: 'Qe' }], hands: [[], [], [], ['Ke', '4o']] };
  eq('AI raises when the hand is surely its own (last to play, a card that takes it, a round in the pocket)', Core.aiRaise(sureWin, 3, never), 'yes');
  const asked = (hand, value = 3, level = 'medio') => ({ ...base, level, phase: 'truco', ask: { by: 0, value }, hands: [[], hand, [], []] });
  eq('AI answers: raises with a monster, accepts a good hand, runs a bad one', [Core.aiAnswer(asked(['5p', '5c', '3e']), 1), Core.aiAnswer(asked(['3e', '2e', 'Ke']), 1), Core.aiAnswer(asked(['4e', '6o', '7e']), 1, never), Core.aiAnswer(asked(['4e', '6o', '7e']), 1, always)], ['raise', 'accept', 'run', 'accept']);
  eq('easy AI never raises back', Core.aiAnswer(asked(['5p', '5c', '3e'], 3, 'facil'), 1), 'accept');
  // answering by the odds: running gives the others what the hand was worth, accepting risks what was asked
  const at = (hand, prev, value, level, extra = {}) => ({ ...base, level, phase: 'truco', value: prev, raisedBy: prev > 1 ? 1 : null, ask: { by: 0, value }, hands: [[], hand, [], []], ...extra });
  eq('a doze from nove is paid with a fair hand (running loses 9 for sure), at médio and difícil; a lost hand (a round down, nothing left) still runs',
    [Core.aiAnswer(at(['3e', '2o', 'Ae'], 9, 12, 'medio'), 1, never), Core.aiAnswer(at(['3e', '2o', 'Ae'], 9, 12, 'dificil'), 1, never), Core.aiAnswer(at(['4e', '6o'], 9, 12, 'dificil', { rounds: [0] }), 1, never)], ['accept', 'accept', 'run']);
  eq('never runs when running hands the others the game', [Core.aiAnswer(at(['4e', '6o', '7e'], 6, 9, 'medio', { score: [6, 0] }), 1, never), Core.aiAnswer(at(['4e', '6o', '7e'], 6, 9, 'dificil', { score: [6, 0] }), 1, never)], ['accept', 'accept']);
  // a seat seen bluffing again and again gets paid more often by the hard player
  const bluffer = [{ shown: 10, weak: 8, answers: 0, runs: 0 }, ...[1, 2, 3].map(() => ({ shown: 0, weak: 0, answers: 0, runs: 0 }))];
  const honest = [{ shown: 10, weak: 0, answers: 0, runs: 0 }, ...[1, 2, 3].map(() => ({ shown: 0, weak: 0, answers: 0, runs: 0 }))];
  const pays = reads => { let k = 0; for (let i = 0; i < 40; i++) if (Core.aiAnswer(at(['Ke', 'Ao', '7e'], 1, 3, 'dificil', { reads }), 1, Core.seeded(i)) !== 'run') k++; return k; };
  const pb = pays(bluffer), ph = pays(honest);
  eq('the hard player pays a known bluffer more than a seat that only raises with a hand', [pb > ph, Core.bluffRate({ ...base, level: 'dificil', reads: bluffer }, 0) > 0.6, Core.bluffRate({ ...base, level: 'dificil', reads: honest }, 0) < 0.1], [true, true, true]);
  // the extreme player bluffs where it works and against a pair that runs, hardly ever against one that always pays
  {
    const xb = { ...base, level: 'extremo', phase: 'play', turn: 0 };
    const reads = runs => [0, 1, 2, 3].map(s => ({ shown: 0, weak: 0, answers: s === 1 ? 10 : 0, runs: s === 1 ? runs : 0 }));
    const runner = Core.extremeBluff({ ...xb, reads: reads(9) }, 0), payer = Core.extremeBluff({ ...xb, reads: reads(0) }, 0);
    const ahead = Core.extremeBluff({ ...xb, rounds: [0], hands: [['5p', '3o'], ['5c', '2o'], ['Ke', 'Ac'], ['Jo', 'Qe']] }, 0), first = Core.extremeBluff(xb, 0);
    eq('the extreme player: bluffs more against a pair that runs, almost never against one that pays, more with a round taken, never past its cap', [runner > 4 * payer, payer < 0.01, ahead > 2 * first, runner <= Core.EXTREME_BLUFF.max], [true, true, true, true]);
    const won = { ...xb, hands: [['5p', '5c', '3o'], ['4e', '6o', '7e'], ['Ke', 'Ac', '7o'], ['Jo', 'Qe', '6c']] };
    eq('the extreme player: a won hand is sometimes kept quiet in the first round, and raised otherwise', [Core.aiRaise(won, 0, always), Core.aiRaise(won, 0, never), Core.aiRaise({ ...won, rounds: [0], hands: [['5p', '5c'], ['4e', '6o'], ['Ke', 'Ac'], ['Jo', 'Qe']] }, 0, always)], ['no', 'yes', 'yes']);
  }
  // what the table sees: a weak raise shown when the others run counts as a bluff, and the run is counted too
  const seen = Core.answer(Core.raise({ ...base, hands: [['4e', '6o', '7e'], ['3e', '2o', 'Ae'], ['Qe', 'Je', 'Ke'], ['4c', '6p', '7c']] }, 0), 'run');
  eq('reads: a weak raise shown when the others run is a bluff seen; the one who ran is counted', [seen.reads[0], seen.reads[1]], [{ shown: 1, weak: 1, answers: 0, runs: 0 }, { shown: 0, weak: 0, answers: 1, runs: 1 }]);
  const old = JSON.parse(JSON.stringify(seen)); delete old.reads; delete old.watch;
  eq('a game saved before reads opens, unread; broken reads are dropped', [!!Core.readGame(old), Core.readGame(old).reads, Core.readGame({ ...JSON.parse(JSON.stringify(seen)), reads: [{ shown: 1, weak: 5 }] }).reads, Core.nextHand(Core.readGame(old), Core.seeded(1)).reads.length], [true, undefined, undefined, 4]);
  eq('cards not seen: 40 minus its hand, the vira and what was played', [Core.unseen({ ...base, played: ['2o'] }, 0).length, Core.sure(base, 0, '5p'), Core.sure(base, 0, '3o')], [35, true, false]);
  eq('strength and weight: the zap is worth most', [Core.weight('5p', '4o'), Core.weight('4e', '4o'), Core.strength(['5p', '3o'], '4o')], [5, 0.2, 8]);
  eq('AI plays a hand of eleven only when both hands are strong', [Core.aiEleven({ ...base, hands: [[], ['5p', '3o', '3e'], [], ['2o', '5c', 'Ae']] }, 1), Core.aiEleven({ ...base, hands: [[], ['4e', '6o', '7e'], [], ['4c', '6p', 'Qe']] }, 1)], [true, false]);
  eq('aiAct: nothing when it is the person\'s move or nobody\'s', [Core.aiAct(base, rand) === base, Core.aiAct(h, rand) === h], [true, true]);
  eq('aiAct: plays, answers, decides', [Core.aiAct(ai([[], ['4e', '3e', 'Ke'], [], []]), never).table.length, Core.aiAct({ ...Core.raise(base, 0), hands: [[], ['5p', '5c', '3e'], [], []] }, never).ask.value, Core.aiAct({ ...them11 }, never).phase !== 'eleven'], [1, 6, true]);
  eq('aiAct: raises with a strong hand, bluff flagged', [Core.aiAct(strong, never).phase, Core.aiAct(weak, always).ask.bluff], ['truco', true]);
  // the extreme player never looks at hidden cards: swapping the others' hidden cards for others that fit what is
  // public (same counts, cards it has not seen) changes none of its moves
  {
    const xr = Core.seeded(41); let same = 0, tried = 0;
    for (let i = 0; i < 12; i++) {
      let g = { ...Core.newGame(xr, 'extremo'), humans: [] };
      for (let k = 0; k < i % 5; k++) if (Core.whoActs(g) !== null) g = Core.aiAct(g, xr);
      const s = Core.whoActs(g); if (s === null || g.phase === 'eleven') continue;
      const hidden = Core.shuffle(g.hands.flatMap((h, j) => (j === s ? [] : h)), Core.seeded(i + 100));
      let k = 0; const swapped = { ...g, hands: g.hands.map((h, j) => (j === s ? h : hidden.slice(k, (k += h.length)))) };
      const a = Core.aiAct(g, Core.seeded(i)), b = Core.aiAct(swapped, Core.seeded(i));
      tried++; if (a.phase === b.phase && JSON.stringify(a.ask) === JSON.stringify(b.ask) && JSON.stringify(a.table) === JSON.stringify(b.table) && a.value === b.value) same++;
    }
    eq('the extreme player decides the same whatever the hidden cards are (it never reads them)', [tried > 5, same === tried], [true, true]);
  }
  // whole games between computer players end, at every level
  for (const level of Core.LEVELS) {
    const rr = Core.seeded(11); let g = Core.newGame(rr, level), k = 0;
    while (g.phase !== 'over' && k < 3000) { k++; const who = Core.whoActs(g); g = who === null ? Core.nextHand(g, rr) : who === 0 ? (g.phase === 'eleven' ? Core.decideEleven(g, true) : g.phase === 'truco' ? Core.answer(g, 'accept') : Core.playCard(g, 0, 0)) : Core.aiAct(g, rr); }
    eq(`a whole game at ${level} ends with a winner at 12`, [g.phase, Math.max(...g.score), g.hist.length > 0, !!Core.readGame(JSON.parse(JSON.stringify(g)))], ['over', 12, true, true]);
  }

  /* training */
  const dm = Core.drill('manilha', Core.seeded(9));
  eq('drill manilha: four options, the answer among them, the answer is the manilha', [dm.options.length, dm.options.includes(dm.answer), dm.answer === Core.manilhaRank(dm.vira), Core.drillOk(dm, dm.answer), Core.drillOk(dm, 'x')], [4, true, true, true, false]);
  let duels = 0, ties = 0, ok = true;
  for (let s = 1; s <= 200; s++) {
    const dr = Core.drill('round', Core.seeded(s)), w = Core.roundWinner(dr.plays, dr.vira);
    ok = ok && dr.plays.length === 4 && new Set(dr.plays.map(p => p.card)).size === 4 && !dr.plays.some(p => p.card === dr.vira) && dr.answer === (w === -1 ? 'empate' : dr.plays[w].card) && dr.options.includes(dr.answer) && dr.why.length > 10;
    if (Core.suitDuel(dr.plays, dr.vira).length) duels++;
    if (w === -1) ties++;
  }
  eq('drill round: 200 drills, each answer right, with many suit duels and some ties', [ok, duels > 60, ties > 20], [true, true, true]);

  /* the real table */
  let rt = Core.emptyTable();
  eq('real table: empty, the vira first', [rt.target, Core.tableSay(rt), Core.advise(rt)], ['vira', 'Diga primeiro a vira.', null]);
  rt = Core.tell(rt, '6o');
  eq('the vira told, the hand is next', [rt.vira, rt.target, Core.tableSay(rt)], ['6o', 'hand', 'Vira 6 de ouros: manilha é 7.']);
  rt = ['7p', '3o', 'Ke'].reduce((x, c) => Core.tell(x, c), rt);
  eq('three cards in the hand, then the table; a fourth is refused; a bad card is ignored', [rt.hand, rt.target, Core.tell(rt, '2c', 'hand') === rt, Core.tell(rt, 'Xx') === rt], [['7p', '3o', 'Ke'], 'table', true, true]);
  const adv0 = Core.advise(rt);
  eq('advice: the hand strongest first, with its place, and what still beats it', adv0.cards.map(c => [c.card, c.place, c.manilha, c.beatenBy, c.sure]), [['7p', 1, true, 0, true], ['3o', 5, false, 3, false], ['Ke', 8, false, 14, false]]);
  rt = Core.tell(Core.tell(rt, '2p'), '7c');
  const adv1 = Core.advise(rt);
  eq('advice with cards on the table: the top one, and the cheapest of yours that takes it', [adv1.top, adv1.cheapest, Core.tableSay(rt)], ['7c', '7p', 'Na mesa, a mais forte é 7 de copas (copas).']);
  eq('advice: a tie when nothing takes it', Core.advise({ vira: '6o', hand: ['3o', '4e'], table: ['3p'], gone: [], target: 'table' }).tie, '3o');
  eq('two manilhas on the table: the suit', Core.tableSay({ vira: '6o', hand: [], table: ['7o', '7e'], gone: [], target: 'table' }), 'Na mesa, a mais forte é 7 de espadas (espadilha) (ganha no naipe das outras manilhas).');
  const nr = Core.nextRound({ ...rt, table: ['2p', '7p'] });
  eq('end of a round: the table goes out of play, your card leaves your hand', [nr.table, nr.gone, nr.hand], [[], ['2p', '7p'], ['3o', 'Ke']]);
  eq('a card told again moves; untell takes it back', [Core.tell(rt, '3o', 'table').hand, Core.untell(rt, '7c').table, Core.untell(rt, '6o').vira], [['7p', 'Ke'], ['2p'], null]);
  eq('hearing: cards with "de" or without, rank words and digits, and where they go', Core.hear('Vira sete de copas, minha mão: três de ouros, rei espadas e 2 de paus. Mesa: ás de copas', null, 'vira'), [{ card: '7c', target: 'vira' }, { card: '3o', target: 'hand' }, { card: 'Ke', target: 'hand' }, { card: '2p', target: 'hand' }, { card: 'Ac', target: 'table' }]);
  eq('hearing: manilhas by nickname need the vira', [Core.hear('zap e espadilha e pica fumo', '7c', 'hand'), Core.hear('zap', null, 'hand')], [[{ card: 'Qp', target: 'hand' }, { card: 'Qe', target: 'hand' }, { card: 'Qo', target: 'hand' }], []]);
  eq('hearing: the vira said first sets the manilha for the rest', Core.hear('vira três de paus, zap', null, 'vira'), [{ card: '3p', target: 'vira' }, { card: '4p', target: 'hand' }]);
  eq('hearing: words that are not cards are left out', [Core.hear('as cartas estão boas', null, 'hand'), Core.hear('', null, 'hand'), Core.hear('valete de coração e dama de espada', null, 'table')], [[], [], [{ card: 'Jc', target: 'table' }, { card: 'Qe', target: 'table' }]]);

  /* the themes: packs of teams of three, the table seat by seat, the colours */
  const ids = Core.TEAMS.map(t => t.id), chars = Core.TEAMS.flatMap(t => [0, 1, 2].map(i => `${t.id}/${i}`));
  eq('every pack registered: a kind, a lead word, its colours, at least one team; every team three named players; ids unique', [Core.PACKS.every(p => p.kind && p.kindName && p.lead && p.colors && p.groups.length > 0), Core.TEAMS.every(t => t.colors.length === 3 && t.colors.every(c => /^#[0-9a-f]{6}$/.test(c)) && t.players.length === 3 && t.players.every(p => p && p.length <= 24)), new Set(ids).size === ids.length, new Set(Core.PACKS.map(p => p.id)).size === Core.PACKS.length], [true, true, true, true]);
  eq('the packs asked for: the Série A with its 20 clubs, three animes and two fighting games', [Core.packById('futebol').groups.length, Core.kinds().map(k => [k.id, k.packs.map(p => p.id)])], [20, [['futebol', ['futebol']], ['anime', ['blue-lock', 'naruto', 'dragon-ball']], ['jogos', ['street-fighter', 'mortal-kombat']]]]);
  eq('the clubs promoted for 2026 are in, the ones relegated are not', [['athletico', 'chapecoense', 'coritiba', 'remo'].every(c => Core.teamById(`futebol/${c}`)), ['fortaleza', 'ceara', 'juventude', 'sport'].some(c => Core.teamById(`futebol/${c}`))], [true, false]);
  const declared = [...Core.PACKS.map(p => p.colors), ...Core.PACKS.flatMap(p => p.groups.flatMap(g => [g.colors, ...g.players.map(c => typeof c === 'string' ? undefined : c.colors)])).filter(Boolean)];
  eq('every colour declared, of pack, team or character, has its text colour at 4.5:1 or more on the main one', declared.filter(c => Core.contrast(c[2], c[0]) < 4.5), []);
  eq('the words in the second colour fall back to the text colour when the second does not read', [Core.accentOn(['#c8102e', '#111111', '#ffffff']), Core.accentOn(['#6cabdd', '#ffffff', '#111111']), Math.round(Core.contrast('#ffffff', '#000000'))], ['#111111', '#111111', 21]);
  eq('a character takes its own colours, else its team\'s; a team without its own takes its pack\'s', [Core.colorsOf('street-fighter/shotokan/1'), Core.colorsOf('naruto/time-8/0'), Core.colorsOf('naruto/time-8'), Core.colorsOf('naruto'), Core.colorsOf('x/y/0')], [['#b91c1c', '#fde047', '#ffffff'], ['#6b4c9a', '#e7d9b0', '#ffffff'], ['#6b4c9a', '#e7d9b0', '#ffffff'], ['#c2410c', '#1b2a4a', '#ffffff'], null]);
  eq('ids saved before themes were bare club ids: they move to the football pack; known ids stay, others are none', [Core.qualify('flamengo'), Core.qualify('naruto/time-7'), Core.qualify('naruto/time-7/2'), Core.qualify('real-madrid'), Core.qualify(7)], ['futebol/flamengo', 'naruto/time-7', 'naruto/time-7/2', null, null]);
  eq('no team: the bar table', Core.lineup(), { names: ['Você', 'Biu', 'Cida', 'Toinho'], sides: [null, null] });
  eq('a team: the star is the partner, the other two the opponents', Core.lineup('futebol/flamengo'), { names: ['Você', 'Lucas Paquetá', 'Pedro', 'Carrascal'], sides: ['futebol/flamengo', null] });
  eq('rivals across themes: the star with you, the rival\'s first two against', [Core.lineup('futebol/flamengo', 'futebol/palmeiras'), Core.lineup('naruto/time-7', 'dragon-ball/saiyajins')], [{ names: ['Você', 'Vitor Roque', 'Pedro', 'Flaco López'], sides: ['futebol/flamengo', 'futebol/palmeiras'] }, { names: ['Você', 'Vegeta', 'Naruto', 'Nappa'], sides: ['naruto/time-7', 'dragon-ball/saiyajins'] }]);
  eq('a rival that is your own team, or unknown, is no rival', [Core.lineup('futebol/flamengo', 'futebol/flamengo').sides, Core.lineup('futebol/flamengo', 'xyz').sides, Core.lineup('xyz').names[1]], [['futebol/flamengo', null], ['futebol/flamengo', null], 'Biu']);
  eq('names the person changed win; blank ones fall back to the team\'s', [Core.playersOf('futebol/santos', { 'futebol/santos': ['Pelé', ' ', 'Zito'] }), Core.lineup('futebol/santos', null, { 'futebol/santos': ['Pelé', 'Coutinho', 'Zito'] }).names], [['Pelé', 'Gabigol', 'Zito'], ['Você', 'Coutinho', 'Pelé', 'Zito']]);
  const mixed = { partner: 'street-fighter/shotokan/0', opp: ['mortal-kombat/shirai-ryu/0', 'mortal-kombat/lin-kuei/0'] };
  eq('a table seat by seat, characters of any pack: the partner across, the opponents on the sides; it wins over a team', [Core.lineup('futebol/flamengo', null, undefined, mixed).names, Core.lineup(null, null, { 'mortal-kombat/shirai-ryu': ['Escorpião', '', ''] }, mixed).names[1]], [['Você', 'Scorpion', 'Ryu', 'Sub-Zero'], 'Escorpião']);
  eq('the colours follow the choice: the pack\'s, the team\'s, or the characters\' own ("Eles" by the first opponent)', ['pack', 'team', 'char'].map(by => Core.lineup(null, null, undefined, mixed, by).sides).concat([Core.lineup('naruto/time-7', 'dragon-ball/saiyajins', undefined, null, 'char').sides, Core.lineup('naruto/time-7', null, undefined, null, 'pack').sides]),
    [['street-fighter', 'mortal-kombat'], ['street-fighter/shotokan', 'mortal-kombat/shirai-ryu'], ['street-fighter/shotokan/0', 'mortal-kombat/shirai-ryu/0'], ['naruto/time-7/0', 'dragon-ball/saiyajins/0'], ['naruto', null]]);
  eq('a table seat by seat holds together only with three known, different characters', [Core.readSeats(mixed), Core.readSeats({ partner: 'x/y/0', opp: mixed.opp }), Core.readSeats({ partner: mixed.opp[0], opp: mixed.opp }), Core.readSeats({ partner: mixed.partner, opp: [mixed.opp[0]] }), Core.readSeats(null)], [mixed, null, null, null, null]);
  const drawn = [1, 2, 3, 4, 5].map(k => Core.drawSeats(Core.seeded(k)));
  eq('a drawn table: three different characters, real ones, and not always the same', [drawn.every(d => !!Core.readSeats(d)), new Set(drawn.map(d => d.partner)).size > 1, chars.length], [true, true, Core.TEAMS.length * 3]);
  eq('a character by id: its team, place and name; nothing for what is not one', [Core.charById('dragon-ball/guerreiros-z/0').name, Core.charById('dragon-ball/guerreiros-z/0').team.pack.name, Core.charById('dragon-ball/guerreiros-z/3'), Core.charById('dragon-ball/x/0'), Core.charName('naruto/time-7/1', { 'naruto/time-7': ['', 'Sasuke Uchiha', ''] })], ['Goku', 'Dragon Ball', null, null, 'Sasuke Uchiha']);
  eq('the same person in two teams (Nagi in Time V and Manshine City) is one person: never two seats of one table', [Core.samePerson('blue-lock/time-v/0', 'blue-lock/manshine-city/1'), Core.samePerson('blue-lock/time-v/0', 'blue-lock/time-v/1'), Core.readSeats({ partner: 'blue-lock/time-v/0', opp: ['blue-lock/manshine-city/1', 'naruto/time-7/0'] })], [true, false, null]);
  const many = Array.from({ length: 300 }, (_, k) => Core.drawSeats(Core.seeded(k + 1)));
  eq('300 drawn tables: never the same person twice', many.filter(d => !Core.readSeats(d)).length, 0);
  eq('heroes against villains only where the story has sides: not football, not Blue Lock', Core.sidedPacks().map(p => p.id), ['naruto', 'dragon-ball', 'street-fighter', 'mortal-kombat']);
  eq('a character takes its own side, else its group\'s; football has none', [Core.sideOf('naruto/sannin/0'), Core.sideOf('naruto/sannin/2'), Core.sideOf('street-fighter/shotokan/2'), Core.sideOf('mortal-kombat/exoterra/1'), Core.sideOf('futebol/flamengo/0'), Core.sideOf('blue-lock/time-z/0')], ['heroi', 'vilao', 'vilao', 'heroi', null, null]);
  const hvs = [null, 'naruto', 'dragon-ball', 'street-fighter', 'mortal-kombat'].flatMap(pk => ['heroi', 'vilao'].flatMap(me => Array.from({ length: 40 }, (_, k) => ({ pk, me, t: Core.drawSided(Core.seeded(k + 7), pk, me) }))));
  eq('drawn heroes against villains: the partner on your side, both opponents on the other, in the pack asked for, no person twice', hvs.filter(({ pk, me, t }) => !(Core.readSeats(t) && Core.sideOf(t.partner) === me && t.opp.every(o => Core.sideOf(o) && Core.sideOf(o) !== me) && (!pk || [t.partner, ...t.opp].every(c => c.startsWith(pk + '/'))))).length, 0);
  eq('mixed heroes against villains draws from more than one pack', new Set(hvs.filter(x => !x.pk).flatMap(x => [x.t.partner, ...x.t.opp].map(c => c.split('/')[0]))).size > 1, true);
  eq('the teams as reviewed: no Kimimaro in the Quarteto do Som, Noa leads Bastard München, Piccolo is there, Tenshinhan is of the Grou', [Core.teamById('naruto/quarteto').players.includes('Kimimaro'), Core.teamById('blue-lock/bastard-munchen').players[0], Core.teamById('dragon-ball/namek').players[0], Core.teamById('dragon-ball/grou').players[0], Core.teamById('dragon-ball/kame').players.includes('Tenshinhan'), Core.teamById('naruto/nevoa').players], [false, 'Noa', 'Piccolo', 'Tenshinhan', false, ['Zabuza', 'Haku', 'Kisame']]);
  /* suggested rivals (D16) */
  const groupsAll = Core.PACKS.flatMap(p => p.groups.map(g => ({ id: `${p.id}/${g.id}`, g })));
  eq('every declared rival: at most 3, a team that exists, not itself, not twice, each with its reason', groupsAll.filter(({ id, g }) => g.rivals && !(g.rivals.length <= Core.RIVALS_MAX && g.rivals.every(r => r !== id && ids.includes(r)) && new Set(g.rivals).size === g.rivals.length && (g.why || []).length === g.rivals.length && g.why.every(w => w && w.length <= 80))).map(x => x.id), []);
  const sug = Object.fromEntries(ids.map(id => [id, Core.suggestRivals(id)]));
  eq('every team gets 1 to 3 suggested rivals, never itself, never twice, each with a reason; packs of 4 or more get 3', ids.filter(id => { const l = sug[id], n = Core.teamById(id).pack.groups.length; return !(l.length >= 1 && l.length === Math.min(Core.RIVALS_MAX, n - 1) && l.every(r => r.id !== id && ids.includes(r.id) && r.why)) || new Set(l.map(r => r.id)).size !== l.length; }), []);
  eq('every football club has its declared direct rival first', Core.TEAMS.filter(t => t.pack.id === 'futebol').filter(t => sug[t.id][0].how !== 'dados').map(t => t.id), []);
  eq('the classics both ways: Fla-Flu, Derby, Gre-Nal, clássico mineiro, Ba-Vi, Atletiba; Vasco and Botafogo want Flamengo; São Paulo and Santos, Corinthians',
    [['flamengo', 'fluminense'], ['corinthians', 'palmeiras'], ['gremio', 'internacional'], ['atletico-mg', 'cruzeiro'], ['bahia', 'vitoria'], ['athletico', 'coritiba'], ['vasco', 'flamengo'], ['botafogo', 'flamengo'], ['sao-paulo', 'corinthians'], ['santos', 'corinthians']].map(([a, b]) => sug[`futebol/${a}`][0].id === `futebol/${b}`), Array(10).fill(true));
  eq('a declared direct rival that lists fewer than 3 has the other in its list (both ways)', groupsAll.filter(({ id, g }) => g.rivals && (Core.PACKS.flatMap(p => p.groups).find(x => `${Core.teamById(g.rivals[0]).pack.id}/${x.id}` === g.rivals[0]).rivals || []).length < Core.RIVALS_MAX && !sug[g.rivals[0]].some(r => r.id === id)).map(x => x.id), []);
  eq('the story rivals: Time 7 × Areia, Guerreiros Z × Freeza, Saiyajins × Guerreiros Z, Time Z × Time V, Shotokan × Shadaloo, Shaolin × Exoterra, Lin Kuei × Shirai Ryu, Forças Especiais × Exoterra',
    [sug['naruto/time-7'][0].id, sug['dragon-ball/guerreiros-z'][0].id, sug['dragon-ball/saiyajins'][0].id, sug['blue-lock/time-z'][0].id, sug['street-fighter/shotokan'][0].id, sug['mortal-kombat/shaolin'][0].id, sug['mortal-kombat/lin-kuei'][0].id, sug['mortal-kombat/forcas-especiais'][0].id],
    ['naruto/areia', 'dragon-ball/freeza', 'dragon-ball/guerreiros-z', 'blue-lock/time-v', 'street-fighter/shadaloo', 'mortal-kombat/exoterra', 'mortal-kombat/shirai-ryu', 'mortal-kombat/exoterra']);
  eq('the same suggestion every time; nothing for an unknown team', [JSON.stringify(Core.suggestRivals('futebol/flamengo')) === JSON.stringify(sug['futebol/flamengo']), Core.suggestRivals('futebol/real-madrid'), Core.suggestRivals(null)], [true, [], []]);
  const fake = (gs) => [{ id: 'x', kind: 'x', kindName: 'X', name: 'Pack X', lead: 'líder', colors: ['#000000', '#ffffff', '#ffffff'], groups: gs.map(([id, side, extra]) => ({ id, name: id.toUpperCase(), side, players: ['a', 'b', 'c'], ...(extra || {}) })) }];
  const fb = fake([['a', 'heroi'], ['b', 'heroi'], ['c', 'vilao', { players: ['p', { name: 'q', side: 'heroi' }, { name: 'r', side: 'heroi' }] }], ['d', 'vilao'], ['e', undefined, { rivals: ['x/a'], why: ['E × A'] }]]);
  eq('fallbacks: the team that names it (with its reason), then the other side (by the side most of its characters are on), then the rest of the pack in order; never itself',
    [Core.suggestRivals('x/a', fb).map(r => [r.id, r.how, r.why]), Core.suggestRivals('x/d', fb).map(r => [r.id, r.how]), Core.suggestRivals('x/e', fb).map(r => [r.id, r.how])],
    [[['x/e', 'volta', 'E × A'], ['x/d', 'lado', 'vilões contra heróis'], ['x/b', 'pack', 'do mesmo tema (Pack X)']], [['x/a', 'lado'], ['x/b', 'lado'], ['x/c', 'lado']], [['x/a', 'dados'], ['x/b', 'pack'], ['x/c', 'pack']]]);
  eq('a pack of one team suggests nothing; of two, the other one', [Core.suggestRivals('x/a', fake([['a']])), Core.suggestRivals('x/a', fake([['a'], ['b']])).map(r => r.id)], [[], ['x/b']]);
  const club = Core.newGame(Core.seeded(4), 'medio', Core.lineup('futebol/flamengo', 'futebol/palmeiras'));
  eq('a game with a team: the names at the table and in the log, the colours of each pair', [club.names, club.sides, Core.raise({ ...club, phase: 'play', turn: 1 }, 1).log.at(-1)], [['Você', 'Vitor Roque', 'Pedro', 'Flaco López'], ['futebol/flamengo', 'futebol/palmeiras'], 'Vitor Roque pediu truco!']);
  eq('a game saved before themes, with bare club ids, opens with them in the football pack; unknown ones do not open', [Core.readGame(JSON.parse(JSON.stringify({ ...club, sides: ['flamengo', 'palmeiras'] }))).sides, Core.readGame(JSON.parse(JSON.stringify({ ...club, sides: ['real-madrid', null] })))], [['futebol/flamengo', 'futebol/palmeiras'], null]);

  /* people at more than one seat */
  const duo = { ...base, humans: [0, 1] };
  eq('a pair with a person answers through that person; a computer pair through the one after who asked', [Core.whoActs(Core.raise({ ...duo, turn: 0 }, 0)), Core.whoActs(Core.raise({ ...duo, turn: 2 }, 2)), Core.whoActs(Core.raise({ ...base, turn: 2 }, 2)), Core.whoActs(Core.raise({ ...duo, turn: 1 }, 1))], [1, 1, 3, 0]);
  eq('the computer never moves for a person', [Core.aiAct({ ...duo, turn: 1 }, never) === undefined, Core.aiAct({ ...duo, turn: 1 }, never).table.length, Core.isHuman(duo, 1), Core.isHuman(base, 1)], [false, 0, true, false]);
  const elevenThem = Core.nextHand({ ...h, humans: [0, 1], score: [3, 11] }, Core.seeded(5));
  eq('a hand of eleven for a pair with a person: that person decides', [Core.whoActs(elevenThem), Core.decideEleven(elevenThem, true).shout.seat], [1, 1]);
  eq('humans go along to the next hand, and default to seat 0', [Core.nextHand({ ...h, humans: [0, 3] }, rand).humans, Core.newGame(rand).humans, Core.newGame(rand, 'medio', { names: ['a', 'b', 'c', 'd'], sides: [null, null], humans: [3, 0] }).humans], [[0, 3], [0], [0, 3]]);

  /* each person's view */
  const vg = { ...base, humans: [0, 1], dealer: 0, starter: 1, turn: 2, names: ['Ana', 'Bia', 'Caio', 'Duda'], score: [5, 2], rounds: [0, -1], raisedBy: 0, sides: ['flamengo', 'palmeiras'],
    table: [{ seat: 1, card: '3e' }], last: { plays: [{ seat: 3, card: '2o' }], winner: 3 }, ask: { by: 3, value: 3, bluff: true }, shout: { seat: 3, word: 'truco' },
    result: { team: 1, points: 3, why: 'Nós levamos a mão.', shown: { seat: 3, cards: ['4e'], bluff: true } }, hist: [{ team: 0, points: 1, how: 'Eles correram.', value: 1 }], log: ['Mão de onze: nós decidimos se jogamos.'] };
  const v0 = Core.viewFor(vg, 0), v1 = Core.viewFor(vg, 1);
  eq('seat 0 sees the table as it is, but only its own cards', [v0.names, v0.hands[0], v0.hands.slice(1).every(hh => hh.every(c => c === '??')), v0.hands.map(hh => hh.length), v0.ask], [['Ana', 'Bia', 'Caio', 'Duda'], vg.hands[0], true, [3, 3, 3, 3], { by: 3, value: 3 }]);
  eq('seat 1 sees itself at the bottom, its pair as "Nós"', [v1.names, v1.hands[0], v1.score, v1.sides, v1.humans, v1.turn, v1.starter, v1.dealer, v1.rounds, v1.raisedBy], [['Bia', 'Caio', 'Duda', 'Ana'], vg.hands[1], [2, 5], ['palmeiras', 'flamengo'], [0, 3], 1, 0, 3, [1, -1], 1]);
  eq('seat 1: the cards on the table, the last round, the raise, the shout and the result turned too', [v1.table, v1.last, v1.ask, v1.shout, v1.result.team, v1.result.shown.seat, v1.hist[0].team], [[{ seat: 0, card: '3e' }], { plays: [{ seat: 2, card: '2o' }], winner: 2 }, { by: 2, value: 3 }, { seat: 2, word: 'truco' }, 0, 2, 1]);
  eq('seat 1: "Nós" and "Eles" swap in the words', [v1.result.why, v1.hist[0].how, v1.log[0], Core.swapSides('Nós levamos, eles correram')], ['Eles levaram a mão.', 'Nós corremos.', 'Mão de onze: eles decidem se jogam.', 'Eles levaram, nós corremos']);
  const v11 = Core.viewFor({ ...vg, phase: 'eleven', eleven: 1 }, 3);
  eq('a hand of eleven: the pair deciding sees both its hands, nobody else\'s', [v11.eleven, v11.hands[2], v11.hands[1].every(c => c === '??'), Core.viewFor({ ...vg, phase: 'eleven', eleven: 1 }, 0).hands[2].every(c => c === '??')], [0, vg.hands[1], true, true]);

  /* a room */
  const roll = Core.seeded(8), T = ['token-ana-1', 'token-bia-2', 'token-caio-3', 'token-duda-4', 'token-eva-5'];
  let room = Core.newRoom(Core.roomCode(Core.seeded(3)));
  eq('room codes: 5 letters that are hard to confuse', [Core.isCode(room.code), Core.isCode('AB0DE'), Core.isCode('abcde'), room.code.length], [true, false, false, Core.CODE_LEN]);

  /* limits against abuse, before the rules see a message */
  let bk = Core.newBucket(1000), oks = 0;
  for (let k = 0; k < Core.RATE_BURST + 5; k++) { const st = Core.allow(bk, 1000); bk = st.bucket; if (st.ok) oks++; }
  eq('rate: a burst of RATE_BURST goes through at once, the rest is refused', oks, Core.RATE_BURST);
  const later1 = Core.allow(bk, 1000 + 1000 / Core.RATE_PER_S);
  eq('rate: after 1/RATE_PER_S s one more message is earned, and only one', [later1.ok, Core.allow(later1.bucket, 1000 + 1000 / Core.RATE_PER_S).ok], [true, false]);
  eq('rate: a long pause refills up to RATE_BURST, never past it', Core.allow(bk, 1e9).bucket.left, Core.RATE_BURST - 1);
  eq('rate: a clock going back earns nothing', [Core.allow(bk, 0).ok, Core.allow(bk, 0).bucket.at], [false, 1000]);
  eq('rate: a person tapping 4 times a second for a minute is never cut', (() => { let b = Core.newBucket(0); for (let t = 0; t < 60000; t += 250) { const st = Core.allow(b, t); if (!st.ok) return false; b = st.bucket; } return true; })(), true);
  eq('size: up to MSG_MAX bytes goes through; past it, or not a number, does not', [Core.tooBig(Core.MSG_MAX), Core.tooBig(Core.MSG_MAX + 1), Core.tooBig(NaN), Core.tooBig(0)], [false, true, true, false]);
  eq('size: the biggest join a phone sends fits', Core.tooBig(JSON.stringify({ t: 'join', name: 'x'.repeat(16), token: 'y'.repeat(64), level: 'dificil' }).length), false);
  eq('connections: a room takes CONN_MAX, not one more', [Core.roomFull(0), Core.roomFull(Core.CONN_MAX - 1), Core.roomFull(Core.CONN_MAX)], [false, false, true]);
  eq('close codes: 1009 too big, 1008 too fast', [Core.CLOSE_BIG, Core.CLOSE_FAST], [1009, 1008]);
  const join = (r, tk, name, level) => Core.handle(r, tk, { t: 'join', name, token: tk, level }, roll);
  eq('joining: a name is needed, and a real token', [join(room, T[0], '  ').error, Core.handle(room, 'x', { t: 'join', name: 'Ana', token: 'x' }, roll).error], ['Escreve seu nome.', 'Não deu pra entrar: recarregue a página.']);
  room = join(room, T[0], '  Ana   Maria ', 'dificil').room;
  room = join(room, T[1], 'Bia', 'facil').room;
  eq('the first is the host at seat 0 and sets the level; the second sits against them', [room.members.map(m => [m.seat, m.name]), room.level, Core.roomView(room, T[0]).host, Core.roomView(room, T[1]).host], [[[0, 'Ana Maria'], [1, 'Bia']], 'dificil', true, false]);
  eq('the room as each one sees it: themselves at seat 0', [Core.roomView(room, T[1]).members, Core.roomView(room, 'nobody')], [[{ seat: 0, name: 'Bia', online: true }, { seat: 3, name: 'Ana Maria', online: true }], null]);
  eq('only the host starts; strangers are refused', [Core.handle(room, T[1], { t: 'start' }, roll).error, Core.handle(room, 'token-stranger', { t: 'start' }, roll).error], ['Só quem criou a sala começa a partida.', 'Você não está nessa sala.']);
  const hostTable = { names: ['Você', 'Scorpion', 'Ryu', 'Sub-Zero'], sides: ['street-fighter/shotokan', 'mortal-kombat/netherrealm'] };
  const themed = Core.handle(room, T[0], Core.readMsg({ t: 'start', table: hostTable }), roll).room.game;
  eq('online, the host\'s table names the computer players and colours the pairs; a table that does not hold together is left out', [themed.names, themed.sides, Core.readMsg({ t: 'start', table: { names: ['a'], sides: [null, null] } }), Core.readMsg({ t: 'again', table: { ...hostTable, sides: ['nada', null] } })],
    [['Ana Maria', 'Bia', 'Ryu', 'Sub-Zero'], ['street-fighter/shotokan', 'mortal-kombat/netherrealm'], { t: 'start' }, { t: 'again' }]);
  const left = Core.handle(join(room, T[2], 'Caio').room, T[2], { t: 'leave' }, roll).room;
  eq('before the game, leaving frees the seat', left.members.length, 2);
  room = Core.handle(room, T[0], { t: 'start' }, roll).room;
  const rg = room.game;
  eq('the game: the people at their seats, the computer at the others, with the bar\'s names', [rg.humans, rg.names[0], rg.names[1], rg.names[2], rg.names[3], rg.level], [[0, 1], 'Ana Maria', 'Bia', 'Cida', 'Toinho', 'dificil']);
  eq('once the game is on, nobody new comes in, and it cannot start twice', [join(room, T[3], 'Duda').error, Core.handle(room, T[0], { t: 'start' }, roll).error], ['Essa partida já começou.', 'A partida já está rolando.']);
  const offline = Core.handle(room, T[1], { t: 'drop' }, roll).room;
  eq('during the game, a dropped connection keeps the seat; coming back with the same token takes it again', [offline.members[1].online, join(offline, T[1], 'qualquer').room.members[1], offline.game.humans], [false, { seat: 1, name: 'Bia', token: T[1], online: true }, [0, 1]]);
  const botted = Core.handle(offline, T[0], { t: 'bot', seat: 1 }, roll).room;
  eq('the host can put the computer in the seat of someone who left', [botted.game.humans, botted.members.length, Core.handle(room, T[0], { t: 'bot', seat: 1 }, roll).error], [[0], 1, 'Esse jogador ainda está na sala.']);
  const started = room;
  const quit = Core.handle(room, T[1], { t: 'leave' }, roll).room, hostQuit = Core.handle(room, T[0], { t: 'leave' }, roll).room;
  eq('during the game, leaving for good puts the computer in the seat at once, and says so', [quit.game.humans, quit.members.map(m => m.name), quit.game.log.at(-1), Core.roomView(quit, T[0]).members.length], [[0], ['Ana Maria'], 'Bia saiu; a IA joga no lugar.', 1]);
  eq('the host leaving: the next person in the room is the host now', [hostQuit.game.humans, Core.roomView(hostQuit, T[1]).host, Core.handle(hostQuit, T[1], { t: 'bot', seat: 0 }, roll).error], [[1], true, 'Esse jogador ainda está na sala.']);
  const turnOf = Core.whoActs(room.game), mover = Core.handle(room, T[turnOf === 1 ? 1 : 0], { t: 'leave' }, roll).room, nobody = Core.handle(hostQuit, T[1], { t: 'leave' }, roll).room;
  eq('the computer moves for whoever left on their turn; with nobody left in the room, it stops', [Core.aiDelay(mover) !== null, nobody.members.length, nobody.game.humans, Core.aiDelay(nobody), Core.aiStep(nobody, roll) === nobody, Core.readMsg({ t: 'drop' })], [true, 0, [], null, true, null]);
  const back = (r, tk) => Core.handle(r, tk, { t: 'join', name: 'Bia', token: tk, back: true }, roll);
  eq('coming back to a game: the seat if it is there; a room the server deleted ends; a seat the computer took is said; before any game it is a plain join', [back(offline, T[1]).room.members[1].online, back(Core.newRoom(room.code), T[1]).error, back(botted, T[1]).error, back(Core.newRoom(room.code), T[1]).room.members.length, back({ ...left, game: null }, T[3]).room.members.length, Core.readMsg({ t: 'join', name: 'A', token: 'tttttttt', back: true }).back, 'back' in Core.readMsg({ t: 'join', name: 'A', token: 'tttttttt', back: 'yes' })],
    [true, Core.ROOM_GONE, Core.SEAT_GONE, 0, 3, true, false]);
  // play out the game through the room: people move only on their turn, the computer when aiDelay says so
  let steps = 0, refused = 0;
  while (room.game.phase !== 'over' && steps < 4000) {
    steps++;
    const g = room.game, who = Core.whoActs(g);
    if (who === null) { room = Core.handle(room, T[1], { t: 'act', a: 'next' }, roll).room; continue; }
    if (!Core.isHuman(g, who)) { const d = Core.aiDelay(room); if (d === null) break; room = Core.aiStep(room, roll); continue; }
    const tk = T[who], other = T[1 - who];
    if (Core.handle(room, other, { t: 'act', a: 'play', k: 0 }, roll).error) refused++;
    const msg = g.phase === 'eleven' ? { t: 'act', a: 'eleven', v: true } : g.phase === 'truco' ? { t: 'act', a: 'answer', v: 'accept' } : { t: 'act', a: 'play', k: 0 };
    room = Core.handle(room, tk, msg, roll).room;
  }
  eq('a whole game in a room ends; nobody can move out of turn', [room.game.phase, Math.max(...room.game.score), refused > 10, Core.aiDelay(room), Core.aiStep(room, roll) === room], ['over', 12, true, null, true]);
  // the same game again, twice, from the same seed: once kept in memory, once with the room going to storage and back
  // (JSON, then readRoom) after every message and every computer move, as the Durable Object does when it sleeps.
  // People here ask for truco, raise and run too, so asks, hands of eleven and shown bluffs all go through storage.
  const playOut = (sleep) => {
    const rr = Core.seeded(21), back = r => (sleep ? Core.readRoom(JSON.parse(JSON.stringify(r))) : r);
    let r = back(started), k = 0;
    const said = [];
    while (r.game.phase !== 'over' && k < 6000) {
      k++;
      const g = r.game, who = Core.whoActs(g);
      if (who === null) { r = back(Core.handle(r, T[1], { t: 'act', a: 'next' }, rr).room); continue; }
      if (!Core.isHuman(g, who)) { if (Core.aiDelay(r) === null) break; r = back(Core.aiStep(r, rr)); continue; }
      const msg = g.phase === 'eleven' ? { t: 'act', a: 'eleven', v: k % 3 !== 0 }
        : g.phase === 'truco' ? { t: 'act', a: 'answer', v: ['accept', 'raise', 'run'][k % 3] }
        : k % 5 === 0 ? { t: 'act', a: 'truco' } : { t: 'act', a: 'play', k: k % g.hands[who].length };
      const out = Core.handle(r, T[who], msg, rr);
      r = back(out.error && msg.a === 'truco' ? Core.handle(r, T[who], { t: 'act', a: 'play', k: 0 }, rr).room : out.room);
      said.push(JSON.stringify(Core.roomView(r, T[0])).length, JSON.stringify(Core.roomView(r, T[1])).length);
    }
    return { r, k, said };
  };
  const awake = playOut(false), asleep = playOut(true);
  eq('a room that sleeps after every move plays the same whole game as one kept in memory', [asleep.r.game.phase, same(asleep.r, awake.r), same(asleep.said, awake.said), awake.k > 20, awake.r.game.hist.some(x => x.points > 1)], ['over', true, true, true, true]);
  eq('the host starts another game with the same people', [Core.handle(room, T[0], { t: 'again' }, roll).room.game.phase !== 'over', Core.handle(room, T[0], { t: 'again' }, roll).room.game.score], [true, [0, 0]]);
  let full = Core.newRoom('ABCDE');
  for (let i = 0; i < 4; i++) full = join(full, T[i], 'P' + i).room;
  eq('four people fill the room', [full.members.map(m => m.seat), join(full, T[4], 'Eva').error], [[0, 1, 2, 3], 'A sala está cheia.']);
  {
    // D15: a finished hand stays ROOM_HAND_PAUSE on every screen, then the server deals the next one, people in it or not
    const ended = { ...room, game: { ...base, humans: [0, 1], phase: 'handEnd', result: { team: 0, points: 1, why: 'x' } } }, dealt = Core.aiStep(ended, Core.seeded(3));
    eq('online: the server deals the next hand by itself after the pause; not with nobody in the room, nor at the end of the game', [Core.aiDelay(ended), dealt.game.n, dealt.game.phase !== 'handEnd', Core.aiDelay({ ...ended, members: [] }), Core.aiDelay({ ...ended, game: { ...ended.game, phase: 'over' } }), Core.ROOM_HAND_PAUSE > Core.ROOM_THINK],
      [Core.ROOM_HAND_PAUSE, base.n + 1, true, null, null, true]);
  }
  eq('the computer waits longer after a round closes', [Core.aiDelay({ ...room, game: { ...base, humans: [0], turn: 1, table: [], last: null } }), Core.aiDelay({ ...room, game: { ...base, humans: [0], turn: 1, table: [], last: { plays: [], winner: 0 } } })], [Core.ROOM_THINK, Core.ROOM_THINK + Core.ROOM_ROUND_PAUSE]);
  eq('messages over the wire: read field by field, anything else is null', [Core.readMsg('{"t":"act","a":"play","k":2}'), Core.readMsg({ t: 'act', a: 'answer', v: 'raise' }), Core.readMsg({ t: 'join', name: 'A', token: 'tttttttt', level: 'x' }), Core.readMsg({ t: 'bot', seat: 2 }), Core.readMsg({ t: 'act', a: 'eleven', v: false }), Core.readMsg({ t: 'act', a: 'next' }), Core.readMsg({ t: 'start' })],
    [{ t: 'act', a: 'play', k: 2 }, { t: 'act', a: 'answer', v: 'raise' }, { t: 'join', name: 'A', token: 'tttttttt' }, { t: 'bot', seat: 2 }, { t: 'act', a: 'eleven', v: false }, { t: 'act', a: 'next' }, { t: 'start' }]);
  eq('bad messages read as null; unknown ones are refused', [['{', null, 'x', { t: 'act', a: 'play', k: 'x' }, { t: 'act', a: 'answer', v: 'dance' }, { t: 'zzz' }, { t: 'act', a: 'eleven', v: 1 }].map(Core.readMsg), Core.handle(room, T[0], { t: 'zzz' }, roll).error, Core.handle(Core.newRoom('ABCDE'), T[0], { t: 'act', a: 'next' }, roll).error], [[null, null, null, null, null, null, null], 'Mensagem desconhecida.', 'Você não está nessa sala.']);
  eq('a move before the game, or one the rules refuse', [Core.handle({ ...full, game: null }, T[0], { t: 'act', a: 'truco' }, roll).error, Core.handle({ ...room, game: { ...base, humans: [0, 1], turn: 0, raisedBy: 0 } , members: room.members }, T[0], { t: 'act', a: 'truco' }, roll).error, Core.handle({ ...room, game: { ...base, humans: [0, 1], phase: 'truco', ask: { by: 1, value: 3 } } }, T[0], { t: 'act', a: 'answer', v: 'dance' }, roll).error], ['A partida ainda não começou.', 'Agora não é a sua vez.', 'Agora não é a sua vez.']);
  eq('a saved room reads back; what does not hold together is null', [Core.readRoom(JSON.parse(JSON.stringify(room))).members.length, [null, {}, { ...room, code: 'x' }, { ...room, members: [{ seat: 'a' }] }].map(Core.readRoom)], [2, [null, null, null, null]]);

  /* three people in a room: how they play (the host chooses) */
  {
    const r3 = ['Ana', 'Bia', 'Caio'].reduce((r, n, i) => Core.handle(r, T[i], { t: 'join', name: n, token: T[i] }, roll).room, Core.newRoom('ABCDE'));
    const fmt = (r, tk, m) => Core.handle(r, tk, { t: 'format', ...m }, roll);
    const seats = r => Object.fromEntries(r.members.map(m => [m.name, m.seat]));
    eq('three people: by default the host and the third sit together, the second plays with a computer', [seats(r3), r3.format, Core.roomView(r3, T[1]).format], [{ Ana: 0, Bia: 1, Caio: 2 }, 'duplas', 'duplas']);
    const caio = fmt(r3, T[0], { format: 'duplas', alone: 2 }).room, ana = fmt(r3, T[0], { format: 'duplas', alone: 0 }).room;
    eq('two against one: whoever the host picks plays with the computer; the other two sit across; the host keeps seat 0', [seats(caio), seats(ana), seats(fmt(r3, T[0], { format: 'duplas', alone: 1 }).room)], [{ Ana: 0, Bia: 2, Caio: 1 }, { Ana: 0, Bia: 1, Caio: 3 }, { Ana: 0, Bia: 1, Caio: 2 }]);
    const g = Core.handle(caio, T[0], { t: 'start' }, roll).room.game, vb = Core.viewFor(g, 2), vc = Core.viewFor(g, 1);
    eq('the pair sees each other as "Nós"; the one alone sees the computer as partner', [g.humans, vb.humans, vb.names[2], vc.humans, vc.names[2]], [[0, 1, 2], [0, 2, 3], 'Ana', [0, 1, 3], Core.DEFAULT_NAMES[3]]);
    const ga = Core.handle(ana, T[0], { t: 'start' }, roll).room;
    eq('the host alone: the computer is the host’s partner, and the host still starts the game', [ga.game.humans, ga.game.names[2], Core.roomView(ga, T[0]).host], [[0, 1, 3], Core.DEFAULT_NAMES[2], true]);
    eq('choosing is for the host, before the game, with three people, someone in the room', [fmt(r3, T[1], { format: 'duplas', alone: 1 }).error, fmt(Core.handle(r3, T[0], { t: 'start' }, roll).room, T[0], { format: 'duplas' }).error, fmt(Core.handle(r3, T[2], { t: 'leave' }, roll).room, T[0], { format: 'tres' }).error, fmt(r3, T[0], { format: 'duplas', alone: 3 }).error],
      ['Só quem criou a sala escolhe como vão jogar.', 'A partida já começou.', 'Isso é só para sala com 3 pessoas.', 'Essa pessoa não está na sala.']);
    const tres = fmt(r3, T[0], { format: 'tres' }).room, t3 = Core.handle(fmt(ana, T[0], { format: 'tres' }).room, T[0], { t: 'start' }, roll).room;
    const vC = Core.roomView(t3, T[2]);
    eq('three pairs: the three people take seats 0, 1 and 2 (the host keeps 0), each facing a computer partner', [tres.format, Core.SUPPORTS_THREE, seats(t3), t3.game.teams, t3.game.humans, t3.game.names, t3.game.score],
      ['tres', true, { Ana: 0, Bia: 1, Caio: 2 }, 3, [0, 1, 2], ['Ana', 'Bia', 'Caio', 'Cida', 'Toinho', 'Nena'], [0, 0, 0]]);
    eq('three pairs, as each person sees it: themselves at 0, the computer partner at 3, the others turned around the six seats, no one else’s cards', [vC.seat, vC.game.names, vC.game.humans, vC.members.map(m => [m.name, m.seat]), vC.game.hands.map(h => h.every(c => c !== '??')), vC.game.score.length],
      [2, ['Caio', 'Cida', 'Toinho', 'Nena', 'Ana', 'Bia'], [0, 4, 5], [['Caio', 0], ['Ana', 4], ['Bia', 5]], [true, false, false, false, false, false], 3]);
    // a whole game of three pairs through the room: people play their first card and accept (Bia runs from every raise)
    let rr = t3, n3 = 0;
    const tk = s => T[[0, 1, 2].indexOf(s)];
    while (rr.game.phase !== 'over' && n3++ < 6000) {
      const g = rr.game, who = Core.whoActs(g);
      if (who === null) { rr = Core.handle(rr, T[0], { t: 'act', a: 'next' }, roll).room; continue; }
      if (!Core.isHuman(g, who)) { rr = Core.aiStep(rr, roll); continue; }
      const msg = g.phase === 'truco' ? { t: 'act', a: 'answer', v: who === 1 ? 'run' : 'accept' } : g.phase === 'eleven' ? { t: 'act', a: 'eleven', v: true } : g.phase === 'play' && who === 2 && Core.canRaise(g, 2) && g.value === 1 ? { t: 'act', a: 'truco' } : { t: 'act', a: 'play', k: 0 };
      const out = Core.handle(rr, tk(who), msg, roll); if (out.error) break; rr = out.room;
      if ([0, 1, 2].some(s => Core.roomView(rr, tk(s)).game.hands.slice(1).some(h => h.some(c => c !== '??')) && !(rr.game.phase === 'eleven'))) break;
    }
    eq('a whole game of three pairs through the room ends, with somebody at 12 and nobody seeing anyone else’s cards', [rr.game.phase, Math.max(...rr.game.score), rr.game.score.length, rr.game.log.some(l => l.includes('saem da mão'))], ['over', 12, 3, true]);
    const four = Core.handle(tres, T[3], { t: 'join', name: 'Duda', token: T[3] }, roll).room;
    eq('with a fourth person the format is not looked at: the table of four starts', [Core.handle(four, T[0], { t: 'start' }, roll).room.game.humans], [[0, 1, 2, 3]]);
    eq('the format over the wire, and in a saved room (an old room without it plays as before)', [Core.readMsg({ t: 'format', format: 'tres' }), Core.readMsg(JSON.stringify({ t: 'format', format: 'duplas', alone: 2 })), Core.readMsg({ t: 'format', format: 'seis' }), Core.readMsg({ t: 'format', format: 'duplas', alone: 'a' }), Core.readRoom(JSON.parse(JSON.stringify(tres))).format, Core.readRoom({ ...r3, format: undefined }).format, Core.readRoom({ ...r3, format: 'x' }).format],
      [{ t: 'format', format: 'tres' }, { t: 'format', format: 'duplas', alone: 2 }, null, { t: 'format', format: 'duplas' }, 'tres', 'duplas', 'duplas']);
  }

  /* what is saved */
  const st = { v: 1, game: h, tally: { w: 2, l: 1 }, level: 'dificil', train: { ok: 3, total: 4, best: 2 }, real: rt, theme: 'dark', speed: 'rapida', quiet: true, hints: false, team: 'futebol/flamengo', rival: 'naruto/time-7', seats: { partner: 'street-fighter/shotokan/0', opp: ['mortal-kombat/netherrealm/0', 'dragon-ball/guerreiros-z/0'] }, colorBy: 'char', custom: { 'futebol/flamengo': ['A', 'B', 'C'] } };
  eq('read state: a saved state comes back as it was', Core.readState(JSON.parse(JSON.stringify(st))), st);
  eq('read state: a state saved before themes (bare club ids) comes back in the football pack', Core.readState({ team: 'flamengo', rival: 'palmeiras', custom: { flamengo: ['A', 'B', 'C'], xyz: ['a', 'b', 'c'] } }), { ...Core.readState({}), team: 'futebol/flamengo', rival: 'futebol/palmeiras', custom: { 'futebol/flamengo': ['A', 'B', 'C'] } });
  eq('read state: a team must be a team (not a pack or a character), seats must hold together, colours one of the choices', Core.readState({ team: 'naruto', rival: 'naruto/time-7/0', seats: { partner: 'naruto/time-7/0', opp: ['naruto/time-7/0', 'x'] }, colorBy: 'team', hv: {} }), Core.readState({}));
  const hvSeats = { partner: 'naruto/time-7/0', opp: ['naruto/som/0', 'naruto/sannin/2'] };
  eq('read state: heroes against villains comes back with its pack and side; a pack without sides, or without seats, is dropped', [Core.readState({ seats: hvSeats, hv: { pack: 'naruto', side: 'vilao' } }).hv, Core.readState({ seats: hvSeats, hv: { pack: 'futebol', side: 'x' } }).hv, Core.readState({ hv: { pack: 'naruto' } }).hv], [{ pack: 'naruto', side: 'vilao' }, {}, undefined]);
  const empty = { v: 1, game: null, tally: { w: 0, l: 0 }, level: 'medio', train: { ok: 0, total: 0, best: 0 }, real: Core.emptyTable() };
  eq('read state: a suggested rival comes back marked; the mark without a rival, or not true, is dropped', [Core.readState({ team: 'futebol/flamengo', rival: 'futebol/fluminense', rivalAuto: true }).rivalAuto, Core.readState({ team: 'futebol/flamengo', rivalAuto: true }).rivalAuto, Core.readState({ team: 'futebol/flamengo', rival: 'futebol/fluminense', rivalAuto: 1 }).rivalAuto], [true, undefined, undefined]);
  eq('read state: what is not a state reads as an empty one', [null, 'x', 7, { game: 'no' }].map(x => Core.readState(x)), Array(4).fill(empty));
  eq('read state: unknown settings are dropped, bad numbers read as 0', Core.readState({ level: 'deus', theme: 'pink', speed: 'turbo', quiet: 1, hints: 0, tally: { w: -1, l: 2.5 }, train: { ok: 'a' }, team: 'real-madrid', rival: 'x', custom: { flamengo: ['a'], xyz: ['a', 'b', 'c'] } }), empty);
  eq('read state: "Avançar sozinho" is on unless saved off (D15); anything but false reads as on', [Core.readState({ auto: false }).auto, 'auto' in Core.readState({ auto: true }), 'auto' in Core.readState({ auto: 'no' }), 'auto' in Core.readState({})], [false, false, false, false]);
  eq('read state: a rival equal to the club is dropped', Core.readState({ team: 'bahia', rival: 'bahia' }).rival, undefined);
  const broken = [{ ...h, names: ['a'] }, { ...h, sides: ['xyz', null] }, { ...h, level: 'x' }, { ...h, score: [13, 0] }, { ...h, hands: [['Xx'], [], [], []] }, { ...h, vira: '9o' }, { ...h, phase: 'dance' }, { ...h, value: 2 }, { ...h, phase: 'truco', ask: null }, { ...h, phase: 'eleven', eleven: null }, { ...h, rounds: [0, 0, 0, 0] }, { ...h, table: [{ seat: 7, card: '3o' }] }, { ...h, log: [1] }, { ...h, blind: 'no' }, { ...h, last: { plays: [], winner: 9 } }, { ...h, ask: { by: 9, value: 3 } }, { ...h, shout: { seat: 'x' } }, { ...h, result: { why: 1 } }];
  eq('read game: what does not hold together is null', broken.map(Core.readGame), broken.map(() => null));
  eq('read real table: what does not hold together is empty', [Core.readReal({ ...rt, hand: ['3o', '4o', '5o', '6o'] }), Core.readReal({ ...rt, target: 'x' }), Core.readReal(null)], [Core.emptyTable(), Core.emptyTable(), Core.emptyTable()]);

  /* the reader of the source: invented data here; real answers go in tests/fixtures/source/ and through tests/contract.py */
  {
  /* three pairs: six seats, partners facing (s and s + 3), each pair against the other two (online) */
  const sixG = (over = {}) => ({ ...Core.newGame(Core.seeded(5), 'medio', { names: Core.SEATS6, sides: [null, null], humans: [0, 1, 2], teams: 3 }), phase: 'play', eleven: null, dealer: 5, starter: 0, turn: 0, vira: '4o', hands: [['3o', 'Ke', '6o'], ['3e', 'Je', '6e'], ['2c', 'Qc', '6c'], ['Ap', 'Kp', '7p'], ['2o', 'Jo', '7o'], ['Ac', 'Kc', '7c']], ...over });
  const g3p = Core.newGame(Core.seeded(3), 'medio', { names: Core.SEATS6, sides: [null, null], humans: [0, 1, 2], teams: 3 });
  const dealt3 = [...g3p.hands.flat(), g3p.vira];
  eq('three pairs: six hands of three and a vira, all different, three scores, pairs by s % 3, partner facing', [g3p.teams, g3p.hands.length, g3p.hands.every(h => h.length === 3), new Set(dealt3).size, g3p.score, [0, 1, 2, 3, 4, 5].map(s => Core.teamOf(s, 3)), [0, 1, 2].map(s => Core.partnerOf(g3p, s)), Core.seatsOf(g3p), Core.seatsOf(Core.newGame(Core.seeded(3)))],
    [3, 6, true, 19, [0, 0, 0], [0, 1, 2, 0, 1, 2], [3, 4, 5], 6, 4]);
  const P6x = (...cs) => cs.map((card, seat) => ({ seat, card }));
  eq('three pairs, a round: equal top cards of two different pairs tie (cangou); of partners, that pair takes it', [Core.roundWinner(P6x('3o', '3e', 'Ko', '2c', '4o', '6e'), '7o', 3), Core.roundWinner(P6x('3o', 'Ke', 'Ko', '3c', '4o', '6e'), '7o', 3), Core.roundWinner(P6x('Qo', 'Qe', 'Ko', '3c', 'Qp', '6e'), '7o', 3)], [-1, 0, 4]);
  eq('three pairs, the hand: one round each (1 a 1 a 1) goes to whoever took the first; two rounds still win it', [Core.handWinner([0, 1, 2]), Core.handWinner([2, 0, 1]), Core.handWinner([1, 2, 1]), Core.handWinner([1, 2, -1]), Core.handWinner([2, -1]), Core.handWinner([-1, -1, 2])], [0, 2, 1, 1, 2, 2]);
  const ask3 = Core.raise(sixG(), 0);
  eq('three pairs, a raise: both other pairs answer, in the order they play after who asked', [ask3.phase, ask3.ask.wait, Core.whoActs(ask3)], ['truco', [1, 2], 1]);
  const run1 = Core.answer(ask3, 'run'), bothRan = Core.answer(run1, 'run');
  eq('three pairs: the first pair runs: it is out of the hand, its cards leave the game, the next pair answers', [run1.phase, run1.out, run1.hands[1], run1.hands[4], Core.whoActs(run1), Core.inHand(run1, 4), Core.inHand(run1, 5)], ['truco', [1], [], [], 2, false, true]);
  eq('three pairs: both run: whoever asked takes what the hand was worth before, and shows the cards', [bothRan.phase, bothRan.score, bothRan.result.points, bothRan.result.shown.seat, bothRan.out], ['handEnd', [1, 0, 0], 1, 0, [1, 2]]);
  const onlyTwo = Core.answer(run1, 'accept');
  eq('three pairs: one runs and the other accepts: the hand goes on between the two at the new value, skipping the seats out', [onlyTwo.phase, onlyTwo.value, onlyTwo.raisedBy, onlyTwo.turn, Core.playCard(onlyTwo, 0, 0).turn], ['play', 3, 0, 0, 2]);
  const acceptRun = Core.answer(Core.answer(ask3, 'accept'), 'run');
  eq('three pairs: one accepts and the next runs: the same, the other way round', [acceptRun.phase, acceptRun.value, acceptRun.out], ['play', 3, [2]]);
  // a round between the two pairs left: four cards close it
  let two = onlyTwo; for (const s of [0, 2, 3, 5]) two = Core.playCard(two, s, 0);
  eq('three pairs: with a pair out, the four cards of the others close the round', [two.rounds, two.table.length, two.last.plays.length], [[0], 0, 4]);
  const back3 = Core.answer(ask3, 'raise');
  eq('three pairs: raising back asks the pairs still in the hand, the asking one too', [back3.ask.by, back3.ask.value, back3.ask.wait, Core.whoActs(back3), back3.value], [1, 6, [2, 0], 2, 3]);
  // a pair that ran loses the rounds it took: they count as tied, and that may decide the hand at once
  const took = sixG({ rounds: [0, 1], hands: [['3o', 'Ke'], ['3e', 'Je'], ['2c', 'Qc'], ['Ap', 'Kp'], ['2o', 'Jo'], ['Ac', 'Kc']] });
  const decided = Core.answer(Core.answer(Core.raise(took, 0), 'run'), 'accept');
  eq('three pairs: the rounds of a pair that ran count as tied; here that gives the hand to whoever took the first', [decided.phase, decided.score, decided.result.points], ['handEnd', [3, 0, 0], 3]);
  // hands of eleven and iron with three pairs
  const at11 = Core.nextHand({ ...sixG(), phase: 'handEnd', score: [3, 11, 4] }, Core.seeded(2));
  const fled = Core.decideEleven(at11, false);
  eq('three pairs, a hand of eleven: the pair with 11 decides; running gives a point to each of the other two', [at11.phase, at11.eleven, Core.whoActs(at11), fled.score, Core.canRaise(Core.decideEleven(at11, true), Core.decideEleven(at11, true).turn)], ['eleven', 1, 1, [4, 11, 5], false]);
  const iron3 = Core.nextHand({ ...sixG(), phase: 'handEnd', score: [11, 11, 4] }, Core.seeded(2));
  eq('three pairs, a hand of iron: two pairs (or three) with 11, everyone plays blind, no raises', [iron3.phase, iron3.blind, iron3.eleven, Core.nextHand({ ...sixG(), phase: 'handEnd', score: [11, 11, 11] }, Core.seeded(2)).blind], ['play', true, null, true]);
  // what each person sees in a room of six: their seat at the bottom, their pair as 0, nobody else's cards
  const v3p = Core.viewFor({ ...ask3, score: [1, 2, 3] }, 1);
  eq('three pairs, viewFor: the table turned to the person, the pairs too, the others\' cards hidden', [v3p.hands[0], v3p.hands.slice(1).every(h => h.every(c => c === '??')), v3p.names[0], v3p.score, v3p.ask.by, v3p.ask.wait, v3p.turn],
    [['3e', 'Je', '6e'], true, 'Biu', [2, 3, 1], 5, [0, 1], 5]);
  eq('three pairs: a saved game reads back; one with seven names or a fourth pair does not', [!!Core.readGame(JSON.parse(JSON.stringify(run1))), Core.readGame({ ...JSON.parse(JSON.stringify(g3p)), names: [...Core.SEATS6, 'X'] }), Core.readGame({ ...JSON.parse(JSON.stringify(g3p)), teams: 4 }), Core.readGame({ ...JSON.parse(JSON.stringify(g3p)), score: [0, 0] })], [true, null, null, null]);
  for (const level of Core.LEVELS) {
    const rr = Core.seeded(23); let g = { ...Core.newGame(rr, level, { names: Core.SEATS6, sides: [null, null], humans: [0], teams: 3 }), humans: [] }, k = 0, ran = 0;
    while (g.phase !== 'over' && k < 6000) { k++; g = Core.whoActs(g) === null ? Core.nextHand(g, rr) : Core.aiAct(g, rr); if (g.out && g.out.length) ran++; }
    // a game can end in two hands once the stakes go up (doze is paid now): what counts is that the hands add up
    const sums = [0, 1, 2].map(t => Math.min(12, g.hist.filter(h => h.team === t).reduce((x, h) => x + h.points, 0)));
    eq(`three pairs: a whole game of six computer players at ${level} ends with one pair at 12, the hands adding up to the score`, [g.phase, g.score.filter(x => x === 12).length, g.score.length, g.hist.length >= 1, sums.every((x, t) => x >= g.score[t])], ['over', 1, 3, true, true]);
  }
  // the extreme player at a table of six also never reads hidden cards: swapping them changes none of its moves
  {
    const xr = Core.seeded(43); let same = 0, tried = 0;
    for (let i = 0; i < 10; i++) {
      let g = { ...Core.newGame(xr, 'extremo', { names: Core.SEATS6, sides: [null, null], humans: [0], teams: 3 }), humans: [] };
      for (let k = 0; k < i % 7; k++) if (Core.whoActs(g) !== null) g = Core.aiAct(g, xr);
      const s = Core.whoActs(g); if (s === null || g.phase === 'eleven') continue;
      const hidden = Core.shuffle(g.hands.flatMap((h, j) => (j === s ? [] : h)), Core.seeded(i + 200));
      let k = 0; const swapped = { ...g, hands: g.hands.map((h, j) => (j === s ? h : hidden.slice(k, (k += h.length)))) };
      const a = Core.aiAct(g, Core.seeded(i)), b = Core.aiAct(swapped, Core.seeded(i));
      tried++; if (a.phase === b.phase && JSON.stringify(a.ask) === JSON.stringify(b.ask) && JSON.stringify(a.table) === JSON.stringify(b.table) && a.value === b.value) same++;
    }
    eq('three pairs: the extreme player decides the same whatever the hidden cards are', [tried > 4, same === tried], [true, true]);
  }
  // online: a room made at the extreme level plays its computer players at that level on the server
  {
    const xr = Core.seeded(44), tk = 'token-extremo-0001';
    let r = Core.handle(Core.newRoom('XTRMO'), tk, { t: 'join', name: 'Ana', token: tk, level: 'extremo' }, xr).room;
    r = Core.handle(r, tk, { t: 'start' }, xr).room;
    let steps = 0;
    for (let i = 0; i < 400 && r.game.phase !== 'over'; i++) {
      const g = r.game, who = Core.whoActs(g);
      if (who === null) { r = { ...r, game: Core.nextHand(g, xr) }; continue; }
      if (Core.isHuman(g, who)) { r = { ...r, game: { ...g, humans: [] } }; continue; }
      r = Core.aiStep(r, xr); steps++;
    }
    eq('online: a room at the extreme level plays its game at that level on the server', [r.level, r.game.level, steps > 10], ['extremo', 'extremo', true]);
  }
  }
  eq('source: an entry read', Core.normEntry({ id: 7, name: ' Um ', value: '2.5', extra: true }), { id: '7', name: 'Um', value: 2.5 });
  eq('source: what is not an entry reads as null', [null, 'x', {}, { id: 1 }, { id: 1, name: 'x', value: 'abc' }, { name: 'x', value: 1 }].map(Core.normEntry), [null, null, null, null, null, null]);
  eq('source: a list, leaving out what cannot be read', [Core.normEntries({ items: [{ id: 1, name: 'a', value: 1 }, { id: 2 }] }), Core.normEntries({}), Core.normEntries(null)], [[{ id: '1', name: 'a', value: 1 }], [], []]);
  return { n, fails };
}
