import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ChatMessage {
  id: string
  username: string
  text: string
  timestamp: number
  type: 'user' | 'system' | 'game'
}

interface ChatState {
  // Messages
  lobbyMessages: ChatMessage[]
  gameMessages: ChatMessage[]
  
  // UI state
  isOverlayOpen: boolean
  isSidebarOpen: boolean  // New state for desktop sidebar
  overlayMessages: ChatMessage[]
  unreadCount: number
  
  // Overlay behavior
  autoFadeEnabled: boolean
  autoFadeTimeout: number
  maxOverlayMessages: number
  maxHistoryMessages: number
  
  // Input state
  currentInput: string
  isTyping: boolean
  
  // Settings
  showTimestamps: boolean
  enableNotifications: boolean
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addLobbyMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addGameMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  
  // Overlay management
  openOverlay: () => void
  closeOverlay: () => void
  toggleOverlay: () => void
  
  // Sidebar management (desktop only)
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  
  // Auto-fade management
  updateOverlayMessages: () => void
  clearAutoFadeTimeout: () => void
  
  // Input management
  setCurrentInput: (input: string) => void
  clearInput: () => void
  setTyping: (typing: boolean) => void
  
  // Settings
  toggleTimestamps: () => void
  toggleNotifications: () => void
  updateSettings: (settings: Partial<Pick<ChatState, 'autoFadeEnabled' | 'autoFadeTimeout' | 'maxOverlayMessages' | 'maxHistoryMessages'>>) => void
  
  // Unread management
  markAsRead: () => void
  incrementUnread: () => void
  
  // Message management
  clearMessages: (type?: 'lobby' | 'game' | 'all') => void
  
  // Computed getters
  getCurrentMessages: () => ChatMessage[]
  getRecentMessages: (count: number) => ChatMessage[]
  hasUnreadMessages: () => boolean
}

