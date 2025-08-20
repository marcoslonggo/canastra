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

## Priority
- Issue #1: High (affects game flow after bater)
- Issue #2: High (breaks core Morto rules)  
- Issue #3: Medium (UX improvement)