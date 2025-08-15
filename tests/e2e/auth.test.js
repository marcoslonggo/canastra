const { test, expect } = require('@playwright/test');

/**
 * Authentication Flow Tests
 * Tests user registration, login, logout, and admin authentication
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3004');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Family Canastra');
    await expect(page.locator('.tab:has-text("Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Register here")')).toBeVisible();
  });

  test('should switch to register form', async ({ page }) => {
    await page.click('button:has-text("Register here")');
    await expect(page.locator('button[type="submit"]:has-text("Register")')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email (optional)' })).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: 'testpass123',
      email: `test_${Date.now()}@example.com`
    };

    // Switch to register form
    await page.click('button:has-text("Register here")');
    
    // Fill registration form
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
    await page.getByRole('textbox', { name: 'Email (optional)' }).fill(testUser.email);
    
    // Submit registration
    await page.locator('button[type="submit"]:has-text("Register")').click();
    
    // Should navigate to lobby after successful registration
    await expect(page.locator('h2')).toContainText('Family Canastra - Game Lobby');
    await expect(page.locator('text*="Welcome"')).toContainText(testUser.username);
  });

  test('should login with existing user', async ({ page }) => {
    // First register a user
    const testUser = {
      username: `logintest_${Date.now()}`,
      password: 'testpass123'
    };

    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button:has-text("Register")');
    
    // Wait for lobby and logout
    await expect(page.locator('h2')).toContainText('Game Lobby');
    await page.click('button:has-text("Logout")');
    
    // Now test login
    await expect(page.locator('h1')).toContainText('Family Canastra');
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button:has-text("Login")');
    
    // Should be back in lobby
    await expect(page.locator('h2')).toContainText('Game Lobby');
    await expect(page.locator('text*="Welcome"')).toContainText(testUser.username);
  });

  test('should handle login errors gracefully', async ({ page }) => {
    await page.fill('input[placeholder*="Username"]', 'nonexistentuser');
    await page.fill('input[placeholder*="Password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    
    // Should show error message (exact text may vary)
    await expect(page.locator('text*="error"')).toBeVisible();
    // Should remain on login page
    await expect(page.locator('h1')).toContainText('Family Canastra');
  });

  test('should login as admin and show admin panel', async ({ page }) => {
    await page.fill('input[placeholder*="Username"]', 'admin');
    await page.fill('input[placeholder*="Password"]', 'test_admin_123');
    await page.click('button:has-text("Login")');
    
    // Should navigate to lobby
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Should show admin indicator
    await expect(page.locator('text*="👑 Admin"')).toBeVisible();
    
    // Should have admin panel button
    await expect(page.locator('button:has-text("Admin Panel")')).toBeVisible();
  });

  test('admin panel should work correctly', async ({ page }) => {
    // Login as admin
    await page.fill('input[placeholder*="Username"]', 'admin');
    await page.fill('input[placeholder*="Password"]', 'test_admin_123');
    await page.click('button:has-text("Login")');
    
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    await expect(page.locator('h3')).toContainText('Admin Panel');
    
    // Should show user management section
    await expect(page.locator('h4')).toContainText('User Management');
    
    // Close admin panel
    await page.click('button:has-text("Hide Admin")');
    await expect(page.locator('h3:has-text("Admin Panel")')).not.toBeVisible();
  });

  test('should persist login state after page refresh', async ({ page }) => {
    const testUser = {
      username: `persisttest_${Date.now()}`,
      password: 'testpass123'
    };

    // Register and login
    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button:has-text("Register")');
    
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('h2')).toContainText('Game Lobby');
    await expect(page.locator('text*="Welcome"')).toContainText(testUser.username);
  });

  test('should logout successfully', async ({ page }) => {
    const testUser = {
      username: `logouttest_${Date.now()}`,
      password: 'testpass123'
    };

    // Register
    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button:has-text("Register")');
    
    await expect(page.locator('h2')).toContainText('Game Lobby');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should return to login page
    await expect(page.locator('h1')).toContainText('Family Canastra');
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Test empty username
    await page.fill('input[placeholder*="Password"]', 'somepassword');
    await page.click('button:has-text("Login")');
    // Button should be disabled or show validation error
    
    // Test empty password
    await page.fill('input[placeholder*="Username"]', 'someuser');
    await page.fill('input[placeholder*="Password"]', '');
    await page.click('button:has-text("Login")');
    // Should show validation error or button disabled
    
    // For registration, test email validation
    await page.click('button:has-text("Register here")');
    await page.fill('input[placeholder*="Username"]', 'testuser');
    await page.fill('input[placeholder*="Password"]', 'password');
    await page.fill('input[placeholder*="Email"]', 'invalid-email');
    await page.click('button:has-text("Register")');
    // Should show validation error for invalid email
  });
});