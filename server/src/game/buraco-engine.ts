import { GameState, Card, Sequence, Player } from '../types';
import { createDeck, shuffleDeck, dealCards, isWildCard } from './deck';
import { validateSequence, createSequence } from './sequences';

export interface GameAction {
  type: 'draw' | 'baixar' | 'discard' | 'bater' | 'add-to-sequence' | 'end-turn';
  playerId: string;
  data?: any;
}

export interface GameActionResult {
  success: boolean;
  message?: string;
  newGameState?: GameState;
  gameEnded?: boolean;
}

export class BuracoGame {
  private gameState: GameState;

  constructor(players: Player[], gameId?: string) {
    this.gameState = this.initializeGame(players, gameId);
  }

  private initializeGame(players: Player[], gameId?: string): GameState {
    const deck = shuffleDeck(createDeck());
    const { playerHands, remainingDeck, mortos } = dealCards(deck, players.length);

    // Assign hands to players
    players.forEach((player, index) => {
      player.hand = playerHands[index];
    });

    return {
      id: gameId || this.generateGameId(),
      players,
      currentTurn: 0,
      mainDeck: remainingDeck,
      discardPile: [],
      mortos,
      mortosUsed: [false, false],
      teamSequences: [[], []],
      scores: [0, 0],
      phase: 'playing',
      turnState: {
        hasDrawn: false,
        hasDiscarded: false,
        drawnCardIds: [],
        hasDiscardedNonDrawnCard: false
      },
      gameRules: {
        pointsToWin: 3000,
        minBaixarAfter1500: 75
      }
    };
  }

  public processAction(action: GameAction): GameActionResult {
    const player = this.getPlayerById(action.playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!this.isPlayerTurn(action.playerId)) {
      return { success: false, message: 'Not your turn' };
    }

    switch (action.type) {
      case 'draw':
        return this.handleDraw(player, action.data);
      case 'baixar':
        return this.handleBaixar(player, action.data);
      case 'discard':
        return this.handleDiscard(player, action.data);
      case 'bater':
        return this.handleBater(player);
      case 'add-to-sequence':
        return this.handleAddToSequence(player, action.data);
      case 'end-turn':
        return this.handleEndTurn(player, action.data);
      default:
        return { success: false, message: 'Invalid action type' };
    }
  }

  private handleDraw(player: Player, data: { source: 'deck' | 'discard' }): GameActionResult {
    // Check if player has already drawn this turn
    if (this.gameState.turnState.hasDrawn) {
      return { success: false, message: 'You can only draw one card per turn' };
    }

    // Check if player can draw from discard (not during Pique)
    if (data.source === 'discard' && this.isPlayerInPique(player)) {
      return { success: false, message: 'Cannot draw from discard pile during Pique' };
    }

    if (data.source === 'deck') {
      return this.drawFromDeck(player);
    } else {
      return this.drawFromDiscardPile(player);
    }
  }

  private drawFromDeck(player: Player): GameActionResult {
    if (this.gameState.mainDeck.length === 0) {
      // Check if we need to add Mortos to deck
      const availableMorto = this.getAvailableMorto();
      if (availableMorto !== null) {
        this.gameState.mainDeck.push(...this.gameState.mortos[availableMorto]);
        this.gameState.mortos[availableMorto] = [];
      } else {
        return { success: false, message: 'No more cards to draw' };
      }
    }

    const card = this.gameState.mainDeck.pop()!;
    player.hand.push(card);
    
    // Mark that player has drawn this turn and track the card ID
    this.gameState.turnState.hasDrawn = true;
    this.gameState.turnState.drawnCardIds.push(card.id);

    // Check if player can Bater after drawing (special rule)
    if (this.gameState.mainDeck.length === 0 && this.canPlayerBater(player)) {
      // Player drew last card and can Bater - allow taking Morto instead
      return {
        success: true,
        message: 'Card drawn. You can Bater and take Morto if available.',
        newGameState: this.gameState
      };
    }

    return {
      success: true,
      newGameState: this.gameState
    };
  }

