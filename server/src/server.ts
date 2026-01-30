import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { register, login, authenticateToken } from './auth/auth';
import { gameManager } from './game/game-manager';
import { 
  createOrUpdateAdminUser, 
  getAllUsers, 
  updateUserAdminStatus, 
  updateUserPassword,
  getUserById,
  userRowToUser 
} from './database/users';
import config from './config';
import './database/db'; // Initialize database
import { sessionManager } from './session-manager';

// Helper function to generate action data for broadcasting (client will localize)
function generateActionData(playerName: string, action: any, result: any): any | null {
  switch (action.type) {
    case 'draw':
      return {
        key: action.data?.source === 'deck' ? 'game.playerActions.drewFromDeck' : 'game.playerActions.drewFromDiscard',
        params: { playerName }
      };
    
    case 'discard':
      if (result.actionDetails?.discardedCard) {
        const card = result.actionDetails.discardedCard;
        return {
          key: 'game.playerActions.discardedCard',
          params: { playerName, card: `${card.value} of ${card.suit}` }
        };
      }
      return {
        key: 'game.playerActions.discardedACard',
        params: { playerName }
      };
    
    case 'baixar':
      const cardCount = result.actionDetails?.sequenceLength || action.data?.cardIndices?.length || 0;
      return {
        key: 'game.playerActions.playedSequence',
        params: { playerName, count: cardCount }
      };
    
    case 'bater':
      const mortoChoice = result.actionDetails?.mortoChoice || action.data?.mortoChoice;
      if (mortoChoice !== undefined) {
        return {
          key: 'game.playerActions.bateuWithMorto',
          params: { playerName, mortoNumber: mortoChoice + 1 }
        };
      }
      return {
        key: 'game.playerActions.bateu',
        params: { playerName }
      };
    
    case 'addToSequence':
      const addedCount = action.data?.cardIndices?.length || 1;
      return {
        key: 'game.playerActions.addedToSequence',
        params: { playerName, count: addedCount }
      };
    
    case 'endTurn':
      return {
        key: 'game.playerActions.endedTurn',
        params: { playerName }
      };
    
    default:
      return null; // Don't broadcast unknown actions
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.cors.allowedOrigins,
    methods: ["GET", "POST"]
  },
  // Mobile-friendly WebSocket configuration
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,  // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 30000, // 30 seconds
  allowEIO3: true // Support older clients
});

const PORT = config.server.port;

// Chat history storage
interface ChatHistoryMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room: 'lobby' | 'game';
  gameId?: string;
}

class ChatHistoryManager {
  private lobbyHistory: ChatHistoryMessage[] = [];
  private gameHistories: Map<string, ChatHistoryMessage[]> = new Map();
  private readonly RETENTION_TIME = 20 * 60 * 1000; // 20 minutes in milliseconds
  
  constructor() {
    // Clean up old messages every 5 minutes
    setInterval(() => {
      this.cleanupOldMessages();
    }, 5 * 60 * 1000);
  }
  
  addLobbyMessage(message: ChatHistoryMessage) {
    this.lobbyHistory.push(message);
    this.cleanupOldMessages();
  }
  
  addGameMessage(gameId: string, message: ChatHistoryMessage) {
    if (!this.gameHistories.has(gameId)) {
      this.gameHistories.set(gameId, []);
    }
    this.gameHistories.get(gameId)!.push(message);
    this.cleanupOldMessages();
  }
  
  getLobbyHistory(): ChatHistoryMessage[] {
    this.cleanupOldMessages();
    return [...this.lobbyHistory];
  }
  
  getGameHistory(gameId: string): ChatHistoryMessage[] {
    this.cleanupOldMessages();
    return [...(this.gameHistories.get(gameId) || [])];
  }
  
  private cleanupOldMessages() {
    const cutoffTime = new Date(Date.now() - this.RETENTION_TIME);
    
    // Clean lobby history
    this.lobbyHistory = this.lobbyHistory.filter(msg => msg.timestamp > cutoffTime);
    
    // Clean game histories
    for (const [gameId, messages] of this.gameHistories.entries()) {
      const filteredMessages = messages.filter(msg => msg.timestamp > cutoffTime);
      if (filteredMessages.length === 0) {
        this.gameHistories.delete(gameId);
      } else {
        this.gameHistories.set(gameId, filteredMessages);
      }
    }
  }
  
  removeGameHistory(gameId: string) {
    this.gameHistories.delete(gameId);
  }
}

const chatHistory = new ChatHistoryManager();

