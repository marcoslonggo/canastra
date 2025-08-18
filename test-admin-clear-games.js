const fetch = require('node-fetch');

async function clearAllGames() {
  try {
    // First login as admin
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3002/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'test_admin_123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    console.log('Login successful');

    // Clear all games
    console.log('Clearing all games...');
    const clearResponse = await fetch('http://localhost:3002/api/admin/games/clear-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!clearResponse.ok) {
      throw new Error(`Clear games failed: ${clearResponse.status}`);
    }

    const clearData = await clearResponse.json();
    console.log('Clear games response:', clearData);

    // Get games list to verify
    console.log('Getting updated games list...');
    const gamesResponse = await fetch('http://localhost:3002/api/admin/games', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (gamesResponse.ok) {
      const gamesData = await gamesResponse.json();
      console.log('Active games after clear:', gamesData);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearAllGames();