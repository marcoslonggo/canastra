import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Card, Player } from '../types';

// Enhanced types for client-side state
interface GameAction {
  id: string;
  type: 'draw' | 'discard' | 'baixar' | 'sequence' | 'turn' | 'bater';
  player: string;
  timestamp: number;
  details?: any;
}

interface GameStore {
  // Core Game State (from server)
  gameState: GameState | null;
  
  // Computed Player State
  isMyTurn: boolean;
  myPlayerId: string | null;
  myPlayer: Player | null;
  
  // UI Selection State
  selectedCards: number[];
  gameEnded: boolean;
  
  // Morto Selection
  availableMortos: number[];
  showMortoSelection: boolean;
  
  // Discard Pile Enhancement
  selectedDiscardCards: Set<string>;
  
  // Game Actions History (for animated-list UI)
  recentActions: GameAction[];
  
  // Core Actions
  setGameState: (state: GameState | null) => void;
  updateGameState: (updater: (state: GameState) => void) => void;
  setMyPlayerId: (id: string | null) => void;
  setGameEnded: (ended: boolean) => void;
  
  // Card Selection Actions
  setSelectedCards: (cards: number[]) => void;
  toggleCardSelection: (cardIndex: number) => void;
  clearSelectedCards: () => void;
  
  // Morto Actions
  setAvailableMortos: (mortos: number[]) => void;
  setShowMortoSelection: (show: boolean) => void;
  
  // Discard Pile Actions
  setSelectedDiscardCards: (cards: Set<string>) => void;
  toggleDiscardCard: (cardId: string) => void;
  clearSelectedDiscardCards: () => void;
  
  // Game Action History
  addGameAction: (action: Omit<GameAction, 'id' | 'timestamp'>) => void;
  clearRecentActions: () => void;
  
  // Computed Properties
  canPlayCards: () => boolean;
  hasSelectedCards: () => boolean;
  getSelectedCardsCount: () => number;
  isTeammate: (playerId: string) => boolean;
  getMyTeam: () => 1 | 2 | null;
  
  // WebSocket Event Handlers
  handleGameStateUpdate: (state: GameState) => void;
  handleTurnChange: (currentTurn: number) => void;
  handleGameEnd: () => void;
  
  // Reset
  resetGameState: () => void;
}

