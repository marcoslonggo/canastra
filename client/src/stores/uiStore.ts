import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import React from 'react'

interface UIState {
  // Device and responsive state
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  currentBreakpoint: string
  
  // Modal and overlay state
  isModalOpen: boolean
  modalContent: string | null
  isDiscardModalOpen: boolean
  isSettingsOpen: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Error state
  error: string | null
  
  // Action message state
  actionMessage: string | null
  actionMessageType: 'info' | 'success' | 'warning' | 'error'
  
  // Theme and preferences
  theme: 'light' | 'dark'
  reducedMotion: boolean
  highContrast: boolean
  
  // Game UI state
  showCardDetails: boolean
  selectedCardForDetails: any | null
  isGameMenuOpen: boolean
  
  // Performance settings
  enableAnimations: boolean
  hardwareAcceleration: boolean
  
  // Actions
  setDeviceInfo: (info: Partial<Pick<UIState, 'isMobile' | 'isTablet' | 'isDesktop' | 'isTouchDevice' | 'currentBreakpoint'>>) => void
  openModal: (content: string) => void
  closeModal: () => void
  openDiscardModal: () => void
  closeDiscardModal: () => void
  toggleSettings: () => void
  setLoading: (loading: boolean, message?: string) => void
  setError: (error: string | null) => void
  setActionMessage: (message: string | null, type?: 'info' | 'success' | 'warning' | 'error') => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleCardDetails: (card?: any) => void
  toggleGameMenu: () => void
  updatePreferences: (prefs: Partial<Pick<UIState, 'reducedMotion' | 'highContrast' | 'enableAnimations' | 'hardwareAcceleration'>>) => void
  
  // Computed getters
  shouldShowMobileUI: () => boolean
  shouldReduceAnimations: () => boolean
}

const getInitialDeviceState = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      currentBreakpoint: 'xl',
    }
  }
  
  const width = window.innerWidth
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isTouchDevice,
    currentBreakpoint: 
      width < 475 ? 'xs' :
      width < 640 ? 'sm' :
      width < 768 ? 'md' :
      width < 1024 ? 'lg' :
      width < 1280 ? 'xl' : '2xl',
  }
}

const getInitialAccessibilitySettings = () => {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: false,
      highContrast: false,
    }
  }
  
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,
  }
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    ...getInitialDeviceState(),
    ...getInitialAccessibilitySettings(),
    
    // Modal and overlay state
    isModalOpen: false,
    modalContent: null,
    isDiscardModalOpen: false,
    isSettingsOpen: false,
    
    // Loading and error state
    isLoading: false,
    loadingMessage: '',
    error: null,
    
    // Action message state
    actionMessage: null,
    actionMessageType: 'info',
    
    // Theme and preferences
    theme: 'light',
    
    // Game UI state
    showCardDetails: false,
    selectedCardForDetails: null,
    isGameMenuOpen: false,
    
    // Performance settings
    enableAnimations: true,
    hardwareAcceleration: true,
    
    // Actions
    setDeviceInfo: (info) => set((state) => ({ ...state, ...info })),
    
    openModal: (content) => set({ 
      isModalOpen: true, 
      modalContent: content 
    }),
    
    closeModal: () => set({ 
      isModalOpen: false, 
      modalContent: null 
    }),
    
    openDiscardModal: () => set({ isDiscardModalOpen: true }),
    closeDiscardModal: () => set({ isDiscardModalOpen: false }),
    
    toggleSettings: () => set((state) => ({ 
      isSettingsOpen: !state.isSettingsOpen 
    })),
    
    setLoading: (loading, message = '') => set({ 
      isLoading: loading, 
      loadingMessage: message 
    }),
    
    setError: (error) => set({ error }),
    
    setActionMessage: (message, type = 'info') => set({ 
      actionMessage: message, 
      actionMessageType: type 
    }),
    
    setTheme: (theme) => set({ theme }),
    
    toggleCardDetails: (card) => set((state) => ({
      showCardDetails: card ? true : !state.showCardDetails,
      selectedCardForDetails: card || (state.showCardDetails ? null : state.selectedCardForDetails)
    })),
    
    toggleGameMenu: () => set((state) => ({ 
      isGameMenuOpen: !state.isGameMenuOpen 
    })),
    
    updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
    
    // Computed getters
    shouldShowMobileUI: () => {
      const state = get()
      return state.isMobile || state.isTouchDevice
    },
    
    shouldReduceAnimations: () => {
      const state = get()
      return state.reducedMotion || !state.enableAnimations
    },
  }))
)

// Hook for responsive updates
export const useResponsiveUpdates = () => {
  const setDeviceInfo = useUIStore(state => state.setDeviceInfo)
  
  React.useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(getInitialDeviceState())
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDeviceInfo)
      window.addEventListener('orientationchange', updateDeviceInfo)
      
      return () => {
        window.removeEventListener('resize', updateDeviceInfo)
        window.removeEventListener('orientationchange', updateDeviceInfo)
      }
    }
  }, [setDeviceInfo])
}

// Selectors
export const uiSelectors = {
  device: (state: UIState) => ({
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
    isTouchDevice: state.isTouchDevice,
    currentBreakpoint: state.currentBreakpoint,
  }),
  
  modals: (state: UIState) => ({
    isModalOpen: state.isModalOpen,
    modalContent: state.modalContent,
    isDiscardModalOpen: state.isDiscardModalOpen,
    isSettingsOpen: state.isSettingsOpen,
  }),
  
  loading: (state: UIState) => ({
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
  }),
  
  theme: (state: UIState) => ({
    theme: state.theme,
    reducedMotion: state.reducedMotion,
    highContrast: state.highContrast,
  }),
  
  performance: (state: UIState) => ({
    enableAnimations: state.enableAnimations,
    hardwareAcceleration: state.hardwareAcceleration,
    shouldReduceAnimations: state.shouldReduceAnimations(),
  }),
}