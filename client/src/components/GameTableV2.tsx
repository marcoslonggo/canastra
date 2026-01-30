import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { GameState, Player, Card as CardType, Sequence, User } from '../types';
import { Card } from './Card';
import { gameService } from '../services/gameService';
import { ChatSystem } from './organisms/ChatSystem';
import { useChatStore } from '../stores/chatStore';
import { ConnectedActionMessage, useActionMessage } from './atoms/ActionMessage';
import { useGameStore, gameSelectors } from '../stores/gameStore';
import { useUIStore, useResponsiveUpdates } from '../stores/uiStore';
import { Modal } from "./atoms/Modal";

// Icon components using inline SVG (same as BuracoMockup)
const Settings = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Globe = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const LogOut = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Users = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v12z" />
  </svg>
);

const Crown = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm2.7-2h8.6l.9-4.4L14 12l-2-4-2 4-3.2-2.4L7.7 14z"/>
  </svg>
);

const Info = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SortAsc = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const MessageCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Eye = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Bug = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0H7" />
  </svg>
);

const Zap = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 0L11 8H4L12 16L14 8H21L13 0Z"/>
  </svg>
);

const X = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Helper function to create card object for face-down cards
function createFaceDownCard(): CardType {
  return {
    id: 'face-down',
    suit: 'spades',
    rank: 'A',
    value: 1,
    points: 0,
    isWild: false
  };
}

// CardBack component for face-down cards
function GameCardBack({ small = false, onClick }: { small?: boolean; onClick?: () => void }) {
  const { isMobile } = useUIStore();
  const width = small ? '40px' : (isMobile ? '56px' : '64px');
  const height = small ? '56px' : (isMobile ? '78px' : '90px');
  
  return (
    <div
      className={`card card-back flex-shrink-0 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
      style={{ 
        '--card-width': width, 
        '--card-height': height 
      } as React.CSSProperties}
    >
      <div className="card-back-pattern">
        <div className="card-back-logo">♠♥♣♦</div>
      </div>
    </div>
  );
}

// Mortos pile component
function MortoPile({ mortos, mortosUsed, onClick }: {
  mortos: [CardType[], CardType[]];
  mortosUsed: [boolean, boolean];
  onClick?: () => void;
}) {
  const { isMobile } = useUIStore();
  const { t } = useTranslation();
  
  // Count available mortos - add safety checks
  const availableCount = mortosUsed ? mortosUsed.filter(used => !used).length : 0;
  const totalCards = (mortos?.[0]?.length || 0) + (mortos?.[1]?.length || 0);
  
  return (
    <div className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={onClick}>
      <div className="relative">
        {/* Stack illusion */}
        <div className="absolute inset-0 bg-gray-800 rounded-lg transform translate-x-1 translate-y-1"></div>
        <div className="absolute inset-0 bg-gray-700 rounded-lg transform translate-x-0.5 translate-y-0.5"></div>
        
        {/* Main pile */}
        <div 
          className="card card-back flex-shrink-0 flex items-center justify-center"
          style={{ 
            '--card-width': isMobile ? '56px' : '64px', 
            '--card-height': isMobile ? '78px' : '90px' 
          } as React.CSSProperties}
        >
          <div className="flex flex-col items-center justify-center text-white">
            {/* Coffin emoji */}
            <div className="text-2xl">⚰️</div>
            <div className="text-xs font-bold mt-1">{availableCount}</div>
          </div>
        </div>
      </div>
      
      <div className="text-xs md:text-sm text-slate-300 text-center">
        {t('game.mortos.label')} · {totalCards}
      </div>
    </div>
  );
}

// Stack pile component
function StackPile({ label, count, topCard, faceDown = false, onClick }: { 
  label: string; 
  count: number; 
  topCard?: CardType; 
  faceDown?: boolean; 
  onClick?: () => void; 
}) {
  const { isMobile } = useUIStore();
  return (
    <div className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={onClick}>
      <div className="relative">
        {/* stack illusion */}
        <div className="absolute -top-1 -left-1 rotate-[-3deg]">
          <GameCardBack small />
        </div>
        <div className="absolute -top-0.5 -left-0.5 rotate-[2deg]">
          <GameCardBack small />
        </div>
        <div className="relative">
          {faceDown ? (
            <GameCardBack />
          ) : topCard ? (
            <Card 
              card={topCard} 
              className="flex-shrink-0"
              style={{ 
                '--card-width': `${isMobile ? '56px' : '64px'}`, 
                '--card-height': `${isMobile ? '78px' : '90px'}` 
              } as React.CSSProperties}
            />
          ) : (
            <GameCardBack />
          )}
        </div>
      </div>
      <div className="text-xs md:text-sm text-slate-300 flex items-center gap-1">
        {label} · {count}
        {onClick && <Eye className="w-3 h-3" />}
      </div>
    </div>
  );
}

// Player badge component  
function PlayerBadge({ name, active = false, team = 1, cardCount = 11, vertical = false }: { 
  name: string; 
  active?: boolean; 
  team?: 1 | 2; 
  cardCount?: number; 
  vertical?: boolean; 
}) {
  const color = team === 1 ? "bg-emerald-600" : "bg-indigo-600";

  if (vertical) {
    return (
      <div
        className={[
          "relative shrink-0 w-12 md:w-14 min-h-32 md:min-h-40",
          "flex flex-col items-center justify-between rounded-lg text-white border border-white/20",
          "px-2 py-3 gap-1",
          color,
          active ? "ring-2 ring-yellow-400 shadow-lg" : "shadow-md",
        ].join(" ")}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <div className="bg-black/30 px-1.5 py-1 rounded text-[10px] md:text-xs font-medium text-center leading-tight border border-white/20 w-full">
          {name.length > 4 ? name.slice(0, 4) : name}
        </div>
        <div className="bg-black/40 px-1.5 py-1 rounded-md text-[11px] md:text-xs font-bold text-center leading-none border border-white/30 w-full flex items-center justify-center gap-1">
          <span className="text-yellow-300">🂠</span>
          <span>{cardCount}</span>
        </div>
        {active && (
          <div className="absolute -top-1 -right-1">
            <Crown className="w-3 h-3 text-yellow-400 bg-yellow-400/20 rounded-full p-0.5" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={["px-2 py-1 rounded-xl text-xs md:text-sm flex items-center gap-1 text-white border border-slate-700", color, active ? "ring-2 ring-yellow-400" : ""].join(" ")}>
      <Users className="w-3 h-3" />
      <span className="font-medium">{name}</span>
      <span className="ml-1 bg-black/20 px-1.5 py-0.5 rounded-md">🂠 {cardCount}</span>
      {active && <Crown className="w-3 h-3" />}
    </div>
  );
}

// Team scoreboard
function TeamScoreboard({ team1Score = 0, team2Score = 0 }: { team1Score?: number; team2Score?: number }) {
  return (
    <div className="mx-auto max-w-md w-full">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border border-emerald-700 bg-emerald-900/50 p-2">
          <div className="text-[10px] md:text-xs uppercase tracking-wide text-emerald-200/80">Team 1</div>
          <div className="text-xl md:text-2xl font-semibold">{team1Score}</div>
        </div>
        <div className="rounded-2xl border border-indigo-700 bg-indigo-900/50 p-2">
          <div className="text-[10px] md:text-xs uppercase tracking-wide text-indigo-200/80">Team 2</div>
          <div className="text-xl md:text-2xl font-semibold">{team2Score}</div>
        </div>
      </div>
    </div>
  );
}

interface GameTableV2Props {
  user: User;
  initialGameState?: GameState;
  onLeaveGame: () => void;
}

export default function GameTableV2({ user, initialGameState, onLeaveGame }: GameTableV2Props) {
  const { t } = useTranslation();
  
  // Game state management (same as original GameTable)
  const [gameState, setGameState] = useState<GameState | null>(initialGameState || null);
  const selectedCards = useGameStore(gameSelectors.selectedCardIndices);
  const { toggleCardSelection, clearSelection } = useGameStore();
  const { isSidebarOpen } = useChatStore();
  const { isMobile } = useUIStore();
  useResponsiveUpdates();
  
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const { showInfo, showError, showSuccess, showWarning } = useActionMessage();
  
  // UI state for panels
  const [adminOpen, setAdminOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [cheatMenuOpen, setCheatMenuOpen] = useState(false);
  const [showDiscardViewer, setShowDiscardViewer] = useState(false);
  const [selectedDiscardCards, setSelectedDiscardCards] = useState<Set<string>>(new Set());
  const [isMortosModalOpen, setIsMortosModalOpen] = useState(false);
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortType, setSortType] = useState<'suit' | 'blackred1' | 'blackred2'>('suit');
  
  // Cheat system (same as original)
  const [cheatsEnabled, setCheatsEnabled] = useState({
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
    allowViewAllHands: false
  });
  const [keySequence, setKeySequence] = useState('');

  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameStateUpdate?: Function;
    gameEnded?: Function;
    actionError?: Function;
    error?: Function;
    playerAction?: Function;
  }>({});

  // Set up game event listeners (same as original GameTable)
  const setupGameEventListeners = () => {
    listenersRef.current.gameStateUpdate = (newGameState: GameState) => {
      console.log('🔄 V2 Game state update received:', {
        sequences: newGameState.teamSequences,
        players: newGameState.players.length,
        currentTurn: newGameState.currentTurn
      });
      setGameState(newGameState);
      updateTurnStatus(newGameState);
      // Clear selection when game state updates (after successful action)
      clearSelection();
    };

    listenersRef.current.gameEnded = (data: { winner: number; scores: number[] }) => {
      setGameEnded(true);
      showSuccess(t('game.messages.gameEnded', { team: data.winner, score1: data.scores[0], score2: data.scores[1] }));
    };

    listenersRef.current.actionError = (error: { message: string; data?: any }) => {
      console.log('🎮 V2 Action error received:', error);
      
      // Check if this is actually a card picker response (not really an error)
      if (error.data?.action === 'show-card-picker' && error.data?.cards) {
        console.log('🎮 V2 Card picker data received:', error.data.cards.length, 'cards');
        // Handle card picker if needed in V2
        showInfo('Select a card to add to your hand');
        return;
      }
      
      if (error.message === 'multiple_mortos_available' && error.data?.availableMortos) {
        console.log('🎮 V2 Multiple Mortos available');
        showInfo(t('game.messages.chooseMoreto'));
      } else {
        console.log('🎮 V2 Other error message:', error.message);
        showError(`${t('common.error')}: ${error.message}`);
      }
    };

    listenersRef.current.error = (error: any) => {
      console.error('V2 Game service error:', error);
      showError(t('game.messages.connectionError'), 5000);
    };

    // Handle player actions from other players
    listenersRef.current.playerAction = (data: any) => {
      console.log('🎯 V2 PlayerAction handler received:', data);
      console.log('🎯 V2 Current user ID:', user.id, 'Data playerId:', data.playerId);
      
      // Only show if it's not the current user's action
      if (data.playerId !== user.id.toString()) {
        let message = '';
        
        // Handle both old format (message) and new format (translationKey + translationParams)
        if (data.translationKey && data.translationParams) {
          message = t(data.translationKey, data.translationParams) as string;
          console.log('🎯 V2 Using translation key:', data.translationKey, 'Result:', message);
        } else if (data.message) {
          message = data.message;
          console.log('🎯 V2 Using direct message:', message);
        }
        
        if (message) {
          console.log('🎯 V2 Setting action message:', message);
          showInfo(message);
        } else {
          console.log('🎯 V2 No message to display');
        }
      } else {
        console.log('🎯 V2 Skipping message - own action');
      }
    };

    // Set up listeners with correct event names (kebab-case)
    gameService.on('game-state-update', listenersRef.current.gameStateUpdate);
    gameService.on('game-ended', listenersRef.current.gameEnded);
    gameService.on('action-error', listenersRef.current.actionError);
    gameService.on('error', listenersRef.current.error);
    gameService.on('player-action', listenersRef.current.playerAction);
    
    console.log('🕹️ V2 GameTable event listeners added');
  };

  const cleanupEventListeners = () => {
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
  };

  const updateTurnStatus = (gameState: GameState) => {
    const myPlayerIndex = gameState.players.findIndex(p => p.id === user.id.toString());
    const myTurn = gameState.currentTurn === myPlayerIndex;
    setIsMyTurn(myTurn);
  };

  useEffect(() => {
    setupGameEventListeners();
    
    const currentState = gameService.getCurrentGameState();
    if (currentState) {
      setGameState(currentState);
      updateTurnStatus(currentState);
    }

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

  // V1/V2 UI Toggle Logic
  const useV2 = window.location.pathname.toLowerCase().includes('v2') || window.location.search.includes('v2=true');

  const handleToggleUI = () => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentOrigin = window.location.origin;
    
    console.log('V2 Toggle - Current URL parts:', { currentPath, currentSearch, currentOrigin, useV2 });
    
    if (useV2) {
      // Switch to V1 - remove /V2 from path and v2=true from query
      const newPath = currentPath.replace(/\/V2$/i, '');
      const newSearch = currentSearch.replace(/[?&]v2=true/gi, '').replace(/^&/, '?');
      const finalUrl = currentOrigin + newPath + newSearch;
      console.log('V2 → V1:', finalUrl);
      window.location.href = finalUrl;
    } else {
      // Switch to V2 - add /V2 to the current path
      const newPath = currentPath + '/V2';
      const finalUrl = currentOrigin + newPath + currentSearch;
      console.log('V1 → V2:', finalUrl);
      window.location.href = finalUrl;
    }
  };

  // Keyboard cheat code handler (same as BuracoMockup)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      const newSequence = keySequence + e.key.toLowerCase();
      setKeySequence(newSequence);

      if (newSequence.includes('iddqd')) {
        setCheatsEnabled({
          allowPlayAllCards: true,
          allowMultipleDiscard: true,
          allowDiscardDrawnCards: true,
          allowViewAllHands: true
        });
        setCheatMenuOpen(true);
        showSuccess('🎮 IDDQD: God mode activated! All cheats enabled.');
        setKeySequence('');
      } else if (newSequence.includes('cardy')) {
        setCheatsEnabled(prev => ({...prev, allowViewAllHands: !prev.allowViewAllHands}));
        showSuccess('👁️ CARDY: View all hands toggled!');
        setKeySequence('');
      } else if (newSequence.includes('winme')) {
        showSuccess('🏆 WINME: Auto-win activated! (Demo only)');
        setKeySequence('');
      } else if (newSequence.includes('speedx')) {
        showSuccess('⚡ SPEEDX: Fast animations activated! (Demo only)');
        setKeySequence('');
      } else if (newSequence.includes('reset')) {
        setCheatsEnabled({
          allowPlayAllCards: false,
          allowMultipleDiscard: false,
          allowDiscardDrawnCards: false,
          allowViewAllHands: false
        });
        showSuccess('🔄 RESET: All cheats disabled!');
        setKeySequence('');
      } else if (newSequence.length > 10) {
        setKeySequence('');
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence, showSuccess]);

  // Game action handlers - handles sorted index to original index mapping
  const handleCardClick = (sortedIndex: number) => {
    const originalIndex = mapSortedToOriginal(sortedIndex);
    toggleCardSelection(originalIndex);
  };

  const handleDrawFromDeck = () => {
    if (!isMyTurn) {
      showError(t('game.messages.notYourTurn'));
      return;
    }
    gameService.drawCard('deck');
  };

  const handleDrawFromDiscard = () => {
    if (!isMyTurn) {
      showError(t('game.messages.notYourTurn'));
      return;
    }
    setShowDiscardViewer(true);
  };

  const executeCheatCode = (cheatCode: string) => {
    console.log(`🎮 V2 Executing cheat code: ${cheatCode}`);
    gameService.sendCheatCode(cheatCode);
    showInfo(`Executing cheat: ${cheatCode}`, 2000);
    
    // Force refresh game state after cheat codes to ensure sync
    setTimeout(() => {
      console.log('🔄 V2 Requesting fresh game state after cheat');
      if (gameService.socket) {
        gameService.socket.emit('get-game-state');
      }
    }, 500);
  };

  const handleDiscardCard = () => {
    if (!isMyTurn) {
      showError(t('game.messages.notYourTurn'));
      return;
    }
    if (selectedCards.length !== 1) {
      showError(t('game.messages.selectOneCard'));
      return;
    }
    gameService.discardCard(selectedCards[0]);
    // Don't clear selection immediately - wait for server response
  };

  const handlePlayCards = () => {
    if (!isMyTurn) {
      showError(t('game.messages.notYourTurn'));
      return;
    }
    if (selectedCards.length < 3) {
      showError(t('game.messages.selectMinimumCards'));
      return;
    }
    // Convert selected card indices to actual cards
    const selectedCardObjects = selectedCards.map(index => myHand[index]);
    const sequences = [selectedCardObjects]; // Group into one sequence for now
    gameService.baixar(sequences);
    // Don't clear selection immediately - wait for server response
  };

  // Get real data from game state
  const currentPlayer = gameState?.players.find(p => p.id === user.id.toString());
  const myHand = currentPlayer?.hand || [];

  // Dynamic card sizing based on available space and chat state
  const getResponsiveCardSize = (cardCount: number = myHand.length) => {
    const baseContainerWidth = isSidebarOpen && !isMobile ? 800 : 1000; // Reduced width when chat is open
    const availableWidth = Math.min(baseContainerWidth, typeof window !== 'undefined' ? window.innerWidth - 100 : 1000);
    const cardsWithSpacing = cardCount || 1;
    const spacingBetweenCards = Math.max(cardsWithSpacing - 1, 0) * 8; // 8px gap between cards
    const availableForCards = availableWidth - spacingBetweenCards - 48; // 48px for padding
    // Responsive max width based on screen size and chat state
    const maxCardWidth = isSidebarOpen && !isMobile ? 52 : (availableWidth < 900 ? 48 : 64);
    const cardWidth = Math.min(Math.max(availableForCards / cardsWithSpacing, 40), maxCardWidth);
    const cardHeight = cardWidth * 1.4; // Maintain card aspect ratio
    
    
    return {
      width: Math.round(cardWidth),
      height: Math.round(cardHeight),
      className: `flex-shrink-0` // Use custom width/height instead of Tailwind classes
    };
  };

  const getResponsiveSequenceCardSize = () => {
    const baseWidth = isSidebarOpen && !isMobile ? 48 : (isMobile ? 44 : 56);
    const baseHeight = baseWidth * 1.4;
    return {
      width: Math.round(baseWidth),
      height: Math.round(baseHeight),
      className: 'flex-shrink-0'
    };
  };

  const [cardSizes, setCardSizes] = useState(() => ({
    hand: getResponsiveCardSize(),
    sequence: getResponsiveSequenceCardSize()
  }));

  // Recalculate card sizes when window resizes or chat state changes
  useEffect(() => {
    const updateCardSizes = () => {
      setCardSizes({
        hand: getResponsiveCardSize(),
        sequence: getResponsiveSequenceCardSize()
      });
    };

    updateCardSizes();
    window.addEventListener('resize', updateCardSizes);
    return () => window.removeEventListener('resize', updateCardSizes);
  }, [isSidebarOpen, myHand.length]);

  const handCardSize = cardSizes.hand;
  const sequenceCardSize = cardSizes.sequence;
  const otherPlayers = gameState?.players.filter(p => p.id !== user.id.toString()) || [];
  const discardPile = gameState?.discardPile || [];
  const deckCount = gameState?.mainDeck?.length || 0;
  const team1Score = gameState?.matchScores?.[0] || 0;
  const team2Score = gameState?.matchScores?.[1] || 0;
  const allSequences = gameState?.teamSequences || [[], []];

  // Sort cards and create mapping between sorted and original indices (same logic as HandManager)
  const getSortedCardsWithMapping = (): { sortedCards: CardType[], sortedToOriginalMap: number[] } => {
    // Create array with original indices
    const cardsWithIndices = myHand.map((card, originalIndex) => ({ card, originalIndex }));
    
    // Sort the cards with their original indices
    const sorted = cardsWithIndices.sort((a, b) => {
      let comparison = 0;
      
      if (sortType === 'suit') {
        const suitOrder = ['hearts', 'diamonds', 'clubs', 'spades'];
        comparison = suitOrder.indexOf(a.card.suit) - suitOrder.indexOf(b.card.suit);
        if (comparison === 0) {
          comparison = a.card.value - b.card.value;
        }
      } else if (sortType === 'blackred1') {
        const isBlackA = a.card.suit === 'clubs' || a.card.suit === 'spades';
        const isBlackB = b.card.suit === 'clubs' || b.card.suit === 'spades';
        comparison = Number(isBlackA) - Number(isBlackB);
        if (comparison === 0) {
          comparison = a.card.value - b.card.value;
        }
      } else if (sortType === 'blackred2') {
        const isRedA = a.card.suit === 'hearts' || a.card.suit === 'diamonds';
        const isRedB = b.card.suit === 'hearts' || b.card.suit === 'diamonds';
        comparison = Number(isRedA) - Number(isRedB);
        if (comparison === 0) {
          comparison = a.card.value - b.card.value;
        }
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return {
      sortedCards: sorted.map(item => item.card),
      sortedToOriginalMap: sorted.map(item => item.originalIndex)
    };
  };
  
  const { sortedCards, sortedToOriginalMap } = getSortedCardsWithMapping();
  
  // Helper function to map sorted index to original index
  const mapSortedToOriginal = (sortedIndex: number): number => {
    return sortedToOriginalMap[sortedIndex];
  };
  
  // Helper function to check if a sorted card is selected
  const isSortedCardSelected = (sortedIndex: number): boolean => {
    const originalIndex = mapSortedToOriginal(sortedIndex);
    return selectedCards.includes(originalIndex);
  };

  // Handle sort button click
  const handleSort = () => {
    if (sortType === 'suit') {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortType('blackred1');
        setSortOrder('asc');
      }
    } else if (sortType === 'blackred1') {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortType('blackred2');
        setSortOrder('asc');
      }
    } else if (sortType === 'blackred2') {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortType('suit');
        setSortOrder('asc');
      }
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Game...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-slate-950 text-slate-100 transition-all duration-300 ${
      isSidebarOpen && !isMobile ? 'pr-80' : ''
    }`}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 flex items-center gap-2 md:gap-4">
          <div className="text-lg md:text-xl font-semibold tracking-wide">
            Buraco Online <span className="text-emerald-400 text-sm">V2</span>
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button onClick={() => setCheatMenuOpen(!cheatMenuOpen)} className={`px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1 ${cheatMenuOpen ? 'bg-yellow-600/20 border-yellow-500' : ''}`}>
              <Zap className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Cheat</span>
            </button>

            <button onClick={() => setDebugOpen(!debugOpen)} className={`px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1 ${debugOpen ? 'bg-blue-600/20 border-blue-500' : ''}`}>
              <Bug className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Debug</span>
            </button>

            <button 
              onClick={() => setAdminOpen((v) => !v)} 
              className="px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1"
              title="Admin Panel"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Admin</span>
              <span className="text-[10px] md:hidden">ADM</span>
            </button>

            <button 
              onClick={handleToggleUI}
              className={`px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1 font-bold text-xs transition-colors ${
                useV2 
                  ? 'bg-gray-600/20 border-gray-500 text-gray-300' 
                  : 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
              }`}
              title={useV2 ? 'Switch to V1 UI' : 'Switch to V2 UI'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs hidden md:inline">{useV2 ? '← V1' : 'V2'}</span>
              <span className="text-xs md:hidden">{useV2 ? 'V1' : 'V2'}</span>
            </button>

            <button onClick={onLeaveGame} className="px-2 md:px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1">
              <LogOut className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Action Message for notifications */}
      <ConnectedActionMessage />

      {/* Admin/Debug/Cheat Panels (same as BuracoMockup) */}
      {adminOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Admin Panel</div>
            <button onClick={() => setAdminOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div>Game ID: {gameState.id}</div>
            <div>Players: {gameState.players.length}/4</div>
            <div>Current Turn: {gameState.players[gameState.currentTurn]?.username}</div>
            <div>Round: {gameState.currentRound || 1}</div>
            <button 
              onClick={onLeaveGame}
              className="w-full bg-red-600/20 border border-red-500 text-red-400 py-2 px-3 rounded text-xs hover:bg-red-600/30 mt-4"
            >
              Leave Game
            </button>
          </div>
        </div>
      )}

      {debugOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-blue-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-blue-400">Debug Panel</div>
            <button onClick={() => setDebugOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="text-blue-300 font-medium">Game State</div>
              <div className="bg-slate-800/50 p-2 rounded font-mono">
                <div>Players: {gameState.players.length}/4</div>
                <div>Turn: {gameState.players[gameState.currentTurn]?.username}</div>
                <div>My Turn: {isMyTurn ? 'YES' : 'NO'}</div>
                <div>Round: {gameState.currentRound || 1}</div>
                <div>Deck: {deckCount} cards</div>
                <div>Discard: {discardPile.length} cards</div>
                <div>My Hand: {myHand.length} cards</div>
                <div>Selected: {selectedCards.length} cards</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cheatMenuOpen && (
        <div className="fixed right-2 top-14 z-20 w-80 bg-slate-900/95 border border-yellow-800 rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-yellow-400">Cheat Menu</div>
            <button onClick={() => setCheatMenuOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Cheat Toggles */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="text-yellow-400 font-medium mb-2">Cheat Toggles</div>
              <div className="flex items-center justify-between">
                <span>Allow play all cards</span>
                <input 
                  type="checkbox" 
                  checked={cheatsEnabled.allowPlayAllCards}
                  onChange={(e) => setCheatsEnabled(prev => ({...prev, allowPlayAllCards: e.target.checked}))}
                  className="accent-yellow-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Allow multiple discard</span>
                <input 
                  type="checkbox" 
                  checked={cheatsEnabled.allowMultipleDiscard}
                  onChange={(e) => setCheatsEnabled(prev => ({...prev, allowMultipleDiscard: e.target.checked}))}
                  className="accent-yellow-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Allow discard drawn cards</span>
                <input 
                  type="checkbox" 
                  checked={cheatsEnabled.allowDiscardDrawnCards}
                  onChange={(e) => setCheatsEnabled(prev => ({...prev, allowDiscardDrawnCards: e.target.checked}))}
                  className="accent-yellow-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>View all hands</span>
                <input 
                  type="checkbox" 
                  checked={cheatsEnabled.allowViewAllHands}
                  onChange={(e) => setCheatsEnabled(prev => ({...prev, allowViewAllHands: e.target.checked}))}
                  className="accent-yellow-500"
                />
              </div>
            </div>

            {/* Cheat Actions */}
            <div className="space-y-2">
              <div className="text-yellow-400 font-medium mb-2">Game Actions</div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => executeCheatCode('limpa')} className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 rounded text-xs text-green-300">
                  🟢 Give Canastra Limpa
                </button>
                <button onClick={() => executeCheatCode('suja')} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded text-xs text-red-300">
                  🔴 Give Canastra Suja
                </button>
                <button onClick={() => executeCheatCode('transform')} className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded text-xs text-blue-300">
                  🔄 Setup Transform Test
                </button>
                <button onClick={() => executeCheatCode('aces3')} className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded text-xs text-purple-300">
                  ♠️ Give Three Aces
                </button>
                <button onClick={() => executeCheatCode('pique')} className="px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 rounded text-xs text-orange-300">
                  ✂️ Reduce to Pique
                </button>
                <button onClick={() => executeCheatCode('discard5')} className="px-3 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/50 rounded text-xs text-slate-300">
                  🗑️ Add to Discard Pile
                </button>
                <button onClick={() => executeCheatCode('getcard')} className="px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 rounded text-xs text-yellow-300 font-semibold">
                  🎴 Pick Any Card
                </button>
                <button onClick={() => executeCheatCode('morto0')} className="px-3 py-2 bg-red-800/20 hover:bg-red-800/30 border border-red-800/50 rounded text-xs text-red-200">
                  📦 Use Morto 1
                </button>
                <button onClick={() => executeCheatCode('morto1')} className="px-3 py-2 bg-red-800/20 hover:bg-red-800/30 border border-red-800/50 rounded text-xs text-red-200">
                  📦 Use Morto 2
                </button>
                <button onClick={() => executeCheatCode('1500pts')} className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded text-xs text-amber-300">
                  🏆 Set Score 1600
                </button>
                <button onClick={() => executeCheatCode('deadlock')} className="px-3 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 rounded text-xs text-gray-300">
                  🔒 Create Deadlock
                </button>
                <button onClick={() => executeCheatCode('resetgame')} className="px-3 py-2 bg-red-700/20 hover:bg-red-700/30 border border-red-700/50 rounded text-xs text-red-300 font-semibold">
                  🔄 Reset Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table area */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 grid grid-rows-[auto,1fr,auto] gap-3 md:gap-4">
        {/* Opponents row */}
        <div className="flex items-center justify-between">
          <div className="invisible md:visible md:opacity-100 opacity-0"></div>
          <div className="flex flex-col items-center gap-2">
            {otherPlayers[0] && (
              <PlayerBadge 
                name={otherPlayers[0].username} 
                team={otherPlayers[0].team} 
                cardCount={otherPlayers[0].hand?.length || 0}
                active={gameState.currentTurn === gameState.players.findIndex(p => p.id === otherPlayers[0].id)}
              />
            )}
          </div>
          <div></div>
        </div>

        {/* Center table */}
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {/* Left side player */}
          <div className="col-span-2 hidden md:flex flex-col justify-center items-center gap-2">
            {otherPlayers[1] && (
              <PlayerBadge 
                name={otherPlayers[1].username} 
                team={otherPlayers[1].team} 
                cardCount={otherPlayers[1].hand?.length || 0}
                vertical 
                active={gameState.currentTurn === gameState.players.findIndex(p => p.id === otherPlayers[1].id)}
              />
            )}
          </div>

          {/* Center felt */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative rounded-[2rem] p-4 md:p-6 border border-emerald-900 bg-gradient-to-b from-emerald-900/70 to-emerald-950/80 shadow-inner">
              <div className="py-2 md:py-3">
                <TeamScoreboard team1Score={team1Score} team2Score={team2Score} />
              </div>

              <div className="flex items-center justify-center gap-10 md:gap-16 py-2 md:py-4">
                <StackPile 
                  label="Discard" 
                  count={discardPile.length} 
                  topCard={discardPile[discardPile.length - 1]} 
                  onClick={handleDrawFromDiscard}
                />
                <StackPile 
                  label="Deck" 
                  count={deckCount} 
                  faceDown 
                  onClick={handleDrawFromDeck}
                />
                {gameState?.mortos && Array.isArray(gameState.mortos) && gameState.mortos.length >= 2 && gameState?.mortosUsed && (
                  <MortoPile 
                    mortos={gameState.mortos}
                    mortosUsed={gameState.mortosUsed}
                    onClick={() => setIsMortosModalOpen(true)}
                  />
                )}
              </div>

              {/* Sequences display */}
              {(allSequences[0].length > 0 || allSequences[1].length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
                  <div className="w-full rounded-2xl bg-emerald-900/30 border border-emerald-800/40 p-2 md:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm text-emerald-50/90 font-medium">Team 1 Sequences</span>
                      <span className="px-2 py-1 bg-emerald-600/30 border border-emerald-500/50 rounded text-emerald-100 text-xs font-bold">
                        {allSequences[0].reduce((total, seq) => total + seq.points, 0)} pts total
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allSequences[0].map((seq, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            {seq.cards.map((card, j) => (
                              <Card 
                                key={j} 
                                card={card} 
                                className="flex-shrink-0"
                                hideCenter={true}
                                style={{ 
                                  '--card-width': `${cardSizes.sequence.width}px`, 
                                  '--card-height': `${cardSizes.sequence.height}px` 
                                } as React.CSSProperties}
                              />
                            ))}
                          </div>
                          <div className="text-center">
                            <span className="inline-block px-2 py-0.5 bg-amber-500/20 border border-amber-400/30 rounded text-amber-200 text-xs font-semibold">
                              {seq.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full rounded-2xl bg-indigo-900/30 border border-indigo-800/40 p-2 md:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm text-indigo-50/90 font-medium">Team 2 Sequences</span>
                      <span className="px-2 py-1 bg-indigo-600/30 border border-indigo-500/50 rounded text-indigo-100 text-xs font-bold">
                        {allSequences[1].reduce((total, seq) => total + seq.points, 0)} pts total
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allSequences[1].map((seq, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            {seq.cards.map((card, j) => (
                              <Card 
                                key={j} 
                                card={card} 
                                className="flex-shrink-0"
                                hideCenter={true}
                                style={{ 
                                  '--card-width': `${cardSizes.sequence.width}px`, 
                                  '--card-height': `${cardSizes.sequence.height}px` 
                                } as React.CSSProperties}
                              />
                            ))}
                          </div>
                          <div className="text-center">
                            <span className="inline-block px-2 py-0.5 bg-amber-500/20 border border-amber-400/30 rounded text-amber-200 text-xs font-semibold">
                              {seq.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side player */}
          <div className="col-span-2 hidden md:flex flex-col justify-center items-center gap-2">
            {otherPlayers[2] && (
              <PlayerBadge 
                name={otherPlayers[2].username} 
                team={otherPlayers[2].team} 
                cardCount={otherPlayers[2].hand?.length || 0}
                vertical 
                active={gameState.currentTurn === gameState.players.findIndex(p => p.id === otherPlayers[2].id)}
              />
            )}
          </div>
        </div>

        {/* My hand */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 md:p-3">
          <div className="flex items-center justify-between mb-2">
            <PlayerBadge 
              name={user.username} 
              active={isMyTurn} 
              team={currentPlayer?.team || 1} 
              cardCount={myHand.length} 
            />
            <div className="flex gap-2">
              {selectedCards.length > 0 && (
                <>
                  <button 
                    onClick={handlePlayCards}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                    disabled={!isMyTurn}
                  >
                    Play ({selectedCards.length})
                  </button>
                  <button 
                    onClick={handleDiscardCard}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    disabled={!isMyTurn || selectedCards.length !== 1}
                  >
                    Discard
                  </button>
                </>
              )}
              <button 
                onClick={handleSort}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs"
                title={`Sort: ${sortType} ${sortOrder}`}
              >
                <SortAsc className="w-3 h-3"/> 
                {sortType === 'suit' ? '♠♥♦♣' : sortType === 'blackred1' ? '⚫🔴' : '🔴⚫'} 
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          <motion.div layout className="flex gap-2 md:gap-3 flex-wrap justify-center">
            {sortedCards.map((card, sortedIndex) => (
              <motion.div 
                key={`${card.id || `${card.suit}-${card.rank}-${sortedIndex}`}`} 
                layout 
                whileHover={{ y: -6 }} 
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                <Card 
                  card={card}
                  isSelected={isSortedCardSelected(sortedIndex)}
                  onClick={() => handleCardClick(sortedIndex)}
                  className={handCardSize.className}
                  style={{ 
                    '--card-width': `${handCardSize.width}px`, 
                    '--card-height': `${handCardSize.height}px` 
                  } as React.CSSProperties}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 pb-6">
        <div className="text-[11px] md:text-sm text-slate-400 flex flex-wrap items-center gap-3">
          <span>Game V2 · Real game logic with new UI</span>
          <span>•</span>
          <span>Connected to: {gameState.id}</span>
          {Object.values(cheatsEnabled).some(Boolean) && (
            <>
              <span>•</span>
              <span className="text-yellow-400 animate-pulse">⚡ Cheats Active</span>
            </>
          )}
        </div>
      </div>

      {/* Chat System */}
      {gameState.id && (
        <ChatSystem gameId={gameState.id} className="fixed bottom-4 right-4" />
      )}

      {/* Discard Picker Modal */}
      <Modal
        open={showDiscardViewer}
        onOpenChange={setShowDiscardViewer}
        title="Choose Cards from Discard Pile"
        description="Select which cards to LEAVE in the discard pile. You will take the rest."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {discardPile.map((card, index) => (
              <motion.div
                key={`discard-${card.id || `${card.suit}-${card.rank}-${index}`}`}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
                onClick={() => {
                  const cardKey = `${card.suit}-${card.rank}-${index}`;
                  setSelectedDiscardCards(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(cardKey)) {
                      newSet.delete(cardKey);
                    } else {
                      newSet.add(cardKey);
                    }
                    return newSet;
                  });
                }}
              >
                <Card 
                  card={card}
                  isSelected={selectedDiscardCards.has(`${card.suit}-${card.rank}-${index}`)}
                  className="flex-shrink-0"
                  style={{ 
                    '--card-width': '56px', 
                    '--card-height': '78px' 
                  } as React.CSSProperties}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm text-slate-600">
            <span>Leave: {selectedDiscardCards.size} cards</span>
            <span>Taking: {discardPile.length - selectedDiscardCards.size} cards</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => {
                setShowDiscardViewer(false);
                setSelectedDiscardCards(new Set());
              }}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // Calculate which cards to take (IDs of non-selected cards)
                const cardsToTake: string[] = [];
                discardPile.forEach((card, index) => {
                  const cardKey = `${card.suit}-${card.rank}-${index}`;
                  if (!selectedDiscardCards.has(cardKey)) {
                    cardsToTake.push(card.id);
                  }
                });
                
                gameService.drawCard('discard', cardsToTake);
                setShowDiscardViewer(false);
                setSelectedDiscardCards(new Set());
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded"
              disabled={!isMyTurn}
            >
              Take Cards
            </button>
          </div>
        </div>
      </Modal>

      {/* Mortos Modal */}
      <Modal
        open={isMortosModalOpen}
        onOpenChange={setIsMortosModalOpen}
        title="Dead Decks (Mortos)"
        description="View the status of the dead decks"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState?.mortos?.map((morto, index) => (
              <div key={`morto-${index}`} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {t('game.morto.title', { number: index + 1 })}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    gameState?.mortosUsed?.[index] ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {gameState?.mortosUsed?.[index] ? t('game.morto.used') : t('game.morto.available')}
                  </div>
                </div>
                
                <div className="text-sm text-slate-300 mb-4">
                  {t('game.morto.cardCount', { count: morto.length })}
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-6xl">⚰️</div>
                </div>
                
                {gameState?.mortosUsedByTeam?.[index] !== null && gameState?.mortosUsedByTeam?.[index] !== undefined && (
                  <div className="text-xs text-slate-400 mt-2">
                    Taken by Team {(gameState?.mortosUsedByTeam?.[index] || 0) + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}