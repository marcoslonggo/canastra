const { test, expect } = require('@playwright/test');

/**
 * Admin Features Tests (Issue #19)
 * Tests admin game management and server restart functionality
 */

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login as admin
    await page.goto('http://localhost:3004');
    
    // Login as admin
    await page.fill('input[placeholder*="Username"]', 'admin');
    await page.fill('input[placeholder*="Password"]', 'test_admin_123');
    await page.click('button:has-text("Login")');
    
    // Wait for lobby to load
    await page.waitForSelector('h2:has-text("Family Canastra - Game Lobby")', { timeout: 10000 });
    await expect(page.locator('text*="👑 Admin"')).toBeVisible();
  });

  test('should display admin panel button for admin users', async ({ page }) => {
    await expect(page.locator('button:has-text("Admin Panel")')).toBeVisible();
  });

  test('should open and close admin panel', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    await expect(page.locator('h3:has-text("Admin Panel")')).toBeVisible();
    
    // Should show all three sections
    await expect(page.locator('h4:has-text("User Management")')).toBeVisible();
    await expect(page.locator('h4:has-text("Game Management")')).toBeVisible();
    await expect(page.locator('h4:has-text("Server Management")')).toBeVisible();
    
    // Close admin panel
    await page.click('button:has-text("Hide Admin")');
    await expect(page.locator('h3:has-text("Admin Panel")')).not.toBeVisible();
  });

  test('should display user management section with users', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Should show user list
    await expect(page.locator('.user-list')).toBeVisible();
    
    // Should show admin user
    await expect(page.locator('text*="admin 👑 (You)"')).toBeVisible();
    
    // Should show user actions for other users (not for admin itself)
    const userItems = page.locator('.user-item');
    const count = await userItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display game management section', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Should show game management section
    await expect(page.locator('h4:has-text("Game Management")')).toBeVisible();
    
    // Should show refresh button
    await expect(page.locator('button:has-text("Refresh Games")')).toBeVisible();
    
    // Should show no active games message (initially)
    await expect(page.locator('text*="No active games"')).toBeVisible();
  });

  test('should display server management section', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Should show server management section
    await expect(page.locator('h4:has-text("Server Management")')).toBeVisible();
    
    // Should show restart server button
    await expect(page.locator('button:has-text("Restart Server")')).toBeVisible();
  });

  test('should show server restart confirmation dialog', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Click restart server button
    await page.click('button:has-text("Restart Server")');
    
    // Should show confirmation modal
    await expect(page.locator('h3:has-text("Restart Server")')).toBeVisible();
    await expect(page.locator('text*="Are you sure you want to restart the server"')).toBeVisible();
    
    // Should have restart and cancel buttons
    await expect(page.locator('button:has-text("Restart Server")')).toHaveCount(2); // Original + modal button
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    
    // Cancel the restart
    await page.click('button:has-text("Cancel")');
    
    // Modal should close
    await expect(page.locator('h3:has-text("Restart Server")')).not.toBeVisible();
  });

  test('should allow promoting users to admin', async ({ page }) => {
    // First create a test user to promote
    await page.click('button:has-text("Logout")');
    
    // Register a new test user
    await page.click('button:has-text("Register here")');
    const testUsername = `testuser_${Date.now()}`;
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]:has-text("Register")');
    
    // Logout and login as admin again
    await page.waitForSelector('h2:has-text("Family Canastra - Game Lobby")');
    await page.click('button:has-text("Logout")');
    await page.fill('input[placeholder*="Username"]', 'admin');
    await page.fill('input[placeholder*="Password"]', 'test_admin_123');
    await page.click('button:has-text("Login")');
    
    // Open admin panel
    await page.waitForSelector('h2:has-text("Family Canastra - Game Lobby")');
    await page.click('button:has-text("Admin Panel")');
    
    // Find the test user and promote them
    const testUserRow = page.locator('.user-item').filter({ hasText: testUsername });
    await expect(testUserRow).toBeVisible();
    
    // Click make admin button for this user
    await testUserRow.locator('button:has-text("Make Admin")').click();
    
    // User should now show crown icon
    await expect(testUserRow.locator('text*="👑"')).toBeVisible();
    
    // Should now have remove admin button instead
    await expect(testUserRow.locator('button:has-text("Remove Admin")')).toBeVisible();
  });

  test('should show refresh games functionality', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Click refresh games button
    await page.click('button:has-text("Refresh Games")');
    
    // Should not crash and should still show the section
    await expect(page.locator('h4:has-text("Game Management")')).toBeVisible();
    await expect(page.locator('button:has-text("Refresh Games")')).toBeVisible();
  });

  test('should show password reset functionality', async ({ page }) => {
    // Open admin panel
    await page.click('button:has-text("Admin Panel")');
    
    // Find any user that has a reset password button and click it
    const resetButton = page.locator('button:has-text("Reset Password")').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Should show password reset modal
      await expect(page.locator('h3:has-text("Reset Password")')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Cancel the reset
      await page.click('button:has-text("Cancel")');
      
      // Modal should close
      await expect(page.locator('h3:has-text("Reset Password")')).not.toBeVisible();
    }
  });
});