  private drawFromDiscardPile(player: Player): GameActionResult {
    if (this.gameState.discardPile.length === 0) {
      return { success: false, message: 'Discard pile is empty' };
    }

    // Take entire discard pile and track all card IDs
    const discardCards = [...this.gameState.discardPile];
    const discardCount = discardCards.length;
    
    player.hand.push(...discardCards);
    this.gameState.discardPile = [];
    
    // Mark that player has drawn this turn and track all card IDs
    this.gameState.turnState.hasDrawn = true;
    this.gameState.turnState.drawnCardIds.push(...discardCards.map(card => card.id));

    return {
      success: true,
      message: `Drew ${discardCount} cards from discard pile. You must discard a different card to end turn.`,
      newGameState: this.gameState
    };
  }

  private handleBaixar(player: Player, data: { sequences: Card[][] }): GameActionResult {
    const team = player.team;
    const currentScore = this.gameState.scores[team - 1];

    // Check minimum points requirement after 1500 points
    if (currentScore >= 1500 && !this.hasPlayerBaixado(player)) {
      const totalPoints = this.calculateBaixarPoints(data.sequences);
      if (totalPoints < this.gameState.gameRules.minBaixarAfter1500) {
        return {
          success: false,
          message: `Need at least ${this.gameState.gameRules.minBaixarAfter1500} points to baixar after 1500`
        };
      }
    }

    // Validate wildcard limits across all sequences being played
    const wildcardValidation = this.validateCrossSequenceWildcards(data.sequences);
    if (!wildcardValidation.isValid) {
      return {
        success: false,
        message: wildcardValidation.message
      };
    }

    // Validate all sequences
    const validatedSequences: Sequence[] = [];
    for (const cardGroup of data.sequences) {
      try {
        console.log('🃏 Validating sequence:', cardGroup.map(c => `${c.rank}${c.suit} (${c.value})`));
        const sequence = createSequence(cardGroup);
        console.log('✅ Sequence validated successfully:', sequence);
        validatedSequences.push(sequence);
      } catch (error) {
        console.log('❌ Sequence validation failed:', error);
        console.log('Cards in failed sequence:', cardGroup.map(c => `${c.rank}${c.suit} (${c.value})`));
        return {
          success: false,
          message: `Invalid sequence: ${error}`
        };
      }
    }

    // Remove cards from player's hand
    for (const sequence of validatedSequences) {
      for (const card of sequence.cards) {
        const cardIndex = player.hand.findIndex(c => 
          c.suit === card.suit && c.rank === card.rank && c.value === card.value
        );
        if (cardIndex >= 0) {
          player.hand.splice(cardIndex, 1);
        }
      }
    }

    // Add sequences to team's area
    this.gameState.teamSequences[team - 1].push(...validatedSequences);

    // Update scores
    const points = validatedSequences.reduce((sum, seq) => sum + seq.points, 0);
    this.gameState.scores[team - 1] += points;

    return {
      success: true,
      message: `Baixou ${validatedSequences.length} sequences for ${points} points`,
      newGameState: this.gameState
    };
  }

  private handleDiscard(player: Player, data: { cardIndex: number; cheatMode?: boolean }): GameActionResult {
    console.log('🎮 Discard action received:', { cardIndex: data.cardIndex, cheatMode: data.cheatMode });
    
    if (data.cardIndex < 0 || data.cardIndex >= player.hand.length) {
      return { success: false, message: 'Invalid card index' };
    }

    const discardedCard = player.hand.splice(data.cardIndex, 1)[0];
    this.gameState.discardPile.push(discardedCard);

    // Mark that player has discarded this turn
    this.gameState.turnState.hasDiscarded = true;
    
    // Check if this card was NOT drawn this turn
    if (!this.gameState.turnState.drawnCardIds.includes(discardedCard.id)) {
      this.gameState.turnState.hasDiscardedNonDrawnCard = true;
    }

    // Check if player has only one card left (Pique)
    if (player.hand.length === 1) {
      return {
        success: true,
        message: 'Pique! You must announce you have only one card left.',
        newGameState: this.gameState
      };
    }

    // Only move to next player if not in cheat mode
    if (data.cheatMode) {
      console.log('🎮 Cheat mode active - not ending turn');
    } else {
      console.log('🎮 Normal mode - ending turn');
      this.nextTurn();
    }

    return {
      success: true,
      newGameState: this.gameState
    };
  }

