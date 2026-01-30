import { BuracoGame, GameAction, GameActionResult } from './buraco-engine';
import { Player, GameState } from '../types';

interface GameRoom {
  id: string;
  game: BuracoGame;
  players: Player[];
  createdAt: Date;
  status: 'waiting' | 'playing' | 'finished';
}

export class GameManager {
  private games: Map<string, GameRoom> = new Map();
  private playerGameMap: Map<string, string> = new Map(); // playerId -> gameId
  
  constructor() {
    // Clear any existing data on restart
    this.games.clear();
    this.playerGameMap.clear();
  }

  public createGame(hostPlayerId: string, hostUsername: string): string {
    const gameId = this.generateGameId();
    const hostPlayer: Player = {
      id: hostPlayerId,
      username: hostUsername,
      team: 1,
      hand: [],
      isConnected: true
    };

    const gameRoom: GameRoom = {
      id: gameId,
      game: new BuracoGame([hostPlayer], gameId),
      players: [hostPlayer],
      createdAt: new Date(),
      status: 'waiting'
    };

    this.games.set(gameId, gameRoom);
    this.playerGameMap.set(hostPlayerId, gameId);

    return gameId;
  }

  public joinGame(gameId: string, playerId: string, username: string): { success: boolean; message?: string } {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      return { success: false, message: 'Game not found' };
    }

    if (gameRoom.status !== 'waiting') {
      return { success: false, message: 'Game already in progress' };
    }

    if (gameRoom.players.length >= 4) {
      return { success: false, message: 'Game is full' };
    }

    // Check if player already in game
    if (gameRoom.players.some(p => p.id === playerId)) {
      return { success: false, message: 'Already in game' };
    }

    // Auto team assignment: 1st player → Team 1, 2nd player → Team 2, 3rd+ players → Team 1 (can switch later)
    const team = gameRoom.players.length === 0 ? 1 : gameRoom.players.length === 1 ? 2 : 1;
    
    const newPlayer: Player = {
      id: playerId,
      username,
      team,
      hand: [],
      isConnected: true
    };

    gameRoom.players.push(newPlayer);
    this.playerGameMap.set(playerId, gameId);

    // Don't auto-start game - wait for manual start

