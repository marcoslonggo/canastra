const { io } = require('socket.io-client');

async function testFinalFlow() {
  console.log('🎯 Testing final game flow after fixes...');
  
  // Create two users to test the complete flow
  const user1Socket = io('http://localhost:3002');
  const user2Socket = io('http://localhost:3002');
  
  let gameId = null;
  let gameStatesReceived = [];
  
  // Wait for connections
  await new Promise((resolve) => {
    let connections = 0;
    
    user1Socket.on('connect', () => {
      console.log('✅ User 1 connected');
      connections++;
      if (connections === 2) resolve();
    });
    
    user2Socket.on('connect', () => {
      console.log('✅ User 2 connected');
      connections++;
      if (connections === 2) resolve();
    });
  });
  
  // Set up event listeners
  user1Socket.on('authenticated', () => console.log('✅ User 1 authenticated'));
  user2Socket.on('authenticated', () => console.log('✅ User 2 authenticated'));
  
  user1Socket.on('game-created', (data) => {
    console.log('🎮 User 1: Game created:', data.gameId);
    gameId = data.gameId;
    
    // Have user 2 join after a short delay
    setTimeout(() => {
      console.log('👥 User 2 joining game:', gameId);
      user2Socket.emit('join-game', { gameId });
    }, 500);
  });
  
  user1Socket.on('game-state-update', (state) => {
    console.log('📊 User 1: Game state update:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
    gameStatesReceived.push({ user: 1, state });
  });
  
  user2Socket.on('game-state-update', (state) => {
    console.log('📊 User 2: Game state update:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
    gameStatesReceived.push({ user: 2, state });
    
    // If we have both players, test starting the game
    if (state.players.length === 2 && state.phase === 'waiting') {
      setTimeout(() => {
        console.log('🚀 User 1 (host) starting the game...');
        user1Socket.emit('start-game');
      }, 1000);
    }
  });
  
  user1Socket.on('error', (error) => console.log('❌ User 1 error:', error));
  user2Socket.on('error', (error) => console.log('❌ User 2 error:', error));
  
  // Authenticate users with unique IDs  
  const userId1 = Date.now();
  const userId2 = Date.now() + 1;
  
  console.log('🔐 Authenticating users...');
  user1Socket.emit('authenticate', { userId: userId1, username: 'player1' });
  user2Socket.emit('authenticate', { userId: userId2, username: 'player2' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Join lobby
  console.log('🏛️ Joining lobby...');
  user1Socket.emit('join-lobby', { username: 'player1' });
  user2Socket.emit('join-lobby', { username: 'player2' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // User 1 creates a game
  console.log('🎯 User 1 creating game...');
  user1Socket.emit('create-game');
  
  // Wait for the full flow to complete
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('📋 Test Summary:');
  console.log('   - Game ID:', gameId);
  console.log('   - Game states received:', gameStatesReceived.length);
  console.log('   - Final game state phases:', [...new Set(gameStatesReceived.map(gs => gs.state.phase))]);
  
  // Cleanup
  user1Socket.disconnect();
  user2Socket.disconnect();
  console.log('🔌 Disconnected');
}

testFinalFlow().catch(console.error);