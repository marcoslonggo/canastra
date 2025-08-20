// Shared types between client and server

export interface User {
  id: number;
  username: string;
  email?: string;
  isAdmin?: boolean;
  gamesPlayed: number;
  gamesWon: number;
}

export interface Card {
  id: string; // Unique identifier for tracking individual card instances
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';
  value: number; // For ordering in sequences
  points: number; // For scoring
  isWild: boolean;
  // Optional properties for wildcards in sequences
  representedValue?: number; // What value this wildcard represents in the sequence
  representedSuit?: string; // What suit this wildcard represents in the sequence
}

export interface Sequence {
  id: string;
  cards: Card[];
  type: 'sequence' | 'aces'; // sequence = same suit, aces = 3 aces only
  isCanastra: boolean;
  canastraType?: 'limpa' | 'suja' | 'as-a-as'; // clean, dirty, ace-to-ace
  points: number;
}

export interface Player {
  id: string;
  username: string;
  team: 1 | 2;
  hand: Card[];
  isConnected: boolean;
}

export interface RoundResult {
  roundNumber: number;
  winnerTeam: number;
  winnerPlayer: string;
  scores: [number, number]; // Points scored this round by each team
  finalHandPenalties: [number, number]; // Penalty points from cards left in hands
  mortoBonus: [number, number]; // Bonus/penalty from Morto usage
  baterBonus: number; // 100 points for bater team
  timestamp: Date;
}

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: number;
  mainDeck: Card[];
  discardPile: Card[];
  mortos: [Card[], Card[]]; // Two Morto decks
  mortosUsed: [boolean, boolean]; // Track which Mortos taken
  mortosUsedByTeam: [number | null, number | null]; // Track which team took each Morto (null = not taken)
  teamSequences: [Sequence[], Sequence[]]; // Team 1 and Team 2 sequences
  roundScores: [number, number]; // Current round scores
  matchScores: [number, number]; // Total match scores across all rounds
  currentRound: number; // Current round number (starts at 1)
  roundHistory: RoundResult[]; // History of completed rounds
  phase: 'waiting' | 'playing' | 'round-finished' | 'match-finished';
  roundWinner?: number; // Winner of current round
  matchWinner?: number; // Winner of entire match
  turnState: {
    hasDrawn: boolean; // Track if current player has drawn this turn
    hasDiscarded: boolean; // Track if current player has discarded this turn
    drawnCardIds: string[]; // IDs of cards drawn this turn (for blue border highlighting)
    hasDiscardedNonDrawnCard: boolean; // Track if player discarded a card NOT drawn this turn
    reachedZeroByDiscard: boolean; // Track if player reached 0 cards by discarding (vs playing)
    hasTakenMorto: boolean; // Track if player has taken a Morto this turn (bateu)
  };
  gameRules: {
    pointsToWin: number; // Points needed to win the match (usually 3000)
    minBaixarAfter1500: number;
  };
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room: 'lobby' | 'game';
  gameId?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}