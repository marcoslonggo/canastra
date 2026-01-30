# Known Bugs to Fix

## Bater Mechanism Issues

### 1. After Bater - Turn Should End After Discard
**Issue**: After successfully bater (going out), if player discards a card from their Morto, they should not be able to continue playing. The turn should end immediately after discard.
**Current Behavior**: Player can continue playing after discarding from Morto
**Expected Behavior**: Turn ends automatically after first discard when playing from Morto after bater

### 2. Multiple Morto Taking by Same Team 
**Issue**: A team can take the second Morto even after already having taken the first one.
**Current Behavior**: Team members can take multiple Mortos
**Expected Behavior**: Once a team has taken any Morto, no team member can take additional Mortos (one Morto per team maximum)

### 3. Better Bater Error Messages
**Issue**: When no Morto is available and team lacks Canastra Limpa, error message is generic "no morto available"
**Current Behavior**: Shows "no morto available" 
**Expected Behavior**: Show "You don't have a clean canastra to bater" or similar descriptive message explaining the bater requirement

### 4. Multiple Discards Per Turn
**Issue**: Players can discard multiple cards during their turn, which violates basic card game rules
**Current Behavior**: Player can discard repeatedly without restrictions
**Expected Behavior**: Player should only be able to discard one card per turn (unless special rules apply)

### 5. Player Gets Stuck After Team Already Has Morto
**Issue**: Player can discard their last card even when their team already has a Morto, creating unplayable state
**Current Behavior**: Player reaches 0 cards but cannot bater (team has Morto) and cannot end turn (requires cards)
**Expected Behavior**: Prevent discarding last card if team already has Morto, or allow ending turn with 0 cards in this case

### 6. Bater Without Drawing Requirement  
**Issue**: Players can bater without having drawn a card during their turn
**Current Behavior**: Player can draw, discard to 0 cards, then bater without drawing again
**Expected Behavior**: Player must draw at least one card before being allowed to bater

## Priority
- Issue #1: High (affects game flow after bater) ✅ FIXED
- Issue #2: High (breaks core Morto rules) ✅ FIXED  
- Issue #3: Medium (UX improvement)
- Issue #4: High (breaks basic turn mechanics) ✅ FIXED
- Issue #5: Critical (creates unplayable state)
- Issue #6: High (breaks turn sequence rules)