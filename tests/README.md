# Canastra Game Test Suite

A comprehensive testing framework for the Brazilian Canastra card game, featuring E2E tests, backend validation, and performance testing.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Both frontend and backend servers running:
  ```bash
  # Terminal 1 - Backend
  cd server && ADMIN_PASSWORD=test_admin_123 npm start
  
  # Terminal 2 - Frontend  
  cd client && PORT=3004 npm start
  ```

### Running Tests

```bash
# Install dependencies (first time only)
npm install @playwright/test
npx playwright install

# Run all tests
node tests/run-all-tests.js

# Quick test suite (5-10 minutes)
node tests/run-all-tests.js --quick

# Specific test suites
node tests/run-all-tests.js --e2e       # Browser tests only
node tests/run-all-tests.js --backend   # API/WebSocket tests
node tests/run-all-tests.js --cheats    # Cheat code functionality
```

## 🧪 Test Categories

### E2E Tests (Playwright)
Browser-based tests covering the complete user experience:

- **Authentication** (`auth.test.js`)
  - User registration and login
  - Admin authentication and panel
  - Session persistence and logout
  - Form validation

- **Lobby Functionality** (`lobby.test.js`)
  - Game creation and joining
  - Available games list
  - Join vs Rejoin button logic
  - Lobby chat with history
  - Connection status handling

- **Game Flow** (`game-flow.test.js`)
  - Complete 2-4 player games
  - Game state synchronization
  - In-game chat functionality
  - Player reconnection
  - Cheat code activation

### Backend Tests (Node.js + WebSocket)
Server-side logic and API validation:

- **WebSocket Events** (`websocket.test.js`)
  - User authentication
  - Game creation and joining
  - Chat message handling
  - Turn validation
  - Connection management

### Performance Tests
Load testing and stress scenarios:

- Multiple concurrent games
- Rapid message sending
- Connection stress testing
- Memory usage validation

## 🎮 Enhanced Cheat System

### Testing Cheat Codes
Special keyboard sequences for rapid testing and debugging:

| Code | Effect | Usage |
|------|--------|-------|
| `iddqd` | Enable cheat mode | Basic testing features |
| `cardy` | Card spy mode | See all players' hands |
| `speedx` | Speed mode | Fast animations |
| `winme` | Auto-win test | End game quickly |
| `reset` | Reset all modes | Clear test states |

### Using Cheat Codes
1. Start a game and enter the game table
2. Type the cheat code (no input field needed)
3. Look for confirmation message
4. Use enhanced features for testing

**Example Testing Workflow:**
```
1. Type 'iddqd' → Enable cheat mode
2. Type 'cardy' → See opponent cards
3. Type 'speedx' → Speed up game
4. Play/test game mechanics
5. Type 'winme' → Auto-win for quick completion
6. Type 'reset' → Clean state for next test
```

## 📊 Test Results

Tests generate comprehensive reports:

- **HTML Report**: Visual test results with screenshots
- **JUnit XML**: CI/CD integration format
- **Console Output**: Real-time progress and summary
- **Screenshots/Videos**: Failure analysis artifacts

## 🛠️ Configuration

### Test Environment Variables
```bash
# Enable test mode features
TEST_MODE=true

# Enable cheat codes
ENABLE_CHEATS=true

# Run headless (CI environments)
HEADLESS=true

# Custom server URLs
BACKEND_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3004
```

### Playwright Configuration
Located in `playwright.config.js`:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Timeouts**: Optimized for game operations
- **Screenshots**: On failure only
- **Videos**: Retain on failure
- **Parallel**: Disabled to prevent game conflicts

## 🔧 Extending Tests

### Adding New E2E Tests
```javascript
// tests/e2e/my-feature.test.js
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:3004');
    // Test implementation
  });
});
```

### Adding Backend Tests
```javascript
// tests/backend/my-api.test.js
const { TestUser, GameTester } = require('../utils/test-helpers');

describe('My API Feature', () => {
  test('should handle requests correctly', async () => {
    const user = new TestUser('testuser');
    // Test implementation
  });
});
```

### Adding Cheat Codes
```javascript
// In GameTable.tsx
else if (newSequence === 'mycht') {
  setActionMessage('🆕 My cheat activated!');
  // Cheat implementation
  setKeySequence('');
}
```

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Canastra Game
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd server && npm install
          cd ../client && npm install
          npm install @playwright/test
      
      - name: Start services
        run: |
          cd server && ADMIN_PASSWORD=test_admin_123 npm start &
          cd client && PORT=3004 npm start &
          sleep 30
      
      - name: Run tests
        run: node tests/run-all-tests.js
        env:
          HEADLESS: true
          CI: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: tests/test-results/
```

## 🐛 Troubleshooting

### Common Issues

**Tests fail with connection errors:**
- Ensure both servers are running
- Check ports 3002 (backend) and 3004 (frontend)
- Wait for "Connected to server" messages

**Playwright installation issues:**
```bash
npx playwright install --with-deps
```

**Test timeout errors:**
- Increase timeout in `playwright.config.js`
- Check server performance
- Disable parallel execution

**Flaky test failures:**
- Enable retries in config
- Add explicit waits for game states
- Use cheat codes to speed up tests

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api node tests/run-all-tests.js --e2e

# Run single test file
npx playwright test tests/e2e/auth.test.js --debug

# Show browser during tests
HEADLESS=false node tests/run-all-tests.js --e2e
```

## 📈 Performance Benchmarks

Expected test execution times:
- **Quick Suite**: 2-5 minutes
- **E2E Tests**: 10-15 minutes  
- **Backend Tests**: 3-7 minutes
- **Full Suite**: 15-25 minutes

Performance targets:
- Game creation: < 2 seconds
- User authentication: < 1 second
- Chat message delivery: < 500ms
- Page navigation: < 3 seconds

## 🤝 Contributing

1. **Add tests for new features**: Every new feature should include tests
2. **Update cheat codes**: Add testing shortcuts for complex features
3. **Maintain test data**: Use unique identifiers to avoid conflicts
4. **Document test scenarios**: Include clear descriptions and expected outcomes
5. **Run tests before commits**: Ensure changes don't break existing functionality

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Testing Framework](https://jestjs.io/)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)
- [Game Testing Best Practices](https://gamedev.stackexchange.com/questions/tagged/testing)