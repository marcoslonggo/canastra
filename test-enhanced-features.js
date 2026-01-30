const { chromium } = require('playwright');

async function testEnhancedFeatures() {
  console.log('🎮 Testing Enhanced Features: Discard Pile Viewer & Auto Team Assignment');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  try {
    // Test 1: Auto Team Assignment
    console.log('\n📋 TEST 1: Auto Team Assignment');
    
    // Player 1 login and create game
    console.log('👤 Player 1 (Michele) - should be assigned to Team 1');
    await page1.goto('http://localhost:3004');
    await page1.fill('input[placeholder="Username"]', 'michele');
    await page1.fill('input[placeholder="Password"]', 'test');
    await page1.click('button:has-text("Login")');
    await page1.waitForTimeout(1000);
    
    await page1.click('button:has-text("Create Game")');
    await page1.waitForTimeout(1000);
    
    // Get game code
    const gameCode = await page1.textContent('.game-code');
    const code = gameCode.match(/[A-Z0-9]{6}/)[0];
    console.log('📝 Game code:', code);
    
    // Player 2 login and join
    console.log('👤 Player 2 (Marcos) - should be assigned to Team 2');
    await page2.goto('http://localhost:3004');
    await page2.fill('input[placeholder="Username"]', 'marcos');
    await page2.fill('input[placeholder="Password"]', 'test');
    await page2.click('button:has-text("Login")');
    await page2.waitForTimeout(1000);
    
    await page2.fill('input[placeholder*="game code"]', code);
    await page2.click('button:has-text("Join Game")');
    await page2.waitForTimeout(2000);
    
    // Check team assignments
    const team1Players = await page1.$$eval('.team-1 .player-info', els => els.length);
    const team2Players = await page1.$$eval('.team-2 .player-info', els => els.length);
    
    console.log(`✅ Team 1 players: ${team1Players}, Team 2 players: ${team2Players}`);
    if (team1Players === 1 && team2Players === 1) {
      console.log('✅ AUTO TEAM ASSIGNMENT: PASSED');
    } else {
      console.log('❌ AUTO TEAM ASSIGNMENT: FAILED');
    }
    
    // Start game
    await page1.click('button:has-text("Start Game")');
    await page1.waitForTimeout(2000);
    
    // Test 2: IDDQD Cheat Code
    console.log('\n📋 TEST 2: IDDQD Super Cheat Code');
    
    console.log('⌨️ Typing "iddqd" to enable god mode...');
    await page1.keyboard.type('iddqd');
    await page1.waitForTimeout(2000);
    
    // Check if cheat menu appeared
    const cheatButton = await page1.$('button:has-text("🎮")');
    if (cheatButton) {
      console.log('✅ IDDQD CHEAT CODE: PASSED - Cheat menu visible');
    } else {
      console.log('❌ IDDQD CHEAT CODE: FAILED - No cheat menu');
    }
    
    // Test 3: Enhanced Discard Pile Viewer
    console.log('\n📋 TEST 3: Enhanced Discard Pile Viewer');
    
    // Build up discard pile
    console.log('🃏 Building discard pile with multiple cards...');
    for (let i = 0; i < 5; i++) {
      const cards = await page1.$$('.hand-card');
      if (cards.length > 0) {
        await cards[0].click();
        await page1.waitForTimeout(300);
        const discardBtn = await page1.$('button:has-text("Discard")');
        if (discardBtn) {
          await discardBtn.click();
          await page1.waitForTimeout(300);
        }
      }
    }
    
    console.log('⏱️ Ending turn...');
    await page1.click('button:has-text("End Turn")');
    await page1.waitForTimeout(1000);
    
    // Test discard pile viewer
    console.log('📋 Testing discard pile viewer...');
    await page2.click('.discard-pile-container');
    await page2.waitForTimeout(1000);
    
    // Check if modal opened
    const modal = await page2.$('.discard-pile-panel');
    if (modal) {
      console.log('✅ DISCARD PILE VIEWER: Modal opened successfully');
      
      // Check for sorted cards
      const cards = await page2.$$('.discard-card-item');
      console.log(`📊 Found ${cards.length} cards in viewer`);
      
      if (cards.length >= 3) {
        // Test card selection
        console.log('🎯 Testing card selection...');
        await cards[0].click();
        await page2.waitForTimeout(500);
        await cards[1].click();
        await page2.waitForTimeout(500);
        
        const selectedCards = await page2.$$('.discard-card-item.selected');
        console.log(`✅ Selected ${selectedCards.length} cards`);
        
        // Test selective drawing
        const drawButton = await page2.$('.discard-action-button.primary');
        if (drawButton) {
          console.log('🎲 Testing selective draw...');
          await drawButton.click();
          await page2.waitForTimeout(2000);
          
          console.log('✅ ENHANCED DISCARD PILE VIEWER: PASSED');
        }
      }
    } else {
      console.log('❌ DISCARD PILE VIEWER: FAILED - Modal did not open');
    }
    
    console.log('\n🏁 All tests completed!');
    console.log('💡 Browser windows will stay open for manual inspection.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  // Keep browser open for inspection
  console.log('🔍 Press Ctrl+C to close browser and exit');
}

// Run the test
testEnhancedFeatures().catch(console.error);