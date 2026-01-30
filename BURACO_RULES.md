# 🃏 Complete Buraco/Canastra Rules Documentation

## 🎯 Core Game Setup

### Deck Composition
- **2 standard decks** (104 cards) + **4 Jokers** = **108 cards total**
- **Card Values**: A=1(low) or A=14(high), 2-K normal values, Joker=any value
- **Wild Cards**: All 2s and all 4 Jokers

### Players & Teams
- **2-4 players** in **2 teams**
- **Team Assignment**:
  - 1st player → Team 1
  - 2nd player → Team 2
  - 3rd+ players → Team 1 (can switch teams)

### Initial Deal
- **11 cards per player**
- **2 Mortos**: 11 cards each (one available per team)
- **Main deck**: Remaining cards after dealing

## 🎲 Card Values & Points

| Card | Points | Notes |
|------|--------|-------|
| 3-7 | 5 each | Regular cards |
| 8-K | 10 each | Face cards and high numbers |
| Aces | 15 each | Can be low (1) or high (14) in sequences |
| 2s | 10 each | **Wild cards** |
| Jokers | 20 each | **Wild cards** |

## 🔄 Turn Structure

### 1. Draw Phase (Mandatory)
Player must draw from **either**:

#### Option A: Main Deck
- Take 1 card from top of main deck
- **CAN discard that same card immediately** if desired
- No restrictions on discard

#### Option B: Discard Pile
- **KEY RULE**: By end of turn, exactly 1 card must remain in discard pile
- Can draw multiple times during turn
- Two scenarios:

**B1 - Take ALL cards:**
- Take every card from discard pile
- Must end turn by putting exactly 1 card back:
  - Either return one of the cards you took, OR
  - Discard a different card from your hand

**B2 - Take SOME cards:**
- Initially take any number, leave any number
- During turn: can play sequences, add cards, etc.
- Before ending turn: must take more cards until exactly 1 remains
- No additional discard needed

### 2. Optional Play Phase
- Can "baixar" (play) new sequences
- Can add cards to existing team sequences
- Turn does NOT auto-end after any action

### 3. End Turn
- Player manually clicks "End Turn" button
- System validates discard pile has exactly 1 card (if drew from discard)

## 🎴 Sequence Types & Validation

### Regular Sequences
- **Minimum 3 cards** of same suit in consecutive order
- **Examples**: A♠-2♠-3♠ or J♥-Q♥-K♥-A♥

### Wildcard Rules

#### Standard Rule
- **Max 1 wildcard per sequence** (2s or Jokers)

#### Special Exception: Natural 2 in Same Suit
- **IF** wildcard 2 is same suit AND in natural position (value 2)
- **THEN** can ALSO use 1 **Joker** wildcard in same sequence
- **Example**: A♠-2♠-3♠-Joker(as 4♠)-5♠ ✅

#### Different Suit 2s
- **IF** wildcard 2 is different suit (e.g., 2♥ in spades sequence)
- **THEN** standard 1-wildcard limit applies
- **Sequence is always "suja" (dirty)**
- **Example**: A♠-2♥(as 2♠)-3♠-Joker ❌ (two wildcards not allowed)

### Three Aces Sequence
- **Minimum 2 natural Ace cards** (not wildcards)
- Can have more Aces and wildcards
- **Example**: A♠-A♥-Joker ✅ (2 natural + 1 wild)
- **Example**: A♠-2♣(as A♥)-Joker ❌ (only 1 natural Ace)

## 🏆 Canastra System (7+ Card Sequences)

### Types & Points
- **Canastra Limpa** (Clean): No wildcards = **+200 points**
- **Canastra Suja** (Dirty): With wildcards = **+100 points**
- **Canastra Ás-à-Ás**: A-2-3...K-A sequence = **+1000 points**

### Dynamic Transformation (Suja → Limpa)
**A dirty canastra can become clean by filling gaps with natural cards!**

**Example**:
- Start: 3♠-4♠-5♠-2♠(as 6♠)-7♠-8♠-9♠ = Canastra Suja (+100)
- Add natural 6♠
- Result: 2♠-3♠-4♠-5♠-6♠-7♠-8♠-9♠ = Canastra Limpa (+200)
- **Bonus**: +100 points for the transformation

