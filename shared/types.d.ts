export interface User {
    id: number;
    username: string;
    email?: string;
    gamesPlayed: number;
    gamesWon: number;
}
export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
    rank: string;
    isWild: boolean;
}
export interface Meld {
    id: string;
    cards: Card[];
    isCanasta: boolean;
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
    deck: Card[];
    discardPile: Card[];
    teamMelds: [Meld[], Meld[]];
    scores: [number, number];
    phase: 'waiting' | 'playing' | 'finished';
    winner?: number;
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
//# sourceMappingURL=types.d.ts.map