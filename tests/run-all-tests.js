#!/usr/bin/env node

/**
 * Master Test Runner for Canastra Game
 * Runs all test suites and provides comprehensive testing
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      e2e: null,
      backend: null,
      performance: null
    };
    this.startTime = Date.now();
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Running: ${command} ${args.join(' ')}`);
      
      const process = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${command} completed successfully`);
          resolve(code);
        } else {
          console.log(`❌ ${command} failed with code ${code}`);
          reject(new Error(`Command failed: ${command}`));
        }
      });

      process.on('error', (error) => {
        console.error(`💥 Error running ${command}:`, error);
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if servers are running
    try {
      const response = await fetch('http://localhost:3002/api/health');
      console.log('✅ Backend server is running');
    } catch (error) {
      console.log('❌ Backend server not running. Please start with: ADMIN_PASSWORD=test_admin_123 npm start');
      process.exit(1);
    }

    try {
      const response = await fetch('http://localhost:3004');
      console.log('✅ Frontend server is running');
    } catch (error) {
      console.log('❌ Frontend server not running. Please start with: PORT=3004 npm start');
      process.exit(1);
    }

    // Check if Playwright is installed
    if (!fs.existsSync(path.join(__dirname, '../node_modules/@playwright/test'))) {
      console.log('📦 Installing Playwright...');
      await this.runCommand('npm', ['install', '@playwright/test']);
      await this.runCommand('npx', ['playwright', 'install']);
    }

    console.log('✅ Prerequisites check completed');
  }

  async runE2ETests() {
    console.log('\n🎭 Running E2E Tests (Playwright)...');
    try {
      await this.runCommand('npx', ['playwright', 'test', 'tests/e2e/'], {
        cwd: path.join(__dirname, '..')
      });
      this.results.e2e = 'PASSED';
    } catch (error) {
      this.results.e2e = 'FAILED';
      console.error('E2E tests failed:', error.message);
    }
  }

  async runBackendTests() {
    console.log('\n🔧 Running Backend Tests (Jest/Node.js)...');
    try {
      // Check if Jest is available, if not use Node.js directly
      const hasJest = fs.existsSync(path.join(__dirname, '../node_modules/jest'));
      
      if (hasJest) {
        await this.runCommand('npx', ['jest', 'tests/backend/'], {
          cwd: path.join(__dirname, '..')
        });
      } else {
        // Run tests directly with Node.js
        const testFiles = fs.readdirSync(path.join(__dirname, 'backend'))
          .filter(file => file.endsWith('.test.js'));
        
        for (const testFile of testFiles) {
          await this.runCommand('node', [path.join(__dirname, 'backend', testFile)]);
        }
      }
      
      this.results.backend = 'PASSED';
    } catch (error) {
      this.results.backend = 'FAILED';
      console.error('Backend tests failed:', error.message);
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    try {
      // Run existing performance test files
      const perfFiles = [
        '../test-final-flow.js',
        '../test-game-flow.js'
      ];
      
      for (const file of perfFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
          await this.runCommand('node', [path.join(__dirname, file)]);
        }
      }
      
      this.results.performance = 'PASSED';
    } catch (error) {
      this.results.performance = 'FAILED';
      console.error('Performance tests failed:', error.message);
    }
  }

  async runQuickTest() {
    console.log('\n⚡ Running Quick Test Suite...');
    
    // Run a subset of critical tests for rapid feedback
    try {
      await this.runCommand('npx', ['playwright', 'test', 'tests/e2e/auth.test.js'], {
        cwd: path.join(__dirname, '..')
      });
      
      // Run one backend test
      await this.runCommand('node', [path.join(__dirname, '../test-final-flow.js')]);
      
      console.log('✅ Quick test suite completed');
    } catch (error) {
      console.error('❌ Quick test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runTestWithCheatCodes() {
    console.log('\n🎮 Running Tests with Cheat Codes...');
    
    // Set environment variable to enable test mode
    process.env.TEST_MODE = 'true';
    process.env.ENABLE_CHEATS = 'true';
    
    try {
      await this.runCommand('npx', ['playwright', 'test', 'tests/e2e/game-flow.test.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, TEST_MODE: 'true' }
      });
      
      console.log('✅ Cheat code tests completed');
    } catch (error) {
      console.error('❌ Cheat code tests failed:', error.message);
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`⏱️  Total Duration: ${minutes}m ${seconds}s`);
    console.log(`🎭 E2E Tests: ${this.results.e2e || 'SKIPPED'}`);
    console.log(`🔧 Backend Tests: ${this.results.backend || 'SKIPPED'}`);
    console.log(`⚡ Performance Tests: ${this.results.performance || 'SKIPPED'}`);
    
    const passed = Object.values(this.results).filter(r => r === 'PASSED').length;
    const failed = Object.values(this.results).filter(r => r === 'FAILED').length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Game is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
  }

  async runAll() {
    console.log('🏁 Starting Comprehensive Test Suite for Canastra Game');
    console.log('=====================================================');
    
    await this.checkPrerequisites();
    
    await this.runE2ETests();
    await this.runBackendTests();
    await this.runPerformanceTests();
    
    this.generateReport();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Canastra Game Test Runner

Usage:
  npm test                    # Run all tests
  npm run test:quick          # Run quick test suite
  npm run test:e2e            # Run only E2E tests
  npm run test:backend        # Run only backend tests
  npm run test:perf           # Run only performance tests
  npm run test:cheats         # Run cheat code tests

Options:
  --help, -h                  # Show this help
  --quick                     # Run quick test suite
  --e2e                       # Run only E2E tests
  --backend                   # Run only backend tests
  --performance               # Run only performance tests
  --cheats                    # Run cheat code tests

Examples:
  node tests/run-all-tests.js --quick
  node tests/run-all-tests.js --e2e
  node tests/run-all-tests.js --cheats
`);
    return;
  }
  
  try {
    if (args.includes('--quick')) {
      await runner.runQuickTest();
    } else if (args.includes('--e2e')) {
      await runner.checkPrerequisites();
      await runner.runE2ETests();
    } else if (args.includes('--backend')) {
      await runner.checkPrerequisites();
      await runner.runBackendTests();
    } else if (args.includes('--performance')) {
      await runner.checkPrerequisites();
      await runner.runPerformanceTests();
    } else if (args.includes('--cheats')) {
      await runner.checkPrerequisites();
      await runner.runTestWithCheatCodes();
    } else {
      await runner.runAll();
    }
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;