    return { success: true };
  }

  public startGame(gameId: string, requestingPlayerId: string): { success: boolean; message?: string } {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      return { success: false, message: 'Game not found' };
    }

    if (gameRoom.status !== 'waiting') {
      return { success: false, message: 'Game already started' };
    }

    // Temporary: Allow any player to start the game for testing
    // Check if requesting player is the host (first player)
    // if (gameRoom.players.length === 0 || gameRoom.players[0].id !== requestingPlayerId) {
    //   return { success: false, message: 'Only the host can start the game' };
    // }

    if (gameRoom.players.length < 2) {
      return { success: false, message: 'Need at least 2 players to start' };
    }

    // Create new game instance with all players
    gameRoom.game = new BuracoGame(gameRoom.players, gameId);
    gameRoom.status = 'playing';

    return { success: true };
  }

  public switchTeam(gameId: string, playerId: string, newTeam: number): { success: boolean; message?: string } {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      return { success: false, message: 'Game not found' };
    }

    if (gameRoom.status !== 'waiting') {
      return { success: false, message: 'Cannot switch teams after game has started' };
    }

    const player = gameRoom.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not in game' };
    }

    if (newTeam !== 1 && newTeam !== 2) {
      return { success: false, message: 'Invalid team number' };
    }

    // Check if target team is full (max 2 players per team)
    const targetTeamPlayers = gameRoom.players.filter(p => p.team === newTeam);
    if (targetTeamPlayers.length >= 2) {
      return { success: false, message: 'Target team is full' };
    }

    // Switch the player's team
    player.team = newTeam;

    return { success: true };
  }

  public processGameAction(playerId: string, action: Omit<GameAction, 'playerId'>): GameActionResult {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) {
      return { success: false, message: 'Not in any game' };
    }

    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      return { success: false, message: 'Game not found' };
    }

    // Allow cheat actions in any game state for testing
    if (action.type === 'cheat') {
      const fullAction: GameAction = {
        ...action,
        playerId
      };
      return gameRoom.game.processAction(fullAction);
    }

    // For non-cheat actions, require game to be playing
    if (gameRoom.status !== 'playing') {
      return { success: false, message: 'Game not active' };
    }

    const fullAction: GameAction = {
      ...action,
      playerId
    };

    const result = gameRoom.game.processAction(fullAction);

    // Handle game end
    if (result.gameEnded) {
      gameRoom.status = 'finished';
      // Could save game results to database here
    }

    return result;
  }

  public getGameState(playerId: string): GameState | null {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return null;

    const gameRoom = this.games.get(gameId);
    if (!gameRoom) return null;

    return gameRoom.game.getGameState();
  }

  public getGameById(gameId: string): BuracoGame | null {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom || gameRoom.status !== 'playing') return null;
    return gameRoom.game;
  }

  public getGameStateById(gameId: string): GameState | null {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) return null;

    // If game is still in waiting status, create a waiting state
    if (gameRoom.status === 'waiting') {
      return {
        id: gameId,
        players: gameRoom.players,
        currentTurn: 0,
        mainDeck: [],
        discardPile: [],
        mortos: [[], []],
        mortosUsed: [false, false],
        mortosUsedByTeam: [null, null],
        teamSequences: [[], []],
        roundScores: [0, 0],
        matchScores: [0, 0],
        currentRound: 1,
        roundHistory: [],
        phase: 'waiting',
        turnState: {
          hasDrawn: false,
          hasDiscarded: false,
          drawnCardIds: [],
          hasDiscardedNonDrawnCard: false,
          reachedZeroByDiscard: false,
          hasTakenMorto: false
        },
        gameRules: {
          pointsToWin: 3000,
          minBaixarAfter1500: 1500
        }
      };
    }

    return gameRoom.game.getGameState();
  }

  public leaveGame(playerId: string): boolean {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) return false;

    const gameRoom = this.games.get(gameId);
    if (!gameRoom) return false;

    // Mark player as disconnected but keep them in the game for reconnection
    const player = gameRoom.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }

    // Don't remove from playerGameMap to allow reconnection
    // this.playerGameMap.delete(playerId);

    // If game is waiting and host leaves, remove game
    if (gameRoom.status === 'waiting' && gameRoom.players[0].id === playerId) {
      this.games.delete(gameId);
      // Remove all players from game
      for (const p of gameRoom.players) {
        this.playerGameMap.delete(p.id);
      }
    }

    return true;
  }

  public reconnectPlayer(playerId: string): { success: boolean; gameId?: string; gameState?: GameState } {
    const gameId = this.playerGameMap.get(playerId);
    if (!gameId) {
      return { success: false };
    }

    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      this.playerGameMap.delete(playerId);
      return { success: false };
    }

    // Mark player as connected
    const player = gameRoom.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = true;
    }

    return {
      success: true,
      gameId,
      gameState: gameRoom.status === 'playing' ? gameRoom.game.getGameState() : undefined
    };
  }

  public getActiveGames(): Array<{id: string; playerCount: number; status: string; players: string[]}> {
    const activeGames = [];
    
    for (const [gameId, gameRoom] of this.games) {
      if (gameRoom.status === 'waiting' || gameRoom.status === 'playing') {
        activeGames.push({
          id: gameId,
          playerCount: gameRoom.players.length,
          status: gameRoom.status,
          players: gameRoom.players.map(p => p.username)
        });
      }
    }

    return activeGames;
  }

  public getPlayerCurrentGame(playerId: string): string | null {
    return this.playerGameMap.get(playerId) || null;
  }

  public isPlayerInGame(playerId: string): boolean {
    return this.playerGameMap.has(playerId);
  }

  public getCurrentPlayer(gameId: string): Player | null {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom || gameRoom.status !== 'playing') return null;

    return gameRoom.game.getCurrentPlayer();
  }

  private generateGameId(): string {
    // Generate a 6-character room code that's easy to share
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Admin method to forcefully terminate a specific game
  public terminateGame(gameId: string): { success: boolean; message?: string } {
    const gameRoom = this.games.get(gameId);
    if (!gameRoom) {
      return { success: false, message: 'Game not found' };
    }

    // Force end the game regardless of status
    gameRoom.status = 'finished';
    
    // Remove all players from this game
    for (const player of gameRoom.players) {
      this.playerGameMap.delete(player.id);
    }
    
    // Remove the game completely
    this.games.delete(gameId);
    
    return { success: true };
  }

  // Admin method to get all active games with detailed info
  public getAllGamesForAdmin(): Array<{id: string; playerCount: number; status: string; players: string[]; createdAt: Date}> {
    const allGames = [];
    
    for (const [gameId, gameRoom] of this.games) {
      allGames.push({
        id: gameId,
        playerCount: gameRoom.players.length,
        status: gameRoom.status,
        players: gameRoom.players.map(p => p.username),
        createdAt: gameRoom.createdAt
      });
    }
    
    return allGames;
  }

  // Cleanup old finished games periodically
  public cleanupOldGames(): void {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [gameId, gameRoom] of this.games) {
      if (gameRoom.status === 'finished' && 
          now.getTime() - gameRoom.createdAt.getTime() > maxAge) {
        
        // Remove all players from this game
        for (const player of gameRoom.players) {
          this.playerGameMap.delete(player.id);
        }
        
        this.games.delete(gameId);
      }
    }
  }
}

// Singleton instance
export const gameManager = new GameManager();

// Clean up old games every hour
setInterval(() => {
  gameManager.cleanupOldGames();
}, 60 * 60 * 1000);