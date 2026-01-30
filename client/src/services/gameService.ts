import { io, Socket } from 'socket.io-client';
import { GameState, User, Card } from '../types';
import config from '../config';

export class GameService {
  private socket: Socket | null = null;
  private user: User | null = null;
  private gameState: GameState | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEventMap();
  }

  private initializeEventMap() {
    // Initialize empty listener arrays for each event type
    const events = [
      'authenticated', 'game-created', 'game-state-update', 'game-ended', 'game-ended-early',
      'chat-message', 'chat-history', 'error', 'action-error', 'player-disconnected',
      'player-left', 'game-list-updated', 'game-reconnected', 'waiting-room-reconnected',
      'connection-status-changed', 'player-action'
    ];
    
    events.forEach(event => {
      this.listeners.set(event, []);
    });
  }

  public connect(user: User, isReconnect: boolean = false): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // If already connected with same user, don't reconnect
      if (this.socket && this.socket.connected && this.user?.id === user.id) {
        console.log('Already connected with same user, skipping reconnection');
        this.setConnectionStatus('connected');
        resolve(true);
        return;
      }

      this.setConnectionStatus('connecting');
      
      // Disconnect existing connection if any
      if (this.socket) {
        console.log('Disconnecting existing connection before reconnecting');
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.user = user;
      const serverUrl = config.websocket.url;
      
      console.log('🔌 Attempting WebSocket connection to:', serverUrl);
      console.log('🔌 Current location:', window.location.href);
      
      this.socket = io(serverUrl, {
        // Mobile-friendly configuration
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        // Authenticate with the server
        this.socket!.emit('authenticate', {
          userId: user.id,
          username: user.username
        });
      });

      this.socket.on('authenticated', (data: { success: boolean }) => {
        if (data.success) {
          this.setConnectionStatus('connected');
          this.setupEventListeners();
          this.setupConnectionHandlers();
          this.emit('authenticated', data);
          resolve(true);
        } else {
          this.setConnectionStatus('disconnected');
          reject(new Error('Authentication failed'));
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        console.error('🔌 Error message:', error.message);
        console.error('🔌 Attempted URL:', serverUrl);
        this.setConnectionStatus('disconnected');
        reject(error);
      });

      // Set up error handling
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.emit('error', error);
      });
    });
  }

  private setupConnectionHandlers() {
    if (!this.socket) return;

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.setConnectionStatus('disconnected');
      
      // Only attempt auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't auto-reconnect
        console.log('Server disconnected us - not auto-reconnecting');
        return;
      }
      
      // Auto-reconnect for network issues, server restarts, etc.
      this.attemptReconnect();
    });

    // Handle reconnection success
    this.socket.on('reconnect', () => {
      console.log('Reconnected to server');
      this.reconnectAttempts = 0;
      this.setConnectionStatus('connected');
    });

    // Handle reconnection attempts
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
      this.setConnectionStatus('connecting');
    });

    // Handle reconnection failure
    this.socket.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      this.setConnectionStatus('disconnected');
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.user) {
        this.connect(this.user, true).catch((error) => {
          console.error('Reconnection failed:', error);
          this.attemptReconnect();
        });
      }
    }, delay);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Remove any existing socket listeners to prevent duplicates
    this.socket.removeAllListeners('game-created');
    this.socket.removeAllListeners('game-state-update');
    this.socket.removeAllListeners('game-ended');
    this.socket.removeAllListeners('action-error');
    this.socket.removeAllListeners('game-list-updated');
    this.socket.removeAllListeners('player-disconnected');
    this.socket.removeAllListeners('player-left');
    this.socket.removeAllListeners('chat:message');
    this.socket.removeAllListeners('chat:history');
    this.socket.removeAllListeners('game-reconnected');
    this.socket.removeAllListeners('waiting-room-reconnected');
    this.socket.removeAllListeners('session-terminated');
    this.socket.removeAllListeners('player-action');

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

    this.socket.on('chat:history', (data) => {
      console.log('📋 Chat history received from server:', data);
      this.emit('chat-history', data);
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

    // Player action events  
    this.socket.on('player-action', (data) => {
      console.log('Player action received:', data);
      this.emit('player-action', data);
    });

    // Session management events
    this.socket.on('session-terminated', (data) => {
      console.log('Session terminated:', data);
      this.handleSessionTerminated(data);
    });
  }

  // Session management
  private handleSessionTerminated(data: any) {
    console.log('Session terminated:', data.reason);
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear user state
    this.user = null;
    this.gameState = null;
    this.setConnectionStatus('disconnected');
    
    // Emit session termination event for UI to handle
    this.emit('session-terminated', {
      reason: data.reason,
      message: data.message,
      timestamp: data.timestamp
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

  private setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit('connection-status-changed', { status, attempts: this.reconnectAttempts });
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

  public drawCard(source: 'deck' | 'discard', selectedCards?: string[]) {
    console.log('🌐 CLIENT: Emitting game-action:', {
      type: 'draw',
      data: { source, selectedCards }
    });
    console.log('🌐 CLIENT: Socket connected?', !!this.socket);
    
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'draw',
        data: { source, selectedCards }
      });
      console.log('🌐 CLIENT: game-action emitted successfully');
    } else {
      console.error('🌐 CLIENT: No socket connection!');
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

  public bater(mortoChoice?: number) {
    if (this.socket) {
      const data = mortoChoice !== undefined ? { mortoChoice } : undefined;
      this.socket.emit('game-action', {
        type: 'bater',
        data
      });
    }
  }

  public endGame(options: {
    type: 'no-prejudice' | 'declare-winner';
    winnerTeam?: number;
    reason?: string;
  }) {
    if (this.socket) {
      this.socket.emit('end-game', options);
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

  public replaceWildcard(sequenceId: string, wildcardIndex: number, replacementCardIndex: number) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'replace-wildcard',
        data: { sequenceId, wildcardIndex, replacementCardIndex }
      });
    }
  }

  public pickCard(cardId: string) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'pick-card',
        data: { cardId }
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

  public sendCheatCode(cheatCode: string) {
    if (this.socket) {
      this.socket.emit('game-action', {
        type: 'cheat',
        data: { cheatCode }
      });
    }
  }

  public sendChatMessage(message: string, room: 'lobby' | 'game' = 'lobby', gameId?: string) {
    console.log('sendChatMessage called:', { message, room, gameId, socketConnected: !!this.socket });
    
    if (this.socket) {
      if (room === 'lobby') {
        console.log('Sending lobby chat message');
        this.socket.emit('chat:lobby', {
          username: this.user?.username,
          text: message
        });
      } else if (room === 'game' && gameId) {
        console.log('Sending game chat message to room:', gameId);
        this.socket.emit('chat:game', {
          gameId: gameId,
          message: message
        });
      } else {
        console.log('Game chat not sent - missing gameId or room type invalid');
      }
    } else {
      console.log('No socket connection available');
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

  public getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public manualReconnect(): Promise<boolean> {
    if (!this.user) {
      return Promise.reject(new Error('No user to reconnect with'));
    }
    
    // Reset reconnect attempts for manual reconnection
    this.reconnectAttempts = 0;
    
    // Clear any pending auto-reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    return this.connect(this.user, true);
  }

  public disconnect() {
    console.log('Disconnecting game service');
    
    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      // Remove all socket listeners to prevent memory leaks
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.gameState = null;
    this.user = null;
    this.reconnectAttempts = 0;
  }
}

// Singleton instance
export const gameService = new GameService();