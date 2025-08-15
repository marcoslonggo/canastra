const { test, expect } = require('@playwright/test');

/**
 * Complete Game Flow Tests
 * Tests full game scenarios from creation to completion
 */

test.describe('Game Flow', () => {
  
  test('should complete a full 2-player game', async ({ context }) => {
    // Create two browser instances for two players
    const player1Page = await context.newPage();
    const player2Page = await context.newPage();
    
    // Register player 1
    await player1Page.goto('http://localhost:3004');
    const user1 = { username: `player1_${Date.now()}`, password: 'testpass123' };
    await player1Page.click('button:has-text("Register here")');
    await player1Page.fill('input[placeholder*="Username"]', user1.username);
    await player1Page.fill('input[placeholder*="Password"]', user1.password);
    await player1Page.click('button:has-text("Register")');
    await expect(player1Page.locator('h2')).toContainText('Game Lobby');
    
    // Register player 2
    await player2Page.goto('http://localhost:3004');
    const user2 = { username: `player2_${Date.now()}`, password: 'testpass123' };
    await player2Page.click('button:has-text("Register here")');
    await player2Page.fill('input[placeholder*="Username"]', user2.password);
    await player2Page.fill('input[placeholder*="Password"]', user2.password);
    await player2Page.click('button:has-text("Register")');
    await expect(player2Page.locator('h2')).toContainText('Game Lobby');
    
    // Player 1 creates game
    await player1Page.click('button:has-text("Create Game")');
    await expect(player1Page.locator('h2')).toContainText('Waiting Room');
    
    // Get game code and have player 2 join
    const gameCodeText = await player1Page.locator('text*="Game Code:"').textContent();
    const gameCode = gameCodeText.match(/[A-Z0-9]{6}/)[0];
    
    await player2Page.fill('input[placeholder*="Enter game code"]', gameCode);
    await player2Page.click('button:has-text("Join Game")');
    await expect(player2Page.locator('h2')).toContainText('Waiting Room');
    
    // Both players should see each other in waiting room
    await expect(player1Page.locator(`text*="${user2.username}"`)).toBeVisible();
    await expect(player2Page.locator(`text*="${user1.username}"`)).toBeVisible();
    
    // Start the game
    await player1Page.click('button:has-text("Start Game")');
    
    // Both should be in game now
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Verify game state elements are present
    await expect(player1Page.locator('.hand-cards')).toBeVisible();
    await expect(player1Page.locator('.deck-pile')).toBeVisible();
    await expect(player1Page.locator('.discard-pile')).toBeVisible();
    
    // Test basic game actions
    await test.step('Test card drawing', async () => {
      // Current player should be able to draw
      await player1Page.click('.deck-pile'); // Try to draw from deck
      // Should see turn state change or cards update
    });
    
    await test.step('Test cheat codes for testing', async () => {
      // Activate cheat mode for easier testing
      await player1Page.keyboard.type('iddqd');
      await expect(player1Page.locator('text*="Cheat mode activated"')).toBeVisible();
      
      // Activate card spy mode
      await player1Page.keyboard.type('cardy');
      await expect(player1Page.locator('text*="Card spy mode activated"')).toBeVisible();
    });
  });

  test('should handle 4-player game creation and management', async ({ context }) => {
    const players = [];
    
    // Create 4 players
    for (let i = 1; i <= 4; i++) {
      const page = await context.newPage();
      await page.goto('http://localhost:3004');
      
      const user = { username: `player${i}_${Date.now()}`, password: 'testpass123' };
      await page.click('button:has-text("Register here")');
      await page.fill('input[placeholder*="Username"]', user.username);
      await page.fill('input[placeholder*="Password"]', user.password);
      await page.click('button:has-text("Register")');
      await expect(page.locator('h2')).toContainText('Game Lobby');
      
      players.push({ page, user });
    }
    
    // Player 1 creates game
    await players[0].page.click('button:has-text("Create Game")');
    await expect(players[0].page.locator('h2')).toContainText('Waiting Room');
    
    // Get game code
    const gameCodeText = await players[0].page.locator('text*="Game Code:"').textContent();
    const gameCode = gameCodeText.match(/[A-Z0-9]{6}/)[0];
    
    // Other players join
    for (let i = 1; i < 4; i++) {
      await players[i].page.fill('input[placeholder*="Enter game code"]', gameCode);
      await players[i].page.click('button:has-text("Join Game")');
      await expect(players[i].page.locator('h2')).toContainText('Waiting Room');
    }
    
    // All players should see full player list
    for (const player of players) {
      for (const otherPlayer of players) {
        if (player !== otherPlayer) {
          await expect(player.page.locator(`text*="${otherPlayer.user.username}"`)).toBeVisible();
        }
      }
    }
    
    // Start game
    await players[0].page.click('button:has-text("Start Game")');
    
    // All players should be in game
    for (const player of players) {
      await expect(player.page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle game chat correctly', async ({ context }) => {
    const player1Page = await context.newPage();
    const player2Page = await context.newPage();
    
    // Set up two players in a game (abbreviated setup)
    await setupTwoPlayerGame(player1Page, player2Page);
    
    // Both should be in game
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Open chat on player 1
    await player1Page.click('button:has-text("Chat")');
    await expect(player1Page.locator('.game-chat-panel')).toBeVisible();
    
    // Send a message
    const message = `Game message ${Date.now()}`;
    await player1Page.fill('.chat-input', message);
    await player1Page.click('button:has-text("Send")');
    
    // Open chat on player 2 and verify message
    await player2Page.click('button:has-text("Chat")');
    await expect(player2Page.locator('.game-chat-panel')).toBeVisible();
    await expect(player2Page.locator(`.chat-message:has-text("${message}")`)).toBeVisible();
  });

  test('should handle player leaving and rejoining game', async ({ context }) => {
    const player1Page = await context.newPage();
    const player2Page = await context.newPage();
    
    await setupTwoPlayerGame(player1Page, player2Page);
    
    // Both in game
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Player 2 leaves game
    await player2Page.click('button:has-text("Leave Game")');
    await expect(player2Page.locator('h2')).toContainText('Game Lobby');
    
    // Player 1 should see disconnection notice
    await expect(player1Page.locator('text*="disconnected"')).toBeVisible({ timeout: 5000 });
    
    // Player 2 rejoins - should see "Rejoin" button
    await expect(player2Page.locator('button:has-text("Rejoin")')).toBeVisible();
    await player2Page.click('button:has-text("Rejoin")');
    
    // Should be back in game
    await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
  });

  test('should handle connection loss and reconnection during game', async ({ context }) => {
    const player1Page = await context.newPage();
    const player2Page = await context.newPage();
    
    await setupTwoPlayerGame(player1Page, player2Page);
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Simulate connection loss by navigating away and back
    await player1Page.goto('about:blank');
    await player1Page.goto('http://localhost:3004');
    
    // Should automatically log back in and return to game
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 15000 });
  });

  test('should activate and use cheat codes for testing', async ({ context }) => {
    const page = await context.newPage();
    
    // Quick setup - register and create game
    await page.goto('http://localhost:3004');
    const user = { username: `cheattester_${Date.now()}`, password: 'testpass123' };
    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', user.username);
    await page.fill('input[placeholder*="Password"]', user.password);
    await page.click('button:has-text("Register")');
    await page.click('button:has-text("Create Game")');
    await page.click('button:has-text("Start Game")'); // Start with 1 player for testing
    
    await expect(page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Test cheat codes
    await test.step('Test basic cheat mode', async () => {
      await page.keyboard.type('iddqd');
      await expect(page.locator('text*="Cheat mode activated"')).toBeVisible();
    });
    
    await test.step('Test card spy mode', async () => {
      await page.keyboard.type('cardy');
      await expect(page.locator('text*="Card spy mode activated"')).toBeVisible();
      // Should show debug indicators
      await expect(page.locator('text*="DEBUG MODE"')).toBeVisible();
    });
    
    await test.step('Test speed mode', async () => {
      await page.keyboard.type('speedx');
      await expect(page.locator('text*="Speed mode activated"')).toBeVisible();
      await expect(page.locator('text*="SPEED MODE"')).toBeVisible();
    });
    
    await test.step('Test auto-win', async () => {
      await page.keyboard.type('winme');
      await expect(page.locator('text*="Auto-win activated"')).toBeVisible();
    });
    
    await test.step('Test reset', async () => {
      await page.keyboard.type('reset');
      await expect(page.locator('text*="All test modes disabled"')).toBeVisible();
      // Debug indicators should be gone
      await expect(page.locator('text*="DEBUG MODE"')).not.toBeVisible();
      await expect(page.locator('text*="SPEED MODE"')).not.toBeVisible();
    });
  });

  test('should show correct turn indicators and game state', async ({ context }) => {
    const player1Page = await context.newPage();
    const player2Page = await context.newPage();
    
    await setupTwoPlayerGame(player1Page, player2Page);
    
    // Both in game
    await expect(player1Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    await expect(player2Page.locator('.game-board')).toBeVisible({ timeout: 10000 });
    
    // Check turn indicators
    const isCurrent1 = await player1Page.locator('.current-turn').isVisible();
    const isCurrent2 = await player2Page.locator('.current-turn').isVisible();
    
    // One should be current, one should not
    expect(isCurrent1 !== isCurrent2).toBe(true);
    
    // Check scores are displayed
    await expect(player1Page.locator('.team-score')).toBeVisible();
    await expect(player2Page.locator('.team-score')).toBeVisible();
  });
});

// Helper function to set up a basic 2-player game
async function setupTwoPlayerGame(player1Page, player2Page) {
  // Register player 1
  await player1Page.goto('http://localhost:3004');
  const user1 = { username: `p1_${Date.now()}`, password: 'testpass123' };
  await player1Page.click('button:has-text("Register here")');
  await player1Page.fill('input[placeholder*="Username"]', user1.username);
  await player1Page.fill('input[placeholder*="Password"]', user1.password);
  await player1Page.click('button:has-text("Register")');
  await expect(player1Page.locator('h2')).toContainText('Game Lobby');
  
  // Register player 2
  await player2Page.goto('http://localhost:3004');
  const user2 = { username: `p2_${Date.now()}`, password: 'testpass123' };
  await player2Page.click('button:has-text("Register here")');
  await player2Page.fill('input[placeholder*="Username"]', user2.username);
  await player2Page.fill('input[placeholder*="Password"]', user2.password);
  await player2Page.click('button:has-text("Register")');
  await expect(player2Page.locator('h2')).toContainText('Game Lobby');
  
  // Create and join game
  await player1Page.click('button:has-text("Create Game")');
  await expect(player1Page.locator('h2')).toContainText('Waiting Room');
  
  const gameCodeText = await player1Page.locator('text*="Game Code:"').textContent();
  const gameCode = gameCodeText.match(/[A-Z0-9]{6}/)[0];
  
  await player2Page.fill('input[placeholder*="Enter game code"]', gameCode);
  await player2Page.click('button:has-text("Join Game")');
  await expect(player2Page.locator('h2')).toContainText('Waiting Room');
  
  // Start game
  await player1Page.click('button:has-text("Start Game")');
}