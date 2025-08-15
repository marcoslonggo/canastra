// Shared types between client and server

export interface User {
  id: number;
  username: string;
  email?: string;
  gamesPlayed: number;
  gamesWon: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';
  value: number; // For ordering in sequences
  points: number; // For scoring
  isWild: boolean;
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

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: number;
  mainDeck: Card[];
  discardPile: Card[];
  mortos: [Card[], Card[]]; // Two Morto decks
  mortosUsed: [boolean, boolean]; // Track which Mortos taken
  teamSequences: [Sequence[], Sequence[]]; // Team 1 and Team 2 sequences
  scores: [number, number];
  phase: 'waiting' | 'playing' | 'finished';
  winner?: number;
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