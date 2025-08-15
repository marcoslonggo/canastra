import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { register, login, authenticateToken } from './auth/auth';
import { gameManager } from './game/game-manager';
import { createOrUpdateAdminUser } from './database/users';
import config from './config';
import './database/db'; // Initialize database

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.cors.allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/auth/register', register);
app.post('/auth/login', login);

// Protected route example
app.get('/api/profile', authenticateToken, (req: any, res) => {
  res.json({ message: 'Protected route accessed', userId: req.userId });
});

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  console.log('User connected:', socket.id);
  let currentUser: any = null;
  let currentGameId: string | null = null;

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (currentUser && currentGameId) {
      // Handle game disconnect
      socket.to(`game:${currentGameId}`).emit('player-disconnected', {
        playerId: currentUser.id,
        username: currentUser.username
      });
    }
  });

  // Authentication for socket
  socket.on('authenticate', (data: { userId: number; username: string }) => {
    currentUser = {
      id: data.userId.toString(),
      username: data.username
    };
    
    // Check if user was already in a game and try to reconnect
    const reconnectResult = gameManager.reconnectPlayer(currentUser.id);
    if (reconnectResult.success && reconnectResult.gameId) {
      currentGameId = reconnectResult.gameId;
      socket.join(`game:${reconnectResult.gameId}`);
      
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
    
    socket.emit('authenticated', { success: true });
  });

  // Lobby events
  socket.on('join-lobby', (data: any) => {
    console.log('User joined lobby:', data);
    socket.join('lobby');
    socket.to('lobby').emit('user-joined', { socketId: socket.id, ...data });
  });

  socket.on('leave-lobby', () => {
    socket.leave('lobby');
    socket.to('lobby').emit('user-left', { socketId: socket.id });
  });

  // Chat events
  socket.on('chat:lobby', (message: any) => {
    io.to('lobby').emit('chat:message', {
      id: Date.now().toString(),
      username: message.username,
      message: message.text,
      timestamp: new Date(),
      room: 'lobby'
    });
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
    if (!currentUser || !currentGameId) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = gameManager.processGameAction(currentUser.id, action);
    
    if (result.success && result.newGameState) {
      // Broadcast updated game state to all players
      io.to(`game:${currentGameId}`).emit('game-state-update', result.newGameState);
      
      if (result.gameEnded) {
        io.to(`game:${currentGameId}`).emit('game-ended', {
          winner: result.newGameState.winner,
          scores: result.newGameState.scores
        });
      }
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

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  
  // Initialize admin user
  await initializeAdmin();
});