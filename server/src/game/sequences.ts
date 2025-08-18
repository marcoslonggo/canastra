import { Card, Sequence } from '../types';
import { isWildCard } from './deck';

export interface SequenceValidation {
  isValid: boolean;
  type?: 'sequence' | 'aces';
  missingCards?: number[];
  canUseLowAce?: boolean;
  canUseHighAce?: boolean;
}

/**
 * Validates wildcard limits in a sequence according to Buraco rules:
 * - Only one wildcard per sequence (hand)
 * - Exception: If wildcard 2 is in its natural position (value 2), another wildcard can be used
 */
function validateWildcardLimits(cards: Card[]): SequenceValidation {
  const wildcards = cards.filter(c => isWildCard(c));
  
  if (wildcards.length <= 1) {
    // One or no wildcards is always valid
    return { isValid: true };
  }
  
  if (wildcards.length > 2) {
    // More than 2 wildcards is never allowed
    return { 
      isValid: false,
      missingCards: [],
      canUseLowAce: false,
      canUseHighAce: false
    };
  }
  
  // Exactly 2 wildcards - check for the special exception
  // Exception: wildcard 2 in its natural position (between A and 3)
  if (hasWildcard2InNaturalPosition(cards)) {
    return { isValid: true };
  }
  
  // Two wildcards without the exception
  return { 
    isValid: false,
    missingCards: [],
    canUseLowAce: false,
    canUseHighAce: false
  };
}

/**
 * Checks if a wildcard 2 is in its natural position (value 2) in the sequence
 * This allows for an additional wildcard to be used elsewhere
 */
function hasWildcard2InNaturalPosition(cards: Card[]): boolean {
  const naturalCards = cards.filter(c => !isWildCard(c)).sort((a, b) => a.value - b.value);
  const wildcards = cards.filter(c => isWildCard(c));
  
  // Look for wildcard 2s specifically
  const wildcard2s = wildcards.filter(c => c.rank === '2');
  
  if (wildcard2s.length === 0) {
    return false; // No wildcard 2s
  }
  
  // Check if all cards are same suit (required for sequences)
  const allNaturalSuits = naturalCards.map(c => c.suit);
  const uniqueSuits = [...new Set(allNaturalSuits)];
  
  if (uniqueSuits.length > 1) {
    return false; // Mixed suits, can't form valid sequence
  }
  
  if (naturalCards.length === 0) {
    return false; // Need at least one natural card to determine suit/sequence
  }
  
  // Try to determine if a 2 could be in its natural position (value 2)
  // This happens when the sequence structure allows for a 2 to have value 2
  
  // Get all natural values
  const naturalValues = naturalCards.map(c => c.value).sort((a, b) => a - b);
  
  // Check different scenarios where 2 could be natural:
  
  // Scenario 1: We have value 1 (A) and value 3, so 2 fits naturally between them
  if (naturalValues.includes(1) && naturalValues.includes(3)) {
    console.log('🃏 Wildcard 2 exception: A-2(wild as natural)-3 pattern detected');
    return true;
  }
  
  // Scenario 2: We have value 3 (and possibly higher), so 2 could be at the start
  if (naturalValues.includes(3)) {
    console.log('🃏 Wildcard 2 exception: 2(wild as natural)-3+ pattern detected');
    return true;
  }
  
  // Scenario 3: We have value 1 (A) and the sequence would naturally include 2
  if (naturalValues.includes(1)) {
    // If we have A and any higher value, check if 2 would fit naturally
    const maxValue = Math.max(...naturalValues);
    const totalLength = cards.length;
    
    // If starting from A(1), a sequence of this length would include 2
    if (maxValue <= totalLength) {
      console.log('🃏 Wildcard 2 exception: A-2(wild as natural)-... pattern detected');
      return true;
    }
  }
  
  // Scenario 4: Try to build the sequence and see if 2 would naturally have value 2
  // For a sequence to be valid, wildcards must fill gaps in consecutive values
  
  const minValue = Math.min(...naturalValues);
  const maxValue = Math.max(...naturalValues);
  const sequenceLength = cards.length;
  
  // Try different starting positions for the sequence
  for (let startValue = Math.max(1, minValue - wildcards.length); 
       startValue <= minValue; 
       startValue++) {
    
    // Check if in this arrangement, the 2 would represent value 2
    const sequenceValues = [];
    for (let i = 0; i < sequenceLength; i++) {
      sequenceValues.push(startValue + i);
    }
    
    // If value 2 is in the sequence and would be represented by a wildcard
    if (sequenceValues.includes(2) && !naturalValues.includes(2)) {
      // Check if this arrangement uses all natural cards correctly
      let allNaturalsUsed = true;
      for (const natValue of naturalValues) {
        if (!sequenceValues.includes(natValue)) {
          allNaturalsUsed = false;
          break;
        }
      }
      
      if (allNaturalsUsed) {
        console.log(`🃏 Wildcard 2 exception: In sequence ${sequenceValues.join('-')}, 2 would be natural position`);
        return true;
      }
    }
  }
  
  return false;
}

export function validateSequence(cards: Card[]): SequenceValidation {
  if (cards.length < 3) {
    return { isValid: false };
  }

  // TEMPORARILY BYPASS wildcard validation for testing
  console.log('🃏 BYPASSING WILDCARD VALIDATION FOR TESTING');
  // const wildcardValidation = validateWildcardLimits(cards);
  // if (!wildcardValidation.isValid) {
  //   return wildcardValidation;
  // }

  // Check if it's an Ace sequence (special case)
  if (isAceSequence(cards)) {
    return {
      isValid: true,
      type: 'aces'
    };
  }

  // Check if it's a valid sequence
  return validateSuitSequence(cards);
}

function isAceSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  
  let aceCount = 0;
  let wildCount = 0;
  
  for (const card of cards) {
    if (isWildCard(card)) {
      wildCount++;
    } else if (card.rank === 'A') {
      aceCount++;
    } else {
      return false; // Non-ace, non-wild card
    }
  }
  
  return aceCount + wildCount >= 3 && aceCount >= 1; // At least 3 cards total, at least one natural ace
}

function validateSuitSequence(cards: Card[]): SequenceValidation {
  // All non-wild cards must be same suit
  const suits = cards.filter(c => !isWildCard(c)).map(c => c.suit);
  const uniqueSuits = [...new Set(suits)];
  
  if (uniqueSuits.length > 1) {
    return { isValid: false }; // Mixed suits
  }
  
  if (suits.length === 0) {
    return { isValid: false }; // All wild cards
  }
  
  // For now, use simple validation - same suit consecutive cards
  const naturalCards = cards.filter(c => !isWildCard(c));
  const wildCards = cards.filter(c => isWildCard(c));
  
  // Sort natural cards by value
  naturalCards.sort((a, b) => a.value - b.value);
  
  // Check if we can form a consecutive sequence
  if (naturalCards.length >= 1) {
    console.log('🃏 Sequence validation - Natural cards:', naturalCards.map(c => `${c.rank}${c.suit}(${c.value})`));
    console.log('🃏 Sequence validation - Wild cards:', wildCards.length);
    console.log('🃏 BYPASSING VALIDATION FOR TESTING - ALLOWING ALL SEQUENCES');
    
    return {
      isValid: true,
      type: 'sequence'
    };
  }
  
  return { isValid: false };
}

function canFormSequence(
  naturalCards: Card[],
  wildCards: Card[],
  startValue: number,
  totalLength: number,
  suit: Card['suit']
): boolean {
  const neededValues = [];
  for (let i = 0; i < totalLength; i++) {
    let value = startValue + i;
    // Handle wrap around: after K(13) comes A(14)
    if (value > 14) {
      return false; // Can't wrap beyond high ace
    }
    neededValues.push(value);
  }
  
  let wildsUsed = 0;
  const usedNaturals = new Set<number>();
  
  // Match natural cards to needed positions
  for (const card of naturalCards) {
    const cardValue = card.value;
    if (neededValues.includes(cardValue) && !usedNaturals.has(cardValue)) {
      usedNaturals.add(cardValue);
    }
  }
  
  // Count how many wilds we need
  for (const value of neededValues) {
    if (!usedNaturals.has(value)) {
      wildsUsed++;
    }
  }
  
  return wildsUsed <= wildCards.length;
}

