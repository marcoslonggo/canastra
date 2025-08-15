const { io } = require('socket.io-client');

async function testGameFlow() {
  console.log('🚀 Starting game flow test...');
  
  // Create two test users
  const user1Socket = io('http://localhost:3002');
  const user2Socket = io('http://localhost:3002');
  
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
  
  let gameId = null;
  
  user1Socket.on('game-created', (data) => {
    console.log('🎮 Game created:', data.gameId);
    gameId = data.gameId;
    
    // Have user 2 join the game
    setTimeout(() => {
      console.log('👥 User 2 joining game:', gameId);
      user2Socket.emit('join-game', { gameId });
    }, 500);
  });
  
  user1Socket.on('game-state-update', (state) => {
    console.log('📊 Game state update for User 1:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
  });
  
  user2Socket.on('game-state-update', (state) => {
    console.log('📊 Game state update for User 2:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
  });
  
  user1Socket.on('error', (error) => console.log('❌ User 1 error:', error));
  user2Socket.on('error', (error) => console.log('❌ User 2 error:', error));
  
  // Authenticate users with unique IDs
  const userId1 = Date.now();
  const userId2 = Date.now() + 1;
  user1Socket.emit('authenticate', { userId: userId1, username: 'testuser1' });
  user2Socket.emit('authenticate', { userId: userId2, username: 'testuser2' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Join lobby
  user1Socket.emit('join-lobby', { username: 'testuser1' });
  user2Socket.emit('join-lobby', { username: 'testuser2' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // User 1 creates a game
  console.log('🎯 User 1 creating game...');
  user1Socket.emit('create-game');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // User 2 tries to join the game (we need to get the gameId first)
  // For now, let's see what happens with game creation
  
  console.log('✨ Test completed');
  
  // Keep connections open for a bit to see events
  setTimeout(() => {
    user1Socket.disconnect();
    user2Socket.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }, 5000);
}

testGameFlow().catch(console.error);