const { io } = require('socket.io-client');

async function testReactFlow() {
  console.log('⚛️ Testing React component flow...');
  
  const socket = io('http://localhost:3002');
  let connectionStatus = 'disconnected';
  
  // Simulate React component state
  let currentScreen = 'lobby';
  let gameId = null;
  
  // Wait for connection
  await new Promise((resolve) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      connectionStatus = 'connected';
      resolve();
    });
  });
  
  // Simulate setting up event listeners like GameLobby component
  socket.on('authenticated', () => {
    console.log('✅ Authenticated');
  });
  
  socket.on('game-created', (data) => {
    console.log('🎮 Game created event received:', data.gameId);
    gameId = data.gameId;
    // This should trigger navigation to waiting room
    currentScreen = 'waiting';
    console.log('📍 Screen changed to:', currentScreen);
  });
  
  socket.on('game-state-update', (state) => {
    console.log('📊 Game state update:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
    
    // This is what GameLobby does
    if (state && (state.phase === 'waiting' || state.phase === 'playing')) {
      gameId = state.id;
      currentScreen = 'waiting';
      console.log('📍 Screen changed to waiting room via game-state-update');
    }
  });
  
  socket.on('error', (error) => {
    console.log('❌ Error:', error);
  });
  
  // Simulate authentication like real app
  console.log('🔐 Authenticating with stored user data...');
  socket.emit('authenticate', { 
    userId: 456, // Different from previous test
    username: 'reactuser' 
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Join lobby like React app
  console.log('🏛️ Joining lobby...');
  socket.emit('join-lobby', { username: 'reactuser' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate clicking Create Game button
  console.log('🎯 Simulating Create Game button click...');
  console.log('   Connection status:', connectionStatus);
  
  if (connectionStatus !== 'connected') {
    console.log('❌ Not connected - would try to reconnect');
    return;
  }
  
  // This is exactly what handleCreateGame does
  socket.emit('create-game');
  
  // Wait for events
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('📊 Final state:');
  console.log('   - Current screen:', currentScreen);
  console.log('   - Game ID:', gameId);
  console.log('   - Connection status:', connectionStatus);
  
  socket.disconnect();
}

testReactFlow().catch(console.error);