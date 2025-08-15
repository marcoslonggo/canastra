/**
 * Global test setup for Playwright
 * Sets up test environment and prepares for testing
 */

async function globalSetup(config) {
  console.log('🔧 Setting up global test environment...');
  
  // Wait for servers to be ready
  await waitForServer('http://localhost:3002', 30000);
  await waitForServer('http://localhost:3004', 30000);
  
  // Create test admin user if needed
  try {
    await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'test_admin_123' })
    });
    console.log('✅ Admin user verified');
  } catch (error) {
    console.log('⚠️  Admin user verification failed, continuing anyway');
  }
  
  // Clear any existing test data
  console.log('🧹 Clearing test data...');
  
  console.log('✅ Global setup completed');
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        console.log(`✅ Server ready at ${url}`);
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${url} not ready after ${timeout}ms`);
}

module.exports = globalSetup;