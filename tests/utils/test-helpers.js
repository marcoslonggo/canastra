const { io } = require('socket.io-client');

/**
 * Test utilities for Canastra game testing
 */

class TestUser {
  constructor(username, options = {}) {
    this.username = username;
    this.userId = Date.now() + Math.random();
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.gameId = null;
    this.options = options;
    this.events = new Map();
  }

  async connect(serverUrl = 'http://localhost:3002') {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl);
      
      this.socket.on('connect', () => {
        console.log(`✅ ${this.username} connected`);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error(`❌ ${this.username} connection error:`, error);
        reject(error);
      });

      // Set up basic event logging
      this.socket.onAny((eventName, ...args) => {
        if (!this.events.has(eventName)) {
          this.events.set(eventName, []);
        }
        this.events.get(eventName).push({
          timestamp: Date.now(),
          data: args
        });
      });
    });
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      this.socket.on('authenticated', (data) => {
        if (data.success) {
          console.log(`🔐 ${this.username} authenticated`);
          this.isAuthenticated = true;
          resolve(data);
        } else {
          reject(new Error('Authentication failed'));
        }
      });

      this.socket.emit('authenticate', {
        userId: this.userId,
        username: this.username
      });
    });
  }

  async joinLobby() {
    this.socket.emit('join-lobby', { username: this.username });
    console.log(`🏛️ ${this.username} joined lobby`);
  }

  async createGame() {
    return new Promise((resolve) => {
      this.socket.on('game-created', (data) => {
        console.log(`🎮 ${this.username} created game: ${data.gameId}`);
        this.gameId = data.gameId;
        resolve(data.gameId);
      });

      this.socket.emit('create-game');
    });
  }

  async joinGame(gameId) {
    this.gameId = gameId;
    this.socket.emit('join-game', { gameId });
    console.log(`👥 ${this.username} joining game: ${gameId}`);
  }

  async startGame() {
    this.socket.emit('start-game');
    console.log(`🚀 ${this.username} starting game`);
  }

  async sendChat(message, room = 'lobby') {
    if (room === 'lobby') {
      this.socket.emit('chat:lobby', {
        username: this.username,
        text: message
      });
    } else if (room === 'game' && this.gameId) {
      this.socket.emit('chat:game', {
        gameId: this.gameId,
        message: message
      });
    }
    console.log(`💬 ${this.username} sent chat: "${message}" to ${room}`);
  }

  async waitForEvent(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${eventName}`));
      }, timeout);

      this.socket.once(eventName, (...args) => {
        clearTimeout(timer);
        resolve(args);
      });
    });
  }

  getEventHistory(eventName) {
    return this.events.get(eventName) || [];
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log(`🔌 ${this.username} disconnected`);
    }
  }
}

class GameTester {
  constructor() {
    this.users = [];
    this.gameId = null;
  }

  async createUsers(count, prefix = 'player') {
    const users = [];
    for (let i = 1; i <= count; i++) {
      const user = new TestUser(`${prefix}${i}`);
      await user.connect();
      await user.authenticate();
      await user.joinLobby();
      users.push(user);
    }
    this.users = users;
    return users;
  }

  async createGame() {
    if (this.users.length === 0) {
      throw new Error('No users available to create game');
    }

    const host = this.users[0];
    this.gameId = await host.createGame();
    
    // Other users join the game
    for (let i = 1; i < this.users.length; i++) {
      await this.users[i].joinGame(this.gameId);
      await this.delay(200); // Small delay between joins
    }

    return this.gameId;
  }

  async startGame() {
    const host = this.users[0];
    await host.startGame();
    console.log(`🎯 Game ${this.gameId} started`);
  }

  async waitForGameState(phase, timeout = 10000) {
    const promises = this.users.map(user => 
      user.waitForEvent('game-state-update', timeout)
    );
    
    const results = await Promise.all(promises);
    const gameState = results[0][0]; // First user's game state
    
    if (gameState.phase === phase) {
      console.log(`✅ Game reached phase: ${phase}`);
      return gameState;
    } else {
      throw new Error(`Expected phase ${phase}, got ${gameState.phase}`);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    for (const user of this.users) {
      user.disconnect();
    }
    console.log('🧹 Cleanup completed');
  }
}

// Cheat code activators for testing
class CheatCodes {
  static async activateSpeedMode(page) {
    await page.keyboard.type('speedx');
    console.log('⚡ Speed mode activated');
  }

  static async activateCardSpy(page) {
    await page.keyboard.type('cardy');
    console.log('🔍 Card spy mode activated');
  }

  static async activateCheatMode(page) {
    await page.keyboard.type('iddqd');
    console.log('🎮 Cheat mode activated');
  }

  static async resetModes(page) {
    await page.keyboard.type('reset');
    console.log('🔄 All modes reset');
  }

  static async autoWin(page) {
    await page.keyboard.type('winme');
    console.log('🏆 Auto-win activated');
  }
}

// Test data generators
class TestData {
  static generateUser(id = 1) {
    return {
      username: `testuser${id}`,
      password: 'testpass123',
      email: `test${id}@example.com`
    };
  }

  static generateAdmin() {
    return {
      username: 'admin',
      password: 'test_admin_123'
    };
  }

  static getGameScenarios() {
    return {
      quick2Player: {
        playerCount: 2,
        autoStart: true,
        fastMode: true
      },
      full4Player: {
        playerCount: 4,
        autoStart: true,
        fastMode: false
      },
      waitingRoom: {
        playerCount: 3,
        autoStart: false,
        fastMode: false
      }
    };
  }
}

module.exports = {
  TestUser,
  GameTester,
  CheatCodes,
  TestData
};