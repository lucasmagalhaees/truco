/* The shapes of the data. Everything the app keeps, and everything the source sends once it has been read. */

/** What comes from outside (the source, a saved state): not ours and not documented, so it is read field by field. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export type Theme = 'light' | 'dark';
/** How long the computer players think before each move. */
export type Speed = 'calma' | 'normal' | 'rapida';
/** How well the computer players play. */
export type Level = 'facil' | 'medio' | 'dificil';

/** A card as two letters: the rank (4 5 6 7 Q J K A 2 3) and the suit (o ouros, e espadas, c copas, p paus). */
export type Card = string;
/** A seat at the table: 0 is the person, 2 their partner; 1 and 3 the other pair. Play goes 0, 1, 2, 3. */
export type Seat = number;
/** A pair: 0 is "Nós" (seats 0 and 2), 1 is "Eles" (seats 1 and 3). With three pairs (six seats), seat s is in pair
 *  s % 3: 0 (seats 0 and 3), 1 (1 and 4) and 2 (2 and 5). */
export type Team = 0 | 1 | 2;
/** A round of the hand: the pair that took it, or -1 for a tie. */
export type RoundResult = Team | -1;

export interface Play { seat: Seat; card: Card }

/** Where the hand is. */
export type Phase =
  | 'eleven'    // one pair has 11 points: it looks at both hands and decides whether to play this hand (worth 3)
  | 'play'      // someone has to play a card (or raise the stakes before playing)
  | 'truco'     // a raise was asked; the other pair accepts, runs or raises again
  | 'handEnd'   // the hand is over and its points counted; the next one waits for a tap
  | 'over';     // a pair reached 12

/** A raise waiting for an answer: who asked, and what the hand would be worth. With three pairs, `wait`: the pairs that
 *  still have to answer, the next one first. */
export interface Ask { by: Seat; value: number; bluff?: true; wait?: Team[] }

/** Something said out loud at the table, shown as a speech bubble: a raise, an answer, a decision on a hand of eleven. */
export type Word = 'truco' | 'seis' | 'nove' | 'doze' | 'aceito' | 'corro' | 'jogo' | 'fujo';
export interface Shout { seat: Seat; word: Word }

/** One finished hand, for the summary at the end. */
export interface HandRecord { team: Team | null; points: number; how: string; value: number }

/** The cards of whoever raised, shown when the other pair ran: and whether a computer player raised on a bluff. */
export interface Shown { seat: Seat; cards: Card[]; bluff: boolean }

export interface Game {
  /** 3 in a game of three pairs (six seats, online only); absent in the game of four. */
  teams?: 3;
  /** With three pairs: the pairs that ran from a raise in this hand, out of it until the next one. */
  out?: Team[];
  /** The names at the four seats (six, with three pairs; 0 is always "Você"), and the club of each pair (null: none). */
  names: string[]; sides: [string | null, string | null];
  /** The seats played by people; the others are computer players. On one phone, only seat 0; in a room, each person's. */
  humans: Seat[];
  /** How well the computer players play in this game. */
  level: Level;
  /** A hand of iron (both pairs with 11): everyone plays blind, without seeing their own cards. */
  blind: boolean;
  /** Every card played in this hand, in order (what a careful player remembers). */
  played: Card[];
  /** Points of each pair (three numbers with three pairs). */
  score: number[];
  /** Who dealt this hand; the one after the dealer leads the first round. */
  dealer: Seat;
  /** How many hands have been dealt in this game. */
  n: number;
  /** The cards still in each seat's hand. */
  hands: Card[][];
  /** The card turned up after dealing: the rank after it is the manilha. */
  vira: Card;
  /** The cards on the table in the round being played, in the order they were played. */
  table: Play[];
  /** The last finished round, still shown until the next card is played, and who took it (-1: tie). */
  last: { plays: Play[]; winner: Seat | -1 } | null;
  /** The finished rounds of this hand. */
  rounds: RoundResult[];
  /** Who led the round being played, and whose turn it is. */
  starter: Seat; turn: Seat;
  /** What this hand is worth now: 1, then 3, 6, 9 or 12 after raises. */
  value: number;
  /** The pair that made the last accepted raise: only the other pair may raise next. */
  raisedBy: Team | null;
  /** A raise waiting for an answer (phase 'truco'). */
  ask: Ask | null;
  /** In 'eleven': the pair with 11 points, deciding. */
  eleven: Team | null;
  phase: Phase;
  /** The last thing said out loud, until the next card is played. */
  shout: Shout | null;
  /** In 'handEnd' and 'over': how the last hand ended. */
  result: { team: Team | null; points: number; why: string; shown?: Shown } | null;
  winner: Team | null;
  /** Every finished hand, in order. */
  hist: HandRecord[];
  /** What happened, in order, in words. */
  log: string[];
}

/** Games won and lost on this device. */
export interface Tally { w: number; l: number }

/** The real table the assistant is following (see src/core/assist.ts). */
export interface RealTable { vira: Card | null; hand: Card[]; table: Card[]; gone: Card[]; target: 'vira' | 'hand' | 'table' }

/** Training drills answered on this device: right answers, total, and the best streak. */
export interface Training { ok: number; total: number; best: number }

/** Everything saved on the device (`truco.v1`). `hints` false turns off the labels that help during a game. */
export interface AppState {
  v: 1; game: Game | null; tally: Tally; level: Level; train: Training; real: RealTable;
  theme?: Theme; speed?: Speed; quiet?: true; hints?: false;
  /** The person's club, the rival club in the rivals mode, and the player names the person changed, by club. */
  team?: string; rival?: string; custom?: Record<string, string[]>;
  /** The name the person plays under online, and the room they are in (code and the token that keeps their seat; played:
   *  a game in it has started, so coming back to an empty room means the room is gone). */
  myName?: string; online?: { code: string; token: string; played?: true };
}

/** An entry as the source describes it, once read by `normEntry`. */
export interface Entry { id: string; name: string; value: number }
