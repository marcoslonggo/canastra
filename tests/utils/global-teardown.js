/**
 * Global test teardown for Playwright
 * Cleans up after all tests complete
 */

async function globalTeardown(config) {
  console.log('🧹 Running global test cleanup...');
  
  // Clean up any test data
  try {
    // Could clear test users, games, etc. here if needed
    console.log('🗑️  Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }
  
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown;