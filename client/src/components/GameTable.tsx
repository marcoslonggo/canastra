import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameState, Player, Card as CardType, Sequence, User, ChatMessage } from '../types';
import { Card, CardBack, CardGroup } from './Card';
import { gameService } from '../services/gameService';
import { LanguageSwitcher } from './LanguageSwitcher';
import './GameTable.css';

interface GameTableProps {
  user: User;
  initialGameState?: GameState;
  onLeaveGame: () => void;
}

export function GameTable({ user, initialGameState, onLeaveGame }: GameTableProps) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState | null>(initialGameState || null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showBaixarDialog, setShowBaixarDialog] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortType, setSortType] = useState<'suit' | 'blackred1' | 'blackred2'>('suit');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [cheatMode, setCheatMode] = useState(false);
  const [showCheatMenu, setShowCheatMenu] = useState(false);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [overlayMessages, setOverlayMessages] = useState<ChatMessage[]>([]);
  const [fadeTimeouts, setFadeTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const maxOverlayMessages = 3;
  const overlayFadeDelay = 4000; // 4 seconds
  const maxChatHistory = 100; // Limit chat history to prevent performance issues
  
  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameStateUpdate?: Function;
    gameEnded?: Function;
    actionError?: Function;
    chatMessage?: Function;
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
        setActionMessage(t('game.messages.connectionError'));
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
    // Auto scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
        setActionMessage(t('game.cheat.allEnabled'));
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence(''); // Reset sequence
      } else if (newSequence === 'cardy') {
        // Show all players' hands (debug mode)
        setActionMessage(t('game.cheat.spyMode'));
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        // This will be handled by CSS class changes
        document.body.classList.toggle('debug-show-all-hands');
      } else if (newSequence === 'winme') {
        // Auto-win current game for testing
        setActionMessage(t('game.cheat.autoWin'));
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        // Send test win signal (we'll implement this in backend)
        if (gameState) {
          gameService.sendChatMessage('DEV_AUTO_WIN_TEST', 'game', gameState.id);
        }
      } else if (newSequence === 'speedx') {
        // Speed up game animations and delays
        setActionMessage(t('game.cheat.speedMode'));
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        document.body.classList.toggle('speed-test-mode');
      } else if (newSequence === 'reset') {
        // Reset all test modes
        setCheatMode(false);
        setActionMessage(t('game.cheat.reset'));
        setTimeout(() => setActionMessage(''), 2000);
        setKeySequence('');
        document.body.classList.remove('debug-show-all-hands', 'speed-test-mode');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence]);

  // Add message to overlay with auto-fade
  const addOverlayMessage = (message: ChatMessage) => {
    setOverlayMessages(prev => {
      const updated = [...prev, message].slice(-maxOverlayMessages);
      
      // Increment unread count and trigger notification animation
      setUnreadCount(prev => prev + 1);
      setHasNewMessages(true);
      setTimeout(() => setHasNewMessages(false), 600);
      
      // Set up fade timeout for this message
      const timeoutId = setTimeout(() => {
        removeOverlayMessage(message.id);
      }, overlayFadeDelay);
      
      setFadeTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.set(message.id, timeoutId);
        return newMap;
      });
      
      return updated;
    });
  };

  // Remove message from overlay
  const removeOverlayMessage = (messageId: string) => {
    setOverlayMessages(prev => prev.filter(msg => msg.id !== messageId));
    setFadeTimeouts(prev => {
      const newMap = new Map(prev);
      const timeoutId = newMap.get(messageId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        newMap.delete(messageId);
      }
      return newMap;
    });
  };

  // Clear overlay messages when chat is opened
  const handleChatToggle = () => {
    const newShowChat = !showChat;
    setShowChat(newShowChat);
    
    if (newShowChat) {
      // Clear overlay messages, timeouts, and unread count when opening chat
      fadeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      setFadeTimeouts(new Map());
      setOverlayMessages([]);
      setHasNewMessages(false);
      setUnreadCount(0); // Reset unread count when chat is opened
    }
  };

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
    if (listenersRef.current.chatMessage) {
      gameService.off('chat-message', listenersRef.current.chatMessage);
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
      setActionMessage('');
    };

    listenersRef.current.gameEnded = (data: { winner: number; scores: number[] }) => {
      setGameEnded(true);
      setActionMessage(t('game.messages.gameEnded', { team: data.winner, score1: data.scores[0], score2: data.scores[1] }));
    };

    listenersRef.current.actionError = (error: { message: string; data?: any }) => {
      console.log('🎮 Action error received:', error);
      
      if (error.message === 'multiple_mortos_available' && error.data?.availableMortos) {
        console.log('🎮 Multiple Mortos available, showing selection:', error.data.availableMortos);
        console.log('🎮 Setting availableMortos state to:', error.data.availableMortos);
        setAvailableMortos(error.data.availableMortos);
        setShowMortoSelection(true);
        setActionMessage(t('game.messages.chooseMoreto'));
      } else {
        console.log('🎮 Other error message:', error.message);
        setActionMessage(`${t('common.error')}: ${error.message}`);
        setTimeout(() => setActionMessage(''), 3000);
      }
    };

    listenersRef.current.error = (error: any) => {
      console.error('Game service error:', error);
      setActionMessage(t('game.messages.connectionError'));
      setTimeout(() => setActionMessage(''), 5000);
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
          message = t(data.translationKey, data.translationParams);
          console.log('🎯 Using translation key:', data.translationKey, 'Result:', message);
        } else if (data.message) {
          message = data.message;
          console.log('🎯 Using direct message:', message);
        }
        
        if (message) {
          console.log('🎯 Setting action message:', message);
          setActionMessage(message);
          setTimeout(() => setActionMessage(''), 4000);
        } else {
          console.log('🎯 No message to display');
        }
      } else {
        console.log('🎯 Skipping message - own action');
      }
    };

    listenersRef.current.chatMessage = (message: ChatMessage) => {
      // Only show messages for this game
      if (message.room === 'game' && message.gameId === gameState?.id) {
        setChatMessages(prev => [...prev, message].slice(-maxChatHistory));
        
        // Add to overlay messages if chat is closed
        if (!showChat) {
          addOverlayMessage(message);
        }
      }
    };

    const chatHistoryHandler = (data: { room: string; gameId?: string; messages: ChatMessage[] }) => {
      console.log('🕹️ GameTable received chat history:', data);
      console.log('🕹️ Current gameState?.id:', gameState?.id);
      console.log('🕹️ Condition check - room:', data.room === 'game', 'gameId match:', data.gameId === gameState?.id);
      if (data.room === 'game' && data.gameId === gameState?.id) {
        console.log('🕹️ Setting game table chat messages:', data.messages.length, 'messages');
        setChatMessages(data.messages.slice(-maxChatHistory));
      } else {
        console.log('🕹️ Not setting messages - condition failed');
      }
    };
    
    // Add the listeners
    gameService.on('game-state-update', listenersRef.current.gameStateUpdate);
    gameService.on('game-ended', listenersRef.current.gameEnded);
    gameService.on('action-error', listenersRef.current.actionError);
    gameService.on('chat-message', listenersRef.current.chatMessage);
    gameService.on('chat-history', chatHistoryHandler);
    gameService.on('error', listenersRef.current.error);
    gameService.on('player-action', listenersRef.current.playerAction);
    
    console.log('🕹️ GameTable event listeners added, including chat-history');
    
    // Note: Chat history will be requested when gameState is available
    // We don't automatically rejoin here to avoid connection loops

    // Handle connection issues
    if (!gameService.isConnected()) {
      setActionMessage(t('game.messages.connectionLost'));
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

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && gameState) {
      gameService.sendChatMessage(chatInput.trim(), 'game', gameState.id);
      setChatInput('');
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      fadeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [fadeTimeouts]);

  const handleCardSelect = (cardIndex: number) => {
    setSelectedCards(prev => {
      if (prev.includes(cardIndex)) {
        return prev.filter(i => i !== cardIndex);
      } else {
        return [...prev, cardIndex];
      }
    });
  };

  const handleDrawFromDeck = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }
    
    gameService.drawCard('deck');
    setActionMessage(t('game.messages.drawingFromDeck'));
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
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }
    
    gameService.drawCard('discard');
    setActionMessage(t('game.messages.takingDiscardPile'));
    setShowDiscardViewer(false);
  };


  const handleBaixar = () => {
    if (selectedCards.length < 3) {
      setActionMessage(t('game.messages.selectAtLeast', { count: 3 }));
      return;
    }

    const myHand = getMyHand();
    const selectedCardData = selectedCards.map(index => myHand[index]);
    
    // Group selected cards into sequences (simplified for now)
    const sequences = [selectedCardData];
    
    gameService.baixar(sequences);
    setSelectedCards([]);
    setShowBaixarDialog(false);
    setActionMessage(t('game.messages.playingSequence'));
  };

  const handleDiscard = (cardIndex: number) => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }

    gameService.discardCard(cardIndex, cheatsEnabled.allowMultipleDiscard);
    setSelectedCards([]);
    setActionMessage(t('game.messages.discardingCard'));
  };

  const handleMultipleDiscard = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }

    if (selectedCards.length === 0) {
      setActionMessage(t('game.messages.selectCards'));
      return;
    }

    const discardCount = selectedCards.length;
    setActionMessage(t('game.messages.discardingCards', { count: discardCount }));

    // Sort indices in descending order to discard from highest to lowest
    // This prevents index shifting issues when removing cards
    const sortedIndices = [...selectedCards].sort((a, b) => b - a);
    
    let discardedCount = 0;
    let remainingIndices = [...sortedIndices];

    // Function to process the next discard
    const processNextDiscard = () => {
      if (remainingIndices.length === 0) {
        setActionMessage(t('game.messages.discardedCards', { count: discardedCount }));
        setTimeout(() => setActionMessage(''), 3000);
        return;
      }

      const nextIndex = remainingIndices.shift()!;
      discardedCount++;
      
      console.log(`🎮 Discarding card at index ${nextIndex} (${discardedCount}/${discardCount})`);
      
      gameService.discardCard(nextIndex, cheatsEnabled.allowMultipleDiscard);
      
      // Wait for game state update before processing next
      setTimeout(processNextDiscard, 400);
    };

    // Clear selection and start processing
    setSelectedCards([]);
    
    // Start the discard process
    setTimeout(processNextDiscard, 100);
  };

  const handleBater = (mortoChoice?: number) => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }

    gameService.bater(mortoChoice);
    setActionMessage(t('game.messages.attemptingBater'));
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
    setActionMessage('');
  };

  const handleEndTurn = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }

    gameService.endTurn(cheatsEnabled.allowDiscardDrawnCards);
    setActionMessage(t('game.messages.endingTurn'));
  };

  const canPlayerBater = (): boolean => {
    const myHand = getMyHand();
    return myHand.length <= 1;
  };

  const getTeamSequences = (team: number): Sequence[] => {
    if (!gameState) return [];
    return gameState.teamSequences[team - 1] || [];
  };

  const getSequenceTypeDisplay = (sequence: Sequence): string => {
    if (sequence.type === 'aces') return t('game.sequences.threeAces');
    if (sequence.isCanastra) {
      switch (sequence.canastraType) {
        case 'as-a-as': return t('game.sequences.canastraAsAAs');
        case 'limpa': return t('game.sequences.canastraLimpa');
        case 'suja': return t('game.sequences.canastraSuja');
        default: return t('game.sequences.canastra');
      }
    }
    return t('game.sequences.sequence');
  };

  const getSortedDiscardPile = (): CardType[] => {
    if (!gameState) return [];
    return [...gameState.discardPile].sort((a, b) => {
      // Sort by suit first, then by value
      if (a.suit !== b.suit) {
        const suitOrder = ['hearts', 'diamonds', 'clubs', 'spades', 'joker'];
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      }
      return a.value - b.value;
    });
  };

  const isCardDrawnThisTurn = (card: CardType): boolean => {
    if (!gameState || !isMyTurn) return false;
    return gameState.turnState?.drawnCardIds?.includes(card.id) || false;
  };

  const sortHand = () => {
    if (!myPlayer) return;
    
    const sortedHand = [...myPlayer.hand].sort((a, b) => {
      const suitOrder = ['hearts', 'diamonds', 'clubs', 'spades', 'joker'];
      
      // Sort by suit first
      if (a.suit !== b.suit) {
        const suitComparison = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
        return sortOrder === 'asc' ? suitComparison : -suitComparison;
      }
      
      // Then by value
      const valueComparison = a.value - b.value;
      return sortOrder === 'asc' ? valueComparison : -valueComparison;
    });

    // Update the player's hand through game service
    // Note: This would need server-side support to persist the order
    // For now, we'll handle it locally by updating the game state
    if (gameState) {
      const newGameState = { ...gameState };
      const playerIndex = newGameState.players.findIndex(p => p.id === myPlayer.id);
      if (playerIndex >= 0) {
        newGameState.players[playerIndex].hand = sortedHand;
        setGameState(newGameState);
      }
    }
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
      setSelectedCards([]);
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
      setSelectedCards(newSelectedCards);
    }

    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleAddToSequence = (sequenceId: string) => {
    if (!isMyTurnOrCheat()) {
      setActionMessage(t('game.messages.notYourTurn'));
      return;
    }

    if (selectedCards.length === 0) {
      setActionMessage(t('game.messages.selectCardsFirst'));
      return;
    }

    gameService.addToSequence(sequenceId, selectedCards);
    setSelectedCards([]);
    setActionMessage(t('game.messages.addingToSequence'));
  };

  const handleCardDragStart = (cardIndex: number) => {
    setDraggedCardIndex(cardIndex);
  };

  const handleCardDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
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
    setActionMessage(t('game.messages.addingCardToSequence'));
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

  const currentPlayer = gameState.players[gameState.currentTurn];
  const myTeam = myPlayer.team;
  const opponentTeam = myTeam === 1 ? 2 : 1;

  return (
    <div className="game-table">
      <div className="game-header">
        <div className="game-info">
          <h2>{t('game.title', { roomCode: gameState.id })}</h2>
          <div className="game-scores">
            <div className={`team-score ${myTeam === 1 ? 'my-team' : ''}`}>
              {t('game.teamScore', { team: 1, score: gameState.scores[0] })}
            </div>
            <div className={`team-score ${myTeam === 2 ? 'my-team' : ''}`}>
              {t('game.teamScore', { team: 2, score: gameState.scores[1] })}
            </div>
          </div>
        </div>
        
        <div className="game-controls">
          <LanguageSwitcher />
          <div className="turn-indicator">
            {isMyTurn ? (
              <span className="my-turn">{t('game.yourTurn')}</span>
            ) : (
              <span className="other-turn">{t('game.opponentTurn', { player: currentPlayer.username })}</span>
            )}
          </div>
          {cheatMode && (
            <button 
              onClick={() => setShowCheatMenu(!showCheatMenu)}
              className="cheat-button"
              title="Cheat Menu"
            >
              {t('game.cheat.title')}
            </button>
          )}
          <button onClick={onLeaveGame} className="leave-button">
            {t('game.leaveGame')}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="action-message">
          {actionMessage}
        </div>
      )}

      <div className="game-board">
        {/* Team Sequences */}
        <div className="team-sequences">
          <div className="team-area">
            <h3>{t('game.sequences.team1')}</h3>
            <div className="sequences-container">
              {getTeamSequences(1).map((sequence, index) => (
                <div 
                  key={sequence.id} 
                  className={`sequence-item ${myTeam === 1 && isMyTurnOrCheat() ? 'sequence-droppable' : ''}`}
                  onDrop={(e) => handleSequenceDrop(e, sequence.id)}
                  onDragOver={handleSequenceDragOver}
                >
                  <div className="sequence-info">
                    <span className="sequence-type">{getSequenceTypeDisplay(sequence)}</span>
                    <span className="sequence-points">{sequence.points} pts</span>
                    {myTeam === 1 && isMyTurnOrCheat() && selectedCards.length > 0 && (
                      <button 
                        onClick={() => handleAddToSequence(sequence.id)}
                        className="add-to-sequence-button"
                        title="Add selected cards to this sequence"
                      >
                        {t('game.hand.actions.addCards')}
                      </button>
                    )}
                  </div>
                  <CardGroup 
                    cards={sequence.cards} 
                    isSequence={true}
                    className="table-sequence"
                    drawnCardIds={gameState.turnState?.drawnCardIds || []}
                  />
                  {myTeam === 1 && isMyTurnOrCheat() && draggedCardIndex !== null && (
                    <div className="drop-indicator">
                      {t('game.hand.dropCardHere')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="team-area">
            <h3>{t('game.sequences.team2')}</h3>
            <div className="sequences-container">
              {getTeamSequences(2).map((sequence, index) => (
                <div 
                  key={sequence.id} 
                  className={`sequence-item ${myTeam === 2 && isMyTurnOrCheat() ? 'sequence-droppable' : ''}`}
                  onDrop={(e) => handleSequenceDrop(e, sequence.id)}
                  onDragOver={handleSequenceDragOver}
                >
                  <div className="sequence-info">
                    <span className="sequence-type">{getSequenceTypeDisplay(sequence)}</span>
                    <span className="sequence-points">{sequence.points} pts</span>
                    {myTeam === 2 && isMyTurnOrCheat() && selectedCards.length > 0 && (
                      <button 
                        onClick={() => handleAddToSequence(sequence.id)}
                        className="add-to-sequence-button"
                        title="Add selected cards to this sequence"
                      >
                        {t('game.hand.actions.addCards')}
                      </button>
                    )}
                  </div>
                  <CardGroup 
                    cards={sequence.cards} 
                    isSequence={true}
                    className="table-sequence"
                    drawnCardIds={gameState.turnState?.drawnCardIds || []}
                  />
                  {myTeam === 2 && isMyTurnOrCheat() && draggedCardIndex !== null && (
                    <div className="drop-indicator">
                      {t('game.hand.dropCardHere')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Area */}
        <div className="center-area">
          <div className="deck-area">
            <div className="deck-section">
              <div className="deck-label">{t('game.deck.mainDeck', { count: gameState.mainDeck.length })}</div>
              <div 
                className="deck-pile"
                onClick={handleDrawFromDeck}
              >
                {gameState.mainDeck.length > 0 ? (
                  <CardBack className="deck-card" />
                ) : (
                  <div className="empty-deck">{t('game.deck.empty')}</div>
                )}
              </div>
            </div>

            <div className="deck-section">
              <div className="deck-label">{t('game.deck.discardPile', { count: gameState.discardPile.length })}</div>
              <div 
                className="discard-pile-container"
                onClick={handleDiscardPileClick}
              >
                {gameState.discardPile.length > 0 ? (
                  <div className="discard-pile-cards">
                    {getSortedDiscardPile().map((card, index) => (
                      <Card 
                        key={`discard-${index}-${card.id || `${card.rank}-${card.suit}`}`}
                        card={card}
                        isDrawnThisTurn={isCardDrawnThisTurn(card)}
                        className="discard-card-small"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-discard">{t('game.deck.empty')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="morto-area">
            <div className="morto-status">
              <div className={`morto-item ${gameState.mortosUsed[0] ? 'morto-used' : 'morto-available'}`}>
                <div className="morto-icon">
                  <div className="morto-deck">
                    <div className="morto-card morto-card-1"></div>
                    <div className="morto-card morto-card-2"></div>
                    <div className="morto-card morto-card-3"></div>
                  </div>
                  <div className="morto-label">
                    <span className="morto-title">{t('game.morto.title', { number: 1 })}</span>
                    <span className="morto-count">{t('game.morto.cardCount', { count: gameState.mortos[0].length })}</span>
                    <span className="morto-status-text">
                      {gameState.mortosUsed[0] ? t('game.morto.used') : t('game.morto.available')}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`morto-item ${gameState.mortosUsed[1] ? 'morto-used' : 'morto-available'}`}>
                <div className="morto-icon">
                  <div className="morto-deck">
                    <div className="morto-card morto-card-1"></div>
                    <div className="morto-card morto-card-2"></div>
                    <div className="morto-card morto-card-3"></div>
                  </div>
                  <div className="morto-label">
                    <span className="morto-title">{t('game.morto.title', { number: 2 })}</span>
                    <span className="morto-count">{t('game.morto.cardCount', { count: gameState.mortos[1].length })}</span>
                    <span className="morto-status-text">
                      {gameState.mortosUsed[1] ? t('game.morto.used') : t('game.morto.available')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Area */}
        <div className="player-area">
          <div className="players-info">
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

          <div className="my-hand">
            <div className="hand-header">
              <h3>{t('game.hand.title', { count: myPlayer.hand.length })}</h3>
              <div className="hand-actions">
                {selectedCards.length > 0 && (
                  <>
                    <button 
                      onClick={() => setShowBaixarDialog(true)}
                      className="action-button baixar-button"
                      disabled={!isMyTurnOrCheat() || selectedCards.length < 3}
                    >
                      {t('game.hand.actions.baixar')} ({selectedCards.length})
                    </button>
                    <button 
                      onClick={() => setSelectedCards([])}
                      className="action-button clear-button"
                    >
                      {t('game.hand.actions.clearSelection')}
                    </button>
                  </>
                )}
                
                {canPlayerBater() && (
                  <button 
                    onClick={() => handleBater()}
                    className="action-button bater-button"
                    disabled={!isMyTurnOrCheat()}
                  >
                    {t('game.hand.actions.bater')}
                  </button>
                )}
                
                {isMyTurnOrCheat() && (
                  <button 
                    onClick={handleEndTurn}
                    className="action-button end-turn-button"
                  >
                    {t('game.hand.actions.endTurn')}
                  </button>
                )}
                
                <div className="sort-button-group">
                  <button 
                    onClick={toggleSortOrder}
                    className="action-button sort-direction-button"
                    title={t('game.hand.sort.direction', { direction: sortOrder === 'asc' ? t('game.hand.sort.ascending') : t('game.hand.sort.descending') })}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                  
                  <button 
                    onClick={cycleSortType}
                    className="action-button sort-pattern-button"
                    title={t('game.hand.sort.pattern', { pattern: sortType === 'suit' ? t('game.hand.sort.suitOrder') : sortType === 'blackred1' ? t('game.hand.sort.blackBlackRedRed') : t('game.hand.sort.blackRedBlackRed') })}
                  >
                    {sortType === 'suit' ? (
                      <span>
                        <span className="suit-black">♠</span>
                        <span className="suit-red">♥</span>
                        <span className="suit-black">♣</span>
                        <span className="suit-red">♦</span>
                      </span>
                    ) : sortType === 'blackred1' ? (
                      <span>
                        <span className="suit-black">♠</span>
                        <span className="suit-black">♣</span>
                        <span className="suit-red">♥</span>
                        <span className="suit-red">♦</span>
                      </span>
                    ) : (
                      <span>
                        <span className="suit-black">♠</span>
                        <span className="suit-red">♥</span>
                        <span className="suit-black">♣</span>
                        <span className="suit-red">♦</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="hand-cards">
              {myPlayer.hand.map((card, index) => (
                <div
                  key={`${card.id || `${card.rank}-${card.suit}-${index}`}`}
                  onDragOver={(e) => handleCardDragOver(e, index)}
                  onDrop={(e) => handleCardDropInHand(e, index)}
                  className={`card-drop-zone ${dragOverIndex === index ? 'drag-over' : ''}`}
                >
                  {dragOverIndex === index && draggedCardIndex !== null && draggedCardIndex !== index && (
                    <div className="card-drop-preview">
                      <Card
                        card={myPlayer.hand[draggedCardIndex]}
                        className="ghost-card"
                      />
                    </div>
                  )}
                  <Card
                    card={card}
                    isSelected={selectedCards.includes(index)}
                    isDraggable={true}
                    isDrawnThisTurn={isCardDrawnThisTurn(card)}
                    onClick={() => handleCardSelect(index)}
                    onDragStart={() => handleCardDragStart(index)}
                    onDragEnd={handleCardDragEnd}
                    className="hand-card"
                  />
                </div>
              ))}
              {/* End-of-hand drop zone */}
              <div
                onDragOver={(e) => handleCardDragOver(e, myPlayer.hand.length)}
                onDrop={(e) => handleCardDropInHand(e, myPlayer.hand.length)}
                className={`card-drop-zone-end ${dragOverIndex === myPlayer.hand.length ? 'drag-over' : ''}`}
              >
                {dragOverIndex === myPlayer.hand.length && draggedCardIndex !== null && (
                  <div className="card-drop-preview">
                    <Card
                      card={myPlayer.hand[draggedCardIndex]}
                      className="ghost-card"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {isMyTurnOrCheat() && selectedCards.length >= 1 && (
            <div className="discard-action">
              {selectedCards.length === 1 || !cheatsEnabled.allowMultipleDiscard ? (
                <button 
                  onClick={() => handleDiscard(selectedCards[0])}
                  className="action-button discard-button"
                >
                  {t('game.hand.actions.discard')}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleDiscard(selectedCards[0])}
                    className="action-button discard-button"
                  >
                    {t('game.hand.actions.discardOne')}
                  </button>
                  {cheatsEnabled.allowMultipleDiscard && selectedCards.length > 1 && (
                    <button 
                      onClick={handleMultipleDiscard}
                      className="action-button discard-button cheat-multi-discard"
                    >
                      {t('game.hand.actions.discardMultiple', { count: selectedCards.length })}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
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
              <button 
                onClick={handleBaixar}
                className="action-button confirm-button"
              >
                {t('game.baixar.confirm')}
              </button>
              <button 
                onClick={() => setShowBaixarDialog(false)}
                className="action-button cancel-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheatMenu && (
        <div className="cheat-menu-overlay">
          <div className="cheat-menu">
            <h3>{t('game.cheat.title')}</h3>
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

      {/* Modern Chat Toggle Button */}
      <button 
        onClick={handleChatToggle}
        className={`chat-toggle-button ${showChat ? 'chat-open' : ''} ${hasNewMessages ? 'new-message' : ''}`}
        title={showChat ? t('game.chat.hideChat') : t('game.chat.showChat')}
      >
{t('game.chat.title')}{unreadCount > 0 && !showChat ? ` (${unreadCount})` : ''}
      </button>

      {/* Chat Panel */}
      {showChat && (
        <div className="game-chat-panel">
          <div className="chat-header">
            <h4>{t('game.chat.title')}</h4>
            <button 
              onClick={() => setShowChat(false)}
              className="chat-close-button"
            >
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">{t('game.chat.noMessages')}</div>
            ) : (
              chatMessages.map((message, index) => (
                <div key={`${message.id}-${index}`} className="chat-message">
                  <span className="message-author">{message.username}:</span>
                  <span className="message-text">{message.message}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          
          <form onSubmit={handleSendChat} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('game.chat.placeholder')}
              maxLength={200}
              className="chat-input"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="chat-send-button"
            >
              {t('game.chat.send')}
            </button>
          </form>
        </div>
      )}

      {/* Floating Overlay Messages (Auto-fade) */}
      {!showChat && overlayMessages.length > 0 && (
        <div className="chat-overlay-messages">
          {overlayMessages.map((message) => (
            <div key={message.id} className="overlay-message">
              <span className="message-author">{message.username}:</span>
              <span className="message-text">{message.message}</span>
            </div>
          ))}
        </div>
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
                      setActionMessage(t('game.messages.takingDiscardPile'));
                    } else {
                      setActionMessage('Cannot leave all cards - must take at least one');
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
              <div>{t('game.teamScore', { team: 1, score: gameState.scores[0] })}</div>
              <div>{t('game.teamScore', { team: 2, score: gameState.scores[1] })}</div>
              <div className="winner">
                {t('game.gameEnded.winner', { team: gameState.winner })}
              </div>
            </div>
            <button onClick={onLeaveGame} className="primary-button">
              {t('game.backToLobby')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}