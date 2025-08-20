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
  data?: any; // Additional data for special cases (like morto selection)
  actionDetails?: any; // Details about the action for broadcasting
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
      mortosUsedByTeam: [null, null],
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
        return this.handleBater(player, action.data);
      case 'add-to-sequence':
        return this.handleAddToSequence(player, action.data);
      case 'end-turn':
        return this.handleEndTurn(player, action.data);
      default:
        return { success: false, message: 'Invalid action type' };
    }
  }

  private handleDraw(player: Player, data: { source: 'deck' | 'discard', selectedCards?: string[] }): GameActionResult {
    console.log('🎮 handleDraw called with:', { source: data.source, selectedCards: data.selectedCards });
    
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
      return this.drawFromDiscardPile(player, data.selectedCards);
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

  private drawFromDiscardPile(player: Player, selectedCardIds?: string[]): GameActionResult {
    
    if (this.gameState.discardPile.length === 0) {
      return { success: false, message: 'Discard pile is empty' };
    }

    let cardsToTake: Card[];
    let remainingCards: Card[];

    if (selectedCardIds && selectedCardIds.length > 0) {
      console.log('🎮 Selective drawing mode - cards to leave:', selectedCardIds.length);
      // Selective drawing - take only selected cards
      cardsToTake = [];
      remainingCards = [];

      // Validate that all selected cards exist in discard pile
      for (const cardId of selectedCardIds) {
        const cardInPile = this.gameState.discardPile.find(card => card.id === cardId);
        if (!cardInPile) {
          console.log('🎮 ERROR: Selected card not found in pile:', cardId);
          return { success: false, message: 'Selected card not found in discard pile' };
        }
      }

      // Separate cards to take from cards to leave (selected)
      for (const card of this.gameState.discardPile) {
        console.log(`🔍 Checking card ${card.id} against selected IDs:`, selectedCardIds);
        console.log(`🔍 Includes check: ${card.id} in [${selectedCardIds.join(', ')}] = ${selectedCardIds.includes(card.id)}`);
        
        if (selectedCardIds.includes(card.id)) {
          // These are selected to LEAVE in the pile
          console.log(`✅ LEAVING card ${card.id} in pile`);
          remainingCards.push(card);
        } else {
          // These are the cards to TAKE
          console.log(`📤 TAKING card ${card.id}`);
          cardsToTake.push(card);
        }
      }
      
      console.log('🎮 Cards to take:', cardsToTake.length);
      console.log('🎮 Cards to leave in pile:', remainingCards.length);

      // Update discard pile to keep only the selected cards
      this.gameState.discardPile = remainingCards;
    } else {
      // Traditional behavior - take entire discard pile
      cardsToTake = [...this.gameState.discardPile];
      this.gameState.discardPile = [];
    }
    
    const cardCount = cardsToTake.length;
    player.hand.push(...cardsToTake);
    
    // Mark that player has drawn this turn and track all card IDs
    this.gameState.turnState.hasDrawn = true;
    this.gameState.turnState.drawnCardIds.push(...cardsToTake.map(card => card.id));

    return {
      success: true,
      message: `Drew ${cardCount} cards from discard pile. You must discard a different card to end turn.`,
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

    // DEADLOCK PREVENTION: Check if action would cause unplayable state
    const totalCardsToRemove = data.sequences.reduce((sum, seq) => sum + seq.length, 0);
    if (this.wouldCauseDeadlock(player, 'baixar', totalCardsToRemove)) {
      const deadlockReason = this.getDeadlockExplanation(player.team);
      return {
        success: false,
        message: `Cannot baixar these cards - this would empty your hand without ability to bater. ${deadlockReason}`
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
        newGameState: this.gameState,
        actionDetails: {
          discardedCard: discardedCard
        }
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
      newGameState: this.gameState,
      actionDetails: {
        discardedCard: discardedCard
      }
    };
  }

  private handleBater(player: Player, data?: { mortoChoice?: number }): GameActionResult {
    console.log('🎮 Bater action received:', { playerId: player.id, mortoChoice: data?.mortoChoice });
    console.log('🎮 Player hand size:', player.hand.length);
    
    if (!this.canPlayerBater(player)) {
      console.log('🎮 Player cannot Bater - hand size:', player.hand.length);
      return { success: false, message: 'Cannot Bater yet' };
    }

    const team = player.team;
    
    // Check if team can finish the game
    if (this.canTeamFinishGame(team)) {
      return this.finishGame(player);
    }

    // Get available Mortos
    const availableMortos = this.getAvailableMortos();
    console.log('🎮 Available Mortos:', availableMortos);
    
    if (availableMortos.length === 0) {
      return { success: false, message: 'No Morto available' };
    }

    // If no choice specified and multiple Mortos available, require choice
    if (data?.mortoChoice === undefined && availableMortos.length > 1) {
      return {
        success: false,
        message: 'multiple_mortos_available',
        data: { availableMortos },
        newGameState: this.gameState
      };
    }

    // Determine which Morto to take
    let mortoToTake: number;
    if (data?.mortoChoice !== undefined) {
      // Validate player's choice
      console.log('🎮 Validating choice:', data.mortoChoice, 'against available:', availableMortos);
      if (!availableMortos.includes(data.mortoChoice)) {
        console.log('🎮 Choice rejected - not in available list');
        return { success: false, message: 'Selected Morto is not available' };
      }
      mortoToTake = data.mortoChoice;
      console.log('🎮 Choice accepted, taking Morto:', mortoToTake);
    } else {
      // Only one Morto available, take it
      mortoToTake = availableMortos[0];
      console.log('🎮 Auto-selecting Morto:', mortoToTake);
    }

    // Give Morto to player
    const mortoCards = this.gameState.mortos[mortoToTake];
    console.log('🎮 Morto', mortoToTake, 'has', mortoCards.length, 'cards');
    player.hand.push(...mortoCards);
    this.gameState.mortos[mortoToTake] = [];
    this.gameState.mortosUsed[mortoToTake] = true;
    this.gameState.mortosUsedByTeam[mortoToTake] = player.team;

    console.log('🎮 Bater successful! Player now has', player.hand.length, 'cards');
    return {
      success: true,
      message: `Bateu! Took Morto ${mortoToTake + 1}. Continue playing.`,
      newGameState: this.gameState,
      actionDetails: {
        mortoChoice: mortoToTake
      }
    };
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
    
    // DEADLOCK PREVENTION: Check if action would cause unplayable state
    const cardsToRemove = data.cardIndices.length;
    if (this.wouldCauseDeadlock(player, 'add-to-sequence', cardsToRemove)) {
      const deadlockReason = this.getDeadlockExplanation(player.team);
      return {
        success: false,
        message: `Cannot add these cards - this would empty your hand without ability to bater. ${deadlockReason}`
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
    
    // Check if player has 0 cards - they must Bater instead of ending turn
    if (player.hand.length === 0 && !data?.cheatMode) {
      return { 
        success: false, 
        message: 'You have no cards! You must Bater instead of ending turn' 
      };
    }
    
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

  /**
   * Check if a team can bater based on current game state
   * Two scenarios:
   * 1. Team hasn't taken Morto - can bater freely if Morto available
   * 2. Team already took Morto OR no Mortos available - can only bater if team has Canastra Limpa
   */
  private canTeamBater(team: number): boolean {
    const teamSequences = this.gameState.teamSequences[team - 1];
    const availableMortos = this.getAvailableMortos();
    
    // Check if team has taken a Morto
    const teamHasTakenMorto = this.gameState.mortosUsedByTeam.some(takenByTeam => takenByTeam === team);
    
    // Scenario A: Team hasn't taken Morto
    if (!teamHasTakenMorto) {
      // Can bater freely if any Morto is available
      return availableMortos.length > 0;
    }
    
    // Scenario B: Team already took Morto OR no Mortos available
    // Can only bater if team has Canastra Limpa
    const hasCanstraLimpa = teamSequences.some(seq => 
      seq.isCanastra && (seq.canastraType === 'limpa' || seq.canastraType === 'as-a-as')
    );
    
    return hasCanstraLimpa;
  }

  /**
   * Check if an action would cause a deadlock (empty hand without ability to bater)
   * CRITICAL: Prevents unplayable game states
   */
  private wouldCauseDeadlock(player: Player, actionType: string, cardsToRemove: number): boolean {
    const remainingCards = player.hand.length - cardsToRemove;
    
    // If action wouldn't empty hand, no deadlock
    if (remainingCards > 0) {
      return false;
    }
    
    // If action would empty hand, check if team can bater
    return !this.canTeamBater(player.team);
  }

  /**
   * Provides clear explanation of why team cannot bater (for deadlock warnings)
   */
  private getDeadlockExplanation(team: number): string {
    const teamSequences = this.gameState.teamSequences[team - 1];
    const availableMortos = this.getAvailableMortos();
    const teamHasTakenMorto = this.gameState.mortosUsedByTeam.some(takenByTeam => takenByTeam === team);
    
    // Check if team has Canastra Limpa
    const hasCanstraLimpa = teamSequences.some(seq => 
      seq.isCanastra && (seq.canastraType === 'limpa' || seq.canastraType === 'as-a-as')
    );
    
    if (!teamHasTakenMorto && availableMortos.length > 0) {
      // This shouldn't happen - team should be able to bater
      return "Team should be able to bater with available Morto.";
    }
    
    if (teamHasTakenMorto && !hasCanstraLimpa) {
      return "Your team already took a Morto and needs a Canastra Limpa (7+ cards without wildcards) to bater.";
    }
    
    if (availableMortos.length === 0 && !hasCanstraLimpa) {
      return "No Mortos available and your team needs a Canastra Limpa to bater.";
    }
    
    return "Team cannot bater under current game rules.";
  }

  private canTeamFinishGame(team: number): boolean {
    // Team needs: at least one Canastra Limpa + any Morto taken by team
    const teamSequences = this.gameState.teamSequences[team - 1];
    const hasCanstraLimpa = teamSequences.some(seq => 
      seq.isCanastra && (seq.canastraType === 'limpa' || seq.canastraType === 'as-a-as')
    );
    
    // Check if this team has taken ANY Morto
    // mortosUsedByTeam[i] contains the team number that took Morto i (1-indexed)
    const teamHasTakenMorto = this.gameState.mortosUsedByTeam.some(takenByTeam => takenByTeam === team);

    return hasCanstraLimpa && teamHasTakenMorto;
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

  private getAvailableMortos(): number[] {
    const available: number[] = [];
    // A Morto is available if it has cards, regardless of whether it was used before
    if (this.gameState.mortos[0].length > 0) {
      available.push(0);
    }
    if (this.gameState.mortos[1].length > 0) {
      available.push(1);
    }
    return available;
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

  // CHEAT SYSTEM - FOR TESTING ONLY
  public executeCheatCode(cheatCode: string, playerId: string): GameActionResult {
    const player = this.getPlayerById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    switch (cheatCode) {
      case 'deadlock':
        return this.cheat_createDeadlockScenario(player);
      case 'limpa':
        return this.cheat_giveCanastraLimpa(player);
      case 'suja':
        return this.cheat_giveCanastraSuja(player);
      case 'transform':
        return this.cheat_setupSujaForTransformation(player);
      case 'aces3':
        return this.cheat_giveThreeAces(player);
      case 'pique':
        return this.cheat_reduceToPique(player);
      case 'discard5':
        return this.cheat_addCardsToDiscardPile();
      case 'morto0':
        return this.cheat_setMortoStatus(player.team, 0);
      case 'morto1':
        return this.cheat_setMortoStatus(player.team, 1);
      case '1500pts':
        return this.cheat_setTeamScore(player.team, 1600);
      default:
        return { success: false, message: `Unknown cheat code: ${cheatCode}` };
    }
  }

  private cheat_createDeadlockScenario(player: Player): GameActionResult {
    // Set player to 1 card
    player.hand = player.hand.slice(0, 1);
    
    // Make sure team took a Morto and has no Limpa
    this.gameState.mortosUsedByTeam[0] = player.team;
    this.gameState.mortosUsed[0] = true;
    this.gameState.mortos[0] = []; // Empty the Morto
    
    // Clear team's sequences to ensure no Limpa
    this.gameState.teamSequences[player.team - 1] = [];
    
    return {
      success: true,
      message: `Deadlock scenario created: ${player.username} has 1 card, team took Morto, no Limpa`,
      newGameState: this.gameState
    };
  }

  private cheat_giveCanastraLimpa(player: Player): GameActionResult {
    // Give player A♠-2♠-3♠-4♠-5♠-6♠-7♠ (Canastra Limpa)
    const limpaCards = [
      { id: 'cheat_A♠', suit: 'spades', rank: 'A', value: 1, points: 15 },
      { id: 'cheat_2♠', suit: 'spades', rank: '2', value: 2, points: 10 },
      { id: 'cheat_3♠', suit: 'spades', rank: '3', value: 3, points: 5 },
      { id: 'cheat_4♠', suit: 'spades', rank: '4', value: 4, points: 5 },
      { id: 'cheat_5♠', suit: 'spades', rank: '5', value: 5, points: 5 },
      { id: 'cheat_6♠', suit: 'spades', rank: '6', value: 6, points: 5 },
      { id: 'cheat_7♠', suit: 'spades', rank: '7', value: 7, points: 5 }
    ];
    
    player.hand.push(...limpaCards);
    
    return {
      success: true,
      message: `Canastra Limpa cards added to ${player.username}'s hand`,
      newGameState: this.gameState
    };
  }

  private cheat_giveCanastraSuja(player: Player): GameActionResult {
    // Give player A♠-2♥-3♠-4♠-5♠-6♠-7♠ (Canastra Suja with different-suit 2)
    const sujaCards = [
      { id: 'cheat_A♠_suja', suit: 'spades', rank: 'A', value: 1, points: 15 },
      { id: 'cheat_2♥_wild', suit: 'hearts', rank: '2', value: 2, points: 10, isWild: true },
      { id: 'cheat_3♠_suja', suit: 'spades', rank: '3', value: 3, points: 5 },
      { id: 'cheat_4♠_suja', suit: 'spades', rank: '4', value: 4, points: 5 },
      { id: 'cheat_5♠_suja', suit: 'spades', rank: '5', value: 5, points: 5 },
      { id: 'cheat_6♠_suja', suit: 'spades', rank: '6', value: 6, points: 5 },
      { id: 'cheat_7♠_suja', suit: 'spades', rank: '7', value: 7, points: 5 }
    ];
    
    player.hand.push(...sujaCards);
    
    return {
      success: true,
      message: `Canastra Suja cards added to ${player.username}'s hand`,
      newGameState: this.gameState
    };
  }

  private cheat_setupSujaForTransformation(player: Player): GameActionResult {
    // Give player 3♠-4♠-5♠-2♠-7♠-8♠-9♠ + natural 6♠ for transformation
    const transformCards = [
      { id: 'cheat_3♠_transform', suit: 'spades', rank: '3', value: 3, points: 5 },
      { id: 'cheat_4♠_transform', suit: 'spades', rank: '4', value: 4, points: 5 },
      { id: 'cheat_5♠_transform', suit: 'spades', rank: '5', value: 5, points: 5 },
      { id: 'cheat_2♠_wild_transform', suit: 'spades', rank: '2', value: 2, points: 10, isWild: true },
      { id: 'cheat_7♠_transform', suit: 'spades', rank: '7', value: 7, points: 5 },
      { id: 'cheat_8♠_transform', suit: 'spades', rank: '8', value: 8, points: 5 },
      { id: 'cheat_9♠_transform', suit: 'spades', rank: '9', value: 9, points: 5 },
      { id: 'cheat_6♠_natural', suit: 'spades', rank: '6', value: 6, points: 5 }
    ];
    
    player.hand.push(...transformCards);
    
    return {
      success: true,
      message: `Transformation scenario set: Suja with missing 6♠ for natural replacement`,
      newGameState: this.gameState
    };
  }

  private cheat_giveThreeAces(player: Player): GameActionResult {
    // Give player A♠-A♥-A♣-Joker (3 natural Aces + wildcard)
    const acesCards = [
      { id: 'cheat_A♠_aces', suit: 'spades', rank: 'A', value: 1, points: 15 },
      { id: 'cheat_A♥_aces', suit: 'hearts', rank: 'A', value: 1, points: 15 },
      { id: 'cheat_A♣_aces', suit: 'clubs', rank: 'A', value: 1, points: 15 },
      { id: 'cheat_joker_aces', suit: 'joker', rank: 'Joker', value: 0, points: 20, isWild: true }
    ];
    
    player.hand.push(...acesCards);
    
    return {
      success: true,
      message: `Three Aces sequence cards added to ${player.username}'s hand`,
      newGameState: this.gameState
    };
  }

  private cheat_reduceToPique(player: Player): GameActionResult {
    // Reduce player to only 1 card
    player.hand = player.hand.slice(0, 1);
    
    return {
      success: true,
      message: `${player.username} reduced to Pique (1 card)`,
      newGameState: this.gameState
    };
  }

  private cheat_addCardsToDiscardPile(): GameActionResult {
    // Add 5 specific test cards to discard pile
    const testCards = [
      { id: 'cheat_discard_K♠', suit: 'spades', rank: 'K', value: 13, points: 10 },
      { id: 'cheat_discard_Q♥', suit: 'hearts', rank: 'Q', value: 12, points: 10 },
      { id: 'cheat_discard_J♣', suit: 'clubs', rank: 'J', value: 11, points: 10 },
      { id: 'cheat_discard_10♦', suit: 'diamonds', rank: '10', value: 10, points: 10 },
      { id: 'cheat_discard_9♠', suit: 'spades', rank: '9', value: 9, points: 5 }
    ];
    
    this.gameState.discardPile.push(...testCards);
    
    return {
      success: true,
      message: `5 test cards added to discard pile`,
      newGameState: this.gameState
    };
  }

  private cheat_setMortoStatus(team: number, mortoIndex: number): GameActionResult {
    // Set whether team has taken specific Morto
    this.gameState.mortosUsedByTeam[mortoIndex] = team;
    this.gameState.mortosUsed[mortoIndex] = true;
    this.gameState.mortos[mortoIndex] = []; // Empty the Morto
    
    return {
      success: true,
      message: `Team ${team} set as having taken Morto ${mortoIndex + 1}`,
      newGameState: this.gameState
    };
  }

  private cheat_setTeamScore(team: number, score: number): GameActionResult {
    // Set team score for testing 1500+ requirements
    this.gameState.scores[team - 1] = score;
    
    return {
      success: true,
      message: `Team ${team} score set to ${score} points`,
      newGameState: this.gameState
    };
  }
}