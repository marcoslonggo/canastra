import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ActionButton, DiscardButton, BaterButton, EndTurnButton } from '../atoms/ActionButton';
import { Card as CardComponent } from '../Card';
import { useUIStore } from '../../stores/uiStore';
import { cn, touchFeedback } from '../../lib/utils';
import type { Card, Sequence } from '../../types';

interface HandManagerProps {
  cards: Card[];
  selectedCards: number[];
  onCardSelect: (index: number) => void;
  onCardReorder: (fromIndex: number, toIndex: number) => void;
  isMyTurn: boolean;
  drawnCardIds?: string[];
  
  // Action handlers
  onBaixar?: () => void;
  onDiscard?: (cardIndex: number) => void;
  onMultipleDiscard?: () => void;
  onAddToSequence?: (sequenceId: string) => void;
  onEndTurn?: () => void;
  
  // Game state
  canBaixar?: boolean;
  canBater?: boolean;
  hasBaixado?: boolean;
  availableSequences?: Sequence[];
  allowedActions?: {
    allowPlayAllCards: boolean;
    allowMultipleDiscard: boolean;
    allowDiscardDrawnCards: boolean;
  };
  
  className?: string;
}

export const HandManager: React.FC<HandManagerProps> = ({
  cards,
  selectedCards,
  onCardSelect,
  onCardReorder,
  isMyTurn,
  drawnCardIds = [],
  onBaixar,
  onDiscard,
  onMultipleDiscard,
  onAddToSequence,
  onEndTurn,
  canBaixar = false,
  canBater = false,
  hasBaixado = false,
  availableSequences = [],
  allowedActions = {
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
  },
  className,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useUIStore();
  
  // Card sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortType, setSortType] = useState<'suit' | 'blackred1' | 'blackred2'>('suit');
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Touch interaction state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sort cards and create mapping between sorted and original indices
  const getSortedCardsWithMapping = (): { sortedCards: Card[], sortedToOriginalMap: number[] } => {
    // Create array with original indices
    const cardsWithIndices = cards.map((card, originalIndex) => ({ card, originalIndex }));
    
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
  
  // Helper function to check if a sorted card is selected (by converting to original index)
  const isSortedCardSelected = (sortedIndex: number): boolean => {
    const originalIndex = mapSortedToOriginal(sortedIndex);
    return selectedCards.includes(originalIndex);
  };
  
  // Handle touch interactions
  const handleTouchStart = (cardIndex: number, event: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Start long press detection for card selection
    const timer = setTimeout(() => {
      touchFeedback.vibrate(50);
      onCardSelect(mapSortedToOriginal(cardIndex));
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  // Handle swipe gestures for card actions
  const handlePanEnd = (cardIndex: number, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Swipe up to select/deselect
    if (offset.y < -50 && Math.abs(velocity.y) > 300) {
      onCardSelect(mapSortedToOriginal(cardIndex));
      touchFeedback.vibrate(25);
    }
    
    // Swipe down to discard (if allowed)
    if (offset.y > 50 && Math.abs(velocity.y) > 300 && isMyTurn && onDiscard) {
      const canDiscardCard = allowedActions.allowDiscardDrawnCards || 
                           !drawnCardIds.includes(sortedCards[cardIndex].id);
      
      if (canDiscardCard) {
        onDiscard(mapSortedToOriginal(cardIndex));
        touchFeedback.vibrate(50);
      }
    }
  };
  
  // Desktop drag and drop handlers
  const handleDragStart = (cardIndex: number) => {
    setDraggedIndex(cardIndex);
  };
  
  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(targetIndex);
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onCardReorder(mapSortedToOriginal(draggedIndex), mapSortedToOriginal(targetIndex));
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  // Action button handlers
  const handleBaixarClick = () => {
    if (canBaixar && selectedCards.length >= 3 && onBaixar) {
      onBaixar();
    }
  };
  
  const handleDiscardClick = () => {
    if (selectedCards.length === 1 && onDiscard) {
      // selectedCards contains original indices, so we can use them directly
      onDiscard(selectedCards[0]);
    } else if (allowedActions.allowMultipleDiscard && selectedCards.length > 1 && onMultipleDiscard) {
      onMultipleDiscard();
    }
  };
  
  const toggleSort = () => {
    if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('asc');
      // Cycle through sort types
      const types: Array<'suit' | 'blackred1' | 'blackred2'> = ['suit', 'blackred1', 'blackred2'];
      const currentIndex = types.indexOf(sortType);
      const nextIndex = (currentIndex + 1) % types.length;
      setSortType(types[nextIndex]);
    }
  };
  
  return (
    <div className={cn(
      'hand-manager flex flex-col',
      // CRITICAL: Remove fixed heights and enable scrolling
      'min-h-0 flex-shrink-0', 
      className
    )}>
      {/* Hand Header - Actions and Controls */}
      <div className="hand-header flex flex-wrap items-center justify-between gap-2 p-3 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ActionButton
            size="sm"
            variant="ghost"
            onClick={toggleSort}
            title="Sort cards"
            className="text-xs"
          >
            🔀 {sortType} {sortOrder === 'asc' ? '↑' : '↓'}
          </ActionButton>
          <span className="text-xs text-gray-500">
            {selectedCards.length > 0 && `${selectedCards.length} selected`}
          </span>
        </div>
        
        {/* Action Buttons */}
        {isMyTurn && (
          <div className="flex flex-wrap gap-2">
            {/* Baixar Button */}
            {canBaixar && (
              <ActionButton
                size="sm"
                variant="success"
                onClick={handleBaixarClick}
                disabled={selectedCards.length < 3}
              >
                {t('game.hand.actions.baixar')} ({selectedCards.length}/3+)
              </ActionButton>
            )}
            
            {/* Discard Button */}
            <DiscardButton
              size="sm"
              onClick={handleDiscardClick}
              disabled={selectedCards.length === 0}
            >
              {t('game.hand.actions.discard')} 
              {allowedActions.allowMultipleDiscard && selectedCards.length > 1 
                ? ` (${selectedCards.length})`
                : ''
              }
            </DiscardButton>
            
            {/* Bater Button */}
            {canBater && (
              <BaterButton
                size="sm"
                onClick={() => {/* Handle bater */}}
              >
                {t('game.hand.actions.bater')}
              </BaterButton>
            )}
            
            {/* End Turn */}
            {hasBaixado && (
              <EndTurnButton
                size="sm"
                onClick={onEndTurn}
              >
                {t('game.hand.actions.endTurn')}
              </EndTurnButton>
            )}
          </div>
        )}
      </div>
      
      {/* Hand Cards - Mobile-First Scrollable Container */}
      <div
        ref={containerRef}
        className={cn(
          'hand-cards flex-1',
          // CRITICAL: Enable natural scrolling on mobile
          'overflow-y-auto overflow-x-hidden',
          // Mobile-first responsive padding
          'p-3 sm:p-4',
          // Natural height - let content determine size
          'min-h-[200px]',
          isMobile ? 'max-h-[40vh]' : 'max-h-[300px]'
        )}
      >
        {sortedCards.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No cards in hand</p>
          </div>
        ) : (
          <div className={cn(
            'card-grid',
            // Responsive grid for different screen sizes
            'grid gap-2',
            isMobile 
              ? 'grid-cols-4 sm:grid-cols-6' // Mobile: 4 columns, larger mobile: 6
              : 'grid-cols-8 lg:grid-cols-10' // Desktop: 8-10 columns
          )}>
            <AnimatePresence mode="popLayout">
              {sortedCards.map((card, index) => {
                const isSelected = isSortedCardSelected(index);
                const isDragged = draggedIndex === index;
                const isDrawn = drawnCardIds.includes(card.id);
                const isDragTarget = dragOverIndex === index;
                
                return (
                  <motion.div
                    key={`${card.id}-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: isDragged ? 0.5 : 1,
                      scale: isSelected ? 1.05 : 1,
                      y: isSelected ? -8 : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.95 }}
                    drag={!isMobile}
                    dragSnapToOrigin
                    onPanEnd={(_, info) => handlePanEnd(index, info)}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'relative cursor-pointer',
                      isDragTarget && 'ring-2 ring-blue-400',
                      isDrawn && 'ring-2 ring-green-400'
                    )}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onTouchStart={(e) => handleTouchStart(index, e)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <CardComponent
                      card={card}
                      isSelected={isSelected}
                      isDraggable={!isMobile}
                      isDrawnThisTurn={drawnCardIds.includes(card.id)}
                      onClick={() => onCardSelect(mapSortedToOriginal(index))}
                      className={cn(
                        'w-full',
                        // Mobile-optimized card size
                        isMobile ? 'min-h-[80px]' : 'min-h-[100px]'
                      )}
                    />
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                      >
                        {selectedCards.indexOf(mapSortedToOriginal(index)) + 1}
                      </motion.div>
                    )}
                    
                    {/* Drawn card indicator */}
                    {isDrawn && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full shadow-sm" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {/* Mobile Usage Hint */}
        {isMobile && sortedCards.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <p>💡 Long press to select • Swipe up to select • Swipe down to discard</p>
          </div>
        )}
      </div>
    </div>
  );
};