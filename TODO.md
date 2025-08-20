# 🃏 Buraco/Canastra Implementation TODO

## **Phase 1: Core Rule Engine Foundation** ✅ COMPLETED

### ✅ COMPLETED
- [x] Update `hasWildcard2InNaturalPosition()` function to check same-suit vs different-suit 2s
- [x] Add Joker requirement for wildcard 2 exception
- [x] Add proper logging for debugging
- [x] **Fix Three Aces validation - require 2+ natural Aces**
  - Updated `isAceSequence()` function in sequences.ts
  - Changed from minimum 1 to minimum 2 natural Aces

### ⏳ PENDING FOR LATER
- [ ] **Update Canastra type detection (Limpa vs Suja)**
  - Different-suit wildcards should always make sequence Suja
  - Same-suit wildcards can potentially be Limpa
  - *Note: Will implement this in Phase 5 with Suja→Limpa transformation*
- [ ] **Test wildcard validation with manual scenarios**
  - *Note: Will create comprehensive tests in Phase 3*

---

## **Phase 2: Deadlock Prevention** ✅ COMPLETED

### ✅ COMPLETED
- [x] **Add pre-action deadlock detection**
  - Added `wouldCauseDeadlock()` and `canTeamBater()` functions
  - Checks: Team has Morto available OR Team has Canastra Limpa
- [x] **Create warning message system**
  - Added `getDeadlockExplanation()` for clear educational feedback
  - Explains specific reason why team cannot bater
- [x] **Update `handleBaixar()` to include deadlock check**
  - Integrated deadlock prevention before sequence validation
- [x] **Update `handleAddToSequence()` to include deadlock check**
  - Added same deadlock prevention logic

---

## **Phase 3: Testing Infrastructure** ✅ COMPLETED

### ✅ COMPLETED
- [x] **Add basic cheat codes to existing system**
  - `deadlock` - Create scenario: 1 card, team took Morto, no Limpa
  - `limpa` - Give player cards for instant Canastra Limpa (A♠-2♠-3♠-4♠-5♠-6♠-7♠)
  - `suja` - Give player cards for Canastra Suja (A♠-2♥-3♠-4♠-5♠-6♠-7♠)
  - `transform` - Setup Suja ready for transformation (3♠-4♠-5♠-2♠-7♠-8♠-9♠ + natural 6♠)
  - `aces3` - Give player 3+ natural Aces (A♠-A♥-A♣-Joker)
  - `pique` - Reduce current player to 1 card
  - `discard5` - Put 5 specific test cards in discard pile
  - `morto0` - Set team to have taken no Morto
  - `morto1` - Set team to have taken Morto 1
  - `1500pts` - Set team score to 1500+ points for testing baixar restrictions
- [x] **Backend cheat system implementation**
  - Added `executeCheatCode()` method to BuracoGame class
  - Implemented 10 testing cheat functions
  - Added cheat detection in chat system
- [x] **Frontend cheat integration**
  - Extended existing keyboard cheat system
  - Added new cheat codes to GameTable.tsx
  - Integrated with chat message system

---

## **Phase 4: Discard Pile Logic** 🃏

### ⏳ PENDING
- [ ] **Update `drawFromDiscardPile()` for multiple draws**
  - Track cards drawn vs cards remaining in turnState
  - Allow multiple draw actions per turn
  - Validate "exactly 1 card remaining" at turn end
- [ ] **Add turn-end validation**
  - Check discard pile state before allowing `handleEndTurn()`
  - Block turn end if drew from discard and wrong number of cards remain
- [ ] **Update UI to show discard pile state**
  - Card count indicator
  - Warning when approaching turn end with invalid state

---

## **Phase 5: Suja→Limpa Transformation** ✨

### ⏳ PENDING
- [ ] **Add transformation detection in `createSequence()`**
  - When adding natural card, check if it fills wildcard gap
  - Move displaced wildcard to end of sequence
  - Recalculate sequence type (Suja → Limpa)
