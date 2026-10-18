// The pure core, as one object: what the page uses and what the tests exercise (tests/unit.cases.mjs).
import { isHuman, aiAct, aiAnswer, aiCard, aiEleven, aiRaise, answer, canRaise, cardName, cardSay, decideEleven, deck, drill, drillOk, ELEVEN, ELEVEN_VALUE, HAND_SIZE, handWinner, inHand, partnerOf, SEATS6, seatsOf, teamsOf, isManilha, LEVELS, MANILHA_NAME, manilhaRank, newGame, nextHand, nextSeat, nextValue, playCard, power, raise, ranking, RANKS, roundWinner, SEATS, seeded, shuffle, strength, suitDuel, SUITS, sure, teamOf, unseen, VALUES, weight, whoActs, WIN_POINTS } from './game';
import { advise, emptyTable, hear, nextRound, tableSay, tell, untell } from './assist';
import { aiDelay, aiStep, allow, CLOSE_BIG, CLOSE_FAST, CODE_LEN, CONN_MAX, MSG_MAX, newBucket, RATE_BURST, RATE_PER_S, roomFull, tooBig, handle, isCode, newRoom, readMsg, readRoom, FORMATS, SUPPORTS_THREE, ROOM_GONE, ROOM_ROUND_PAUSE, ROOM_THINK, roomCode, SEAT_GONE, roomView, swapSides, viewFor } from './online';
import { readGame, readReal, readState } from './save';
import { accentOn, charById, charName, COLOR_BY, colorsOf, contrast, DEFAULT_NAMES, drawSeats, kinds, lineup, packById, PACKS, playersOf, qualify, readSeats, samePerson, sideOf, sidedPacks, drawSided, teamById, packTeams, TEAMS, TEAMS_CHECKED } from './teams';
import { normEntries, normEntry } from './source';

export const Core = {
  RANKS, SUITS, SEATS, LEVELS, WIN_POINTS, HAND_SIZE, VALUES, ELEVEN, ELEVEN_VALUE, MANILHA_NAME,
  SEATS6, teamsOf, seatsOf, partnerOf, inHand,
  seeded, shuffle, teamOf, nextSeat, nextValue, deck, manilhaRank, isManilha, power, ranking, cardName, cardSay,
  newGame, nextHand, whoActs, isHuman, roundWinner, handWinner, suitDuel, playCard, canRaise, raise, answer, decideEleven,
  weight, strength, unseen, sure, aiCard, aiRaise, aiAnswer, aiEleven, aiAct, drill, drillOk,
  emptyTable, tell, untell, nextRound, advise, tableSay, hear,
  TEAMS, TEAMS_CHECKED, DEFAULT_NAMES, teamById, playersOf, lineup, PACKS, kinds, packById, packTeams, charById, charName, qualify, colorsOf, contrast, accentOn, readSeats, drawSeats, COLOR_BY, samePerson, sideOf, sidedPacks, drawSided,
  viewFor, swapSides, newRoom, roomCode, isCode, CODE_LEN, handle, roomView, aiDelay, aiStep, readMsg, readRoom, ROOM_THINK, ROOM_ROUND_PAUSE, ROOM_GONE, SEAT_GONE, FORMATS, SUPPORTS_THREE,
  MSG_MAX, RATE_BURST, RATE_PER_S, CONN_MAX, CLOSE_BIG, CLOSE_FAST, newBucket, allow, tooBig, roomFull,
  readGame, readReal, readState, normEntry, normEntries
};
export type * from './types';
export type { Answer, Drill, DrillKind } from './game';
export type { CardAdvice, Target } from './assist';
export type { Character, Colors, ColorBy, Group, Pack, Seats, Side, Team as Club } from './teams';
export type { Action, Bucket, ClientMsg, Format, Member, Room, RoomView } from './online';