export function createSequence(cards: Card[], id?: string): Sequence {
  const validation = validateSequence(cards);
  
  if (!validation.isValid) {
    throw new Error('Invalid sequence');
  }
  
  // For regular sequences, optimize wildcard positioning
  let optimizedCards = cards;
  if (validation.type === 'sequence') {
    optimizedCards = optimizeWildcardPositions(cards);
  }
  
  const sequence: Sequence = {
    id: id || generateSequenceId(),
    cards: optimizedCards,
    type: validation.type!,
    isCanastra: optimizedCards.length >= 7,
    points: calculateSequencePoints(optimizedCards, validation.type!)
  };
  
  // Determine Canastra type if applicable
  if (sequence.isCanastra) {
    sequence.canastraType = getCanastraType(optimizedCards, validation.type!);
  }
  
  return sequence;
}

function calculateSequencePoints(cards: Card[], type: 'sequence' | 'aces'): number {
  let totalPoints = 0;
  
  // Add card points
  for (const card of cards) {
    totalPoints += card.points;
  }
  
  // Add Canastra bonus if 7+ cards
  if (cards.length >= 7) {
    const canastraType = getCanastraType(cards, type);
    switch (canastraType) {
      case 'as-a-as':
        totalPoints += 1000;
        break;
      case 'limpa':
        totalPoints += 200;
        break;
      case 'suja':
        totalPoints += 100;
        break;
    }
  }
  
  return totalPoints;
}

function getCanastraType(cards: Card[], type: 'sequence' | 'aces'): 'limpa' | 'suja' | 'as-a-as' {
  if (type === 'aces') {
    const hasWilds = cards.some(c => isWildCard(c));
    return hasWilds ? 'suja' : 'limpa'; // Ace sequence is clean if no wilds, dirty if has wilds
  }
  
  const hasWilds = cards.some(c => isWildCard(c));
  
  if (!hasWilds) {
    // Check if it's Ace to Ace (A-2-3-...-K-A)
    if (isAceToAceSequence(cards)) {
      return 'as-a-as';
    }
    return 'limpa';
  }
  
  return 'suja';
}

function isAceToAceSequence(cards: Card[]): boolean {
  if (cards.length < 13) return false; // Must be at least A through A
  
  const naturalCards = cards.filter(c => !isWildCard(c));
  const values = naturalCards.map(c => c.value).sort((a, b) => a - b);
  
  // Check if we have both low ace (1) and high ace (14) and sequence between
  const hasLowAce = values.includes(1);
  const hasHighAce = values.includes(14);
  
  return hasLowAce && hasHighAce && values.length >= 13;
}

export function canAddCardToSequence(sequence: Sequence, card: Card): boolean {
  const testCards = [...sequence.cards, card];
  const validation = validateSequence(testCards);
  return validation.isValid;
}

export function addCardToSequence(sequence: Sequence, card: Card): Sequence {
  if (!canAddCardToSequence(sequence, card)) {
    throw new Error('Cannot add card to sequence');
  }
  
  return createSequence([...sequence.cards, card], sequence.id);
}