- [ ] **Add +100 bonus points for transformation**
- [ ] **Add visual feedback**
  - Toast notification: "Sequence upgraded to Limpa!"
  - Update sequence display immediately
- [ ] **Update `addCardToSequence()` to trigger transformation check**

---

## **Phase 6: Multi-Round Scoring** 🏆

### ⏳ PENDING
- [ ] **Add round tracking to GameState**
  ```typescript
  roundHistory: RoundState[];
  currentRound: number;
  cumulativeScores: [number, number];
  ```
- [ ] **Implement hand card swapping logic**
  - Calculate remaining cards per team when someone bates
  - Swap points between teams
  - Add to cumulative scores
- [ ] **Add 1500+ rule enforcement**
  - Flag when team crosses 1500 points
  - Require 75+ card points for first baixar of new round
  - Reset flag after successful baixar
- [ ] **Create new round reset logic**
  - Fresh deck shuffle and deal
  - Reset Mortos
  - Maintain cumulative scores
- [ ] **Check for 3000+ victory condition**
  - Only after someone bates
  - Check cumulative scores, not single round

---

## **Phase 7: UI Improvements** 💎

### ⏳ PENDING
- [ ] **Create Morto selection modal**
  - Show available Mortos when player bates
  - Allow choice between Morto 1 and Morto 2
  - Continue play after selection
- [ ] **Add score display panel**
  - Current round scores
  - Cumulative scores
  - 1500+ rule indicator
- [ ] **Improve mobile touch targets**
  - Ensure all buttons are 44px+ minimum
  - Add haptic feedback for important actions
- [ ] **Add sequence transformation animations**
  - Highlight when Suja becomes Limpa
  - Show point bonus clearly

---

## **Current Status** 📊

### ✅ **WORKING**
- Basic game mechanics
- Card display optimizations
- WebSocket multiplayer
- Existing cheat system (`iddqd`, `cardy`, etc.)

### 🔧 **IN PROGRESS**
- None - ready for Phase 4 (Discard Pile Logic)

### 🐛 **KNOWN ISSUES**
- Sequence validation temporarily bypassed (will be addressed in Phase 5)
- Single-round scoring only (will be addressed in Phase 6)

### ✅ **FIXED ISSUES**
- Different-suit wildcards validation (Phase 1)
- Three Aces rule now requires 2+ natural Aces (Phase 1)
- Deadlock prevention implemented (Phase 2)
- Clear warning messages for blocked actions (Phase 2)

### 🎯 **NEXT UP**
1. Update discard pile logic for multiple draws (Phase 4)
2. Implement Suja→Limpa transformation (Phase 5)
3. Add multi-round scoring system (Phase 6)

---

## **Testing Scenarios** 🧪

### **Wildcard Testing**
- [ ] A♠-2♠-3♠-4♠-Joker (same-suit 2 + Joker = allowed)
- [ ] A♠-2♥-3♠-4♠-Joker (different-suit 2 + Joker = not allowed)
- [ ] A♠-2♠-3♠-4♠-5♠-6♠-7♠ (same-suit natural 2 = Limpa)
- [ ] A♠-2♥-3♠-4♠-5♠-6♠-7♠ (different-suit 2 = Suja)

### **Three Aces Testing**
- [ ] A♠-A♥-Joker (2 natural + 1 wild = valid)
- [ ] A♠-2♥-Joker (1 natural + 2 wild = invalid)
- [ ] A♠-A♥-A♣-2♠ (3 natural + 1 wild = valid)

### **Deadlock Testing**
- [ ] Player with 1 card, team took Morto, no Limpa
- [ ] Player trying to baixar all cards without bater requirements

### **Multi-Round Testing**
- [ ] Team reaches 1500, check 75+ requirement next round
- [ ] Someone bates with 3000+, check victory
- [ ] Hand card swapping calculation

---

*Last Updated: Current session*