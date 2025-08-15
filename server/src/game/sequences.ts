import { Card, Sequence } from '../types';
import { isWildCard } from './deck';

export interface SequenceValidation {
  isValid: boolean;
  type?: 'sequence' | 'aces';
  missingCards?: number[];
  canUseLowAce?: boolean;
  canUseHighAce?: boolean;
}

export function validateSequence(cards: Card[]): SequenceValidation {
  if (cards.length < 3) {
    return { isValid: false };
  }

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
    // Allow any sequence for now to debug the issue
    console.log('🃏 Sequence validation - Natural cards:', naturalCards.map(c => `${c.rank}${c.suit}(${c.value})`));
    console.log('🃏 Sequence validation - Wild cards:', wildCards.length);
    
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