  private handleBater(player: Player): GameActionResult {
    if (!this.canPlayerBater(player)) {
      return { success: false, message: 'Cannot Bater yet' };
    }

    const team = player.team;
    
    // Check if team can finish the game
    if (this.canTeamFinishGame(team)) {
      return this.finishGame(player);
    }

    // Regular Bater - take Morto if available
    const availableMorto = this.getAvailableMortoForTeam(team);
    if (availableMorto !== null) {
      // Give Morto to player
      player.hand.push(...this.gameState.mortos[availableMorto]);
      this.gameState.mortos[availableMorto] = [];
      this.gameState.mortosUsed[availableMorto] = true;

      return {
        success: true,
        message: 'Bateu! Took Morto deck. Continue playing.',
        newGameState: this.gameState
      };
    } else {
      return { success: false, message: 'No Morto available for your team' };
    }
  }

  private handleAddToSequence(player: Player, data: { sequenceId: string; cardIndices: number[] }): GameActionResult {
    const team = player.team;
    const teamSequences = this.gameState.teamSequences[team - 1];
    
    // Find the target sequence
    const sequenceIndex = teamSequences.findIndex(seq => seq.id === data.sequenceId);
    if (sequenceIndex === -1) {
      return { success: false, message: 'Sequence not found' };
    }
    
    const targetSequence = teamSequences[sequenceIndex];
    
    // Get cards from player's hand
    const cardsToAdd: Card[] = [];
    for (const cardIndex of data.cardIndices) {
      if (cardIndex < 0 || cardIndex >= player.hand.length) {
        return { success: false, message: 'Invalid card index' };
      }
      cardsToAdd.push(player.hand[cardIndex]);
    }
    
    // Check wildcard limits for the new sequence
    const newSequenceCards = [...targetSequence.cards, ...cardsToAdd];
    const wildcardValidation = this.validateCrossSequenceWildcards([newSequenceCards]);
    if (!wildcardValidation.isValid) {
      return {
        success: false,
        message: `Cannot add cards: ${wildcardValidation.message}`
      };
    }
    
    // Try to add cards to the sequence
    try {
      const newSequence = createSequence(newSequenceCards, targetSequence.id);
      
      // Remove cards from player's hand (in reverse order to maintain indices)
      const sortedIndices = [...data.cardIndices].sort((a, b) => b - a);
      for (const cardIndex of sortedIndices) {
        player.hand.splice(cardIndex, 1);
      }
      
      // Replace the sequence in team's area
      teamSequences[sequenceIndex] = newSequence;
      
      // Update team score (add points from new cards)
      const addedPoints = cardsToAdd.reduce((sum, card) => sum + card.points, 0);
      this.gameState.scores[team - 1] += addedPoints;
      
      console.log(`🃏 Added ${cardsToAdd.length} cards to sequence. New sequence:`, newSequence);
      
      return {
        success: true,
        message: `Added ${cardsToAdd.length} cards to sequence`,
        newGameState: this.gameState
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot add cards to sequence: ${error}`
      };
    }
  }

  private handleEndTurn(player: Player, data?: { cheatMode?: boolean }): GameActionResult {
    console.log('🎮 End turn action received:', { cheatMode: data?.cheatMode });
    
    // Check if player has drawn at least one card this turn
    if (!this.gameState.turnState.hasDrawn) {
      // Check if there are cards available to draw
      const hasAvailableCards = this.gameState.mainDeck.length > 0 || 
                               this.gameState.discardPile.length > 0 || 
                               this.getAvailableMorto() !== null;
      
      if (hasAvailableCards && !data?.cheatMode) {
        return { 
          success: false, 
          message: 'You must draw at least one card before ending your turn' 
        };
      }
    }

    // Check if player has discarded a card this turn (required rule)
    if (!this.gameState.turnState.hasDiscarded && !data?.cheatMode) {
      return { 
        success: false, 
        message: 'You must discard a card before ending your turn' 
      };
    }
    
    // Check if player drew from discard pile - must discard a different card
    if (this.gameState.turnState.drawnCardIds.length > 0 && 
        !this.gameState.turnState.hasDiscardedNonDrawnCard && 
        !data?.cheatMode) {
      return { 
        success: false, 
        message: 'You cannot end turn by discarding the same card(s) you drew this turn' 
      };
    }

    if (data?.cheatMode) {
      console.log('🎮 Cheat mode active - bypassing end turn restrictions');
    }

    // Move to next player
    this.nextTurn();

    return {
      success: true,
      message: 'Turn ended',
      newGameState: this.gameState
    };
  }

  private validateCrossSequenceWildcards(sequences: Card[][]): { isValid: boolean; message?: string } {
    // Count total wildcards being played across all sequences
    let totalWildcards = 0;
    let sequencesWithWildcard2InNaturalPosition = 0;
    
    for (const cardGroup of sequences) {
      const wildcards = cardGroup.filter(c => isWildCard(c));
      totalWildcards += wildcards.length;
      
      // Check if this sequence has a wildcard 2 in natural position
      if (this.hasWildcard2InNaturalPosition(cardGroup)) {
        sequencesWithWildcard2InNaturalPosition++;
      }
    }
    
    // Rule: Each sequence can have at most 1 wildcard
    // Exception: If wildcard 2 is in natural position, that sequence can have 2 wildcards
    const maxAllowedWildcards = sequences.length + sequencesWithWildcard2InNaturalPosition;
    
    if (totalWildcards > maxAllowedWildcards) {
      return {
        isValid: false,
        message: `Too many wildcards: ${totalWildcards} used, maximum ${maxAllowedWildcards} allowed (1 per sequence, +1 for wildcard 2 in natural position)`
      };
    }
    
    // Check individual sequence wildcard limits
    for (let i = 0; i < sequences.length; i++) {
      const cardGroup = sequences[i];
      const wildcards = cardGroup.filter(c => isWildCard(c));
      
      if (wildcards.length > 2) {
        return {
          isValid: false,
          message: `Sequence ${i + 1} has ${wildcards.length} wildcards, maximum 2 allowed`
        };
      }
      
      if (wildcards.length === 2 && !this.hasWildcard2InNaturalPosition(cardGroup)) {
        return {
          isValid: false,
          message: `Sequence ${i + 1} has 2 wildcards but wildcard 2 is not in its natural position (between A and 3)`
        };
      }
    }
    
    return { isValid: true };
  }

  private hasWildcard2InNaturalPosition(cards: Card[]): boolean {
    // Sort cards by value for analysis
    const naturalCards = cards.filter(c => !isWildCard(c)).sort((a, b) => a.value - b.value);
    const wildcards = cards.filter(c => isWildCard(c));
    
    // Look for wildcard 2s specifically
    const wildcard2s = wildcards.filter(c => c.rank === '2');
    
    if (wildcard2s.length === 0) {
      return false; // No wildcard 2s
    }
    
    // Check if any wildcard 2 could be in its natural position (value 2)
    // This happens when we have A (value 1) and 3 (value 3) as natural cards
    const hasAce = naturalCards.some(c => c.value === 1);
    const hasThree = naturalCards.some(c => c.value === 3);
    
    // If we have both A and 3, and a wildcard 2, then the 2 could be in its natural position
    if (hasAce && hasThree && wildcard2s.length > 0) {
      // Check if they're all the same suit (for regular sequences)
      const suits = naturalCards.map(c => c.suit);
      const uniqueSuits = [...new Set(suits)];
      
      if (uniqueSuits.length === 1) {
        console.log('🃏 Wildcard 2 exception: Found A-2(wild)-3 pattern, allowing additional wildcard');
        return true;
      }
    }
    
    return false;
  }

  private canPlayerBater(player: Player): boolean {
    return player.hand.length === 0;
  }

  private canTeamFinishGame(team: number): boolean {
    // Team needs: at least one Canastra Limpa + Morto taken
    const teamSequences = this.gameState.teamSequences[team - 1];
    const hasCanstraLimpa = teamSequences.some(seq => 
      seq.isCanastra && (seq.canastraType === 'limpa' || seq.canastraType === 'as-a-as')
    );
    
    const teamMortoTaken = team === 1 ? 
      this.gameState.mortosUsed[0] : 
      this.gameState.mortosUsed[1];

    return hasCanstraLimpa && teamMortoTaken;
  }

  private finishGame(player: Player): GameActionResult {
    const team = player.team;
    
    // Award winning bonus
    this.gameState.scores[team - 1] += 100;
    
    // Penalize cards remaining in other players' hands
    for (const otherPlayer of this.gameState.players) {
      if (otherPlayer.team !== team) {
        const remainingPoints = otherPlayer.hand.reduce((sum, card) => sum + card.points, 0);
        this.gameState.scores[team - 1] += remainingPoints;
      }
    }

    // Check for Morto penalty
    if (!this.gameState.mortosUsed[0] || !this.gameState.mortosUsed[1]) {
      // Apply -100 penalty to team that didn't take Morto
      const penaltyTeam = this.gameState.mortosUsed[0] ? 2 : 1;
      this.gameState.scores[penaltyTeam - 1] -= 100;
    }

    this.gameState.phase = 'finished';
    this.gameState.winner = team;

    return {
      success: true,
      message: `Game finished! Team ${team} wins!`,
      newGameState: this.gameState,
      gameEnded: true
    };
  }

  private isPlayerTurn(playerId: string): boolean {
    const currentPlayer = this.gameState.players[this.gameState.currentTurn];
    return currentPlayer.id === playerId;
  }

  private isPlayerInPique(player: Player): boolean {
    return player.hand.length === 1;
  }

  private nextTurn(): void {
    this.gameState.currentTurn = (this.gameState.currentTurn + 1) % this.gameState.players.length;
    // Reset turn state for new player
    this.gameState.turnState.hasDrawn = false;
    this.gameState.turnState.hasDiscarded = false;
    this.gameState.turnState.drawnCardIds = [];
    this.gameState.turnState.hasDiscardedNonDrawnCard = false;
  }

  private getPlayerById(playerId: string): Player | undefined {
    return this.gameState.players.find(p => p.id === playerId);
  }

  private getAvailableMorto(): number | null {
    if (this.gameState.mortos[0].length > 0) return 0;
    if (this.gameState.mortos[1].length > 0) return 1;
    return null;
  }

  private getAvailableMortoForTeam(team: number): number | null {
    // Team 1 gets Morto 0, Team 2 gets Morto 1 (if available)
    const mortoIndex = team - 1;
    if (this.gameState.mortos[mortoIndex].length > 0 && !this.gameState.mortosUsed[mortoIndex]) {
      return mortoIndex;
    }
    return null;
  }

  private hasPlayerBaixado(player: Player): boolean {
    // Check if player's team has any sequences on the table
    const teamSequences = this.gameState.teamSequences[player.team - 1];
    return teamSequences.length > 0;
  }

  private calculateBaixarPoints(sequences: Card[][]): number {
    let total = 0;
    for (const cardGroup of sequences) {
      try {
        const sequence = createSequence(cardGroup);
        total += sequence.points;
      } catch {
        // Invalid sequence, ignore
      }
    }
    return total;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public getCurrentPlayer(): Player {
    return this.gameState.players[this.gameState.currentTurn];
  }
}