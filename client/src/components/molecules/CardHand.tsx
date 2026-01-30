import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCard, type Card } from '../atoms/GameCard'
import { cn, gameUtils, animations } from '../../lib/utils'
import { useGameStore } from '../../stores/gameStore'

interface CardHandProps {
  cards: Card[]
  maxCards?: number
  spacing?: 'tight' | 'normal' | 'loose'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical' | 'fan'
  selectable?: boolean
  multiSelect?: boolean
  showCardCount?: boolean
  emptyMessage?: string
  onCardSelect?: (card: Card) => void
  onCardLongPress?: (card: Card) => void
  className?: string
  'data-testid'?: string
}

const spacingClasses = {
  tight: '-space-x-8 sm:-space-x-6',
  normal: '-space-x-6 sm:-space-x-4', 
  loose: '-space-x-4 sm:-space-x-2',
}

const CardHand: React.FC<CardHandProps> = ({
  cards,
  maxCards = 13,
  spacing = 'normal',
  size = 'md',
  orientation = 'horizontal',
  selectable = true,
  multiSelect = true,
  showCardCount = false,
  emptyMessage = 'No cards',
  onCardSelect,
  onCardLongPress,
  className,
  'data-testid': testId,
}) => {
  const selectedCards = useGameStore(state => state.selectedCards)
  const selectCard = useGameStore(state => state.selectCard)
  const deselectCard = useGameStore(state => state.deselectCard)
  const clearSelection = useGameStore(state => state.clearSelection)
  
  const handleCardSelect = (card: Card, index?: number) => {
    if (!selectable || index === undefined) return
    
    const isSelected = selectedCards.includes(index)
    
    if (isSelected) {
      deselectCard(index)
    } else {
      if (!multiSelect) {
        clearSelection()
      }
      selectCard(index)
    }
    
    onCardSelect?.(card)
  }
  
  const handleCardLongPress = (card: Card) => {
    onCardLongPress?.(card)
  }
  
  // Calculate visible cards (handle overflow)
  const visibleCards = cards.slice(0, maxCards)
  const overflowCount = Math.max(0, cards.length - maxCards)
  
  // Animation variants for card entrance
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.8,
      rotate: -10 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300,
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.8,
      transition: { duration: 0.15 }
    }
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      }
    }
  }
  
  if (cards.length === 0) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg',
          'text-gray-500 text-sm',
          className
        )}
        data-testid={testId}
      >
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className={cn('relative', className)} data-testid={testId}>
      {/* Card Count Badge */}
      {showCardCount && (
        <div className="absolute -top-2 -right-2 z-10 bg-primary-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {cards.length}
        </div>
      )}
      
      {/* Cards Container */}
      <motion.div
        className={cn(
          'flex relative',
          // Orientation classes
          orientation === 'horizontal' && [
            'flex-row items-end',
            spacingClasses[spacing]
          ],
          orientation === 'vertical' && [
            'flex-col items-center',
            spacing === 'tight' && '-space-y-8',
            spacing === 'normal' && '-space-y-6',
            spacing === 'loose' && '-space-y-4',
          ],
          orientation === 'fan' && [
            'flex-row items-end justify-center',
            spacingClasses[spacing]
          ]
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="sync">
          {visibleCards.map((card, index) => {
            const cardIndex = cards.indexOf(card) // Get original index
            const isSelected = selectedCards.includes(cardIndex)
            
            return (
              <motion.div
                key={gameUtils.getCardId(card)}
                className={cn(
                  'relative transition-all duration-200',
                  selectable && 'cursor-pointer',
                  // Z-index for proper stacking
                  `z-[${index + 1}]`,
                  // Hover effects
                  selectable && 'hover:z-50 hover:-translate-y-2',
                  // Selected state
                  isSelected && 'z-50'
                )}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index}
                layout
                whileHover={selectable ? {
                  y: -8,
                  scale: 1.05,
                  transition: { type: "spring" as const, damping: 15, stiffness: 400 }
                } : undefined}
              >
                <GameCard
                  card={card}
                  cardIndex={cardIndex}
                  size={size}
                  isSelected={isSelected}
                  isPlayable={selectable}
                  onSelect={handleCardSelect}
                  onLongPress={handleCardLongPress}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Overflow Indicator */}
        {overflowCount > 0 && (
          <motion.div
            className={cn(
              'flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg',
              'text-gray-600 text-sm font-medium',
              gameUtils.getCardSize(size)
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" as const, damping: 25, stiffness: 200 }}
          >
            +{overflowCount}
          </motion.div>
        )}
      </motion.div>
      
      {/* Selection Summary (for mobile) */}
      {selectedCards.length > 0 && (
        <motion.div
          className="absolute -bottom-8 left-0 right-0 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {selectedCards.length} selected
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Specialized variants for different game areas
interface TeamSequenceHandProps {
  sequences: Array<{
    id: string
    cards: Card[]
    type: 'clean' | 'dirty' | 'aces'
  }>
  teamNumber: number
  className?: string
}

const TeamSequenceHand: React.FC<TeamSequenceHandProps> = ({
  sequences,
  teamNumber,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-gray-700">
        Team {teamNumber} Sequences
      </h3>
      {sequences.map((sequence) => (
        <div key={sequence.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {sequence.type === 'clean' ? 'Clean' : 
               sequence.type === 'dirty' ? 'Dirty' : 'Aces'} Canastra
            </span>
            {sequence.cards.length >= 7 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Complete
              </span>
            )}
          </div>
          <CardHand
            cards={sequence.cards}
            size="sm"
            spacing="tight"
            selectable={false}
            showCardCount={false}
          />
        </div>
      ))}
    </div>
  )
}

export { CardHand, TeamSequenceHand }
export type { CardHandProps, TeamSequenceHandProps }