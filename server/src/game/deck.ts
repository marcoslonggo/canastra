import { Card } from '../types';

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Array<{ rank: Card['rank']; value: number; points: number }> = [
  { rank: 'A', value: 1, points: 15 },    // Ace low
  { rank: '2', value: 2, points: 10 },    // Wild card
  { rank: '3', value: 3, points: 5 },
  { rank: '4', value: 4, points: 5 },
  { rank: '5', value: 5, points: 5 },
  { rank: '6', value: 6, points: 5 },
  { rank: '7', value: 7, points: 5 },
  { rank: '8', value: 8, points: 10 },
  { rank: '9', value: 9, points: 10 },
  { rank: '10', value: 10, points: 10 },
  { rank: 'J', value: 11, points: 10 },
  { rank: 'Q', value: 12, points: 10 },
  { rank: 'K', value: 13, points: 10 },
  { rank: 'A', value: 14, points: 15 },   // Ace high for sequences
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardIdCounter = 0;

  // Create two standard 52-card decks
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    // Regular cards
    for (const suit of SUITS) {
      for (const rankInfo of RANKS.slice(1, -1)) { // Exclude both Aces for now
        deck.push({
          id: `card_${++cardIdCounter}`,
          suit,
          rank: rankInfo.rank,
          value: rankInfo.value,
          points: rankInfo.points,
          isWild: rankInfo.rank === '2'
        });
      }
      
      // Add single Ace (can be either low or high depending on context)
      deck.push({
        id: `card_${++cardIdCounter}`,
        suit,
        rank: 'A',
        value: 1, // Default to low, will be handled in sequence validation
        points: 15,
        isWild: false
      });
    }
  }

  // Add 4 Jokers
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${++cardIdCounter}`,
      suit: 'joker',
      rank: 'JOKER',
      value: 0, // Can be any value
      points: 20,
      isWild: true
    });
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number): { 
  playerHands: Card[][], 
  remainingDeck: Card[], 
  mortos: [Card[], Card[]] 
} {
  const playerHands: Card[][] = [];
  let deckIndex = 0;

  // Deal 11 cards to each player
  for (let player = 0; player < numPlayers; player++) {
    playerHands.push(deck.slice(deckIndex, deckIndex + 11));
    deckIndex += 11;
  }

  // Deal 11 cards to each Morto
  const morto1 = deck.slice(deckIndex, deckIndex + 11);
  deckIndex += 11;
  const morto2 = deck.slice(deckIndex, deckIndex + 11);
  deckIndex += 11;

  // Remaining cards form the main deck
  const remainingDeck = deck.slice(deckIndex);

  return {
    playerHands,
    remainingDeck,
    mortos: [morto1, morto2]
  };
}

export function getCardDisplayName(card: Card): string {
  if (card.suit === 'joker') {
    return 'Joker';
  }
  
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function getCardPoints(card: Card): number {
  return card.points;
}

export function isWildCard(card: Card): boolean {
  return card.isWild;
}