//#region src/core/game.ts
/** Ranks from weakest to strongest, and suits in the order manilhas rank (ouros < espadas < copas < paus). */
var RANKS = [
	"4",
	"5",
	"6",
	"7",
	"Q",
	"J",
	"K",
	"A",
	"2",
	"3"
];
var SUITS = [
	"o",
	"e",
	"c",
	"p"
];
/** What a hand is worth: 1, then truco 3, seis 6, nove 9 and doze 12. */
var VALUES = [
	1,
	3,
	6,
	9,
	12
];
/** The four seats: the person, the pair on their right, their partner (facing them) and the pair on their left. */
var SEATS = [
	"Você",
	"Biu",
	"Cida",
	"Toinho"
];
/** A seeded source of chance (mulberry32): the same seed gives the same numbers, in [0, 1). */
function seeded(seed) {
	let a = seed >>> 0;
	return () => {
		a = a + 1831565813 >>> 0;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
/** A shuffled copy (Fisher-Yates). */
function shuffle(list, rand) {
	const a = [...list];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
var teamOf = (s) => s % 2;
var nextSeat = (s) => (s + 1) % 4;
var other = (t) => 1 - t;
/** The 40 cards: no 8, 9, 10 or jokers. */
var deck = () => RANKS.flatMap((r) => SUITS.map((s) => r + s));
/** The rank of the manilhas: the one after the vira's (after 3 comes 4 again). */
var manilhaRank = (vira) => RANKS[(RANKS.indexOf(vira[0]) + 1) % RANKS.length];
var isManilha = (c, vira) => c[0] === manilhaRank(vira);
/** How strong a card is with this vira: 0 (a 4) to 9 (a 3), and the manilhas above, 10 (ouros) to 13 (paus, the zap). */
function power(c, vira) {
	return isManilha(c, vira) ? 10 + SUITS.indexOf(c[1]) : RANKS.indexOf(c[0]);
}
var RANK_NAME = {
	Q: "dama",
	J: "valete",
	K: "rei",
	A: "ás"
};
var SUIT_NAME = {
	o: "ouros",
	e: "espadas",
	c: "copas",
	p: "paus"
};
/** A card in words: "7 de copas", "ás de espadas". */
var cardName = (c) => `${RANK_NAME[c[0]] || c[0]} de ${SUIT_NAME[c[1]]}`;
/** The nickname of each manilha, by suit, from the weakest to the strongest. */
var MANILHA_NAME = {
	o: "picafumo",
	e: "espadilha",
	c: "copas",
	p: "zap"
};
/** A card in words, with its nickname when it is a manilha: "7 de paus (zap)". */
var cardSay = (c, vira) => cardName(c) + (isManilha(c, vira) ? ` (${MANILHA_NAME[c[1]]})` : "");
/** Every card from the strongest to the weakest with this vira: the four manilhas by suit (zap, copas, espadilha,
*  picafumo), then 3 2 A K J Q 7 6 5 4 without the manilha rank, four cards of each (they tie with each other). */
function ranking(vira) {
	const m = manilhaRank(vira);
	return [...[...SUITS].reverse().map((s) => ({
		rank: m,
		cards: [m + s],
		manilha: true
	})), ...[...RANKS].reverse().filter((r) => r !== m).map((r) => ({
		rank: r,
		cards: SUITS.map((s) => r + s),
		manilha: false
	}))];
}
/** The difficulty levels. */
var LEVELS = [
	"facil",
	"medio",
	"dificil"
];
var say = (g, s) => g.names[s] || SEATS[s];
var WORD = {
	3: "truco",
	6: "seis",
	9: "nove",
	12: "doze"
};
var nextValue = (v) => VALUES[Math.min(VALUES.length - 1, VALUES.indexOf(v) + 1)];
/** Deals a new hand on top of what the game already has: score, history, log and the next dealer. */
function deal(base, rand) {
	const d = shuffle(deck(), rand), starter = nextSeat(base.dealer);
	const at = [base.score[0] === 11, base.score[1] === 11];
	const eleven = at[0] !== at[1] ? at[0] ? 0 : 1 : null;
	const vira = d[12];
	const log = [...base.log, `Mão ${base.n}: ${say(base, base.dealer)} deu as cartas. Vira: ${cardName(vira)}.`];
	if (eleven !== null) log.push(`Mão de onze: ${eleven === 0 ? "nós" : "eles"} ${eleven === 0 ? "decidimos se jogamos" : "decidem se jogam"}.`);
	else if (at[0] && at[1]) log.push("Mão de ferro: os dois com 11. Todo mundo joga às cegas, sem ver as próprias cartas; quem levar a mão leva o jogo.");
	return {
		names: base.names,
		sides: base.sides,
		humans: base.humans,
		level: base.level,
		blind: at[0] && at[1],
		played: [],
		score: base.score,
		dealer: base.dealer,
		n: base.n,
		hist: base.hist,
		log,
		hands: [
			0,
			1,
			2,
			3
		].map((i) => d.slice(i * 3, (i + 1) * 3)),
		vira,
		table: [],
		last: null,
		rounds: [],
		starter,
		turn: starter,
		value: 1,
		raisedBy: null,
		ask: null,
		eleven,
		phase: eleven !== null ? "eleven" : "play",
		shout: null,
		result: null,
		winner: null
	};
}
/** A new game: nobody has points, the first dealer is drawn. */
function newGame(rand, level = "medio", table) {
	const names = table && table.names.length === 4 ? table.names.map((x, i) => String(x || SEATS[i]).slice(0, 24)) : [...SEATS];
	return deal({
		score: [0, 0],
		dealer: Math.floor(rand() * 4),
		n: 1,
		hist: [],
		log: [],
		level: LEVELS.includes(level) ? level : "medio",
		names,
		sides: table ? table.sides : [null, null],
		humans: table && table.humans && table.humans.length ? [...table.humans].sort() : [0]
	}, rand);
}
/** After a hand: the next one, dealt by the next seat. */
function nextHand(g, rand) {
	if (g.phase !== "handEnd") return g;
	return deal({
		score: g.score,
		dealer: nextSeat(g.dealer),
		n: g.n + 1,
		hist: g.hist,
		log: g.log,
		level: g.level,
		names: g.names,
		sides: g.sides,
		humans: g.humans
	}, rand);
}
/** Who has to act now: the seat whose turn it is, the one who answers a raise, or the one who decides a hand of eleven
*  for their pair. A pair with a person in it answers and decides through that person; a pair of computer players,
*  through the one after who asked (on a raise) or its first seat (on a hand of eleven). Null when nobody has to. */
function whoActs(g) {
	if (g.phase === "play") return g.turn;
	if (g.phase === "truco") return responder(g, g.ask);
	if (g.phase === "eleven") return speaker(g, g.eleven, g.eleven);
	return null;
}
/** The seat that speaks for pair `t`: its person (the first one, if both are people), or `fallback`. */
var speaker = (g, t, fallback) => {
	const h = (g.humans || [0]).filter((s) => teamOf(s) === t).sort()[0];
	return h === void 0 ? fallback : h;
};
var responder = (g, a) => speaker(g, other(teamOf(a.by)), nextSeat(a.by));
/** Whether `seat` is played by a person. */
var isHuman = (g, seat) => (g.humans || [0]).includes(seat);
/** Who takes a round: the seat with the strongest card, or -1 when the strongest cards tie between the two pairs (two
*  equal cards of the same pair are not a tie: that pair takes it). */
function roundWinner(plays, vira) {
	const best = Math.max(...plays.map((p) => power(p.card, vira)));
	const tops = plays.filter((p) => power(p.card, vira) === best);
	return tops.every((p) => teamOf(p.seat) === teamOf(tops[0].seat)) ? tops[0].seat : -1;
}
/** Who takes the hand from the rounds played so far: a pair, null (nobody: every round tied), or undefined when it is
*  not decided yet. Two rounds win it; a tie goes to whoever took the other round, and a tie in the third round goes
*  to whoever took the first. */
function handWinner(rounds) {
	const [a, b, c] = rounds;
	if (rounds.length < 2) return void 0;
	if (rounds.length === 2) {
		if (a !== -1 && (a === b || b === -1)) return a;
		if (a === -1 && b !== -1) return b;
		return;
	}
	if (c !== -1) return c;
	return a !== -1 ? a : null;
}
/** A finished round in words; when manilhas met, says that the suit decided it. */
function roundSay(g, table, w, n) {
	const vira = g.vira;
	if (w === -1) return `${n}ª rodada empatou (cangou).`;
	const card = table.find((p) => p.seat === w).card, manilhas = table.filter((p) => isManilha(p.card, vira)).length;
	return `${n}ª rodada: ${say(g, w)} fez com ${cardSay(card, vira)}${manilhas > 1 ? ", que ganha no naipe" : ""}.`;
}
/** Which manilhas met in a round, strongest first, when more than one did: the suit decides between them. */
function suitDuel(plays, vira) {
	const m = plays.map((p) => p.card).filter((c) => isManilha(c, vira)).sort((a, b) => power(b, vira) - power(a, vira));
	return m.length > 1 ? m : [];
}
/** Ends the hand: the points go to `team` (none to anyone when null), and 12 points end the game. */
function endHand(g, team, points, why) {
	const score = [g.score[0], g.score[1]];
	if (team !== null) score[team] = Math.min(12, score[team] + points);
	const rec = {
		team,
		points: team === null ? 0 : points,
		how: why,
		value: g.value
	};
	const over = score[0] >= 12 || score[1] >= 12;
	const winner = over ? score[0] >= 12 ? 0 : 1 : null;
	const log = [...g.log, team === null ? `${why} Ninguém marca.` : `${why} ${team === 0 ? "Nós" : "Eles"} +${points}.`];
	if (over) log.push(winner === 0 ? "Fim de jogo: nós vencemos!" : "Fim de jogo: eles venceram.");
	return {
		...g,
		score,
		ask: null,
		phase: over ? "over" : "handEnd",
		result: {
			team,
			points: rec.points,
			why
		},
		winner,
		hist: [...g.hist, rec],
		log
	};
}
/** Plays card `k` of `seat`'s hand, if it is that seat's turn. The fourth card closes the round, and maybe the hand. */
function playCard(g, seat, k) {
	if (g.phase !== "play" || g.turn !== seat || !Number.isInteger(k) || k < 0 || k >= g.hands[seat].length) return g;
	const card = g.hands[seat][k];
	const hands = g.hands.map((h, i) => i === seat ? h.filter((_, j) => j !== k) : h);
	const table = [...g.table, {
		seat,
		card
	}];
	const next = {
		...g,
		hands,
		table,
		played: [...g.played, card],
		shout: null
	};
	if (table.length < 4) return {
		...next,
		turn: nextSeat(seat)
	};
	const w = roundWinner(table, g.vira), result = w === -1 ? -1 : teamOf(w);
	const rounds = [...g.rounds, result], n = rounds.length;
	const log = [
		...g.log,
		...table.map((p) => `${say(g, p.seat)} jogou ${cardSay(p.card, g.vira)}.`),
		roundSay(g, table, w, n)
	];
	const done = {
		...next,
		rounds,
		table: [],
		last: {
			plays: table,
			winner: w
		},
		log
	};
	const hw = handWinner(rounds);
	if (hw !== void 0) return endHand(done, hw, g.value, hw === null ? "As três rodadas empataram." : `${hw === 0 ? "Nós levamos" : "Eles levaram"} a mão.`);
	const starter = w === -1 ? g.starter : w;
	return {
		...done,
		starter,
		turn: starter
	};
}
/** Whether `seat` may raise the stakes now: on their turn, before playing, if the hand is not at 12 yet, if the last
*  accepted raise was not their pair's, and if nobody has 11 points (a hand of eleven or of iron has no truco). */
function canRaise(g, seat) {
	return g.phase === "play" && g.turn === seat && g.value < 12 && g.raisedBy !== teamOf(seat) && g.score[0] < 11 && g.score[1] < 11;
}
/** Truco (or seis, nove, doze): the other pair has to answer. */
function raise(g, seat, bluff = false) {
	if (!canRaise(g, seat)) return g;
	const value = nextValue(g.value), word = WORD[value];
	return {
		...g,
		phase: "truco",
		ask: bluff ? {
			by: seat,
			value,
			bluff: true
		} : {
			by: seat,
			value
		},
		shout: {
			seat,
			word
		},
		log: [...g.log, `${say(g, seat)} pediu ${word}!`]
	};
}
/** The answer to a raise. Accepting makes the hand worth what was asked; running gives the asking pair what the hand
*  was worth before; raising accepts and asks for the next value, and then the first pair answers. */
function answer(g, a) {
	if (g.phase !== "truco" || !g.ask) return g;
	const ask = g.ask, seat = responder(g, ask);
	if (a === "accept") return {
		...g,
		phase: "play",
		value: ask.value,
		raisedBy: teamOf(ask.by),
		ask: null,
		shout: {
			seat,
			word: "aceito"
		},
		log: [...g.log, `${say(g, seat)} aceitou. Vale ${ask.value}.`]
	};
	if (a === "run") {
		const end = endHand(g, teamOf(ask.by), g.value, `${say(g, seat)} correu do ${WORD[ask.value]}.`);
		const shown = {
			seat: ask.by,
			cards: g.hands[ask.by],
			bluff: !!ask.bluff
		};
		return {
			...end,
			shout: {
				seat,
				word: "corro"
			},
			result: {
				...end.result,
				shown
			},
			log: shown.bluff ? [...end.log, `${say(g, ask.by)} estava blefando!`] : end.log
		};
	}
	if (a === "raise" && ask.value < 12) {
		const value = nextValue(ask.value), word = WORD[value];
		return {
			...g,
			value: ask.value,
			raisedBy: teamOf(ask.by),
			ask: {
				by: seat,
				value
			},
			shout: {
				seat,
				word
			},
			log: [...g.log, `${say(g, seat)} aceitou e pediu ${word}!`]
		};
	}
	return g;
}
/** A hand of eleven: the pair with 11 plays it (worth 3) or runs (the others get 1). */
function decideEleven(g, play) {
	if (g.phase !== "eleven" || g.eleven === null) return g;
	const t = g.eleven, seat = whoActs(g);
	if (!play) return {
		...endHand({
			...g,
			value: 1
		}, other(t), 1, `${t === 0 ? "Nós corremos" : "Eles correram"} da mão de onze.`),
		shout: {
			seat,
			word: "fujo"
		}
	};
	return {
		...g,
		phase: "play",
		value: 3,
		shout: {
			seat,
			word: "jogo"
		},
		log: [...g.log, `${t === 0 ? "Nós jogamos" : "Eles jogam"} a mão de onze: vale 3.`]
	};
}
/** How much a card is worth to hold, roughly: a 4 almost nothing, a 3 a lot, the zap the most. */
function weight(c, vira) {
	const p = power(c, vira);
	return p >= 10 ? [
		3.5,
		4,
		4.5,
		5
	][p - 10] : [
		.2,
		.25,
		.3,
		.4,
		.6,
		.8,
		1.1,
		1.6,
		2.2,
		3
	][p];
}
var strength = (cards, vira) => cards.reduce((s, c) => s + weight(c, vira), 0);
/** How the rounds stand for a pair: +2.5 for each round taken, -2.5 for each one lost. */
var standing = (g, t) => g.rounds.reduce((s, r) => s + (r === t ? 2.5 : r === -1 ? 0 : -2.5), 0);
/** The cards `seat` has not seen: not in its hand, not played this hand, not the vira. */
function unseen(g, seat) {
	const known = /* @__PURE__ */ new Set([
		...g.hands[seat],
		...g.played,
		...g.table.map((p) => p.card),
		g.vira
	]);
	return deck().filter((c) => !known.has(c));
}
/** Whether no card `seat` has not seen can beat `c`: a sure card. */
var sure = (g, seat, c) => unseen(g, seat).every((u) => power(u, g.vira) < power(c, g.vira));
/** How strong a hand is for a player of this level: the hard one adds what it knows (sure cards, the partner's card
*  that already holds the round). */
function judge(g, seat) {
	const t = teamOf(seat);
	let s = strength(g.hands[seat], g.vira) + standing(g, t);
	if (g.level === "dificil") {
		s += g.hands[seat].filter((c) => sure(g, seat, c)).length * 1.5;
		const w = g.table.length ? roundWinner(g.table, g.vira) : -1;
		if (w !== -1 && teamOf(w) === t && sure(g, seat, g.table.find((p) => p.seat === w).card)) s += 2.5;
	}
	return s;
}
/** Whether `seat` surely takes the hand by playing now: last to play, the round already its pair's or a card that beats
*  the table, and taking this round decides the hand. */
function sureThing(g, seat) {
	if (g.table.length !== 3) return false;
	const t = teamOf(seat), best = Math.max(...g.table.map((p) => power(p.card, g.vira)));
	const partnerTop = roundWinner(g.table, g.vira) === nextSeat(nextSeat(seat));
	return handWinner([...g.rounds, t]) === t && (partnerTop || g.hands[seat].some((c) => power(c, g.vira) > best));
}
/** The card a computer player plays: its index in the hand. */
function aiCard(g, seat, rand) {
	const hand = g.hands[seat], pw = (k) => power(hand[k], g.vira);
	if (g.blind || g.level === "facil" && rand() < 1 / 3) return Math.floor(rand() * hand.length);
	const order = hand.map((_, k) => k).sort((a, b) => pw(a) - pw(b));
	const low = order[0], high = order[order.length - 1], hard = g.level === "dificil";
	if (!g.table.length) {
		const second = order[order.length - 2];
		if (!g.rounds.length && order.length > 1 && (pw(high) >= 10 && pw(second) >= 8 || hard && sure(g, seat, hand[high]) && pw(second) >= 7)) return second;
		return high;
	}
	const w = roundWinner(g.table, g.vira), best = Math.max(...g.table.map((p) => power(p.card, g.vira)));
	const beat = order.find((k) => pw(k) > best);
	if (w !== -1 && teamOf(w) === teamOf(seat)) {
		const top = g.table.find((p) => p.seat === w).card;
		if (hard && g.table.length < 3 && !sure(g, seat, top) && beat !== void 0) return beat;
		return low;
	}
	return beat === void 0 ? low : beat;
}
/** Whether a computer player raises before playing: 'no', 'yes' with a hand that deserves it, or 'bluff'. */
function aiRaise(g, seat, rand) {
	if (!canRaise(g, seat)) return "no";
	if (sureThing(g, seat)) return "yes";
	const need = {
		3: 6.5,
		6: 8,
		9: 9.5,
		12: 11
	}[nextValue(g.value)] + (g.level === "facil" ? 1.5 : 0);
	if (judge(g, seat) >= need) return "yes";
	if (g.level === "dificil" && standing(g, teamOf(seat)) > 0 && g.hands[seat].some((c) => sure(g, seat, c))) return "yes";
	const odds = g.level === "facil" ? .03 : g.level === "medio" ? .08 : standing(g, teamOf(seat)) > 0 || g.rounds.length === 2 ? .2 : .03;
	return rand() < odds ? "bluff" : "no";
}
/** How a computer player answers a raise. With `rand`, it now and then accepts a raise it would have run from: the
*  easy one often, the hard one when it suspects a bluff. */
function aiAnswer(g, seat, rand) {
	if (!g.ask) return "accept";
	const need = {
		3: 4,
		6: 5.5,
		9: 7,
		12: 8.5
	}[g.ask.value] + (g.level === "facil" ? 1 : 0);
	const score = judge(g, seat);
	if (score >= need + 3.5 && g.ask.value < 12 && g.level !== "facil") return "raise";
	if (score >= need) return "accept";
	if (g.level === "dificil" && rand && score >= need - 2 && rand() < .35) return "accept";
	return rand && rand() < (g.level === "facil" ? .2 : .1) ? "accept" : "run";
}
/** Whether the computer pair plays a hand of eleven: both hands together, strong enough. */
var aiEleven = (g, t) => strength([...g.hands[t], ...g.hands[t + 2]], g.vira) >= (g.level === "facil" ? 6 : 7.5);
/** The move of the computer player who has to act now; the same game when it is the person's move, or nobody's. */
function aiAct(g, rand) {
	const s = whoActs(g);
	if (s === null || isHuman(g, s)) return g;
	if (g.phase === "eleven") return decideEleven(g, aiEleven(g, g.eleven));
	if (g.phase === "truco") return answer(g, aiAnswer(g, s, rand));
	const r = aiRaise(g, s, rand);
	if (r !== "no") return raise(g, s, r === "bluff");
	return playCard(g, s, aiCard(g, s, rand));
}
/** Whether an answer to a drill is right. */
var drillOk = (d, a) => d.answer === a;
/** A drill. 'manilha': the options are ranks. 'round': the options are the four cards played, and "empate". */
function drill(kind, rand) {
	const d = shuffle(deck(), rand), vira = d[0], m = manilhaRank(vira);
	if (kind === "manilha") return {
		kind,
		vira,
		plays: [],
		options: shuffle([m, ...shuffle(RANKS.filter((r) => r !== m), rand).slice(0, 3)], rand),
		answer: m,
		why: `Vira ${cardName(vira)}: a manilha é a carta seguinte na sequência 4 5 6 7 Q J K A 2 3${vira[0] === "3" ? " (depois do 3 volta pro 4)" : ""}, então ${RANK_NAME[m] || m}. Força no naipe: picafumo (ouros) < espadilha (espadas) < copas < zap (paus).`
	};
	const rest = d.slice(1), mans = shuffle(rest.filter((c) => c[0] === m), rand), plain = rest.filter((c) => c[0] !== m);
	const roll = rand();
	let cards;
	if (roll < .25) {
		const top = plain[0], twin = plain.find((c) => c[0] === top[0] && c !== top);
		const low = plain.filter((c) => power(c, vira) < power(top, vira)).slice(0, 2);
		if (twin && low.length === 2) {
			const a = Math.floor(rand() * 2) * 2, b = 1 + Math.floor(rand() * 2) * 2;
			cards = [];
			cards[a] = top;
			cards[b] = twin;
			const free = [
				0,
				1,
				2,
				3
			].filter((i) => i !== a && i !== b);
			cards[free[0]] = low[0];
			cards[free[1]] = low[1];
		} else cards = plain.slice(0, 4);
	} else {
		const nM = roll < .75 ? 2 + Math.floor(rand() * 2) : roll < .88 ? 1 : 0;
		cards = shuffle([...mans.slice(0, nM), ...plain.slice(0, 4 - nM)], rand);
	}
	const plays = cards.map((card, seat) => ({
		seat,
		card
	}));
	const w = roundWinner(plays, vira);
	const best = Math.max(...cards.map((c) => power(c, vira)));
	if (w !== -1 && cards.filter((c) => power(c, vira) === best).length > 1) return drill(kind, rand);
	const duel = suitDuel(plays, vira);
	return {
		kind,
		vira,
		plays,
		options: [...cards, "empate"],
		answer: w === -1 ? "empate" : plays[w].card,
		why: w === -1 ? `Cangou: as duas mais fortes são do mesmo valor (${cardName(cards.find((c) => power(c, vira) === best)).split(" ")[0]}) e de duplas diferentes. Naipe só desempata manilha.` : duel.length ? `${duel.map((c) => cardSay(c, vira)).join(" > ")}: manilha contra manilha, decide o naipe (ouros < espadas < copas < paus).` : isManilha(plays[w].card, vira) ? `${cardSay(plays[w].card, vira)} é a única manilha: ganha de qualquer outra carta.` : `Sem manilha na mesa, vale a sequência 4 5 6 7 Q J K A 2 3: ${cardName(plays[w].card)} é a mais alta.`
	};
}
//#endregion
//#region src/core/assist.ts
var emptyTable = () => ({
	vira: null,
	hand: [],
	table: [],
	gone: [],
	target: "vira"
});
/** Every card already told, anywhere. */
var told = (t) => [
	...t.vira ? [t.vira] : [],
	...t.hand,
	...t.table,
	...t.gone
];
/** Puts a card where `target` says (the vira replaces the old one; at most 3 in the hand and 4 on the table). A card
*  already told elsewhere moves; one told twice in the same place changes nothing. */
function tell(t, card, target = t.target) {
	if (!deck().includes(card)) return t;
	const without = {
		...t,
		vira: t.vira === card ? null : t.vira,
		hand: t.hand.filter((c) => c !== card),
		table: t.table.filter((c) => c !== card),
		gone: t.gone.filter((c) => c !== card)
	};
	if (target === "vira") return {
		...without,
		vira: card,
		target: "hand"
	};
	if (target === "hand") return without.hand.length >= 3 ? t : {
		...without,
		hand: [...without.hand, card],
		target: without.hand.length === 2 ? "table" : "hand"
	};
	return without.table.length >= 4 ? t : {
		...without,
		table: [...without.table, card]
	};
}
/** Takes a card back out. */
var untell = (t, card) => ({
	...t,
	vira: t.vira === card ? null : t.vira,
	hand: t.hand.filter((c) => c !== card),
	table: t.table.filter((c) => c !== card),
	gone: t.gone.filter((c) => c !== card)
});
/** The round is over: the cards on the table go out of play (the person's own card leaves the hand if it was there). */
var nextRound = (t) => ({
	...t,
	hand: t.hand.filter((c) => !t.table.includes(c)),
	gone: [...t.gone, ...t.table],
	table: [],
	target: "table"
});
/** What the person should know about each of their cards: its place with this vira (1 is the zap), how many cards
*  that are still out there beat it (0: a sure card), and whether it takes the table as it is now. Also the strongest
*  card on the table, and the cheapest of the person's cards that takes it. */
function advise(t) {
	if (!t.vira) return null;
	const vira = t.vira, known = new Set(told(t)), out = deck().filter((c) => !known.has(c));
	const places = [...new Set(deck().map((c) => power(c, vira)))].sort((a, b) => b - a);
	const top = t.table.length ? t.table.reduce((a, b) => power(b, vira) > power(a, vira) ? b : a) : null;
	const tp = top ? power(top, vira) : -1;
	const cards = [...t.hand].sort((a, b) => power(b, vira) - power(a, vira)).map((card) => {
		const p = power(card, vira), beatenBy = out.filter((c) => power(c, vira) > p).length;
		return {
			card,
			place: places.indexOf(p) + 1,
			manilha: isManilha(card, vira),
			beatenBy,
			sure: beatenBy === 0,
			takes: p > tp
		};
	});
	const takers = cards.filter((c) => c.takes);
	const tie = top && !isManilha(top, vira) ? cards.find((c) => power(c.card, vira) === tp)?.card ?? null : null;
	return {
		cards,
		top,
		cheapest: top && takers.length ? takers[takers.length - 1].card : null,
		tie
	};
}
/** One line on the table as it is: who is on top and why. */
function tableSay(t) {
	const a = advise(t);
	if (!a || !t.vira) return "Diga primeiro a vira.";
	if (!a.top) return `Vira ${cardSay(t.vira, t.vira).split(" (")[0]}: manilha é ${manilhaRank(t.vira)}.`;
	const m = t.table.filter((c) => isManilha(c, t.vira));
	return `Na mesa, a mais forte é ${cardSay(a.top, t.vira)}${m.length > 1 ? " (ganha no naipe das outras manilhas)" : ""}.`;
}
var RANK_WORDS = {
	quatro: "4",
	"4": "4",
	cinco: "5",
	"5": "5",
	seis: "6",
	"6": "6",
	sete: "7",
	"7": "7",
	dama: "Q",
	rainha: "Q",
	q: "Q",
	valete: "J",
	j: "J",
	rei: "K",
	k: "K",
	as: "A",
	a: "A",
	"1": "A",
	um: "A",
	dois: "2",
	"2": "2",
	tres: "3",
	"3": "3"
};
var SUIT_WORDS = {
	ouro: "o",
	ouros: "o",
	espada: "e",
	espadas: "e",
	copa: "c",
	copas: "c",
	coracao: "c",
	coracoes: "c",
	pau: "p",
	paus: "p",
	zap: "p"
};
var NICK = {
	zap: "p",
	espadilha: "e",
	picafumo: "o",
	"pica-fumo": "o"
};
var TARGET_WORDS = {
	vira: "vira",
	virou: "vira",
	mao: "hand",
	minha: "hand",
	minhas: "hand",
	tenho: "hand",
	mesa: "table",
	jogou: "table",
	jogaram: "table",
	caiu: "table",
	saiu: "table"
};
/** What was said, read: the cards in order, each with where it goes (a word like "vira", "mão" or "mesa" switches
*  where the next cards go). A manilha by its nickname ("zap", "espadilha", "picafumo") needs the vira. */
function hear(text, vira, start) {
	const words = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/pica fumo/g, "picafumo").split(/[^a-z0-9-]+/).filter(Boolean);
	const found = [];
	let target = start, v = vira;
	for (let i = 0; i < words.length; i++) {
		const w = words[i];
		if (TARGET_WORDS[w]) {
			target = TARGET_WORDS[w];
			continue;
		}
		if (NICK[w] && v && !(w === "zap" && i > 0 && RANK_WORDS[words[i - 1]])) {
			const card = manilhaRank(v) + NICK[w];
			found.push({
				card,
				target
			});
			continue;
		}
		const r = RANK_WORDS[w];
		if (!r) continue;
		const next = words[i + 1] === "de" ? words[i + 2] : words[i + 1], s = next ? SUIT_WORDS[next] : void 0;
		if (!s) continue;
		const card = r + s;
		found.push({
			card,
			target
		});
		if (target === "vira") {
			v = card;
			target = "hand";
		}
		i += words[i + 1] === "de" ? 2 : 1;
	}
	return found;
}
//#endregion
//#region src/core/teams.ts
var TEAMS_CHECKED = "14/10/2026";
var TEAMS = [
	{
		id: "athletico",
		name: "Athletico-PR",
		colors: [
			"#c8102e",
			"#111111",
			"#ffffff"
		],
		players: [
			"Kevin Viveros",
			"Luiz Gustavo",
			"Kerwin Vargas"
		]
	},
	{
		id: "atletico-mg",
		name: "Atlético-MG",
		colors: [
			"#111111",
			"#f2f2f2",
			"#ffffff"
		],
		players: [
			"Dudu",
			"Bernard",
			"Reinier"
		]
	},
	{
		id: "bahia",
		name: "Bahia",
		colors: [
			"#0055a4",
			"#e30613",
			"#ffffff"
		],
		players: [
			"Luciano Juba",
			"Erick Pulga",
			"Kanu"
		]
	},
	{
		id: "botafogo",
		name: "Botafogo",
		colors: [
			"#111111",
			"#f2f2f2",
			"#ffffff"
		],
		players: [
			"Arthur Cabral",
			"Ziyech",
			"Alex Telles"
		]
	},
	{
		id: "bragantino",
		name: "Bragantino",
		colors: [
			"#f2f2f2",
			"#d6001c",
			"#111111"
		],
		players: [
			"Isidro Pitta",
			"Tiago Volpi",
			"Eric Ramires"
		]
	},
	{
		id: "chapecoense",
		name: "Chapecoense",
		colors: [
			"#00843d",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Giovanni Augusto",
			"Yago Felipe",
			"Bruno Pacheco"
		]
	},
	{
		id: "corinthians",
		name: "Corinthians",
		colors: [
			"#111111",
			"#f2f2f2",
			"#ffffff"
		],
		players: [
			"Yuri Alberto",
			"Hugo Souza",
			"Breno Bidon"
		]
	},
	{
		id: "coritiba",
		name: "Coritiba",
		colors: [
			"#00544c",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Josué",
			"Pedro Rocha",
			"Breno Lopes"
		]
	},
	{
		id: "cruzeiro",
		name: "Cruzeiro",
		colors: [
			"#003b94",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Kaio Jorge",
			"Matheus Pereira",
			"Lucas Silva"
		]
	},
	{
		id: "flamengo",
		name: "Flamengo",
		colors: [
			"#c8102e",
			"#111111",
			"#ffffff"
		],
		players: [
			"Pedro",
			"Lucas Paquetá",
			"Carrascal"
		]
	},
	{
		id: "fluminense",
		name: "Fluminense",
		colors: [
			"#7a1f3d",
			"#00613c",
			"#ffffff"
		],
		players: [
			"Hulk",
			"Thiago Silva",
			"Ganso"
		]
	},
	{
		id: "gremio",
		name: "Grêmio",
		colors: [
			"#0d80bf",
			"#111111",
			"#ffffff"
		],
		players: [
			"Carlos Vinícius",
			"Weverton",
			"Pavón"
		]
	},
	{
		id: "internacional",
		name: "Internacional",
		colors: [
			"#e2001a",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Alan Patrick",
			"Alerrandro",
			"Thiago Maia"
		]
	},
	{
		id: "mirassol",
		name: "Mirassol",
		colors: [
			"#ffd200",
			"#00843d",
			"#111111"
		],
		players: [
			"Reinaldo",
			"Edson Carioca",
			"Chico Kim"
		]
	},
	{
		id: "palmeiras",
		name: "Palmeiras",
		colors: [
			"#006437",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Vitor Roque",
			"Flaco López",
			"Andreas Pereira"
		]
	},
	{
		id: "remo",
		name: "Remo",
		colors: [
			"#0b2346",
			"#ffffff",
			"#ffffff"
		],
		players: [
			"Yago Pikachu",
			"Vitor Bueno",
			"Alef Manga"
		]
	},
	{
		id: "santos",
		name: "Santos",
		colors: [
			"#f2f2f2",
			"#111111",
			"#111111"
		],
		players: [
			"Neymar",
			"Gabigol",
			"Barreal"
		]
	},
	{
		id: "sao-paulo",
		name: "São Paulo",
		colors: [
			"#e10600",
			"#111111",
			"#ffffff"
		],
		players: [
			"Calleri",
			"Arboleda",
			"Marcos Antônio"
		]
	},
	{
		id: "vasco",
		name: "Vasco",
		colors: [
			"#111111",
			"#f2f2f2",
			"#ffffff"
		],
		players: [
			"Léo Jardim",
			"Thiago Mendes",
			"Andrés Gómez"
		]
	},
	{
		id: "vitoria",
		name: "Vitória",
		colors: [
			"#d71920",
			"#111111",
			"#ffffff"
		],
		players: [
			"Matheuzinho",
			"Lucas Arcanjo",
			"Erick"
		]
	}
];
/** The default table, with no club chosen. */
var DEFAULT_NAMES = [
	"Você",
	"Biu",
	"Cida",
	"Toinho"
];
var teamById = (id) => TEAMS.find((t) => t.id === id) || null;
/** The players of a club as the person sees them: the club's, with the names the person changed. */
function playersOf(id, custom) {
	const t = teamById(id), own = custom && custom[id];
	const base = t ? t.players : [
		"",
		"",
		""
	];
	return [
		0,
		1,
		2
	].map((i) => own && typeof own[i] === "string" && own[i].trim() ? own[i].trim().slice(0, 24) : base[i]);
}
/** Who sits where: the names of the four seats, and the club of each pair (null: none). With no club, the default
*  table. With a club and no rival, the star is the partner and the other two are the opponents. With a rival, the star
*  is the partner and the rival's first two are the opponents. */
function lineup(team, rival, custom) {
	const t = teamById(team);
	if (!t) return {
		names: [...DEFAULT_NAMES],
		sides: [null, null]
	};
	const mine = playersOf(t.id, custom), r = teamById(rival);
	if (!r || r.id === t.id) return {
		names: [
			"Você",
			mine[1],
			mine[0],
			mine[2]
		],
		sides: [t.id, null]
	};
	const theirs = playersOf(r.id, custom);
	return {
		names: [
			"Você",
			theirs[0],
			mine[0],
			theirs[1]
		],
		sides: [t.id, r.id]
	};
}
//#endregion
//#region src/core/online.ts
/** Seats in the order people take them: the first is the host, the second sits against them (each with a computer
*  partner), the third is the host's partner and the fourth the second one's. */
var SEAT_ORDER = [
	0,
	1,
	2,
	3
];
/** What a phone coming back to its game hears when the room is gone (nobody in it for a day), or its seat went to the computer. */
var ROOM_GONE = "A sala anterior acabou.";
var SEAT_GONE = "Seu lugar na partida ficou com a IA.";
/** Letters for room codes: no 0/O, 1/I/L, so a code read out loud is not mistaken. */
var CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
/** The longest message a phone of ours sends is a join (a NAME_MAX name, a 64-letter token): well under a kilobyte. */
var MSG_MAX = 1024;
/** WebSocket close codes: 1009 for a message too big, 1008 (policy) for too many too fast. */
var CLOSE_BIG = 1009;
var CLOSE_FAST = 1008;
var newBucket = (now) => ({
	left: 20,
	at: now
});
/** One more message at `now`: the allowance after it, and whether it may go through. A clock going back earns nothing. */
function allow(b, now) {
	const left = Math.min(20, b.left + Math.max(0, now - b.at) * 5 / 1e3), at = Math.max(now, b.at);
	return left >= 1 ? {
		bucket: {
			left: left - 1,
			at
		},
		ok: true
	} : {
		bucket: {
			left,
			at
		},
		ok: false
	};
}
/** Whether a message of `bytes` is past MSG_MAX. */
var tooBig = (bytes) => !(bytes <= MSG_MAX);
/** Whether a room with `conns` connections open takes no more. */
var roomFull = (conns) => conns >= 12;
var newRoom = (code) => ({
	code,
	level: "medio",
	members: [],
	game: null
});
/** A room code: CODE_LEN letters that are hard to confuse. */
var roomCode = (rand) => Array.from({ length: 5 }, () => CODE_ABC[Math.floor(rand() * 31)]).join("");
var isCode = (x) => typeof x === "string" && new RegExp(`^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$`).test(x);
var host = (r) => r.members.find((m) => m.seat === 0) || r.members[0];
/** "Nós" and "Eles" in the words of the log are from seat 0's side; for the other pair they swap. */
var SWAPS = [
	["Nós", "Eles"],
	["nós", "eles"],
	["decidimos", "decidem"],
	["levamos", "levaram"],
	["vencemos", "venceram"],
	["corremos", "correram"],
	["jogamos", "jogam"]
];
function swapSides(text) {
	let out = text;
	SWAPS.forEach(([a, b], i) => {
		out = out.split(a).join(`\u0001${i}a`).split(b).join(`\u0001${i}b`);
	});
	SWAPS.forEach(([a, b], i) => {
		out = out.split(`\u0001${i}a`).join(b).split(`\u0001${i}b`).join(a);
	});
	return out;
}
/** The game as `seat` sees it: turned so that seat is 0 and its pair is 0 ("Nós"), with the other hands hidden (each card
*  as "??", so their number still shows). In a hand of eleven, the pair deciding sees both its hands, as the rules say.
*  A computer player's bluff is not told until it is shown. */
function viewFor(g, seat) {
	const r = (s) => (s - seat + 4) % 4, flip = seat % 2 === 1;
	const tm = (t) => t === null || !flip ? t : 1 - t;
	const turn = (xs) => [
		0,
		1,
		2,
		3
	].map((v) => xs[(v + seat) % 4]);
	const say = (s) => flip ? swapSides(s) : s;
	const eleven = tm(g.eleven);
	const hands = turn(g.hands).map((h, v) => v === 0 || v === 2 && g.phase === "eleven" && eleven === 0 ? [...h] : h.map(() => "??"));
	return {
		...g,
		hands,
		names: turn(g.names),
		sides: flip ? [g.sides[1], g.sides[0]] : [...g.sides],
		humans: g.humans.map(r).sort(),
		score: flip ? [g.score[1], g.score[0]] : [...g.score],
		dealer: r(g.dealer),
		starter: r(g.starter),
		turn: r(g.turn),
		table: g.table.map((p) => ({
			seat: r(p.seat),
			card: p.card
		})),
		last: g.last ? {
			plays: g.last.plays.map((p) => ({
				seat: r(p.seat),
				card: p.card
			})),
			winner: g.last.winner === -1 ? -1 : r(g.last.winner)
		} : null,
		rounds: g.rounds.map((x) => x === -1 ? -1 : tm(x)),
		raisedBy: tm(g.raisedBy),
		ask: g.ask ? {
			by: r(g.ask.by),
			value: g.ask.value
		} : null,
		eleven,
		shout: g.shout ? {
			seat: r(g.shout.seat),
			word: g.shout.word
		} : null,
		result: g.result ? {
			team: tm(g.result.team),
			points: g.result.points,
			why: say(g.result.why),
			...g.result.shown ? { shown: {
				...g.result.shown,
				seat: r(g.result.shown.seat)
			} } : {}
		} : null,
		winner: tm(g.winner),
		hist: g.hist.map((h) => ({
			...h,
			team: tm(h.team),
			how: say(h.how)
		})),
		log: g.log.map(say)
	};
}
/** The room as the person with `token` sees it; null if they are not in it. */
function roomView(room, token) {
	const me = room.members.find((m) => m.token === token);
	if (!me) return null;
	const r = (s) => (s - me.seat + 4) % 4;
	return {
		t: "room",
		code: room.code,
		host: host(room) === me,
		seat: me.seat,
		level: room.level,
		members: room.members.map((m) => ({
			seat: r(m.seat),
			name: m.name,
			online: m.online
		})).sort((a, b) => a.seat - b.seat),
		game: room.game ? viewFor(room.game, me.seat) : null
	};
}
var cleanName = (x) => typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 16) : "";
/** A message from the person with `token`. Errors say why in words the person can read; the room is then unchanged. */
function handle(room, token, msg, rand) {
	const me = room.members.find((m) => m.token === token);
	if (msg.t === "join") {
		if (me) return { room: {
			...room,
			members: room.members.map((m) => m === me ? {
				...m,
				online: true
			} : m)
		} };
		if (msg.back && !room.members.length) return {
			room,
			error: ROOM_GONE
		};
		if (msg.back && room.game) return {
			room,
			error: SEAT_GONE
		};
		const name = cleanName(msg.name);
		if (!name) return {
			room,
			error: "Escreve seu nome."
		};
		if (typeof token !== "string" || token.length < 8 || token.length > 64) return {
			room,
			error: "Não deu pra entrar: recarregue a página."
		};
		if (room.game) return {
			room,
			error: "Essa partida já começou."
		};
		const free = SEAT_ORDER.find((s) => !room.members.some((m) => m.seat === s));
		if (free === void 0) return {
			room,
			error: "A sala está cheia."
		};
		const level = !room.members.length && msg.level && LEVELS.includes(msg.level) ? msg.level : room.level;
		return { room: {
			...room,
			level,
			members: [...room.members, {
				seat: free,
				name,
				token,
				online: true
			}]
		} };
	}
	if (!me) return {
		room,
		error: "Você não está nessa sala."
	};
	const isHost = host(room) === me;
	if ((msg.t === "leave" || msg.t === "drop") && !room.game) return { room: {
		...room,
		members: room.members.filter((m) => m !== me)
	} };
	if (msg.t === "drop") return { room: {
		...room,
		members: room.members.map((m) => m === me ? {
			...m,
			online: false
		} : m)
	} };
	if (msg.t === "leave") return { room: toComputer(room, me) };
	if (msg.t === "start" || msg.t === "again") {
		if (!isHost) return {
			room,
			error: "Só quem criou a sala começa a partida."
		};
		if (room.game && room.game.phase !== "over") return {
			room,
			error: "A partida já está rolando."
		};
		return { room: {
			...room,
			game: startGame(room, rand)
		} };
	}
	if (msg.t === "bot") {
		if (!isHost || !room.game) return {
			room,
			error: "Só quem criou a sala faz isso."
		};
		const gone = room.members.find((m) => m.seat === msg.seat && !m.online);
		if (!gone) return {
			room,
			error: "Esse jogador ainda está na sala."
		};
		return { room: toComputer(room, gone) };
	}
	if (msg.t === "act") {
		const g = room.game;
		if (!g) return {
			room,
			error: "A partida ainda não começou."
		};
		const next = act(g, me.seat, msg, rand);
		return next === g ? {
			room,
			error: "Agora não é a sua vez."
		} : { room: {
			...room,
			game: next
		} };
	}
	return {
		room,
		error: "Mensagem desconhecida."
	};
}
/** Someone out of the game for good: the computer plays their seat from now on. If the host went, the next person in the
*  room is the host (see host). */
function toComputer(room, gone) {
	const g = room.game;
	return {
		...room,
		members: room.members.filter((m) => m !== gone),
		game: {
			...g,
			humans: g.humans.filter((s) => s !== gone.seat),
			log: [...g.log, `${g.names[gone.seat]} saiu; a IA joga no lugar.`]
		}
	};
}
/** A new game for the people in the room; the empty seats are computer players with the bar's names. */
function startGame(room, rand) {
	const names = [
		0,
		1,
		2,
		3
	].map((s) => room.members.find((m) => m.seat === s)?.name || DEFAULT_NAMES[s]);
	return newGame(rand, room.level, {
		names,
		sides: [null, null],
		humans: room.members.map((m) => m.seat)
	});
}
/** A person's move, only when it is theirs to make; anyone may deal the next hand. */
function act(g, seat, x, rand) {
	if (x.a === "next") return nextHand(g, rand);
	if (whoActs(g) !== seat) return g;
	if (x.a === "play") return playCard(g, seat, Number(x.k));
	if (x.a === "truco") return raise(g, seat);
	if (x.a === "answer") return [
		"accept",
		"run",
		"raise"
	].includes(x.v) ? answer(g, x.v) : g;
	return decideEleven(g, x.v === true);
}
/** If a computer player has to move, how long to wait first (ms); null when it is a person's move, or nobody's. */
function aiDelay(room) {
	const g = room.game, s = g ? whoActs(g) : null;
	if (!g || s === null || isHuman(g, s) || !room.members.length) return null;
	return 900 + (g.phase === "play" && !g.table.length && g.last ? 700 : 0);
}
/** The computer player's move, if one has to move. */
var aiStep = (room, rand) => room.game && aiDelay(room) !== null ? {
	...room,
	game: aiAct(room.game, rand)
} : room;
/** A message as it arrived over the wire: anything that is not a message reads as null. */
function readMsg(raw) {
	let o;
	try {
		o = typeof raw === "string" ? JSON.parse(raw) : raw;
	} catch (e) {
		return null;
	}
	if (!o || typeof o !== "object" || typeof o.t !== "string") return null;
	if (o.t === "join") return {
		t: "join",
		name: String(o.name ?? ""),
		token: String(o.token ?? ""),
		...LEVELS.includes(o.level) ? { level: o.level } : {},
		...o.back === true ? { back: true } : {}
	};
	if (o.t === "start" || o.t === "again" || o.t === "leave") return { t: o.t };
	if (o.t === "bot" && Number.isInteger(o.seat)) return {
		t: "bot",
		seat: o.seat
	};
	if (o.t === "act") {
		if (o.a === "play" && Number.isInteger(o.k)) return {
			t: "act",
			a: "play",
			k: o.k
		};
		if (o.a === "truco" || o.a === "next") return {
			t: "act",
			a: o.a
		};
		if (o.a === "answer" && [
			"accept",
			"run",
			"raise"
		].includes(o.v)) return {
			t: "act",
			a: "answer",
			v: o.v
		};
		if (o.a === "eleven" && typeof o.v === "boolean") return {
			t: "act",
			a: "eleven",
			v: o.v
		};
	}
	return null;
}
/** A saved room, read back; null if it does not hold together. The game in it is not checked again: only the server writes it. */
function readRoom(x) {
	const r = x;
	if (!r || typeof r !== "object" || !isCode(r.code) || !LEVELS.includes(r.level) || !Array.isArray(r.members)) return null;
	if (!r.members.every((m) => m && typeof m.name === "string" && typeof m.token === "string" && Number.isInteger(m.seat) && typeof m.online === "boolean")) return null;
	return {
		code: r.code,
		level: r.level,
		members: r.members,
		game: r.game && typeof r.game === "object" ? r.game : null
	};
}
//#endregion
//#region src/core/save.ts
var PHASES = [
	"eleven",
	"play",
	"truco",
	"handEnd",
	"over"
];
var SPEEDS = [
	"calma",
	"normal",
	"rapida"
];
var isCard = (x) => typeof x === "string" && /^[4567QJKA23][oecp]$/.test(x);
var isCards = (x, max) => Array.isArray(x) && x.length <= max && x.every(isCard);
var isSeat = (x) => Number.isInteger(x) && x >= 0 && x <= 3;
var isTeam = (x) => x === 0 || x === 1;
var isPts = (x) => Number.isInteger(x) && x >= 0 && x <= 12;
var isPlays = (x) => Array.isArray(x) && x.length <= 4 && x.every((p) => p && typeof p === "object" && isSeat(p.seat) && isCard(p.card));
/** A saved game, or null if it does not hold together. */
function readGame(x) {
	const g = x;
	if (!g || typeof g !== "object" || !Array.isArray(g.names) || g.names.length !== 4 || !g.names.every((x) => typeof x === "string" && x.length <= 24)) return null;
	if (g.humans === void 0) g.humans = [0];
	if (!Array.isArray(g.humans) || !g.humans.length || g.humans.length > 4 || !g.humans.every(isSeat) || new Set(g.humans).size !== g.humans.length) return null;
	if (!Array.isArray(g.sides) || g.sides.length !== 2 || !g.sides.every((x) => x === null || !!teamById(x))) return null;
	if (!LEVELS.includes(g.level) || typeof g.blind !== "boolean" || !isCards(g.played, 12)) return null;
	if (!Array.isArray(g.score) || g.score.length !== 2 || !g.score.every(isPts) || !isSeat(g.dealer) || !Number.isInteger(g.n) || g.n < 1) return null;
	if (!Array.isArray(g.hands) || g.hands.length !== 4 || !g.hands.every((h) => isCards(h, 3)) || !isCard(g.vira)) return null;
	if (!isPlays(g.table) || !(g.last === null || g.last && isPlays(g.last.plays) && (g.last.winner === -1 || isSeat(g.last.winner)))) return null;
	if (!Array.isArray(g.rounds) || g.rounds.length > 3 || !g.rounds.every((r) => r === -1 || isTeam(r)) || !isSeat(g.starter) || !isSeat(g.turn)) return null;
	if (!VALUES.includes(g.value) || !(g.raisedBy === null || isTeam(g.raisedBy)) || !(g.eleven === null || isTeam(g.eleven)) || !PHASES.includes(g.phase)) return null;
	if (!(g.ask === null || g.ask && isSeat(g.ask.by) && VALUES.includes(g.ask.value))) return null;
	if (g.phase === "truco" && !g.ask) return null;
	if (g.phase === "eleven" && g.eleven === null) return null;
	if (!(g.shout === null || g.shout && isSeat(g.shout.seat) && typeof g.shout.word === "string")) return null;
	if (!(g.result === null || g.result && typeof g.result.why === "string" && Number.isInteger(g.result.points))) return null;
	if (!(g.winner === null || isTeam(g.winner)) || !Array.isArray(g.hist) || !Array.isArray(g.log) || !g.log.every((l) => typeof l === "string")) return null;
	return g;
}
/** A saved real table; what does not hold together reads as an empty one. */
function readReal(x) {
	const t = x, empty = {
		vira: null,
		hand: [],
		table: [],
		gone: [],
		target: "vira"
	};
	if (!t || typeof t !== "object" || !(t.vira === null || isCard(t.vira)) || !isCards(t.hand, 3) || !isCards(t.table, 4) || !isCards(t.gone, 40) || ![
		"vira",
		"hand",
		"table"
	].includes(t.target)) return empty;
	return {
		vira: t.vira,
		hand: t.hand,
		table: t.table,
		gone: t.gone,
		target: t.target
	};
}
/** The player names the person changed, by club: only known clubs, three short names each. */
function readCustom(x) {
	if (!x || typeof x !== "object") return {};
	const out = {};
	for (const [k, v] of Object.entries(x)) if (teamById(k) && Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "string" && n.length <= 24)) out[k] = v;
	return Object.keys(out).length ? { custom: out } : {};
}
/** Everything saved, as it was read from the device. */
function readState(x) {
	const o = x && typeof x === "object" ? x : {};
	const n = (v) => Number.isInteger(v) && v >= 0 ? v : 0;
	const t = o.train;
	return {
		v: 1,
		game: readGame(o.game),
		tally: {
			w: n(o.tally?.w),
			l: n(o.tally?.l)
		},
		level: LEVELS.includes(o.level) ? o.level : "medio",
		train: {
			ok: n(t?.ok),
			total: n(t?.total),
			best: n(t?.best)
		},
		real: readReal(o.real),
		...o.theme === "light" || o.theme === "dark" ? { theme: o.theme } : {},
		...SPEEDS.includes(o.speed) ? { speed: o.speed } : {},
		...o.quiet === true ? { quiet: true } : {},
		...o.hints === false ? { hints: false } : {},
		...typeof o.team === "string" && teamById(o.team) ? { team: o.team } : {},
		...typeof o.rival === "string" && teamById(o.rival) && o.rival !== o.team ? { rival: o.rival } : {},
		...readCustom(o.custom),
		...typeof o.myName === "string" && o.myName.trim() ? { myName: o.myName.trim().slice(0, 16) } : {},
		...o.online && typeof o.online === "object" && /^[A-Z0-9]{5}$/.test(String(o.online.code)) && /^[A-Za-z0-9-]{8,64}$/.test(String(o.online.token)) ? { online: {
			code: String(o.online.code),
			token: String(o.online.token),
			...o.online.played === true ? { played: true } : {}
		} } : {}
	};
}
//#endregion
//#region src/core/source.ts
/** One entry as the source sends it: `{ id, name, value }`. Anything else, or a field missing, reads as null. */
function normEntry(j) {
	if (!j || typeof j !== "object") return null;
	const id = j.id != null ? String(j.id) : "", name = typeof j.name === "string" ? j.name.trim() : "", value = Number(j.value);
	return id && name && Number.isFinite(value) ? {
		id,
		name,
		value
	} : null;
}
/** A list of entries, as `{ items: [...] }`: what cannot be read is left out. */
var normEntries = (j) => j && Array.isArray(j.items) ? j.items.map(normEntry).filter((e) => !!e) : [];
//#endregion
//#region src/core/index.ts
var Core = {
	RANKS,
	SUITS,
	SEATS,
	LEVELS,
	WIN_POINTS: 12,
	HAND_SIZE: 3,
	VALUES,
	ELEVEN: 11,
	ELEVEN_VALUE: 3,
	MANILHA_NAME,
	seeded,
	shuffle,
	teamOf,
	nextSeat,
	nextValue,
	deck,
	manilhaRank,
	isManilha,
	power,
	ranking,
	cardName,
	cardSay,
	newGame,
	nextHand,
	whoActs,
	isHuman,
	roundWinner,
	handWinner,
	suitDuel,
	playCard,
	canRaise,
	raise,
	answer,
	decideEleven,
	weight,
	strength,
	unseen,
	sure,
	aiCard,
	aiRaise,
	aiAnswer,
	aiEleven,
	aiAct,
	drill,
	drillOk,
	emptyTable,
	tell,
	untell,
	nextRound,
	advise,
	tableSay,
	hear,
	TEAMS,
	TEAMS_CHECKED,
	DEFAULT_NAMES,
	teamById,
	playersOf,
	lineup,
	viewFor,
	swapSides,
	newRoom,
	roomCode,
	isCode,
	CODE_LEN: 5,
	handle,
	roomView,
	aiDelay,
	aiStep,
	readMsg,
	readRoom,
	ROOM_THINK: 900,
	ROOM_ROUND_PAUSE: 700,
	ROOM_GONE,
	SEAT_GONE,
	MSG_MAX,
	RATE_BURST: 20,
	RATE_PER_S: 5,
	CONN_MAX: 12,
	CLOSE_BIG,
	CLOSE_FAST,
	newBucket,
	allow,
	tooBig,
	roomFull,
	readGame,
	readReal,
	readState,
	normEntry,
	normEntries
};
//#endregion
export { Core };
