const io = require('socket.io-client');

async function testGameCreation() {
  return new Promise((resolve, reject) => {
    console.log('Connecting to server...');
    
    const socket = io('http://localhost:3002', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      
      // Authenticate first
      console.log('Authenticating...');
      socket.emit('authenticate', {
        username: 'marcos',
        password: 'password123' // This won't work for login but will test the flow
      });
    });

    socket.on('authenticated', (data) => {
      console.log('Authentication response:', data);
      
      // Try to create a game
      console.log('Attempting to create game...');
      socket.emit('create-game');
    });

    socket.on('game-created', (data) => {
      console.log('Game created successfully:', data);
      socket.disconnect();
      resolve('Success');
    });

    socket.on('error', (error) => {
      console.log('Error received:', error);
      if (error.message && error.message.includes('Player already in game')) {
        console.log('❌ The "Player already in game" issue is still present');
        socket.disconnect();
        resolve('Issue still exists');
      } else {
        console.log('Different error (expected for auth):', error.message);
        socket.disconnect();
        resolve('Authentication error (expected)');
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setTimeout(() => {
      socket.disconnect();
      reject('Timeout');
    }, 5000);
  });
}

testGameCreation()
  .then(result => {
    console.log('Test result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });