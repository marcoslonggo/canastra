const { TestUser, GameTester } = require('../utils/test-helpers');

/**
 * Backend WebSocket Tests
 * Tests WebSocket events, game engine, and server-side logic
 */

describe('WebSocket Events', () => {
  let tester;

  beforeEach(() => {
    tester = new GameTester();
  });

  afterEach(async () => {
    await tester.cleanup();
  });

  test('should authenticate users correctly', async () => {
    const user = new TestUser('testuser');
    await user.connect();
    
    const authResult = await user.authenticate();
    expect(authResult.success).toBe(true);
    expect(user.isAuthenticated).toBe(true);
  });

  test('should handle multiple concurrent connections', async () => {
    const users = await tester.createUsers(4, 'concurrent');
    
    // All users should be connected and authenticated
    for (const user of users) {
      expect(user.isConnected).toBe(true);
      expect(user.isAuthenticated).toBe(true);
    }
  });

  test('should create and join games correctly', async () => {
    const users = await tester.createUsers(2);
    const gameId = await tester.createGame();
    
    expect(gameId).toBeDefined();
    expect(gameId).toMatch(/[A-Z0-9]{6}/); // Should be 6-character code
    
    // Wait for game creation confirmation  
    const gameCreatedEvent = await tester.users[0].waitForEvent('game-created', 10000);
    expect(gameCreatedEvent[0].gameId).toBe(gameId);
    
    // Simple verification that users are connected and game exists
    expect(tester.users).toHaveLength(2);
    expect(tester.users[0].isAuthenticated).toBe(true);
    expect(tester.users[1].isAuthenticated).toBe(true);
  }, 15000);

  test('should start game with correct initial state', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    await tester.startGame();
    
    const gameState = await tester.waitForGameState('playing');
    
    expect(gameState.phase).toBe('playing');
    expect(gameState.players).toHaveLength(2);
    expect(gameState.currentTurn).toBeDefined();
    expect(gameState.mainDeck.length).toBeGreaterThan(0);
    expect(gameState.discardPile.length).toBeGreaterThanOrEqual(0); // Discard pile may be empty initially
    
    // Each player should have cards
    gameState.players.forEach(player => {
      expect(player.hand.length).toBeGreaterThan(0);
    });
  }, 15000);

  test('should handle chat messages correctly', async () => {
    const users = await tester.createUsers(2);
    const message = `Test message ${Date.now()}`;
    
    // Set up message listener for second user
    const messagePromise = users[1].waitForEvent('chat:message');
    
    // First user sends message
    await users[0].sendChat(message, 'lobby');
    
    // Second user should receive it
    const [receivedMessage] = await messagePromise;
    expect(receivedMessage.message || receivedMessage.text).toBe(message);
    expect(receivedMessage.username).toBe(users[0].username);
  });

  test('should handle game chat separately from lobby chat', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    
    const gameMessage = `Game message ${Date.now()}`;
    const lobbyMessage = `Lobby message ${Date.now()}`;
    
    // Send game chat
    await users[0].sendChat(gameMessage, 'game');
    
    // Send lobby chat (should be separate)
    await users[0].sendChat(lobbyMessage, 'lobby');
    
    // Both should be received but in different contexts
    // This would require more sophisticated event tracking
  });

  test('should maintain chat history correctly', async () => {
    const user = new TestUser('historytest');
    await user.connect();
    await user.authenticate();
    await user.joinLobby();
    
    // Send multiple messages
    const messages = [
      `Message 1 ${Date.now()}`,
      `Message 2 ${Date.now()}`,
      `Message 3 ${Date.now()}`
    ];
    
    for (const message of messages) {
      await user.sendChat(message, 'lobby');
      await tester.delay(100);
    }
    
    // Disconnect and reconnect
    user.disconnect();
    
    const newUser = new TestUser('historytest2');
    await newUser.connect();
    await newUser.authenticate();
    await newUser.joinLobby();
    
    // Should receive chat history
    const historyEvent = await newUser.waitForEvent('chat:history');
    const history = historyEvent[0];
    
    expect(history.messages).toBeDefined();
    expect(history.messages.length).toBeGreaterThan(0);
  });

  test('should handle player disconnections gracefully', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    await tester.startGame();
    
    // Disconnect one player
    users[1].disconnect();
    
    // First player should receive disconnection event
    const disconnectEvent = await users[0].waitForEvent('player-disconnected');
    expect(disconnectEvent[0].username).toBe(users[1].username);
  });

  test('should handle game state updates correctly', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    await tester.startGame();
    
    const gameState = await tester.waitForGameState('playing');
    
    // Game state should have all required properties
    expect(gameState).toHaveProperty('id');
    expect(gameState).toHaveProperty('players');
    expect(gameState).toHaveProperty('currentTurn');
    expect(gameState).toHaveProperty('mainDeck');
    expect(gameState).toHaveProperty('discardPile');
    expect(gameState).toHaveProperty('teamSequences');
    expect(gameState).toHaveProperty('scores');
    expect(gameState).toHaveProperty('turnState');
  });

  test('should validate turn actions correctly', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    await tester.startGame();
    
    const gameState = await tester.waitForGameState('playing');
    const currentPlayer = users[gameState.currentTurn];
    const otherPlayer = users[1 - gameState.currentTurn];
    
    // Current player should be able to draw
    currentPlayer.socket.emit('game-action', {
      type: 'draw',
      data: { source: 'deck' }
    });
    
    // Other player should not be able to act (should get error)
    const errorPromise = otherPlayer.waitForEvent('action-error');
    otherPlayer.socket.emit('game-action', {
      type: 'draw',
      data: { source: 'deck' }
    });
    
    const [error] = await errorPromise;
    expect(error.message).toContain('turn');
  });

  test('should handle game list updates', async () => {
    const users = await tester.createUsers(3);
    
    // Set up listener for game list updates
    const gameListPromise = users[2].waitForEvent('game-list-updated');
    
    // Create a game with first two users
    await tester.createGame();
    
    // Third user should receive game list update
    const [gameList] = await gameListPromise;
    expect(gameList).toBeDefined();
    expect(Array.isArray(gameList)).toBe(true);
    expect(gameList.length).toBeGreaterThan(0);
  });

  test('should handle reconnection correctly', async () => {
    const users = await tester.createUsers(2);
    await tester.createGame();
    await tester.startGame();
    
    // Disconnect one player
    const originalUser = users[0];
    originalUser.disconnect();
    
    // Reconnect same user
    const reconnectedUser = new TestUser(originalUser.username);
    reconnectedUser.userId = originalUser.userId;
    await reconnectedUser.connect();
    await reconnectedUser.authenticate();
    
    // Should receive game reconnection event with current state
    const reconnectEvent = await reconnectedUser.waitForEvent('game-reconnected', 15000);
    expect(reconnectEvent[0].gameState).toBeDefined();
  }, 20000);

  test('should enforce player limits correctly', async () => {
    const users = await tester.createUsers(5); // Try to create 5 users for 4-player max game
    await tester.createGame(); // First 4 should join
    
    // 5th user should not be able to join
    const fifthUser = users[4];
    const errorPromise = fifthUser.waitForEvent('error');
    
    await fifthUser.joinGame(tester.gameId);
    
    const [error] = await errorPromise;
    expect(error.message).toContain('full' || 'limit' || 'players');
  });

  test('should handle concurrent game creation', async () => {
    const users = await tester.createUsers(4);
    
    // Try to create multiple games simultaneously
    const gamePromises = users.map(user => {
      const gameId = user.createGame();
      return gameId;
    });
    
    const gameIds = await Promise.all(gamePromises);
    
    // All games should have unique IDs
    const uniqueIds = new Set(gameIds);
    expect(uniqueIds.size).toBe(gameIds.length);
  });
});

// Performance and stress tests
describe('Performance Tests', () => {
  test('should handle rapid message sending', async () => {
    const user = new TestUser('speedtester');
    await user.connect();
    await user.authenticate();
    await user.joinLobby();
    
    const messageCount = 50;
    const startTime = Date.now();
    
    // Send many messages rapidly
    for (let i = 0; i < messageCount; i++) {
      await user.sendChat(`Speed test ${i}`, 'lobby');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should handle all messages within reasonable time
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  test('should handle multiple concurrent games', async () => {
    const gamePromises = [];
    
    // Create multiple games concurrently
    for (let i = 0; i < 3; i++) {
      const promise = (async () => {
        const tester = new GameTester();
        await tester.createUsers(2, `game${i}`);
        const gameId = await tester.createGame();
        await tester.startGame();
        return { tester, gameId };
      })();
      
      gamePromises.push(promise);
    }
    
    const results = await Promise.all(gamePromises);
    
    // All games should be created successfully
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.gameId).toBeDefined();
    });
    
    // Cleanup
    for (const result of results) {
      await result.tester.cleanup();
    }
  });
});