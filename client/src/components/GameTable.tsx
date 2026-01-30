import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameState, Player, Card as CardType, Sequence, User } from '../types';
import { Card } from './Card';
import { gameService } from '../services/gameService';
import { ChatSystem } from './organisms/ChatSystem';
import { useChatStore } from '../stores/chatStore';
import { ConnectedActionMessage, useActionMessage } from './atoms/ActionMessage';
import { ActionButton } from './atoms/ActionButton';
import { GameHeader } from './organisms/GameHeader';
import { HandManager } from './molecules/HandManager';
import { DeckDisplay } from './molecules/DeckDisplay';
import { TeamSequences } from './organisms/TeamSequences';
import { MobileTipsTooltip } from './atoms/MobileTipsTooltip';
import { useGameStore, gameSelectors } from '../stores/gameStore';
import { useUIStore, useResponsiveUpdates } from '../stores/uiStore';
import './GameTable.css';

interface GameTableProps {
  user: User;
  initialGameState?: GameState;
  onLeaveGame: () => void;
}

export function GameTable({ user, initialGameState, onLeaveGame }: GameTableProps) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState | null>(initialGameState || null);
  
  // Use gameStore for selectedCards state
  const selectedCards = useGameStore(gameSelectors.selectedCardIndices);
  const { toggleCardSelection, clearSelection, updateSelectedCards } = useGameStore();
  
  // Chat and UI stores
  const { isSidebarOpen } = useChatStore();
  const { isMobile } = useUIStore();
  
  // Enable responsive updates for proper mobile/desktop detection
  useResponsiveUpdates();
  
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  
  // Use the action message hook instead of local state
  const { showInfo, showError, showSuccess, showWarning } = useActionMessage();
  const [showBaixarDialog, setShowBaixarDialog] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortType, setSortType] = useState<'suit' | 'blackred1' | 'blackred2'>('suit');
  const [cheatMode, setCheatMode] = useState(false);
  const [showCheatMenu, setShowCheatMenu] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [availableCardsForPicking, setAvailableCardsForPicking] = useState<CardType[]>([]);
  const [cheatsEnabled, setCheatsEnabled] = useState({
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
    allowViewAllHands: false
  });
  const [showMortoSelection, setShowMortoSelection] = useState(false);
  const [availableMortos, setAvailableMortos] = useState<number[]>([]);
  const [showDiscardViewer, setShowDiscardViewer] = useState(false);
  const [selectedDiscardCards, setSelectedDiscardCards] = useState<Set<string>>(new Set());
  const [keySequence, setKeySequence] = useState('');
  const [showMobileTips, setShowMobileTips] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameStateUpdate?: Function;
    gameEnded?: Function;
    actionError?: Function;
    error?: Function;
    playerAction?: Function;
  }>({});

  useEffect(() => {
    setupGameEventListeners();
    
    // Get current game state
    const currentState = gameService.getCurrentGameState();
    if (currentState) {
      setGameState(currentState);
      updateTurnStatus(currentState);
    }

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      if (!gameService.isConnected()) {
        showError(t('game.messages.connectionError'));
      }
    }, 5000);

    return () => {
      clearInterval(connectionCheck);
      cleanupEventListeners();
    };
  }, []);

  useEffect(() => {
    if (gameState) {
      updateTurnStatus(gameState);
    }
  }, [gameState, user.id]);


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only listen for keypresses when in game and not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const newSequence = (keySequence + e.key.toLowerCase()).slice(-5); // Keep last 5 chars
      setKeySequence(newSequence);

      // Testing cheat codes
      if (newSequence === 'iddqd') {
        setCheatMode(true);
        // Enable all cheats automatically
        setCheatsEnabled({
          allowPlayAllCards: true,
          allowMultipleDiscard: true,
          allowDiscardDrawnCards: true,
          allowViewAllHands: true
        });
        showSuccess(t('game.cheat.allEnabled'));
        setKeySequence(''); // Reset sequence
      } else if (newSequence === 'cardy') {
        // Show all players' hands (debug mode)
        showInfo(t('game.cheat.spyMode'));
        setKeySequence('');
        // This will be handled by CSS class changes
        document.body.classList.toggle('debug-show-all-hands');
      } else if (newSequence === 'winme') {
        // Auto-win current game for testing
        showSuccess(t('game.cheat.autoWin'));
        setKeySequence('');
        // Send test win signal (we'll implement this in backend)
        if (gameState) {
          gameService.sendChatMessage('DEV_AUTO_WIN_TEST', 'game', gameState.id);
        }
      } else if (newSequence === 'speedx') {
        // Speed up game animations and delays
        showInfo(t('game.cheat.speedMode'));
        setKeySequence('');
        document.body.classList.toggle('speed-test-mode');
      } else if (newSequence === 'reset') {
        // Reset all test modes
        setCheatMode(false);
        showInfo(t('game.cheat.reset'), 2000);
        setKeySequence('');
        document.body.classList.remove('debug-show-all-hands', 'speed-test-mode');
      }
      
      // NEW TESTING CHEAT CODES - Phase 3
      else if (['deadlock', 'limpa', 'suja', 'transform', 'aces3', 'pique', 'discard5', 'morto0', 'morto1', '1500pts'].includes(newSequence)) {
        console.log(`🎮 Testing cheat code: ${newSequence}`);
        showInfo(`🧪 Testing: ${newSequence.toUpperCase()}`);
        setKeySequence('');
        
        // Send cheat code directly as game action, not through chat
        gameService.sendCheatCode(newSequence);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence]);




  const cleanupEventListeners = () => {
    // Remove existing listeners
    if (listenersRef.current.gameStateUpdate) {
      gameService.off('game-state-update', listenersRef.current.gameStateUpdate);
    }
    if (listenersRef.current.gameEnded) {
      gameService.off('game-ended', listenersRef.current.gameEnded);
    }
    if (listenersRef.current.actionError) {
      gameService.off('action-error', listenersRef.current.actionError);
    }
    if (listenersRef.current.error) {
      gameService.off('error', listenersRef.current.error);
    }
    if (listenersRef.current.playerAction) {
      gameService.off('player-action', listenersRef.current.playerAction);
    }
    
    // Clear references
    listenersRef.current = {};
  };

  const setupGameEventListeners = () => {
    console.log('🕹️ GameTable setupGameEventListeners called');
    // Clean up any existing listeners first
    cleanupEventListeners();
    
    // Create new listener functions and store references
    listenersRef.current.gameStateUpdate = (newGameState: GameState) => {
      setGameState(newGameState);
      // Clear selection when game state updates (after successful action)
      clearSelection();
      // Action messages are auto-managed by the store now
    };

    listenersRef.current.gameEnded = (data: { winner: number; scores: number[] }) => {
      setGameEnded(true);
      showSuccess(t('game.messages.gameEnded', { team: data.winner, score1: data.scores[0], score2: data.scores[1] }));
    };

    listenersRef.current.actionError = (error: { message: string; data?: any }) => {
      console.log('🎮 Action error received:', error);
      
      // Check if this is actually a card picker response (not really an error)
      if (error.data?.action === 'show-card-picker' && error.data?.cards) {
        console.log('🎮 Card picker data received:', error.data.cards.length, 'cards');
        setAvailableCardsForPicking(error.data.cards);
        setShowCardPicker(true);
        showInfo('Select a card to add to your hand');
        return;
      }
      
      if (error.message === 'multiple_mortos_available' && error.data?.availableMortos) {
        console.log('🎮 Multiple Mortos available, showing selection:', error.data.availableMortos);
        console.log('🎮 Setting availableMortos state to:', error.data.availableMortos);
        setAvailableMortos(error.data.availableMortos);
        setShowMortoSelection(true);
        showInfo(t('game.messages.chooseMoreto'));
      } else {
        console.log('🎮 Other error message:', error.message);
        showError(`${t('common.error')}: ${error.message}`);
      }
    };

    listenersRef.current.error = (error: any) => {
      console.error('Game service error:', error);
      showError(t('game.messages.connectionError'), 5000);
    };

    // Handle player actions from other players
    listenersRef.current.playerAction = (data: any) => {
      console.log('🎯 PlayerAction handler received:', data);
      console.log('🎯 Current user ID:', user.id, 'Data playerId:', data.playerId);
      
      // Only show if it's not the current user's action
      if (data.playerId !== user.id.toString()) {
        let message = '';
        
        // Handle both old format (message) and new format (translationKey + translationParams)
        if (data.translationKey && data.translationParams) {
          message = t(data.translationKey, data.translationParams) as string;
          console.log('🎯 Using translation key:', data.translationKey, 'Result:', message);
        } else if (data.message) {
          message = data.message;
          console.log('🎯 Using direct message:', message);
        }
        
        if (message) {
          console.log('🎯 Setting action message:', message);
          showInfo(message);
        } else {
          console.log('🎯 No message to display');
        }
      } else {
        console.log('🎯 Skipping message - own action');
      }
    };


    
    // Add the listeners
    gameService.on('game-state-update', listenersRef.current.gameStateUpdate);
    gameService.on('game-ended', listenersRef.current.gameEnded);
    gameService.on('action-error', listenersRef.current.actionError);
    gameService.on('error', listenersRef.current.error);
    gameService.on('player-action', listenersRef.current.playerAction);
    
    console.log('🕹️ GameTable event listeners added');

    // Handle connection issues
    if (!gameService.isConnected()) {
      showError(t('game.messages.connectionLost'));
    }
  };

  const updateTurnStatus = (state: GameState) => {
    const currentPlayer = state.players[state.currentTurn];
    setIsMyTurn(currentPlayer.id === user.id.toString());
  };

  const getCurrentPlayer = (): Player | null => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === user.id.toString()) || null;
  };

  const getMyHand = (): CardType[] => {
    const player = getCurrentPlayer();
    return player ? player.hand : [];
  };



  const handleCardSelect = (cardIndex: number) => {
    // Mark as interacted on first card selection
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    toggleCardSelection(cardIndex);
  };

  const handleDrawFromDeck = () => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }
    
    gameService.drawCard('deck');
    showInfo(t('game.messages.drawingFromDeck'), 2000);
  };

  const handleDiscardPileClick = () => {
    if (!gameState || gameState.discardPile.length === 0) {
      return;
    }
    
    // Always allow viewing the discard pile
    setShowDiscardViewer(true);
    setSelectedDiscardCards(new Set());
  };

  // Card sorting function for discard pile viewer
  const sortDiscardCards = (cards: CardType[]) => {
    const suitOrder = { '♠': 0, '♣': 1, '♥': 2, '♦': 3 };
    const valueOrder: { [key: string]: number } = {
      'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 
      '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'Joker': 14
    };
    
    return [...cards].sort((a, b) => {
      // Sort by suit first
      const suitA = suitOrder[a.suit as keyof typeof suitOrder] ?? 99;
      const suitB = suitOrder[b.suit as keyof typeof suitOrder] ?? 99;
      if (suitA !== suitB) return suitA - suitB;
      
      // Then by value
      const valueA = valueOrder[a.value] ?? 99;
      const valueB = valueOrder[b.value] ?? 99;
      return valueA - valueB;
    });
  };

  const handleDrawFromDiscard = () => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }
    
    gameService.drawCard('discard');
    showInfo(t('game.messages.takingDiscardPile'), 2000);
    setShowDiscardViewer(false);
  };


  const handleBaixar = () => {
    if (selectedCards.length < 3) {
      showWarning(t('game.messages.selectAtLeast', { count: 3 }));
      return;
    }

    const myHand = getMyHand();
    const selectedCardData = selectedCards.map(index => myHand[index]);
    
    // Group selected cards into sequences (simplified for now)
    const sequences = [selectedCardData];
    
    gameService.baixar(sequences);
    // Don't clear selection immediately - wait for server response
    setShowBaixarDialog(false);
    showInfo(t('game.messages.playingSequence'), 2000);
  };

  const handleDiscard = (cardIndex: number) => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    gameService.discardCard(cardIndex, cheatsEnabled.allowMultipleDiscard);
    // Don't clear selection immediately - wait for server response
    showInfo(t('game.messages.discardingCard'), 2000);
  };

  const handleMultipleDiscard = () => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    if (selectedCards.length === 0) {
      showWarning(t('game.messages.selectCards'));
      return;
    }

    const discardCount = selectedCards.length;
    showInfo(t('game.messages.discardingCards', { count: discardCount }), 2000);

    // Sort indices in descending order to discard from highest to lowest
    // This prevents index shifting issues when removing cards
    const sortedIndices = [...selectedCards].sort((a, b) => b - a);
    
    let discardedCount = 0;
    let remainingIndices = [...sortedIndices];

    // Function to process the next discard
    const processNextDiscard = () => {
      if (remainingIndices.length === 0) {
        showSuccess(t('game.messages.discardedCards', { count: discardedCount }));
        return;
      }

      const nextIndex = remainingIndices.shift()!;
      discardedCount++;
      
      console.log(`🎮 Discarding card at index ${nextIndex} (${discardedCount}/${discardCount})`);
      
      gameService.discardCard(nextIndex, cheatsEnabled.allowMultipleDiscard);
      
      // Wait for game state update before processing next
      setTimeout(processNextDiscard, 400);
    };

    // Don't clear selection immediately - let server handle it
    
    // Start the discard process
    setTimeout(processNextDiscard, 100);
  };

  const handleBater = (mortoChoice?: number) => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    gameService.bater(mortoChoice);
    showInfo(t('game.messages.attemptingBater'), 2000);
  };

  const handleMortoSelection = (mortoIndex: number) => {
    console.log('🎮 Player selected Morto:', mortoIndex);
    console.log('🎮 Available Mortos before selection:', availableMortos);
    setShowMortoSelection(false);
    setAvailableMortos([]);
    handleBater(mortoIndex);
  };

  const cancelMortoSelection = () => {
    setShowMortoSelection(false);
    setAvailableMortos([]);
    // Action message cleared automatically
  };

  const handleEndTurn = () => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    gameService.endTurn(cheatsEnabled.allowDiscardDrawnCards);
    showInfo(t('game.messages.endingTurn'), 2000);
  };

  const canPlayerBater = (): boolean => {
    const myHand = getMyHand();
    return myHand.length === 0;
  };

  const getTeamSequences = (team: number): Sequence[] => {
    if (!gameState) return [];
    return gameState.teamSequences[team - 1] || [];
  };

  // Generate team display name based on players
  const getTeamDisplayName = (team: number): string => {
    if (!gameState) return `Team ${team}`;
    
    const teamPlayers = gameState.players.filter(player => player.team === team);
    
    if (teamPlayers.length === 0) {
      return `Team ${team}`;
    } else if (teamPlayers.length === 1) {
      // Single player: use first name
      return teamPlayers[0].username;
    } else {
      // Multiple players: use first 2 letters of each name with &
      const teamName = teamPlayers
        .map(player => player.username.substring(0, 2))
        .join('&');
      return teamName;
    }
  };

  // Get team label for display (Your/Opponent based on current user's team)
  const getTeamLabel = (team: number): string => {
    const myPlayer = getCurrentPlayer();
    if (!myPlayer) return getTeamDisplayName(team);
    
    if (myPlayer.team === team) {
      return t('game.sequences.yourSequences');
    } else {
      return t('game.sequences.opponentSequences');
    }
  };


  const isCardDrawnThisTurn = (card: CardType): boolean => {
    if (!gameState || !isMyTurn) return false;
    return gameState.turnState?.drawnCardIds?.includes(card.id) || false;
  };


  const getSortedHand = (hand: CardType[], type: string, order: string) => {
    return [...hand].sort((a, b) => {
      let suitOrder: string[] = [];
      
      switch (type) {
        case 'suit':
          suitOrder = ['hearts', 'diamonds', 'clubs', 'spades', 'joker'];
          break;
        case 'blackred1': // spades, clubs, hearts, diamonds
          suitOrder = ['spades', 'clubs', 'hearts', 'diamonds', 'joker'];
          break;
        case 'blackred2': // spades, hearts, clubs, diamonds
          suitOrder = ['spades', 'hearts', 'clubs', 'diamonds', 'joker'];
          break;
      }
      
      // Sort by suit first
      if (a.suit !== b.suit) {
        const suitComparison = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
        return order === 'asc' ? suitComparison : -suitComparison;
      }
      
      // Then by value
      const valueComparison = a.value - b.value;
      return order === 'asc' ? valueComparison : -valueComparison;
    });
  };

  const applySorting = () => {
    if (!myPlayer || !gameState) return;
    
    const sortedHand = getSortedHand(myPlayer.hand, sortType, sortOrder);
    const newGameState = { ...gameState };
    const playerIndex = newGameState.players.findIndex(p => p.id === myPlayer.id);
    
    if (playerIndex >= 0) {
      newGameState.players[playerIndex].hand = sortedHand;
      setGameState(newGameState);
      // Clear selections since indices will change
      clearSelection();
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    // Apply sorting with new order
    setTimeout(applySorting, 0);
  };

  const cycleSortType = () => {
    setSortType(prev => {
      switch (prev) {
        case 'suit': return 'blackred1';
        case 'blackred1': return 'blackred2';
        case 'blackred2': return 'suit';
        default: return 'suit';
      }
    });
    // Apply sorting with new type
    setTimeout(applySorting, 0);
  };

  const handleCardDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCardIndex !== null && draggedCardIndex !== targetIndex) {
      setDragOverIndex(targetIndex);
    }
  };

  const handleCardDropInHand = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedCardIndex === null || draggedCardIndex === targetIndex) return;
    if (!myPlayer || !gameState) return;

    // Reorder cards in hand
    const newHand = [...myPlayer.hand];
    const draggedCard = newHand.splice(draggedCardIndex, 1)[0];
    
    // If dropping at end of hand (targetIndex >= hand length), adjust targetIndex
    const actualTargetIndex = targetIndex >= newHand.length ? newHand.length : targetIndex;
    newHand.splice(actualTargetIndex, 0, draggedCard);

    // Update selected cards indices
    const newSelectedCards = selectedCards.map(index => {
      if (index === draggedCardIndex) return actualTargetIndex;
      if (index < draggedCardIndex && index >= actualTargetIndex) return index + 1;
      if (index > draggedCardIndex && index <= actualTargetIndex) return index - 1;
      return index;
    });

    // Update game state locally
    const newGameState = { ...gameState };
    const playerIndex = newGameState.players.findIndex(p => p.id === myPlayer.id);
    if (playerIndex >= 0) {
      newGameState.players[playerIndex].hand = newHand;
      setGameState(newGameState);
      updateSelectedCards(newSelectedCards);
    }

    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleAddToSequence = (sequenceId: string) => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    if (selectedCards.length === 0) {
      showWarning(t('game.messages.selectCardsFirst'));
      return;
    }

    gameService.addToSequence(sequenceId, selectedCards);
    clearSelection();
    showInfo(t('game.messages.addingToSequence'), 2000);
  };

  const handleReplaceWildcard = (sequenceId: string, wildcardIndex: number) => {
    if (!isMyTurnOrCheat()) {
      showWarning(t('game.messages.notYourTurn'));
      return;
    }

    if (selectedCards.length !== 1) {
      showWarning('Select exactly one card to replace the wildcard');
      return;
    }

    const replacementCardIndex = selectedCards[0];
    gameService.replaceWildcard(sequenceId, wildcardIndex, replacementCardIndex);
    clearSelection();
    showInfo('Attempting to replace wildcard...', 2000);
  };

  const executeCheatCode = (cheatCode: string) => {
    gameService.sendCheatCode(cheatCode);
    showInfo(`Executing cheat: ${cheatCode}`, 2000);
  };

  const handlePickCard = (cardId: string) => {
    gameService.pickCard(cardId);
    setShowCardPicker(false);
    showInfo('Adding card to hand...', 2000);
  };

  const handleCardDragStart = (cardIndex: number) => {
    setDraggedCardIndex(cardIndex);
  };

  const handleCardDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleCardReorder = (fromIndex: number, toIndex: number) => {
    if (!myPlayer || !gameState || fromIndex === toIndex) return;

    // Reorder cards in hand (same logic as handleCardDropInHand)
    const newHand = [...myPlayer.hand];
    const draggedCard = newHand.splice(fromIndex, 1)[0];
    
    // Adjust target index if necessary
    const actualTargetIndex = toIndex >= newHand.length ? newHand.length : toIndex;
    newHand.splice(actualTargetIndex, 0, draggedCard);

    // Update selected cards indices
    const newSelectedCards = selectedCards.map(index => {
      if (index === fromIndex) return actualTargetIndex;
      if (index < fromIndex && index >= actualTargetIndex) return index + 1;
      if (index > fromIndex && index <= actualTargetIndex) return index - 1;
      return index;
    });

    // Update game state locally
    const newGameState = { ...gameState };
    const playerIndex = newGameState.players.findIndex(p => p.id === myPlayer.id);
    if (playerIndex >= 0) {
      newGameState.players[playerIndex].hand = newHand;
      setGameState(newGameState);
      updateSelectedCards(newSelectedCards);
    }
  };

  const handleSequenceDrop = (e: React.DragEvent, sequenceId: string) => {
    e.preventDefault();
    
    if (!isMyTurnOrCheat() || draggedCardIndex === null) {
      return;
    }

    const myPlayer = getCurrentPlayer();
    if (!myPlayer || myPlayer.team !== myTeam) {
      return;
    }

    // Add the dragged card to the sequence
    gameService.addToSequence(sequenceId, [draggedCardIndex]);
    setDraggedCardIndex(null);
    showInfo(t('game.messages.addingCardToSequence'), 2000);
  };

  const handleSequenceDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const toggleCheat = (cheatName: keyof typeof cheatsEnabled) => {
    setCheatsEnabled(prev => ({
      ...prev,
      [cheatName]: !prev[cheatName]
    }));
  };

  const isMyTurnOrCheat = () => {
    return isMyTurn || cheatsEnabled.allowPlayAllCards;
  };

  if (!gameState) {
    return (
      <div className="game-loading">
        <h2>{t('game.loading.title')}</h2>
        <p>{t('game.loading.connecting')}</p>
      </div>
    );
  }

  const myPlayer = getCurrentPlayer();
  if (!myPlayer) {
    return (
      <div className="game-error">
        <h2>{t('common.error')}</h2>
        <p>{t('game.error.playerData')}</p>
        <button onClick={onLeaveGame}>{t('game.backToLobby')}</button>
      </div>
    );
  }

  const myTeam = myPlayer.team;

  return (
    <div className={`game-table ${!isMobile && isSidebarOpen ? 'chat-sidebar-open' : ''}`}>
      <GameHeader
        gameState={gameState}
        user={user}
        myPlayer={myPlayer}
        isMyTurn={isMyTurn}
        cheatMode={cheatMode}
        onLeaveGame={onLeaveGame}
        onToggleCheatMenu={() => setShowCheatMenu(!showCheatMenu)}
        showCheatMenu={showCheatMenu}
      />

      <ConnectedActionMessage />

      <div className="game-board flex flex-col gap-4">
        {/* User-Requested Layout: Game Board First, then Hands, then Deck */}
        
        {/* Player Area - Hands (2nd Priority) */}
        <div className="player-area order-2 lg:order-2">
          <div className="players-info hidden sm:flex">
            {gameState.players.map((player, index) => (
              <div 
                key={player.id} 
                className={`player-info ${player.id === user.id.toString() ? 'current-user' : ''} ${index === gameState.currentTurn ? 'active-player' : ''}`}
              >
                <span className="player-name">{player.username}</span>
                <span className="player-team">{t('game.players.team', { team: player.team })}</span>
                <span className="player-cards">{t('game.players.cards', { count: player.hand.length })}</span>
                {!player.isConnected && <span className="disconnected">{t('game.players.disconnected')}</span>}
              </div>
            ))}
          </div>

          <HandManager
            cards={myPlayer.hand}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            onCardReorder={handleCardReorder}
            isMyTurn={isMyTurnOrCheat()}
            drawnCardIds={gameState.turnState?.drawnCardIds || []}
            onBaixar={() => setShowBaixarDialog(true)}
            onBater={() => handleBater()}
            onDiscard={handleDiscard}
            onMultipleDiscard={handleMultipleDiscard}
            onEndTurn={handleEndTurn}
            canBaixar={isMyTurnOrCheat() && selectedCards.length >= 3}
            canBater={canPlayerBater()}
            hasBaixado={gameState.teamSequences[myTeam - 1]?.length > 0}
            allowedActions={{
              allowPlayAllCards: cheatsEnabled.allowPlayAllCards,
              allowMultipleDiscard: cheatsEnabled.allowMultipleDiscard,
              allowDiscardDrawnCards: cheatsEnabled.allowDiscardDrawnCards
            }}
            className="my-hand"
          />
        </div>

        {/* End Turn Button - Mobile: Between Hand and Deck, Desktop: Bottom */}
        {isMyTurnOrCheat() && (
          <div className="end-turn-section order-2.5 lg:order-4 flex justify-center py-2">
            <ActionButton
              size="sm"
              variant="warning"
              onClick={handleEndTurn}
              className="font-medium shadow-md"
            >
              {t('game.hand.actions.endTurn')}
            </ActionButton>
          </div>
        )}

        {/* Center Area - Deck Area (3rd Priority) */}
        <div className="center-deck-area order-3 lg:order-3 bg-green-800/20 rounded-lg p-2 flex-shrink-0 min-h-[80px] relative z-10">
          <DeckDisplay
            mainDeckCount={gameState.mainDeck.length}
            onDrawFromMainDeck={handleDrawFromDeck}
            discardPile={gameState.discardPile}
            onDiscardPileClick={handleDiscardPileClick}
            mortosUsed={gameState.mortosUsed}
            mortos={gameState.mortos}
            isMyTurn={isMyTurn}
            allowedActions={{
              allowPlayAllCards: cheatsEnabled.allowPlayAllCards,
              allowMultipleDiscard: cheatsEnabled.allowMultipleDiscard,
              allowDiscardDrawnCards: cheatsEnabled.allowDiscardDrawnCards
            }}
            className="center-area"
          />
        </div>

        {/* Team Sequences - Game Board (1st Priority) */}
        <div className="team-sequences-container order-1 lg:order-1">
          <TeamSequences
            teamNumber={1}
            teamLabel={getTeamLabel(1)}
            teamName={getTeamDisplayName(1)}
            sequences={getTeamSequences(1)}
            myTeam={myTeam}
            isMyTurn={isMyTurn}
            selectedCards={selectedCards}
            draggedCardIndex={draggedCardIndex}
            drawnCardIds={gameState.turnState?.drawnCardIds}
            allowedActions={{
              allowPlayAllCards: cheatsEnabled.allowPlayAllCards,
              allowMultipleDiscard: cheatsEnabled.allowMultipleDiscard,
              allowDiscardDrawnCards: cheatsEnabled.allowDiscardDrawnCards
            }}
            onAddToSequence={handleAddToSequence}
            onReplaceWildcard={handleReplaceWildcard}
            onSequenceDrop={handleSequenceDrop}
            onSequenceDragOver={handleSequenceDragOver}
            className="team-1-sequences"
          />
          
          <TeamSequences
            teamNumber={2}
            teamLabel={getTeamLabel(2)}
            teamName={getTeamDisplayName(2)}
            sequences={getTeamSequences(2)}
            myTeam={myTeam}
            isMyTurn={isMyTurn}
            selectedCards={selectedCards}
            draggedCardIndex={draggedCardIndex}
            drawnCardIds={gameState.turnState?.drawnCardIds}
            allowedActions={{
              allowPlayAllCards: cheatsEnabled.allowPlayAllCards,
              allowMultipleDiscard: cheatsEnabled.allowMultipleDiscard,
              allowDiscardDrawnCards: cheatsEnabled.allowDiscardDrawnCards
            }}
            onAddToSequence={handleAddToSequence}
            onReplaceWildcard={handleReplaceWildcard}
            onSequenceDrop={handleSequenceDrop}
            onSequenceDragOver={handleSequenceDragOver}
            className="team-2-sequences"
          />
        </div>
      </div>

      {showBaixarDialog && (
        <div className="baixar-dialog-overlay">
          <div className="baixar-dialog">
            <h3>{t('game.baixar.confirmTitle')}</h3>
            <p>{t('game.baixar.confirmMessage', { count: selectedCards.length })}</p>
            <div className="selected-cards-preview">
              {selectedCards.map(index => {
                const card = myPlayer.hand[index];
                return (
                  <Card 
                    key={`preview-${index}`}
                    card={card}
                    isDrawnThisTurn={isCardDrawnThisTurn(card)}
                    className="preview-card"
                  />
                );
              })}
            </div>
            <div className="dialog-actions">
              <ActionButton 
                onClick={handleBaixar}
                variant="success"
              >
                {t('game.baixar.confirm')}
              </ActionButton>
              <ActionButton 
                onClick={() => setShowBaixarDialog(false)}
                variant="ghost"
              >
                {t('common.cancel')}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {showCheatMenu && (
        <div className="cheat-menu-overlay">
          <div className="cheat-menu" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>{t('game.cheat.title')} - IDDQD Mode</h3>
            
            {/* Toggle Cheats Section */}
            <div className="cheat-section">
              <h4>Toggle Cheats</h4>
              <div className="cheat-options">
                <div className="cheat-option">
                  <label>
                    <div className="cheat-option-header">
                      <input
                        type="checkbox"
                        checked={cheatsEnabled.allowPlayAllCards}
                        onChange={() => toggleCheat('allowPlayAllCards')}
                      />
                      <span className="cheat-label">{t('game.cheat.options.allowPlayAllCards.title')}</span>
                    </div>
                    <span className="cheat-description">{t('game.cheat.options.allowPlayAllCards.description')}</span>
                  </label>
                </div>
                
                <div className="cheat-option">
                  <label>
                    <div className="cheat-option-header">
                      <input
                        type="checkbox"
                        checked={cheatsEnabled.allowMultipleDiscard}
                        onChange={() => toggleCheat('allowMultipleDiscard')}
                      />
                      <span className="cheat-label">{t('game.cheat.options.allowMultipleDiscard.title')}</span>
                    </div>
                    <span className="cheat-description">{t('game.cheat.options.allowMultipleDiscard.description')}</span>
                  </label>
                </div>
                
                <div className="cheat-option">
                  <label>
                    <div className="cheat-option-header">
                      <input
                        type="checkbox"
                        checked={cheatsEnabled.allowDiscardDrawnCards}
                        onChange={() => toggleCheat('allowDiscardDrawnCards')}
                      />
                      <span className="cheat-label">{t('game.cheat.options.allowDiscardDrawnCards.title')}</span>
                    </div>
                    <span className="cheat-description">{t('game.cheat.options.allowDiscardDrawnCards.description')}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Card Cheats Section */}
            <div className="cheat-section">
              <h4>Card Cheats</h4>
              <div className="cheat-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button onClick={() => executeCheatCode('limpa')} className="action-button cheat-button">
                  🟢 Give Canastra Limpa
                </button>
                <button onClick={() => executeCheatCode('suja')} className="action-button cheat-button">
                  🔴 Give Canastra Suja
                </button>
                <button onClick={() => executeCheatCode('transform')} className="action-button cheat-button">
                  🔄 Setup Transform Test
                </button>
                <button onClick={() => executeCheatCode('aces3')} className="action-button cheat-button">
                  ♠️ Give Three Aces
                </button>
                <button onClick={() => executeCheatCode('pique')} className="action-button cheat-button">
                  ✂️ Reduce to Pique
                </button>
                <button onClick={() => executeCheatCode('discard5')} className="action-button cheat-button">
                  🗑️ Add to Discard Pile
                </button>
                <button onClick={() => executeCheatCode('getcard')} className="action-button cheat-button primary">
                  🎴 Pick Any Card
                </button>
              </div>
            </div>

            {/* Game State Cheats Section */}
            <div className="cheat-section">
              <h4>Game State Cheats</h4>
              <div className="cheat-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button onClick={() => executeCheatCode('morto0')} className="action-button cheat-button">
                  📦 Use Morto 1
                </button>
                <button onClick={() => executeCheatCode('morto1')} className="action-button cheat-button">
                  📦 Use Morto 2
                </button>
                <button onClick={() => executeCheatCode('1500pts')} className="action-button cheat-button">
                  🏆 Set Score 1600
                </button>
                <button onClick={() => executeCheatCode('deadlock')} className="action-button cheat-button">
                  🔒 Create Deadlock
                </button>
                <button onClick={() => executeCheatCode('resetgame')} className="action-button cheat-button danger">
                  🔄 Reset Game
                </button>
              </div>
            </div>

            <div className="cheat-menu-actions">
              <button 
                onClick={() => setShowCheatMenu(false)}
                className="action-button cancel-button"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Picker Modal */}
      {showCardPicker && (
        <div className="card-picker-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-picker-modal" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Select a Card to Add to Your Hand</h3>
            <div className="card-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
              {availableCardsForPicking.map((card) => (
                <div key={card.id} style={{ cursor: 'pointer', width: '60px', height: '84px' }} onClick={() => handlePickCard(card.id)}>
                  <Card
                    card={card}
                    className="clickable-card"
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowCardPicker(false)}
                className="action-button cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ChatSystem - Mobile-optimized with Zustand integration */}
      {gameState && (
        <ChatSystem gameId={gameState.id} />
      )}

      {/* Morto Selection Dialog */}
      {showMortoSelection && (
        <div className="morto-selection-overlay">
          <div className="morto-selection-dialog">
            <h2>{t('game.morto.selection.title')}</h2>
            <p>{t('game.morto.selection.description')}</p>
            
            <div className="morto-selection-options">
              {availableMortos.map(mortoIndex => (
                <button
                  key={mortoIndex}
                  onClick={() => handleMortoSelection(mortoIndex)}
                  className="morto-selection-button"
                >
                  <div className="morto-selection-visual">
                    <div className="morto-deck">
                      <div className="morto-card morto-card-1"></div>
                      <div className="morto-card morto-card-2"></div>
                      <div className="morto-card morto-card-3"></div>
                    </div>
                    <div className="morto-selection-info">
                      <span className="morto-selection-title">{t('game.morto.title', { number: mortoIndex + 1 })}</span>
                      <span className="morto-selection-count">
                        {t('game.morto.cardCount', { count: gameState?.mortos[mortoIndex]?.length || 11 })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="morto-selection-actions">
              <button 
                onClick={cancelMortoSelection}
                className="action-button cancel-button"
              >
                {t('game.morto.selection.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Pile Viewer Panel (Chat-style) */}
      {showDiscardViewer && gameState && (
        <div className="discard-pile-panel">
          <div className="discard-header">
            <h4>{t('game.discardPile.viewerTitle')} ({gameState.discardPile.length})</h4>
            <button 
              onClick={() => setShowDiscardViewer(false)}
              className="discard-close-button"
            >
              ×
            </button>
          </div>
          
          <div className="discard-content">
            {gameState.discardPile.length === 0 ? (
              <div className="empty-discard">
                <p>{t('game.deck.empty')}</p>
              </div>
            ) : (
              <div className="discard-cards-container">
                <div className="discard-cards-list">
                  {sortDiscardCards(gameState.discardPile).map((card, index) => {
                    // IMPORTANT: Use the actual card.id, not a fallback
                    const cardId = card.id;
                    if (!cardId) {
                      console.warn('Card in discard pile missing ID:', card);
                      return null;
                    }
                    const isSelected = selectedDiscardCards.has(cardId);
                    const originalIndex = gameState.discardPile.findIndex(c => c.id === cardId);
                    const actualPosition = originalIndex + 1;
                    
                    return (
                      <div
                        key={`discard-${cardId}-${index}`}
                        className={`discard-card-item ${isSelected ? 'selected' : ''} ${!isMyTurnOrCheat() ? 'view-only' : ''}`}
                        onClick={() => {
                          if (isMyTurnOrCheat()) {
                            const newSelected = new Set(selectedDiscardCards);
                            if (isSelected) {
                              newSelected.delete(cardId);
                            } else {
                              newSelected.add(cardId);
                            }
                            setSelectedDiscardCards(newSelected);
                          }
                        }}
                      >
                        <div className="card-position-indicator">
                          #{actualPosition}
                        </div>
                        <div className="card-display">
                          <Card 
                            card={card}
                            isDrawnThisTurn={isCardDrawnThisTurn(card)}
                            className="discard-list-card"
                          />
                        </div>
                        <div className="card-info">
                          <span className="card-name">{card.suit} {card.value}</span>
                          {isSelected && <span className="selected-indicator">✓ Leave</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {isMyTurnOrCheat() && gameState.discardPile.length > 0 && (
            <div className="discard-actions">
              <button 
                onClick={() => {
                  // Take all cards EXCEPT selected ones (leave selected in pile)
                  if (selectedDiscardCards.size > 0) {
                    const cardsToLeave = Array.from(selectedDiscardCards);
                    const cardsToTakeCount = gameState.discardPile.length - selectedDiscardCards.size;
                    
                    console.log('🎮 CLIENT: Drawing from discard with selection:');
                    console.log('  - Selected cards to LEAVE:', JSON.stringify(cardsToLeave));
                    console.log('  - Cards to LEAVE (raw):', cardsToLeave);
                    console.log('  - Total pile size:', gameState.discardPile.length);
                    console.log('  - Cards to take:', cardsToTakeCount);
                    console.log('  - Discard pile cards:', gameState.discardPile.map(c => ({ id: c.id, card: `${c.value}${c.suit}` })));
                    
                    if (cardsToTakeCount > 0) {
                      gameService.drawCard('discard', cardsToLeave);
                      showInfo(t('game.messages.takingDiscardPile'), 2000);
                    } else {
                      showWarning('Cannot leave all cards - must take at least one');
                      return;
                    }
                  } else {
                    // Take all cards
                    console.log('🎮 CLIENT: Drawing ALL cards from discard pile');
                    handleDrawFromDiscard();
                  }
                  setShowDiscardViewer(false);
                  setSelectedDiscardCards(new Set());
                }}
                className="discard-action-button primary"
                disabled={gameState.discardPile.length === 0 || selectedDiscardCards.size === gameState.discardPile.length}
              >
                {selectedDiscardCards.size > 0 
                  ? `Take ${gameState.discardPile.length - selectedDiscardCards.size} cards (Leave ${selectedDiscardCards.size})`
                  : t('game.discardPile.drawAll')
                }
              </button>
              {selectedDiscardCards.size > 0 && (
                <button 
                  onClick={() => setSelectedDiscardCards(new Set())}
                  className="discard-action-button secondary"
                >
                  {t('game.discardPile.clearSelection')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {gameEnded && (
        <div className="game-ended-overlay">
          <div className="game-ended-dialog">
            <h2>{t('game.gameEnded.title')}</h2>
            <div className="final-scores">
              <div>{t('game.teamScore', { team: 1, score: gameState.matchScores?.[0] || 0 })}</div>
              <div>{t('game.teamScore', { team: 2, score: gameState.matchScores?.[1] || 0 })}</div>
              <div className="winner">
                {t('game.gameEnded.winner', { team: gameState.matchWinner })}
              </div>
            </div>
            <button onClick={onLeaveGame} className="primary-button">
              {t('game.backToLobby')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tips Tooltip */}
      <MobileTipsTooltip
        show={showMobileTips && !hasInteracted && gameState && myPlayer && myPlayer.hand.length > 0}
        onDismiss={() => setShowMobileTips(false)}
      />
    </div>
  );
}