const initialState = {
  gameState: null,
  isMyTurn: false,
  myPlayerId: null,
  myPlayer: null,
  selectedCards: [],
  gameEnded: false,
  availableMortos: [],
  showMortoSelection: false,
  selectedDiscardCards: new Set<string>(),
  recentActions: [],
};

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Core State Setters
        setGameState: (state) => set((draft) => {
          draft.gameState = state;
          if (state && draft.myPlayerId) {
            draft.myPlayer = state.players.find(p => p.id === draft.myPlayerId) || null;
            draft.isMyTurn = state.currentTurn === state.players.findIndex(p => p.id === draft.myPlayerId);
          }
        }),
        
        updateGameState: (updater) => set((draft) => {
          if (draft.gameState) {
            updater(draft.gameState);
            // Recompute derived state
            if (draft.myPlayerId) {
              draft.myPlayer = draft.gameState.players.find(p => p.id === draft.myPlayerId) || null;
              draft.isMyTurn = draft.gameState.currentTurn === draft.gameState.players.findIndex(p => p.id === draft.myPlayerId);
            }
          }
        }),
        
        setMyPlayerId: (id) => set((draft) => {
          draft.myPlayerId = id;
          if (draft.gameState && id) {
            draft.myPlayer = draft.gameState.players.find(p => p.id === id) || null;
            draft.isMyTurn = draft.gameState.currentTurn === draft.gameState.players.findIndex(p => p.id === id);
          }
        }),
        
        setGameEnded: (ended) => set((draft) => {
          draft.gameEnded = ended;
        }),
        
        // Card Selection Actions
        setSelectedCards: (cards) => set((draft) => {
          draft.selectedCards = cards;
        }),
        
        toggleCardSelection: (cardIndex) => set((draft) => {
          const index = draft.selectedCards.indexOf(cardIndex);
          if (index > -1) {
            draft.selectedCards.splice(index, 1);
          } else {
            draft.selectedCards.push(cardIndex);
          }
        }),
        
        clearSelectedCards: () => set((draft) => {
          draft.selectedCards = [];
        }),
        
        // Morto Actions
        setAvailableMortos: (mortos) => set((draft) => {
          draft.availableMortos = mortos;
        }),
        
        setShowMortoSelection: (show) => set((draft) => {
          draft.showMortoSelection = show;
        }),
        
        // Discard Pile Actions
        setSelectedDiscardCards: (cards) => set((draft) => {
          draft.selectedDiscardCards = cards;
        }),
        
        toggleDiscardCard: (cardId) => set((draft) => {
          const newSet = new Set(draft.selectedDiscardCards);
          if (newSet.has(cardId)) {
            newSet.delete(cardId);
          } else {
            newSet.add(cardId);
          }
          draft.selectedDiscardCards = newSet;
        }),
        
        clearSelectedDiscardCards: () => set((draft) => {
          draft.selectedDiscardCards = new Set();
        }),
        
        // Game Action History
        addGameAction: (action) => set((draft) => {
          const newAction: GameAction = {
            ...action,
            id: `action-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
          };
          
          draft.recentActions.unshift(newAction);
          // Keep only last 10 actions
          if (draft.recentActions.length > 10) {
            draft.recentActions = draft.recentActions.slice(0, 10);
          }
        }),
        
        clearRecentActions: () => set((draft) => {
          draft.recentActions = [];
        }),
        
        // Computed Properties
        canPlayCards: () => {
          const state = get();
          return state.isMyTurn && state.selectedCards.length > 0;
        },
        
        hasSelectedCards: () => {
          return get().selectedCards.length > 0;
        },
        
        getSelectedCardsCount: () => {
          return get().selectedCards.length;
        },
        
        isTeammate: (playerId) => {
          const state = get();
          if (!state.gameState || !state.myPlayer) return false;
          const player = state.gameState.players.find(p => p.id === playerId);
          return player ? player.team === state.myPlayer.team : false;
        },
        
        getMyTeam: () => {
          const state = get();
          return state.myPlayer?.team || null;
        },
        
        // WebSocket Event Handlers
        handleGameStateUpdate: (state) => {
          const currentState = get();
          set((draft) => {
            draft.gameState = state;
            if (currentState.myPlayerId) {
              draft.myPlayer = state.players.find(p => p.id === currentState.myPlayerId) || null;
              draft.isMyTurn = state.currentTurn === state.players.findIndex(p => p.id === currentState.myPlayerId);
            }
          });
        },
        
        handleTurnChange: (currentTurn) => {
          set((draft) => {
            if (draft.gameState) {
              draft.gameState.currentTurn = currentTurn;
              if (draft.myPlayerId) {
                draft.isMyTurn = currentTurn === draft.gameState.players.findIndex(p => p.id === draft.myPlayerId);
              }
            }
          });
        },
        
        handleGameEnd: () => {
          set((draft) => {
            draft.gameEnded = true;
            draft.selectedCards = [];
          });
        },
        
        // Reset
        resetGameState: () => set(() => initialState),
      }))
    ),
    {
      name: 'game-store',
    }
  )
);

// Selectors for common derived state
export const selectGameState = (state: GameStore) => state.gameState;
export const selectIsMyTurn = (state: GameStore) => state.isMyTurn;
export const selectSelectedCards = (state: GameStore) => state.selectedCards;
export const selectMyPlayer = (state: GameStore) => state.myPlayer;
export const selectRecentActions = (state: GameStore) => state.recentActions;
export const selectCanPlayCards = (state: GameStore) => state.canPlayCards();