## ⚡ Special Game States

### Pique (1 Card Remaining)
- Player has only 1 card left
- Must announce "Pique"
- **Cannot draw from discard pile**
- **Can still add cards to existing sequences**

### Bater (Going Out)
Player empties their hand and must take available Morto.

#### Bater Conditions
**Scenario A - Team hasn't taken Morto:**
- Can bater freely, no requirements
- Take available Morto and continue playing

**Scenario B - Team already took Morto OR no Mortos available:**
- Can ONLY bater if team has **Canastra Limpa**

#### Deadlock Prevention
- **Block any action** that would empty player's hand if:
  - Team already took Morto (or none available) AND
  - Team has no Canastra Limpa
- **Show warning**: "Cannot perform this action - would cause deadlock. Team needs Canastra Limpa to bater."
- Applies to: creating sequences, adding to sequences, all baixar actions

### Morto Selection
- **Immediate popup** when hand becomes empty
- Player **chooses which Morto** to take (if multiple available)
- After taking Morto: continue playing until manual turn end
- Must discard to end turn (unless bater again)

## 🎯 Scoring System

### Multi-Round Game Structure
- **Game continues until** someone bates with team having **3000+ points**
- After each bater: count points and check for victory
- If no team has 3000+: start new round with fresh cards

### End-of-Round Scoring

#### Step 1: Each Team's Points
1. **Sequence Bonuses**: Canastra bonuses, Three Aces bonuses
2. **Card Points in Sequences**: Sum all played cards using point values

#### Step 2: Hand Card Penalty/Bonus
- **Remaining hand cards are "gifted" to opponent team**
- **Example**: Team 1 has 3 cards left, Team 2 has 7 cards left
  - Team 1 gets +7 cards worth of points (from Team 2's hands)
  - Team 2 gets +3 cards worth of points (from Team 1's hands)

#### Step 3: 1500+ Rule
- **After team reaches 1500+ points in ANY previous round**
- **Next round**: First baixar must be worth **75+ card points minimum**
- **Applies only to**: First baixar of new round, not subsequent plays
- **Resets**: If team doesn't reach 3000, rule applies again next round

## 🔧 Advanced Mechanics

### Sequence Building
- **Add cards anywhere**: Beginning, middle, or end of sequences
- **Natural card insertion**: When natural card fills gap, wildcard moves to end
- **Dynamic recalculation**: Points and Canastra status update immediately

### Multiple Discard Pile Draws
- **Allowed multiple times** per turn (though tactically questionable)
- Must maintain "exactly 1 card remains" rule by turn end

### Enhanced Discard Pile System
- **Selective Drawing**: Choose specific cards to leave in pile
- **Auto-sorting**: Cards sorted by suit and value for easy viewing
- **Modal Interface**: Zoom animation from discard pile location

## 🎮 Example Game Flow

### Setup Phase
1. Deal 11 cards per player, create 2 Mortos
2. Team assignment and player positioning

### Round 1
- Players draw, play sequences, add to sequences
- Someone bates with team having Canastra Limpa
- **Scoring**: Team 1: 1520 points, Team 2: 800 points
- **No winner**: Start Round 2

### Round 2 
- **1500+ Rule**: Team 1 must baixar first time with 75+ card points
- Continue play until another bater
- **Scoring**: Team 1: 3200 points, Team 2: 1900 points
- **Victory**: Team 1 wins with 3000+ points after bater!

## 🚨 Critical Rules Summary

1. **Discard Pile**: Must end with exactly 1 card when drawing from it
2. **Wildcards**: Same-suit 2s get Joker exception, different-suit don't
3. **Three Aces**: Minimum 2 natural Aces required
4. **Deadlock Prevention**: Block actions that would cause unbateable empty hand
5. **Scoring**: Hand cards become opponent's bonus points
6. **Victory**: 3000+ points AFTER completing a bater
7. **1500+ Rule**: 75+ points for first baixar of new round only

---

*This document represents the complete and authoritative rule set for the Buraco/Canastra implementation.*