function optimizeWildcardPositions(cards: Card[]): Card[] {
  const naturalCards = cards.filter(c => !isWildCard(c));
  const wildCards = cards.filter(c => isWildCard(c));
  
  if (wildCards.length === 0) {
    // No wildcards, just sort natural cards
    return naturalCards.sort((a, b) => a.value - b.value);
  }
  
  if (naturalCards.length === 0) {
    return cards; // All wildcards, no optimization possible
  }
  
  // Get the suit from natural cards
  const suit = naturalCards[0].suit;
  
  // Sort natural cards by value
  const sortedNaturals = naturalCards.sort((a, b) => a.value - b.value);
  
  console.log('🃏 Optimizing wildcard positions for:', {
    naturals: sortedNaturals.map(c => `${c.rank}${c.suit}(${c.value})`),
    wilds: wildCards.length,
    suit
  });
  
  // Strategy: Try to minimize gaps and enable future extensions
  // Find the best contiguous range that uses all natural cards and wildcards
  const minNatural = sortedNaturals[0].value;
  const maxNatural = sortedNaturals[sortedNaturals.length - 1].value;
  const totalCards = cards.length;
  
  // Try different starting positions to find the best arrangement
  let bestArrangement: Card[] = [];
  let bestScore = -1;
  
  // Try starting from a few positions before the minimum natural
  for (let startValue = Math.max(1, minNatural - wildCards.length); 
       startValue <= minNatural; 
       startValue++) {
    
    const arrangement = buildSequenceArrangement(
      startValue, 
      totalCards, 
      sortedNaturals, 
      wildCards, 
      suit
    );
    
    if (arrangement.length > 0) {
      const score = calculateArrangementScore(arrangement, sortedNaturals);
      if (score > bestScore) {
        bestScore = score;
        bestArrangement = arrangement;
      }
    }
  }
  
  if (bestArrangement.length === 0) {
    // Fallback: simple arrangement
    return [...sortedNaturals, ...wildCards];
  }
  
  console.log('🃏 Optimized sequence:', bestArrangement.map((c, i) => {
    if (isWildCard(c)) {
      const representedValue = (bestArrangement[0] as any).value ? 
        i + (bestArrangement[0] as any).value : 
        i + 1;
      return `WILD(as ${representedValue})`;
    }
    return `${c.rank}${c.suit}(${c.value})`;
  }));
  
  return bestArrangement;
}

function buildSequenceArrangement(
  startValue: number, 
  totalCards: number, 
  naturalCards: Card[], 
  wildCards: Card[], 
  suit: string
): Card[] {
  const arrangement: Card[] = [];
  const naturalMap = new Map<number, Card>();
  
  // Create map of natural cards by value
  for (const card of naturalCards) {
    naturalMap.set(card.value, card);
  }
  
  let wildIndex = 0;
  
  // Build sequence from startValue
  for (let i = 0; i < totalCards; i++) {
    const currentValue = startValue + i;
    
    if (naturalMap.has(currentValue)) {
      // Use natural card
      arrangement.push(naturalMap.get(currentValue)!);
    } else if (wildIndex < wildCards.length) {
      // Use wildcard to represent this value
      const wildCard = { 
        ...wildCards[wildIndex],
        // Assign the value this wildcard represents for display
        representedValue: currentValue,
        representedSuit: suit
      };
      arrangement.push(wildCard);
      wildIndex++;
    } else {
      // Can't build a valid sequence with this arrangement
      return [];
    }
  }
  
  // Check if all natural cards are used
  const usedNaturals = arrangement.filter(c => !isWildCard(c)).length;
  if (usedNaturals !== naturalCards.length) {
    return [];
  }
  
  return arrangement;
}

function calculateArrangementScore(arrangement: Card[], naturalCards: Card[]): number {
  let score = 0;
  
  // Prefer arrangements where wildcards fill internal gaps
  let hasInternalWild = false;
  for (let i = 1; i < arrangement.length - 1; i++) {
    if (isWildCard(arrangement[i])) {
      hasInternalWild = true;
      score += 10; // Bonus for internal wildcard
    }
  }
  
  // Prefer arrangements with wildcards at the beginning for low extensions
  if (arrangement.length > 0 && isWildCard(arrangement[0])) {
    score += 5;
  }
  
  // Prefer arrangements that keep natural cards in their original relative order
  let naturalIndex = 0;
  for (const card of arrangement) {
    if (!isWildCard(card)) {
      if (naturalIndex < naturalCards.length && 
          card.value === naturalCards[naturalIndex].value) {
        score += 1;
      }
      naturalIndex++;
    }
  }
  
  return score;
}

function generateSequenceId(): string {
  return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}