import { io, Socket } from 'socket.io-client';
import { GameState, User, Card } from '../types';
import config from '../config';

export class GameService {
  private socket: Socket | null = null;
  private user: User | null = null;
  private gameState: GameState | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeEventMap();
  }

  private initializeEventMap() {
    // Initialize empty listener arrays for each event type
    const events = [
      'authenticated', 'game-created', 'game-state-update', 'game-ended',
      'chat-message', 'error', 'action-error', 'player-disconnected',
      'player-left', 'game-list-updated', 'game-reconnected', 'waiting-room-reconnected'
    ];
    
    events.forEach(event => {
      this.listeners.set(event, []);
    });
  }

  public connect(user: User): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.user = user;
      const serverUrl = config.websocket.url;
      
      this.socket = io(serverUrl);

      this.socket.on('connect', () => {
        console.log('Connected to server');
        // Authenticate with the server
        this.socket!.emit('authenticate', {
          userId: user.id,
          username: user.username
        });
      });

      this.socket.on('authenticated', (data: { success: boolean }) => {
        if (data.success) {
          this.setupEventListeners();
          this.emit('authenticated', data);
          resolve(true);
        } else {
          reject(new Error('Authentication failed'));
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      // Set up error handling
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.emit('error', error);
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Game events
    this.socket.on('game-created', (data) => {
      console.log('Game created:', data);
      this.emit('game-created', data);
    });

    this.socket.on('game-state-update', (gameState: GameState) => {
      console.log('Game state updated:', gameState);
      this.gameState = gameState;
      this.emit('game-state-update', gameState);
    });

    this.socket.on('game-ended', (data) => {
      console.log('Game ended:', data);
      this.emit('game-ended', data);
    });

    this.socket.on('action-error', (error) => {
      console.error('Action error:', error);
      this.emit('action-error', error);
    });

    // Lobby events
    this.socket.on('game-list-updated', (games) => {
      console.log('Game list updated:', games);
      this.emit('game-list-updated', games);
    });

    // Player events
    this.socket.on('player-disconnected', (data) => {
      console.log('Player disconnected:', data);
      this.emit('player-disconnected', data);
    });

    this.socket.on('player-left', (data) => {
      console.log('Player left:', data);
      this.emit('player-left', data);
    });

    // Chat events
    this.socket.on('chat:message', (message) => {
      console.log('Chat message:', message);
      this.emit('chat-message', message);
    });

    // Reconnection events
    this.socket.on('game-reconnected', (data) => {
      console.log('Game reconnected:', data);
      this.gameState = data.gameState;
      this.emit('game-reconnected', data);
    });

    this.socket.on('waiting-room-reconnected', (data) => {
      console.log('Waiting room reconnected:', data);
      this.emit('waiting-room-reconnected', data);
    });
  }

  // Event subscription methods
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Game actions
  public createGame() {
    if (this.socket) {
      this.socket.emit('create-game');
    }
  }

  public joinGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('join-game', { gameId });
    }
  }

  public leaveGame() {
    if (this.socket) {
      this.socket.emit('leave-game');
    }
  }

  public startGame() {
    if (this.socket) {
      this.socket.emit('start-game');
    }
  }

  public drawCard(source: 'deck' | 'discard') {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'draw',
        data: { source }
      });
    }
  }

  public baixar(sequences: Card[][]) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'baixar',
        data: { sequences }
      });
    }
  }

  public discardCard(cardIndex: number, cheatMode?: boolean) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'discard',
        data: { cardIndex, cheatMode }
      });
    }
  }

  public bater() {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'bater'
      });
    }
  }

  public switchTeam(teamNumber: number) {
    if (this.socket) {
      this.socket.emit('switch-team', {
        teamNumber
      });
    }
  }

  public addToSequence(sequenceId: string, cardIndices: number[]) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'add-to-sequence',
        data: { sequenceId, cardIndices }
      });
    }
  }

  public endTurn(cheatMode?: boolean) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'end-turn',
        data: { cheatMode }
      });
    }
  }

  public sendChatMessage(message: string, room: 'lobby' | 'game' = 'lobby') {
    if (this.socket) {
      if (room === 'lobby') {
        this.socket.emit('chat:lobby', {
          username: this.user?.username,
          text: message
        });
      }
    }
  }

  public joinLobby() {
    if (this.socket) {
      this.socket.emit('join-lobby', {
        username: this.user?.username
      });
    }
  }

  public leaveLobby() {
    if (this.socket) {
      this.socket.emit('leave-lobby');
    }
  }

  public getActiveGames() {
    if (this.socket) {
      this.socket.emit('get-active-games');
    }
  }

  public getGameState() {
    if (this.socket) {
      this.socket.emit('get-game-state');
    }
    return this.gameState;
  }

  public getCurrentGameState(): GameState | null {
    return this.gameState;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.gameState = null;
  }
}

// Singleton instance
export const gameService = new GameService();