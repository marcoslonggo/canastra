import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Game state types
interface Card {
  id: string
  suit: string
  value: string
  isWild?: boolean
}

interface Player {
  id: string
  username: string
  team: number
  isHost?: boolean
  isConnected?: boolean
}

interface Sequence {
  id: string
  cards: Card[]
  type: 'clean' | 'dirty' | 'aces'
  teamNumber: number
}

interface GameState {
  // Game data
  gameId: string | null
  players: Player[]
  currentTurn: number
  phase: 'waiting' | 'playing' | 'finished'
  
  // Player's hand and cards
  hand: Card[]
  selectedCards: Card[]
  drawnCard: Card | null
  
  // Game board state
  discardPile: Card[]
  sequences: Sequence[]
  scores: [number, number]
  
  // Turn and action state
  isMyTurn: boolean
  lastAction: string | null
  canBaixar: boolean
  canBater: boolean
  hasBaixado: boolean
  
  // Game settings and modes
  allowPlayAllCards: boolean
  allowMultipleDiscard: boolean
  allowDiscardDrawnCards: boolean
  allowViewAllHands: boolean
  showAllHands: boolean
  
  // Actions
  setGameId: (id: string | null) => void
  setPlayers: (players: Player[]) => void
  setHand: (cards: Card[]) => void
  selectCard: (card: Card) => void
  deselectCard: (card: Card) => void
  clearSelection: () => void
  setDrawnCard: (card: Card | null) => void
  setDiscardPile: (cards: Card[]) => void
  setSequences: (sequences: Sequence[]) => void
  setTurn: (playerId: number, isMyTurn: boolean) => void
  setGamePhase: (phase: 'waiting' | 'playing' | 'finished') => void
  
  // Game actions
  setCanBaixar: (can: boolean) => void
  setCanBater: (can: boolean) => void
  setHasBaixado: (has: boolean) => void
  setLastAction: (action: string | null) => void
  
  // Cheat modes
  enableCheatMode: (mode: string) => void
  disableCheatMode: (mode: string) => void
  toggleAllCheats: () => void
  resetCheats: () => void
  
  // Computed getters
  getSelectedCardIds: () => string[]
  getMyTeam: () => number | null
  getTeamSequences: (team: number) => Sequence[]
  getOpponentSequences: () => Sequence[]
  isCardSelected: (card: Card) => boolean
  canPlayCard: (card: Card) => boolean
  
  // Game state reset
  resetGameState: () => void
}