const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const createMessage = (data: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => ({
  id: generateMessageId(),
  timestamp: Date.now(),
  ...data,
})

let autoFadeTimeoutId: NodeJS.Timeout | null = null

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    lobbyMessages: [],
    gameMessages: [],
    
    // UI state
    isOverlayOpen: false,
    isSidebarOpen: false,
    overlayMessages: [],
    unreadCount: 0,
    
    // Overlay settings
    autoFadeEnabled: true,
    autoFadeTimeout: 4000, // 4 seconds
    maxOverlayMessages: 3,
    maxHistoryMessages: 100,
    
    // Input state
    currentInput: '',
    isTyping: false,
    
    // Settings
    showTimestamps: true,
    enableNotifications: true,
    
    // Message actions
    addMessage: (messageData) => {
      const message = createMessage(messageData)
      set((state) => {
        // Add to appropriate message list
        const currentMessages = [...state.getCurrentMessages(), message]
        
        // Limit message history
        const trimmedMessages = currentMessages.slice(-state.maxHistoryMessages)
        
        // Update overlay if needed
        let newOverlayMessages = [...state.overlayMessages]
        if (!state.isOverlayOpen && state.autoFadeEnabled) {
          newOverlayMessages = [...newOverlayMessages, message].slice(-state.maxOverlayMessages)
        }
        
        // Increment unread if overlay is closed
        const newUnreadCount = state.isOverlayOpen ? state.unreadCount : state.unreadCount + 1
        
        return {
          gameMessages: trimmedMessages,
          overlayMessages: newOverlayMessages,
          unreadCount: newUnreadCount,
        }
      })
      
      // Set auto-fade timeout for overlay messages
      if (!get().isOverlayOpen && get().autoFadeEnabled) {
        get().clearAutoFadeTimeout()
        autoFadeTimeoutId = setTimeout(() => {
          set((state) => ({ overlayMessages: [] }))
        }, get().autoFadeTimeout)
      }
    },
    
    addLobbyMessage: (messageData) => {
      const message = createMessage(messageData)
      set((state) => ({
        lobbyMessages: [...state.lobbyMessages, message].slice(-state.maxHistoryMessages)
      }))
    },
    
    addGameMessage: (messageData) => {
      get().addMessage(messageData)
    },
    
    // Overlay management
    openOverlay: () => {
      set({ 
        isOverlayOpen: true,
        overlayMessages: [], // Clear overlay messages when opening full chat
        unreadCount: 0 // Mark as read when opening
      })
      get().clearAutoFadeTimeout()
    },
    
    closeOverlay: () => {
      set({ isOverlayOpen: false })
    },
    
    toggleOverlay: () => {
      const state = get()
      if (state.isOverlayOpen) {
        state.closeOverlay()
      } else {
        state.openOverlay()
      }
    },
    
    // Sidebar management (desktop only)
    openSidebar: () => {
      set({ 
        isSidebarOpen: true,
        overlayMessages: [], // Clear overlay messages when opening sidebar
        unreadCount: 0 // Mark as read when opening
      })
      get().clearAutoFadeTimeout()
    },
    
    closeSidebar: () => {
      set({ isSidebarOpen: false })
    },
    
    toggleSidebar: () => {
      const state = get()
      if (state.isSidebarOpen) {
        state.closeSidebar()
      } else {
        state.openSidebar()
      }
    },
    
    // Auto-fade management
    updateOverlayMessages: () => {
      const state = get()
      if (state.autoFadeEnabled && !state.isOverlayOpen) {
        const recentMessages = state.getCurrentMessages().slice(-state.maxOverlayMessages)
        set({ overlayMessages: recentMessages })
      }
    },
    
    clearAutoFadeTimeout: () => {
      if (autoFadeTimeoutId) {
        clearTimeout(autoFadeTimeoutId)
        autoFadeTimeoutId = null
      }
    },
    
    // Input management
    setCurrentInput: (input) => set({ currentInput: input }),
    clearInput: () => set({ currentInput: '' }),
    setTyping: (typing) => set({ isTyping: typing }),
    
    // Settings
    toggleTimestamps: () => set((state) => ({ 
      showTimestamps: !state.showTimestamps 
    })),
    
    toggleNotifications: () => set((state) => ({ 
      enableNotifications: !state.enableNotifications 
    })),
    
    updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    
    // Unread management
    markAsRead: () => set({ unreadCount: 0 }),
    incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
    
    // Message management
    clearMessages: (type = 'all') => {
      set((state) => {
        const updates: Partial<ChatState> = {}
        
        switch (type) {
          case 'lobby':
            updates.lobbyMessages = []
            break
          case 'game':
            updates.gameMessages = []
            updates.overlayMessages = []
            break
          case 'all':
            updates.lobbyMessages = []
            updates.gameMessages = []
            updates.overlayMessages = []
            updates.unreadCount = 0
            break
        }
        
        return { ...state, ...updates }
      })
    },
    
    // Computed getters
    getCurrentMessages: () => {
      const state = get()
      // Return game messages if in game, lobby messages if in lobby
      // This would need context about current screen
      return state.gameMessages // For now, default to game messages
    },
    
    getRecentMessages: (count) => {
      return get().getCurrentMessages().slice(-count)
    },
    
    hasUnreadMessages: () => get().unreadCount > 0,
  }))
)

// Selectors
export const chatSelectors = {
  messages: (state: ChatState) => ({
    lobbyMessages: state.lobbyMessages,
    gameMessages: state.gameMessages,
    overlayMessages: state.overlayMessages,
  }),
  
  ui: (state: ChatState) => ({
    isOverlayOpen: state.isOverlayOpen,
    isSidebarOpen: state.isSidebarOpen,
    unreadCount: state.unreadCount,
    hasUnreadMessages: state.hasUnreadMessages(),
  }),
  
  input: (state: ChatState) => ({
    currentInput: state.currentInput,
    isTyping: state.isTyping,
  }),
  
  settings: (state: ChatState) => ({
    showTimestamps: state.showTimestamps,
    enableNotifications: state.enableNotifications,
    autoFadeEnabled: state.autoFadeEnabled,
    autoFadeTimeout: state.autoFadeTimeout,
  }),
}

// Auto-cleanup effect
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (autoFadeTimeoutId) {
      clearTimeout(autoFadeTimeoutId)
    }
  })
}