import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, Card as CardType, Sequence, User, ChatMessage } from '../types';
import { Card, CardBack, CardGroup } from './Card';
import { gameService } from '../services/gameService';
import './GameTable.css';

interface GameTableProps {
  user: User;
  initialGameState?: GameState;
  onLeaveGame: () => void;
}

export function GameTable({ user, initialGameState, onLeaveGame }: GameTableProps) {
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
    allowDiscardDrawnCards: false
  });
  const [keySequence, setKeySequence] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameStateUpdate?: Function;
    gameEnded?: Function;
    actionError?: Function;
    chatMessage?: Function;
    error?: Function;
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
        setActionMessage('Connection lost. Reconnecting...');
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
        setActionMessage('Cheat mode activated! 🎮');
        setTimeout(() => setActionMessage(''), 2000);
        setKeySequence(''); // Reset sequence
      } else if (newSequence === 'cardy') {
        // Show all players' hands (debug mode)
        setActionMessage('🔍 Card spy mode activated! All hands visible');
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        // This will be handled by CSS class changes
        document.body.classList.toggle('debug-show-all-hands');
      } else if (newSequence === 'winme') {
        // Auto-win current game for testing
        setActionMessage('🏆 Auto-win activated for testing!');
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        // Send test win signal (we'll implement this in backend)
        if (gameState) {
          gameService.sendChatMessage('DEV_AUTO_WIN_TEST', 'game', gameState.id);
        }
      } else if (newSequence === 'speedx') {
        // Speed up game animations and delays
        setActionMessage('⚡ Speed mode activated! Fast animations');
        setTimeout(() => setActionMessage(''), 3000);
        setKeySequence('');
        document.body.classList.toggle('speed-test-mode');
      } else if (newSequence === 'reset') {
        // Reset all test modes
        setCheatMode(false);
        setActionMessage('🔄 All test modes disabled');
        setTimeout(() => setActionMessage(''), 2000);
        setKeySequence('');
        document.body.classList.remove('debug-show-all-hands', 'speed-test-mode');
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
    if (listenersRef.current.chatMessage) {
      gameService.off('chat-message', listenersRef.current.chatMessage);
    }
    if (listenersRef.current.error) {
      gameService.off('error', listenersRef.current.error);
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
      setActionMessage(`Game ended! Team ${data.winner} wins! Scores: ${data.scores[0]} - ${data.scores[1]}`);
    };

    listenersRef.current.actionError = (error: { message: string }) => {
      setActionMessage(`Error: ${error.message}`);
      setTimeout(() => setActionMessage(''), 3000);
    };

    listenersRef.current.error = (error: any) => {
      console.error('Game service error:', error);
      setActionMessage('Connection error. Trying to reconnect...');
      setTimeout(() => setActionMessage(''), 5000);
    };

    listenersRef.current.chatMessage = (message: ChatMessage) => {
      // Only show messages for this game
      if (message.room === 'game' && message.gameId === gameState?.id) {
        setChatMessages(prev => [...prev, message]);
      }
    };

    const chatHistoryHandler = (data: { room: string; gameId?: string; messages: ChatMessage[] }) => {
      console.log('🕹️ GameTable received chat history:', data);
      console.log('🕹️ Current gameState?.id:', gameState?.id);
      console.log('🕹️ Condition check - room:', data.room === 'game', 'gameId match:', data.gameId === gameState?.id);
      if (data.room === 'game' && data.gameId === gameState?.id) {
        console.log('🕹️ Setting game table chat messages:', data.messages.length, 'messages');
        setChatMessages(data.messages);
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
    
    console.log('🕹️ GameTable event listeners added, including chat-history');
    
    // Request chat history for current game if we have gameState
    if (gameState?.id) {
      console.log('🕹️ Requesting chat history for game:', gameState.id);
      // Re-join the game room to trigger chat history send
      gameService.joinGame(gameState.id);
    }

    // Handle connection issues
    if (!gameService.isConnected()) {
      setActionMessage('Connection lost. Please refresh if issues persist.');
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
      setActionMessage('Not your turn!');
      return;
    }
    
    gameService.drawCard('deck');
    setActionMessage('Drawing from deck...');
  };

  const handleDrawFromDiscard = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage('Not your turn!');
      return;
    }
    
    gameService.drawCard('discard');
    setActionMessage('Taking discard pile...');
  };

  const handleBaixar = () => {
    if (selectedCards.length < 3) {
      setActionMessage('Select at least 3 cards to baixar');
      return;
    }

    const myHand = getMyHand();
    const selectedCardData = selectedCards.map(index => myHand[index]);
    
    // Group selected cards into sequences (simplified for now)
    const sequences = [selectedCardData];
    
    gameService.baixar(sequences);
    setSelectedCards([]);
    setShowBaixarDialog(false);
    setActionMessage('Playing sequence...');
  };

  const handleDiscard = (cardIndex: number) => {
    if (!isMyTurnOrCheat()) {
      setActionMessage('Not your turn!');
      return;
    }

    gameService.discardCard(cardIndex, cheatsEnabled.allowMultipleDiscard);
    setSelectedCards([]);
    setActionMessage('Discarding card...');
  };

  const handleMultipleDiscard = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage('Not your turn!');
      return;
    }

    if (selectedCards.length === 0) {
      setActionMessage('Select cards to discard!');
      return;
    }

    const myHand = getMyHand();
    const cardsToDiscard = selectedCards.map(index => myHand[index]);
    const discardCount = selectedCards.length;
    
    setActionMessage(`Discarding ${discardCount} cards...`);

    // Create a queue of cards to discard
    let discardQueue = [...cardsToDiscard];
    let discardedCount = 0;

    // Function to process the next discard
    const processNextDiscard = () => {
      if (discardQueue.length === 0) {
        setActionMessage(`Successfully discarded ${discardedCount} cards!`);
        setTimeout(() => setActionMessage(''), 3000);
        return;
      }

      // Get current hand state
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) {
        setActionMessage('Failed to get current player state');
        return;
      }

      const currentHand = currentPlayer.hand;
      const cardToDiscard = discardQueue[0];
      
      // Find current index of this card
      const currentIndex = currentHand.findIndex(card => card.id === cardToDiscard.id);
      
      if (currentIndex >= 0) {
        // Remove from queue and discard
        discardQueue = discardQueue.slice(1);
        discardedCount++;
        
        gameService.discardCard(currentIndex, cheatsEnabled.allowMultipleDiscard);
        
        // Wait for game state update before processing next
        setTimeout(processNextDiscard, 300);
      } else {
        // Card not found in hand (maybe already discarded), skip it
        discardQueue = discardQueue.slice(1);
        setTimeout(processNextDiscard, 50);
      }
    };

    // Clear selection and start processing
    setSelectedCards([]);
    
    // Start the discard process
    setTimeout(processNextDiscard, 100);
  };

  const handleBater = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage('Not your turn!');
      return;
    }

    gameService.bater();
    setActionMessage('Attempting to Bater...');
  };

  const handleEndTurn = () => {
    if (!isMyTurnOrCheat()) {
      setActionMessage('Not your turn!');
      return;
    }

    gameService.endTurn(cheatsEnabled.allowDiscardDrawnCards);
    setActionMessage('Ending turn...');
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
    if (sequence.type === 'aces') return 'Three Aces';
    if (sequence.isCanastra) {
      switch (sequence.canastraType) {
        case 'as-a-as': return 'Canastra Ás-à-Ás (+1000)';
        case 'limpa': return 'Canastra Limpa (+200)';
        case 'suja': return 'Canastra Suja (+100)';
        default: return 'Canastra';
      }
    }
    return 'Sequence';
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
      setActionMessage('Not your turn!');
      return;
    }

    if (selectedCards.length === 0) {
      setActionMessage('Select cards first!');
      return;
    }

    gameService.addToSequence(sequenceId, selectedCards);
    setSelectedCards([]);
    setActionMessage('Adding cards to sequence...');
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
    setActionMessage('Adding card to sequence...');
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
        <h2>Loading game...</h2>
        <p>Connecting to game server...</p>
      </div>
    );
  }

  const myPlayer = getCurrentPlayer();
  if (!myPlayer) {
    return (
      <div className="game-error">
        <h2>Error</h2>
        <p>Could not find player data</p>
        <button onClick={onLeaveGame}>Back to Lobby</button>
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
          <h2>Buraco - Room {gameState.id}</h2>
          <div className="game-scores">
            <div className={`team-score ${myTeam === 1 ? 'my-team' : ''}`}>
              Team 1: {gameState.scores[0]} points
            </div>
            <div className={`team-score ${myTeam === 2 ? 'my-team' : ''}`}>
              Team 2: {gameState.scores[1]} points
            </div>
          </div>
        </div>
        
        <div className="game-controls">
          <div className="turn-indicator">
            {isMyTurn ? (
              <span className="my-turn">Your Turn</span>
            ) : (
              <span className="other-turn">{currentPlayer.username}'s Turn</span>
            )}
          </div>
          {cheatMode && (
            <button 
              onClick={() => setShowCheatMenu(!showCheatMenu)}
              className="cheat-button"
              title="Cheat Menu"
            >
              🎮 Cheats
            </button>
          )}
          <button onClick={onLeaveGame} className="leave-button">
            Leave Game
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
            <h3>Team 1 Sequences</h3>
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
                        + Add Cards
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
                      Drop card here
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="team-area">
            <h3>Team 2 Sequences</h3>
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
                        + Add Cards
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
                      Drop card here
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
              <div className="deck-label">Main Deck ({gameState.mainDeck.length})</div>
              <div 
                className="deck-pile"
                onClick={handleDrawFromDeck}
              >
                {gameState.mainDeck.length > 0 ? (
                  <CardBack className="deck-card" />
                ) : (
                  <div className="empty-deck">Empty</div>
                )}
              </div>
            </div>

            <div className="deck-section">
              <div className="deck-label">Discard Pile ({gameState.discardPile.length})</div>
              <div 
                className="discard-pile-container"
                onClick={handleDrawFromDiscard}
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
                  <div className="empty-discard">Empty</div>
                )}
              </div>
            </div>
          </div>

          <div className="morto-area">
            <div className="morto-status">
              <div className="morto-item">
                <span>Morto 1: {gameState.mortosUsed[0] ? 'Used' : 'Available'}</span>
                <span>({gameState.mortos[0].length} cards)</span>
              </div>
              <div className="morto-item">
                <span>Morto 2: {gameState.mortosUsed[1] ? 'Used' : 'Available'}</span>
                <span>({gameState.mortos[1].length} cards)</span>
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
                <span className="player-team">Team {player.team}</span>
                <span className="player-cards">{player.hand.length} cards</span>
                {!player.isConnected && <span className="disconnected">Disconnected</span>}
              </div>
            ))}
          </div>

          <div className="my-hand">
            <div className="hand-header">
              <h3>Your Hand ({myPlayer.hand.length} cards)</h3>
              <div className="hand-actions">
                {selectedCards.length > 0 && (
                  <>
                    <button 
                      onClick={() => setShowBaixarDialog(true)}
                      className="action-button baixar-button"
                      disabled={!isMyTurnOrCheat() || selectedCards.length < 3}
                    >
                      Baixar ({selectedCards.length})
                    </button>
                    <button 
                      onClick={() => setSelectedCards([])}
                      className="action-button clear-button"
                    >
                      Clear Selection
                    </button>
                  </>
                )}
                
                {canPlayerBater() && (
                  <button 
                    onClick={handleBater}
                    className="action-button bater-button"
                    disabled={!isMyTurnOrCheat()}
                  >
                    Bater
                  </button>
                )}
                
                {isMyTurnOrCheat() && (
                  <button 
                    onClick={handleEndTurn}
                    className="action-button end-turn-button"
                  >
                    End Turn
                  </button>
                )}
                
                <div className="sort-button-group">
                  <button 
                    onClick={toggleSortOrder}
                    className="action-button sort-direction-button"
                    title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                  
                  <button 
                    onClick={cycleSortType}
                    className="action-button sort-pattern-button"
                    title={`Sort by ${sortType === 'suit' ? 'suit order' : sortType === 'blackred1' ? 'black/black/red/red' : 'black/red/black/red'}`}
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
                  Discard Selected Card
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleDiscard(selectedCards[0])}
                    className="action-button discard-button"
                  >
                    Discard One Card
                  </button>
                  {cheatsEnabled.allowMultipleDiscard && selectedCards.length > 1 && (
                    <button 
                      onClick={handleMultipleDiscard}
                      className="action-button discard-button cheat-multi-discard"
                    >
                      🎮 Discard All {selectedCards.length} Cards
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
            <h3>Confirm Baixar</h3>
            <p>Do you want to baixar {selectedCards.length} selected cards?</p>
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
                Confirm Baixar
              </button>
              <button 
                onClick={() => setShowBaixarDialog(false)}
                className="action-button cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheatMenu && (
        <div className="cheat-menu-overlay">
          <div className="cheat-menu">
            <h3>🎮 Cheat Menu</h3>
            <div className="cheat-options">
              <div className="cheat-option">
                <label>
                  <div className="cheat-option-header">
                    <input
                      type="checkbox"
                      checked={cheatsEnabled.allowPlayAllCards}
                      onChange={() => toggleCheat('allowPlayAllCards')}
                    />
                    <span className="cheat-label">Allow play all cards (ignore turn)</span>
                  </div>
                  <span className="cheat-description">Play cards even when it's not your turn</span>
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
                    <span className="cheat-label">Allow multiple card discard</span>
                  </div>
                  <span className="cheat-description">Discard as many cards as you want at once</span>
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
                    <span className="cheat-label">Allow discarding drawn cards</span>
                  </div>
                  <span className="cheat-description">End turn even if you discard the same card you drew</span>
                </label>
              </div>
            </div>
            <div className="cheat-menu-actions">
              <button 
                onClick={() => setShowCheatMenu(false)}
                className="action-button cancel-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button 
        onClick={() => setShowChat(!showChat)}
        className="chat-toggle-button"
        title={showChat ? 'Hide Chat' : 'Show Chat'}
      >
        💬 {showChat ? 'Hide' : 'Chat'}
      </button>

      {/* Chat Panel */}
      {showChat && (
        <div className="game-chat-panel">
          <div className="chat-header">
            <h4>Game Chat</h4>
            <button 
              onClick={() => setShowChat(false)}
              className="chat-close-button"
            >
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">No messages yet. Start the conversation!</div>
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
              placeholder="Type a message..."
              maxLength={200}
              className="chat-input"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="chat-send-button"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {gameEnded && (
        <div className="game-ended-overlay">
          <div className="game-ended-dialog">
            <h2>Game Ended!</h2>
            <div className="final-scores">
              <div>Team 1: {gameState.scores[0]} points</div>
              <div>Team 2: {gameState.scores[1]} points</div>
              <div className="winner">
                Team {gameState.winner} Wins! 🎉
              </div>
            </div>
            <button onClick={onLeaveGame} className="primary-button">
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}