// CORS Debugging Middleware
app.use((req, res, next) => {
  console.log(`🌐 [CORS] ${req.method} ${req.path} from origin: ${req.get('Origin') || 'no-origin'}`);
  console.log(`🌐 [CORS] User-Agent: ${req.get('User-Agent')}`);
  console.log(`🌐 [CORS] Allowed origins: ${JSON.stringify(config.cors.allowedOrigins)}`);
  next();
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    console.log(`🌐 [CORS-ORIGIN-CHECK] Incoming origin: "${origin || 'no-origin'}"`);
    
    // Allow requests with no origin (mobile apps, direct requests)
    if (!origin) {
      console.log(`🌐 [CORS-ORIGIN-CHECK] Allowing no-origin request`);
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (config.cors.allowedOrigins.includes(origin)) {
      console.log(`🌐 [CORS-ORIGIN-CHECK] Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`🌐 [CORS-ORIGIN-CHECK] REJECTING origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle form data

// Simple test endpoint for mobile debugging
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Mobile connectivity test successful!', 
    timestamp: new Date().toISOString(),
    serverIP: req.headers.host 
  });
});

// Test POST endpoint to check if POST requests work
app.post('/test-post', (req, res) => {
  console.log('📱 Mobile POST test request received!');
  res.json({ 
    message: 'Mobile POST test successful!', 
    timestamp: new Date().toISOString(),
    body: req.body 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/auth/register', (req, res) => {
  console.log('🔐 Register request received from:', req.headers.origin || req.ip);
  register(req, res);
});

app.post('/auth/login', (req, res) => {
  console.log('🔐 POST Login request received from:', req.headers.origin || req.ip);
  console.log('🔐 Request headers:', req.headers);
  login(req, res);
});

// Temporary GET endpoint for debugging mobile connectivity
app.get('/auth/login', (req, res) => {
  console.log('🔐 GET Login request received from:', req.headers.origin || req.ip);
  console.log('🔐 Query parameters:', req.query);
  
  // Extract credentials from query params for testing
  const { username, password } = req.query;
  
  if (username && password) {
    console.log('🔐 Attempting login with GET params...');
    // Simulate login (TEMPORARY - not secure!)
    login(req, res);
  } else {
    res.status(400).json({ 
      error: 'Missing credentials',
      message: 'Username and password required as query parameters',
      debug: 'GET request received but missing credentials'
    });
  }
});

// Explicit OPTIONS handler for login endpoint
app.options('/auth/login', (req, res) => {
  console.log('🔐 OPTIONS preflight for /auth/login from:', req.headers.origin || req.ip);
  console.log('🔐 Request headers:', JSON.stringify(req.headers, null, 2));
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Explicit OPTIONS handler for register endpoint
app.options('/auth/register', (req, res) => {
  console.log('🔐 OPTIONS preflight for /auth/register from:', req.headers.origin || req.ip);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Protected route example
app.get('/api/profile', authenticateToken, (req: any, res) => {
  res.json({ message: 'Protected route accessed', userId: req.userId });
});

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await getUserById(req.userId);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const users = await getAllUsers();
    const safeUsers = users.map(user => userRowToUser(user));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/:userId/promote', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await updateUserAdminStatus(userId, true);
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

app.post('/api/admin/users/:userId/demote', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await updateUserAdminStatus(userId, false);
    res.json({ success: true, message: 'User demoted from admin' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to demote user' });
  }
});

app.post('/api/admin/users/:userId/reset-password', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, passwordHash);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Admin game management routes
app.get('/api/admin/games', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const games = gameManager.getAllGamesForAdmin();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.post('/api/admin/games/:gameId/terminate', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const gameId = req.params.gameId;
    const result = gameManager.terminateGame(gameId);
    
    if (result.success) {
      // Notify all players in the game that it was terminated
      io.to(`game:${gameId}`).emit('game-terminated', {
        message: 'Game terminated by administrator'
      });
      
      // Update lobby with refreshed game list
      io.to('lobby').emit('game-list-updated', gameManager.getActiveGames());
      
      res.json({ success: true, message: 'Game terminated successfully' });
    } else {
      res.status(404).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to terminate game' });
  }
});

app.post('/api/admin/server/restart', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    // Send immediate response before restarting
    res.json({ success: true, message: 'Server restart initiated' });
    
    console.log('🔄 Server restart requested by admin');
    
    // Notify all connected clients about server restart
    io.emit('server-restarting', {
      message: 'Server is restarting. Please refresh your page in a few moments.',
      countdown: 5
    });
    
    // Give clients time to receive the message, then restart
    setTimeout(() => {
      console.log('🔄 Restarting server...');
      process.exit(0); // This will cause the server to restart if using a process manager like pm2
    }, 3000);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restart server' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  console.log('User connected:', socket.id);
  let currentUser: any = null;
  let currentGameId: string | null = null;

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up session
    sessionManager.removeSessionBySocket(socket.id);
    
    if (currentUser && currentGameId) {
      // Handle game disconnect
      socket.to(`game:${currentGameId}`).emit('player-disconnected', {
        playerId: currentUser.id,
        username: currentUser.username
      });
    }
  });

  // Add debug event listener to catch all events
  socket.onAny((eventName: string, ...args: any[]) => {
    console.log('📡 Received event:', eventName, 'from user:', currentUser?.username || 'anonymous');
    if (eventName.startsWith('chat:')) {
      console.log('💬 Chat event details:', args);
    }
  });

  // Authentication for socket
  socket.on('authenticate', (data: { userId: number; username: string }) => {
    const userId = data.userId.toString();
    const username = data.username;
    
    // Handle session management
    const sessionResult = sessionManager.authenticateUser(userId, username, socket);
    
    currentUser = {
      id: userId,
      username: username
    };
    
    // Check if user was already in a game and try to reconnect
    const reconnectResult = gameManager.reconnectPlayer(currentUser.id);
    if (reconnectResult.success && reconnectResult.gameId) {
      currentGameId = reconnectResult.gameId;
      socket.join(`game:${reconnectResult.gameId}`);
      
      // Update session with game info
      sessionManager.setUserGame(userId, reconnectResult.gameId);
      
      if (reconnectResult.gameState) {
        socket.emit('game-reconnected', { 
          gameId: reconnectResult.gameId,
          gameState: reconnectResult.gameState 
        });
      } else {
        // Player was in waiting room
        const waitingGameState = gameManager.getGameStateById(reconnectResult.gameId);
        socket.emit('waiting-room-reconnected', { 
          gameId: reconnectResult.gameId,
          gameState: waitingGameState
        });
      }
    }
    
    // Send authentication response with session info
    socket.emit('authenticated', { 
      success: true,
      sessionInfo: {
        hasConflict: sessionResult.hasConflict,
        message: sessionResult.message
      }
    });
  });

  // Lobby events
  socket.on('join-lobby', (data: any) => {
    console.log('User joined lobby:', data);
    socket.join('lobby');
    socket.to('lobby').emit('user-joined', { socketId: socket.id, ...data });
    
    // Send chat history to the newly joined user
    const lobbyHistory = chatHistory.getLobbyHistory();
    console.log('📋 Lobby history retrieved:', lobbyHistory.length, 'messages');
    if (lobbyHistory.length > 0) {
      console.log('📤 Sending lobby chat history to user:', currentUser?.username);
      socket.emit('chat:history', { room: 'lobby', messages: lobbyHistory });
    } else {
      console.log('📭 No lobby chat history to send');
    }
  });

  socket.on('leave-lobby', () => {
    socket.leave('lobby');
    socket.to('lobby').emit('user-left', { socketId: socket.id });
  });

  // Chat events
  socket.on('chat:lobby', (message: any) => {
    const chatMessage = {
      id: Date.now().toString(),
      username: message.username,
      message: message.text,
      timestamp: new Date(),
      room: 'lobby' as const
    };
    
    // Save to history
    chatHistory.addLobbyMessage(chatMessage);
    
    // Broadcast to all lobby users
    io.to('lobby').emit('chat:message', chatMessage);
  });

  console.log('🔧 Setting up chat:game event listener');
  socket.on('chat:game', (data: { gameId: string; message: string }) => {
    console.log('🎮 Received chat:game event:', data, 'from user:', currentUser?.username);
    
    if (!currentUser) {
      console.log('❌ Not authenticated for chat:game');
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Verify user is actually in this game
    const gameState = gameManager.getGameStateById(data.gameId);
    if (!gameState) {
      console.log('❌ Game not found for chat:game:', data.gameId);
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const isPlayerInGame = gameState.players.some(player => player.id === currentUser.id.toString());
    if (!isPlayerInGame) {
      console.log('❌ Player not in game for chat:game:', currentUser.id, 'gameId:', data.gameId);
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Chat messages are processed normally - no cheat detection here anymore
    
    console.log('✅ Sending game chat message to room:', `game:${data.gameId}`);
    
    const chatMessage = {
      id: Date.now().toString(),
      username: currentUser.username,
      message: data.message,
      timestamp: new Date(),
      room: 'game' as const,
      gameId: data.gameId
    };
    
    // Save to history
    chatHistory.addGameMessage(data.gameId, chatMessage);
    
    // Send message to game-specific room
    io.to(`game:${data.gameId}`).emit('chat:message', chatMessage);
  });

  // Game events
  socket.on('create-game', () => {
    console.log('🎮 Create game requested by:', currentUser?.username);
    
    if (!currentUser) {
      console.log('❌ Not authenticated');
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Check if player is already in a game
    if (gameManager.isPlayerInGame(currentUser.id)) {
      console.log('❌ Player already in game:', currentUser.id);
      socket.emit('error', { message: 'You are already in a game' });
      return;
    }

    try {
      const gameId = gameManager.createGame(currentUser.id, currentUser.username);
      currentGameId = gameId;
      socket.join(`game:${gameId}`);
      
      // Update session with game info
      sessionManager.setUserGame(currentUser.id, gameId);
      
      console.log('✅ Game created successfully:', gameId);
      socket.emit('game-created', { gameId });
      
      // Send initial game state to the creator
      const gameState = gameManager.getGameStateById(gameId);
      socket.emit('game-state-update', gameState);
      
      socket.to('lobby').emit('game-list-updated', gameManager.getActiveGames());
    } catch (error) {
      console.log('❌ Game creation error:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('join-game', (data: { gameId: string }) => {
    if (!currentUser) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // First try to reconnect if player was already in this game
    const reconnectResult = gameManager.reconnectPlayer(currentUser.id);
    if (reconnectResult.success && reconnectResult.gameId === data.gameId) {
      currentGameId = data.gameId;
      socket.join(`game:${data.gameId}`);
      
      // Update session with game info
      sessionManager.setUserGame(currentUser.id, data.gameId);
      
      // Send game chat history to the reconnecting user
      const gameHistory = chatHistory.getGameHistory(data.gameId);
      if (gameHistory.length > 0) {
        socket.emit('chat:history', { room: 'game', gameId: data.gameId, messages: gameHistory });
      }
      
      if (reconnectResult.gameState) {
        socket.emit('game-reconnected', { 
          gameId: reconnectResult.gameId,
          gameState: reconnectResult.gameState 
        });
      } else {
        // Player was in waiting room
        const waitingGameState = gameManager.getGameStateById(reconnectResult.gameId);
        socket.emit('waiting-room-reconnected', { 
          gameId: reconnectResult.gameId,
          gameState: waitingGameState
        });
      }
      return;
    }

    const result = gameManager.joinGame(data.gameId, currentUser.id, currentUser.username);
    
    if (result.success) {
      currentGameId = data.gameId;
      socket.join(`game:${data.gameId}`);
      
      // Update session with game info
      sessionManager.setUserGame(currentUser.id, data.gameId);
      
      // Send game chat history to the newly joined user
      const gameHistory = chatHistory.getGameHistory(data.gameId);
      if (gameHistory.length > 0) {
        socket.emit('chat:history', { room: 'game', gameId: data.gameId, messages: gameHistory });
      }
      
      // Send updated game state to all players in the game
      const gameState = gameManager.getGameStateById(data.gameId);
      io.to(`game:${data.gameId}`).emit('game-state-update', gameState);
      socket.to('lobby').emit('game-list-updated', gameManager.getActiveGames());
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  socket.on('leave-game', () => {
    if (currentUser && currentGameId) {
      gameManager.leaveGame(currentUser.id);
      socket.leave(`game:${currentGameId}`);
      socket.to(`game:${currentGameId}`).emit('player-left', {
        playerId: currentUser.id,
        username: currentUser.username
      });
      currentGameId = null;
      
      // Clear game from session
      sessionManager.setUserGame(currentUser.id, undefined);
      
      socket.to('lobby').emit('game-list-updated', gameManager.getActiveGames());
    }
  });

  socket.on('start-game', () => {
    if (!currentUser || !currentGameId) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = gameManager.startGame(currentGameId, currentUser.id);
    if (result.success) {
      // Broadcast game started to all players in the room
      const gameState = gameManager.getGameStateById(currentGameId);
      io.to(`game:${currentGameId}`).emit('game-state-update', gameState);
      socket.to('lobby').emit('game-list-updated', gameManager.getActiveGames());
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  socket.on('switch-team', (data: { teamNumber: number }) => {
    if (!currentUser || !currentGameId) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = gameManager.switchTeam(currentGameId, currentUser.id, data.teamNumber);
    if (result.success) {
      // Broadcast updated game state to all players in the game
      const gameState = gameManager.getGameStateById(currentGameId);
      io.to(`game:${currentGameId}`).emit('game-state-update', gameState);
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Game action events
  socket.on('game-action', (action: any) => {
    console.log('🎯 Server received game-action:', JSON.stringify(action, null, 2));
    
    if (!currentUser || !currentGameId) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = gameManager.processGameAction(currentUser.id, action);
    
    if (result.success) {
      // Broadcast updated game state to all players if available
      if (result.newGameState) {
        io.to(`game:${currentGameId}`).emit('game-state-update', result.newGameState);
      }
      
      // Send special data back to the requesting player (e.g., card picker, morto selection)
      if (result.data) {
        socket.emit('action-error', { 
          message: result.message,
          data: result.data 
        });
      }
      
      // Broadcast action data to other players (not the acting player)
      const actionData = generateActionData(currentUser.username, action, result);
      if (actionData) {
        socket.to(`game:${currentGameId}`).emit('player-action', {
          playerId: currentUser.id,
          playerName: currentUser.username,
          action: action.type,
          translationKey: actionData.key,
          translationParams: actionData.params,
          details: result.actionDetails || {}
        });
      }
      
      if (result.gameEnded && result.newGameState) {
        io.to(`game:${currentGameId}`).emit('game-ended', {
          matchWinner: result.newGameState.matchWinner,
          roundWinner: result.newGameState.roundWinner,
          matchScores: result.newGameState.matchScores,
          roundScores: result.newGameState.roundScores,
          phase: result.newGameState.phase
        });
      }
    } else {
      socket.emit('action-error', { 
        message: result.message,
        data: result.data 
      });
    }
  });

  socket.on('end-game', (data: { 
    gameId?: string; 
    type: 'no-prejudice' | 'declare-winner'; 
    winnerTeam?: number; 
    reason?: string 
  }) => {
    if (!currentUser) {
      socket.emit('action-error', { message: 'Not authenticated' });
      return;
    }

    // Get gameId from data or current user's game
    const gameId = data.gameId || gameManager.getPlayerCurrentGame(currentUser.id);
    if (!gameId) {
      socket.emit('action-error', { message: 'No game to end' });
      return;
    }

    // Check if user is admin
    const isAdmin = currentUser.isAdmin || false;

    // TODO: Implement endGameEarly method in game-manager
    const result = {
      success: false,
      message: 'End game early feature temporarily disabled'
    };

    if (result.success && 'gameState' in result) {
      // Notify all players in the game about early termination
      io.to(`game-${gameId}`).emit('game-ended-early', {
        type: data.type,
        winnerTeam: data.winnerTeam,
        reason: result.message,
        gameState: result.gameState,
        terminatedBy: isAdmin ? 'admin' : 'owner'
      });

      // Also emit updated game state
      if (result.gameState) {
        io.to(`game-${gameId}`).emit('game-state-update', result.gameState);
      }

      // Update lobby with game list
      io.to('lobby').emit('game-list-updated', gameManager.getActiveGames());

      // Also emit the standard game-ended event to all players with proper format
      if (result.gameState && typeof result.gameState === 'object' && 'winner' in result.gameState && 'scores' in result.gameState) {
        io.to(`game-${gameId}`).emit('game-ended', {
          winner: (result.gameState as any).winner || 0,
          scores: (result.gameState as any).scores
        });
      }

      socket.emit('action-success', { message: result.message });
    } else {
      socket.emit('action-error', { message: result.message });
    }
  });

  socket.on('get-game-state', () => {
    if (currentUser) {
      const gameState = gameManager.getGameState(currentUser.id);
      if (gameState) {
        socket.emit('game-state-update', gameState);
      }
    }
  });

  socket.on('get-active-games', () => {
    socket.emit('game-list-updated', gameManager.getActiveGames());
  });
});

// Admin initialization
async function initializeAdmin() {
  if (config.admin.password) {
    try {
      const adminUsername = 'admin';
      const passwordHash = await bcrypt.hash(config.admin.password, 10);
      await createOrUpdateAdminUser(adminUsername, passwordHash);
    } catch (error) {
      console.error('❌ Failed to initialize admin user:', error);
    }
  } else {
    console.log('ℹ️  No ADMIN_PASSWORD provided, skipping admin user creation');
  }
}

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} (accepting external connections)`);
  console.log(`WebSocket server ready`);
  
  // Initialize admin user
  await initializeAdmin();
});