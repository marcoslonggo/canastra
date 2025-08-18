import React from 'react'
import { motion } from 'framer-motion'
import { cn, gameUtils, touchFeedback } from '../../lib/utils'
import { useGameStore } from '../../stores/gameStore'

interface Card {
  id: string
  suit: string
  value: string
  isWild?: boolean
}

interface GameCardProps {
  card: Card
  cardIndex?: number
  size?: 'sm' | 'md' | 'lg'
  isSelected?: boolean
  isPlayable?: boolean
  showBack?: boolean
  onSelect?: (card: Card, index?: number) => void
  onLongPress?: (card: Card, index?: number) => void
  className?: string
  'data-testid'?: string
}

const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  (
    {
      card,
      cardIndex,
      size = 'md',
      isSelected = false,
      isPlayable = true,
      showBack = false,
      onSelect,
      onLongPress,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null)
    
    // Get selection state from store if not provided
    const isCardSelected = useGameStore(state => state.isCardSelected)
    const actuallySelected = isSelected || (cardIndex !== undefined && isCardSelected(cardIndex))
    
    const suitColor = gameUtils.getSuitColor(card.suit)
    const cardSize = gameUtils.getCardSize(size)
    
    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault()
      setIsPressed(true)
      
      // Start long press timer
      const timer = setTimeout(() => {
        if (onLongPress) {
          touchFeedback.vibrate([50, 50, 50]) // Triple vibration for long press
          onLongPress(card, cardIndex)
        }
      }, 500) // 500ms for long press
      
      setLongPressTimer(timer)
    }
    
    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault()
      setIsPressed(false)
      
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      
      // Handle tap/click
      if (isPlayable && onSelect) {
        touchFeedback.vibrate(30) // Quick vibration for tap
        onSelect(card, cardIndex)
      }
    }
    
    const handleTouchCancel = () => {
      setIsPressed(false)
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
    }
    
    // Mouse event handlers for desktop
    const handleClick = () => {
      if (isPlayable && onSelect) {
        onSelect(card, cardIndex)
      }
    }
    
    // Cleanup timer on unmount
    React.useEffect(() => {
      return () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
        }
      }
    }, [longPressTimer])
    
    const getSuitSymbol = (suit: string) => {
      switch (suit.toLowerCase()) {
        case 'hearts': return '♥'
        case 'diamonds': return '♦'
        case 'clubs': return '♣'
        case 'spades': return '♠'
        default: return suit
      }
    }
    
    const getDisplayValue = (value: string) => {
      switch (value.toLowerCase()) {
        case 'jack': return 'J'
        case 'queen': return 'Q'
        case 'king': return 'K'
        case 'ace': return 'A'
        case 'joker': return '🃏'
        default: return value
      }
    }
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'card-game relative cursor-pointer select-none',
          cardSize,
          actuallySelected && 'card-selected',
          !isPlayable && 'opacity-50 cursor-not-allowed',
          isPressed && 'scale-95',
          card.isWild && 'ring-2 ring-yellow-400',
          className
        )}
        initial={{ scale: 1, rotateY: 0 }}
        animate={{
          scale: actuallySelected ? 1.05 : 1,
          rotateY: showBack ? 180 : 0,
          y: actuallySelected ? -8 : 0,
        }}
        whileHover={isPlayable ? { scale: 1.02 } : undefined}
        whileTap={isPlayable ? { scale: 0.98 } : undefined}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 300,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleClick}
        data-testid={testId}
        data-card-id={gameUtils.getCardId(card)}
        {...props}
      >
        {/* Card Face */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg border border-gray-300 bg-white shadow-sm',
            'flex flex-col justify-between p-1 sm:p-2',
            showBack && 'opacity-0'
          )}
        >
          {/* Top left corner */}
          <div className={cn('text-xs sm:text-sm font-bold', suitColor)}>
            <div>{getDisplayValue(card.value)}</div>
            <div className="text-xs">{getSuitSymbol(card.suit)}</div>
          </div>
          
          {/* Center symbol for face cards and special cards */}
          <div className={cn('flex-1 flex items-center justify-center text-lg sm:text-xl', suitColor)}>
            {card.value.toLowerCase() === 'joker' ? (
              <span className="text-2xl">🃏</span>
            ) : (
              <span>{getSuitSymbol(card.suit)}</span>
            )}
          </div>
          
          {/* Bottom right corner (rotated) */}
          <div className={cn('text-xs sm:text-sm font-bold self-end transform rotate-180', suitColor)}>
            <div>{getDisplayValue(card.value)}</div>
            <div className="text-xs">{getSuitSymbol(card.suit)}</div>
          </div>
          
          {/* Wild card indicator */}
          {card.isWild && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full transform translate-x-1 -translate-y-1" />
          )}
        </div>
        
        {/* Card Back */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg border border-gray-300 bg-cardBack shadow-sm',
            'flex items-center justify-center',
            !showBack && 'opacity-0'
          )}
        >
          <div className="text-white text-xl font-bold">🃏</div>
        </div>
        
        {/* Loading/Processing Overlay */}
        {isPressed && (
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.div>
    )
  }
)

GameCard.displayName = 'GameCard'

export { GameCard }
export type { GameCardProps, Card }