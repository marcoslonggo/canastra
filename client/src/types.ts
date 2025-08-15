// Shared types for client use - updated to match server

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
  value: number;
  points: number;
  isWild: boolean;
  // Optional properties for wildcards in sequences
  representedValue?: number; // What value this wildcard represents in the sequence
  representedSuit?: string; // What suit this wildcard represents in the sequence
}

export interface Sequence {
  id: string;
  cards: Card[];
  type: 'sequence' | 'aces';
  isCanastra: boolean;
  canastraType?: 'limpa' | 'suja' | 'as-a-as';
  points: number;
}

export interface Player {
  id: string;
  username: string;
  team: 1 | 2;
  hand: Card[];
  isConnected: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: number;
  mainDeck: Card[];
  discardPile: Card[];
  mortos: [Card[], Card[]];
  mortosUsed: [boolean, boolean];
  teamSequences: [Sequence[], Sequence[]];
  scores: [number, number];
  phase: 'waiting' | 'playing' | 'finished';
  winner?: number;
  turnState: {
    hasDrawn: boolean; // Track if current player has drawn this turn
    hasDiscarded: boolean; // Track if current player has discarded this turn
    drawnCardIds: string[]; // IDs of cards drawn this turn (for blue border highlighting)
    hasDiscardedNonDrawnCard: boolean; // Track if player discarded a card NOT drawn this turn
  };
  gameRules: {
    pointsToWin: number;
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