const initialState = {
  gameId: null,
  players: [],
  currentTurn: 0,
  phase: 'waiting' as const,
  hand: [],
  selectedCards: [],
  drawnCard: null,
  discardPile: [],
  sequences: [],
  scores: [0, 0] as [number, number],
  isMyTurn: false,
  lastAction: null,
  canBaixar: false,
  canBater: false,
  hasBaixado: false,
  allowPlayAllCards: false,
  allowMultipleDiscard: false,
  allowDiscardDrawnCards: false,
  allowViewAllHands: false,
  showAllHands: false,
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Basic setters
    setGameId: (id) => set({ gameId: id }),
    setPlayers: (players) => set({ players }),
    setHand: (cards) => set({ hand: cards }),
    setDrawnCard: (card) => set({ drawnCard: card }),
    setDiscardPile: (cards) => set({ discardPile: cards }),
    setSequences: (sequences) => set({ sequences }),
    setGamePhase: (phase) => set({ phase }),
    
    // Card selection
    selectCard: (card) => set((state) => {
      const isAlreadySelected = state.selectedCards.some(c => c.id === card.id)
      if (isAlreadySelected) return state
      
      return {
        selectedCards: [...state.selectedCards, card]
      }
    }),
    
    deselectCard: (card) => set((state) => ({
      selectedCards: state.selectedCards.filter(c => c.id !== card.id)
    })),
    
    clearSelection: () => set({ selectedCards: [] }),
    
    // Turn management
    setTurn: (playerId, isMyTurn) => set({
      currentTurn: playerId,
      isMyTurn
    }),
    
    // Game actions
    setCanBaixar: (can) => set({ canBaixar: can }),
    setCanBater: (can) => set({ canBater: can }),
    setHasBaixado: (has) => set({ hasBaixado: has }),
    setLastAction: (action) => set({ lastAction: action }),
    
    // Cheat modes
    enableCheatMode: (mode) => set((state) => {
      const updates: Partial<GameState> = {}
      
      switch (mode) {
        case 'cardy':
          updates.allowViewAllHands = true
          updates.showAllHands = true
          break
        case 'playall':
          updates.allowPlayAllCards = true
          break
        case 'multidiscard':
          updates.allowMultipleDiscard = true
          break
        case 'discarddrawn':
          updates.allowDiscardDrawnCards = true
          break
      }
      
      return { ...state, ...updates }
    }),
    
    disableCheatMode: (mode) => set((state) => {
      const updates: Partial<GameState> = {}
      
      switch (mode) {
        case 'cardy':
          updates.allowViewAllHands = false
          updates.showAllHands = false
          break
        case 'playall':
          updates.allowPlayAllCards = false
          break
        case 'multidiscard':
          updates.allowMultipleDiscard = false
          break
        case 'discarddrawn':
          updates.allowDiscardDrawnCards = false
          break
      }
      
      return { ...state, ...updates }
    }),
    
    toggleAllCheats: () => set((state) => {
      const allEnabled = state.allowPlayAllCards && 
                        state.allowMultipleDiscard && 
                        state.allowDiscardDrawnCards && 
                        state.allowViewAllHands
      
      return {
        allowPlayAllCards: !allEnabled,
        allowMultipleDiscard: !allEnabled,
        allowDiscardDrawnCards: !allEnabled,
        allowViewAllHands: !allEnabled,
        showAllHands: !allEnabled,
      }
    }),
    
    resetCheats: () => set({
      allowPlayAllCards: false,
      allowMultipleDiscard: false,
      allowDiscardDrawnCards: false,
      allowViewAllHands: false,
      showAllHands: false,
    }),
    
    // Computed getters
    getSelectedCardIds: () => get().selectedCards.map(card => card.id),
    
    getMyTeam: () => {
      const state = get()
      // This would need to be implemented based on current user context
      // For now, return null
      return null
    },
    
    getTeamSequences: (team) => get().sequences.filter(seq => seq.teamNumber === team),
    
    getOpponentSequences: () => {
      const state = get()
      const myTeam = state.getMyTeam()
      if (myTeam === null) return []
      return state.sequences.filter(seq => seq.teamNumber !== myTeam)
    },
    
    isCardSelected: (card) => get().selectedCards.some(c => c.id === card.id),
    
    canPlayCard: (card) => {
      const state = get()
      return state.isMyTurn && (state.allowPlayAllCards || state.phase === 'playing')
    },
    
    // Reset
    resetGameState: () => set(initialState),
  }))
)

// Selectors for optimized subscriptions
export const gameSelectors = {
  hand: (state: GameState) => state.hand,
  selectedCards: (state: GameState) => state.selectedCards,
  isMyTurn: (state: GameState) => state.isMyTurn,
  gamePhase: (state: GameState) => state.phase,
  players: (state: GameState) => state.players,
  sequences: (state: GameState) => state.sequences,
  canBaixar: (state: GameState) => state.canBaixar,
  canBater: (state: GameState) => state.canBater,
  cheatModes: (state: GameState) => ({
    allowPlayAllCards: state.allowPlayAllCards,
    allowMultipleDiscard: state.allowMultipleDiscard,
    allowDiscardDrawnCards: state.allowDiscardDrawnCards,
    allowViewAllHands: state.allowViewAllHands,
    showAllHands: state.showAllHands,
  }),
}