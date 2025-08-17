import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Device detection utilities for responsive behavior
 */
export const deviceUtils = {
  isMobile: () => window.innerWidth < 768,
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => window.innerWidth >= 1024,
  isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
}

/**
 * Animation utilities
 */
export const animations = {
  // Spring animation configs for Framer Motion
  spring: {
    default: { type: "spring", damping: 20, stiffness: 300 },
    gentle: { type: "spring", damping: 25, stiffness: 200 },
    snappy: { type: "spring", damping: 15, stiffness: 400 },
  },
  
  // Transition configs
  transition: {
    fast: { duration: 0.15, ease: "easeOut" },
    default: { duration: 0.25, ease: "easeInOut" },
    slow: { duration: 0.4, ease: "easeInOut" },
  },
}

/**
 * Touch feedback utilities
 */
export const touchFeedback = {
  // Haptic feedback (if supported)
  vibrate: (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  },
  
  // Visual touch feedback
  addTouchClass: (element: HTMLElement, className = 'active') => {
    element.classList.add(className)
    setTimeout(() => element.classList.remove(className), 150)
  },
}

/**
 * Responsive utilities
 */
export const responsive = {
  // Get current breakpoint
  getCurrentBreakpoint: () => {
    const width = window.innerWidth
    if (width < 475) return 'xs'
    if (width < 640) return 'sm'
    if (width < 768) return 'md'
    if (width < 1024) return 'lg'
    if (width < 1280) return 'xl'
    return '2xl'
  },
  
  // Check if current screen matches breakpoint
  matches: (breakpoint: string) => {
    const breakpoints = {
      xs: 475,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    }
    return window.innerWidth >= (breakpoints[breakpoint as keyof typeof breakpoints] || 0)
  },
}

/**
 * Form utilities
 */
export const formUtils = {
  // Mobile keyboard handling
  preventZoom: (input: HTMLInputElement) => {
    input.addEventListener('focus', () => {
      if (deviceUtils.isMobile()) {
        const viewport = document.querySelector('meta[name=viewport]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
        }
      }
    })
    
    input.addEventListener('blur', () => {
      if (deviceUtils.isMobile()) {
        const viewport = document.querySelector('meta[name=viewport]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1')
        }
      }
    })
  },
}

/**
 * Game-specific utilities
 */
export const gameUtils = {
  // Card suit utilities
  getSuitColor: (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'hearts':
      case 'diamonds':
        return 'text-hearts'
      case 'clubs':
      case 'spades':
        return 'text-clubs'
      default:
        return 'text-gray-900'
    }
  },
  
  // Card size utilities
  getCardSize: (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-10 h-14',      // 40x56px
      md: 'w-12 h-16',      // 48x64px  
      lg: 'w-16 h-24',      // 64x96px
    }
    return sizes[size]
  },
  
  // Generate card ID for consistent animations
  getCardId: (card: any) => {
    return `${card.suit}-${card.value}-${card.id || ''}`
  },
}

/**
 * Accessibility utilities
 */
export const a11y = {
  // Screen reader announcements
  announce: (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  },
  
  // Focus management
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  },
}