const { test, expect } = require('@playwright/test');

/**
 * Admin Features Tests (Issue #19)
 * Tests admin game management and server restart functionality
 */

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login as admin
    await page.goto('http://localhost:3004');
    
    // Login as admin - use name attributes instead of placeholders
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'test_admin_123');
    await page.click('button[type="submit"]');
    
    // Wait for lobby to load - look for game lobby container
    await page.waitForSelector('.game-lobby', { timeout: 10000 });
    await expect(page.locator('text=👑')).toBeVisible();
  });

  test('should display admin panel button for admin users', async ({ page }) => {
    await expect(page.locator('.admin-toggle-button')).toBeVisible();
  });

  test('should open and close admin panel', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    await expect(page.locator('.admin-panel')).toBeVisible();
    
    // Should show all three sections
    await expect(page.locator('.admin-section')).toHaveCount(3);
    
    // Close admin panel
    await page.click('.admin-toggle-button');
    await expect(page.locator('.admin-panel')).not.toBeVisible();
  });

  test('should display user management section with users', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Should show user list
    await expect(page.locator('.user-list')).toBeVisible();
    
    // Should show admin user in the user list
    await expect(page.locator('.user-item .username:has-text("admin")')).toBeVisible();
    await expect(page.locator('.user-item .username:has-text("admin 👑")')).toBeVisible();
    
    // Should show user actions for other users (not for admin itself)
    const userItems = page.locator('.user-item');
    const count = await userItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display game management section', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Should show game management section
    await expect(page.locator('.admin-section').nth(1)).toBeVisible();
    
    // Should show refresh button
    await expect(page.locator('.refresh-button')).toBeVisible();
    
    // Should show games list or no games message
    await expect(page.locator('.games-list')).toBeVisible();
  });

  test('should display server management section', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Should show server management section
    await expect(page.locator('.admin-section').nth(2)).toBeVisible();
    
    // Should show restart server button
    await expect(page.locator('.restart-server-button')).toBeVisible();
  });

  test('should show server restart confirmation dialog', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Click restart server button
    await page.click('.restart-server-button');
    
    // Should show confirmation modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal')).toBeVisible();
    
    // Should have restart and cancel buttons
    await expect(page.locator('.confirm-button')).toBeVisible();
    await expect(page.locator('.cancel-button')).toBeVisible();
    
    // Cancel the restart
    await page.click('.cancel-button');
    
    // Modal should close
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test.skip('should allow promoting users to admin', async ({ page }) => {
    // First create a test user to promote
    await page.click('.logout-button');
    
    // Register a new test user
    await page.click('.link-button');
    const testUsername = `testuser_${Date.now()}`;
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Logout and login as admin again
    await page.waitForSelector('.game-lobby');
    await page.click('.logout-button');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'test_admin_123');
    await page.click('button[type="submit"]');
    
    // Open admin panel
    await page.waitForSelector('.game-lobby');
    await page.click('.admin-toggle-button');
    
    // Find the test user and promote them
    const testUserRow = page.locator('.user-item').filter({ hasText: testUsername });
    await expect(testUserRow).toBeVisible();
    
    // Click make admin button for this user
    await testUserRow.locator('.promote-button').click();
    
    // User should now show crown icon
    await expect(testUserRow.locator('text=👑')).toBeVisible();
    
    // Should now have remove admin button instead
    await expect(testUserRow.locator('.demote-button')).toBeVisible();
  });

  test('should show refresh games functionality', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Click refresh games button
    await page.click('.refresh-button');
    
    // Should not crash and should still show the section
    await expect(page.locator('.admin-section').nth(1)).toBeVisible();
    await expect(page.locator('.refresh-button')).toBeVisible();
  });

  test('should show password reset functionality', async ({ page }) => {
    // Open admin panel
    await page.click('.admin-toggle-button');
    
    // Find any user that has a reset password button and click it
    const resetButton = page.locator('.reset-password-button').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Should show password reset modal
      await expect(page.locator('.modal-overlay')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Cancel the reset
      await page.click('.cancel-button');
      
      // Modal should close
      await expect(page.locator('.modal-overlay')).not.toBeVisible();
    }
  });
});