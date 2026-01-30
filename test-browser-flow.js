const { io } = require('socket.io-client');

async function testBrowserFlow() {
  console.log('🌐 Testing browser-like flow...');
  
  const socket = io('http://localhost:3002');
  
  // Wait for connection
  await new Promise((resolve) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      resolve();
    });
  });
  
  // Set up event listeners like the browser would
  socket.on('authenticated', () => console.log('✅ Authenticated'));
  socket.on('game-created', (data) => {
    console.log('🎮 Game created event received:', data.gameId);
  });
  socket.on('game-state-update', (state) => {
    console.log('📊 Game state update:', {
      phase: state.phase,
      players: state.players.map(p => p.username),
      id: state.id
    });
  });
  socket.on('error', (error) => console.log('❌ Error:', error));
  
  // Simulate browser authentication (like what happens on page load)
  console.log('🔐 Authenticating like a browser user...');
  socket.emit('authenticate', { 
    userId: 123, // Static user ID like a real user would have
    username: 'browseruser' 
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Join lobby
  console.log('🏛️ Joining lobby...');
  socket.emit('join-lobby', { username: 'browseruser' });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try to create a game (simulate button click)
  console.log('🎯 Attempting to create game (like clicking Create Game button)...');
  socket.emit('create-game');
  
  // Wait to see what happens
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✨ Test completed');
  socket.disconnect();
}

testBrowserFlow().catch(console.error);