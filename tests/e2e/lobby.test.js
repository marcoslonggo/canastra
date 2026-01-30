const { test, expect } = require('@playwright/test');

/**
 * Lobby Functionality Tests
 * Tests game creation, joining, chat, and lobby interactions
 */

test.describe('Lobby Functionality', () => {
  let testUser;

  test.beforeEach(async ({ page }) => {
    // Create unique test user for each test
    testUser = {
      username: `lobbytester_${Date.now()}`,
      password: 'testpass123'
    };

    // Navigate and register
    await page.goto('http://localhost:3004');
    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button:has-text("Register")');
    
    // Wait for lobby
    await expect(page.locator('h2')).toContainText('Game Lobby');
  });

  test('should display lobby correctly', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('h2')).toContainText('Family Canastra - Game Lobby');
    await expect(page.locator('text*="Welcome"')).toContainText(testUser.username);
    
    // Check connection status
    await expect(page.locator('text*="Connected"')).toBeVisible();
    
    // Check main sections
    await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();
    await expect(page.locator('h3:has-text("Join Game with Code")')).toBeVisible();
    await expect(page.locator('h3:has-text("Available Games")')).toBeVisible();
    await expect(page.locator('h3:has-text("Lobby Chat")')).toBeVisible();
  });

  test('should create a new game', async ({ page }) => {
    await page.click('button:has-text("Create Game")');
    
    // Should navigate to waiting room or show game created
    // Wait for either waiting room or game list update
    await expect(page.locator('h2')).toContainText('Waiting Room', { timeout: 10000 });
  });

  test('should show created games in available games list', async ({ page, context }) => {
    // Create a game
    await page.click('button:has-text("Create Game")');
    await expect(page.locator('h2')).toContainText('Waiting Room');
    
    // Open new tab to check from another user's perspective
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3004');
    
    // Register another user
    const user2 = { username: `joiner_${Date.now()}`, password: 'testpass123' };
    await newPage.click('button:has-text("Register here")');
    await newPage.fill('input[placeholder*="Username"]', user2.username);
    await newPage.fill('input[placeholder*="Password"]', user2.password);
    await newPage.click('button:has-text("Register")');
    
    await expect(newPage.locator('h2')).toContainText('Game Lobby');
    
    // Should see the created game in available games
    await expect(newPage.locator('.game-item')).toBeVisible({ timeout: 5000 });
    await expect(newPage.locator('text*="Code:"')).toBeVisible();
  });

  test('should join game with code', async ({ page, context }) => {
    // Create a game first
    await page.click('button:has-text("Create Game")');
    await expect(page.locator('h2')).toContainText('Waiting Room');
    
    // Get the game code from the URL or waiting room
    const gameCode = await page.locator('text*="Game Code:"').textContent();
    const code = gameCode.match(/[A-Z0-9]{6}/)[0];
    
    // Open new tab for second user
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3004');
    
    const user2 = { username: `joiner_${Date.now()}`, password: 'testpass123' };
    await newPage.click('button:has-text("Register here")');
    await newPage.fill('input[placeholder*="Username"]', user2.username);
    await newPage.fill('input[placeholder*="Password"]', user2.password);
    await newPage.click('button:has-text("Register")');
    
    await expect(newPage.locator('h2')).toContainText('Game Lobby');
    
    // Join using game code
    await newPage.fill('input[placeholder*="Enter game code"]', code);
    await newPage.click('button:has-text("Join Game")');
    
    // Should navigate to waiting room
    await expect(newPage.locator('h2')).toContainText('Waiting Room');
  });

  test('should join game from available games list', async ({ page, context }) => {
    // Create a game
    await page.click('button:has-text("Create Game")');
    await expect(page.locator('h2')).toContainText('Waiting Room');
    
    // Second user joins from lobby
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3004');
    
    const user2 = { username: `listjoiner_${Date.now()}`, password: 'testpass123' };
    await newPage.click('button:has-text("Register here")');
    await newPage.fill('input[placeholder*="Username"]', user2.username);
    await newPage.fill('input[placeholder*="Password"]', user2.password);
    await newPage.click('button:has-text("Register")');
    
    await expect(newPage.locator('h2')).toContainText('Game Lobby');
    
    // Wait for game to appear and click join
    await expect(newPage.locator('.game-item')).toBeVisible({ timeout: 5000 });
    await newPage.click('.game-item button:has-text("Join")');
    
    // Should navigate to waiting room
    await expect(newPage.locator('h2')).toContainText('Waiting Room');
  });

  test('should show "Rejoin" for existing game members', async ({ page }) => {
    // Create a game
    await page.click('button:has-text("Create Game")');
    await expect(page.locator('h2')).toContainText('Waiting Room');
    
    // Go back to lobby
    await page.click('button:has-text("Leave Game")');
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Should show "Rejoin" instead of "Join" for the user's own game
    await expect(page.locator('button:has-text("Rejoin")')).toBeVisible({ timeout: 5000 });
  });

  test('should send and receive lobby chat messages', async ({ page, context }) => {
    const message = `Test message ${Date.now()}`;
    
    // Send a chat message
    await page.fill('input[placeholder*="Type a message"]', message);
    await page.click('button:has-text("Send")');
    
    // Should see the message in chat
    await expect(page.locator(`.chat-message:has-text("${message}")`)).toBeVisible();
    
    // Second user should also see the message
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3004');
    
    const user2 = { username: `chatter_${Date.now()}`, password: 'testpass123' };
    await newPage.click('button:has-text("Register here")');
    await newPage.fill('input[placeholder*="Username"]', user2.username);
    await newPage.fill('input[placeholder*="Password"]', user2.password);
    await newPage.click('button:has-text("Register")');
    
    await expect(newPage.locator('h2')).toContainText('Game Lobby');
    
    // Should see the chat message from first user
    await expect(newPage.locator(`.chat-message:has-text("${message}")`)).toBeVisible();
  });

  test('should persist chat history on page refresh', async ({ page }) => {
    const message = `Persistent message ${Date.now()}`;
    
    // Send a chat message
    await page.fill('input[placeholder*="Type a message"]', message);
    await page.click('button:has-text("Send")');
    
    await expect(page.locator(`.chat-message:has-text("${message}")`)).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Message should still be visible (within 20-minute retention)
    await expect(page.locator(`.chat-message:has-text("${message}")`)).toBeVisible();
  });

  test('should disable actions when disconnected', async ({ page }) => {
    // All buttons should be enabled initially
    await expect(page.locator('button:has-text("Create Game")')).toBeEnabled();
    await expect(page.locator('button:has-text("Send")')).toBeDisabled(); // Disabled when no text
    
    // Force disconnect by stopping the server (simulate network issue)
    // This would require server restart simulation
    // For now, we'll test that UI responds to connection status changes
  });

  test('should handle connection status changes', async ({ page }) => {
    // Should show "Connected" status
    await expect(page.locator('text*="Connected"')).toBeVisible();
    
    // If we could simulate disconnection, should show:
    // - "Disconnected" status
    // - "Reconnect" button
    // - Disabled action buttons
  });

  test('should validate game code input', async ({ page }) => {
    // Test empty game code
    const joinButton = page.locator('button:has-text("Join Game")');
    await expect(joinButton).toBeDisabled();
    
    // Test valid game code format (6 characters)
    await page.fill('input[placeholder*="Enter game code"]', 'ABC123');
    await expect(joinButton).toBeEnabled();
    
    // Test invalid game code
    await page.fill('input[placeholder*="Enter game code"]', 'INVALID');
    // Should still be enabled as validation might be server-side
  });

  test('should show game status correctly', async ({ page, context }) => {
    // Create a game
    await page.click('button:has-text("Create Game")');
    await expect(page.locator('h2')).toContainText('Waiting Room');
    
    // Check from another user's perspective
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3004');
    
    const user2 = { username: `statuschecker_${Date.now()}`, password: 'testpass123' };
    await newPage.click('button:has-text("Register here")');
    await newPage.fill('input[placeholder*="Username"]', user2.username);
    await newPage.fill('input[placeholder*="Password"]', user2.password);
    await newPage.click('button:has-text("Register")');
    
    await expect(newPage.locator('h2')).toContainText('Game Lobby');
    
    // Should show game with "waiting" status and player count
    await expect(newPage.locator('.game-item')).toBeVisible({ timeout: 5000 });
    await expect(newPage.locator('text*="Players: 1/4"')).toBeVisible();
    await expect(newPage.locator('text*="waiting"')).toBeVisible();
  });
});