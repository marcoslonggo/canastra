import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ActionButton, DiscardButton, BaterButton } from '../atoms/ActionButton';
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
  onBater?: () => void;
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
  onBater,
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
  const [hasInteracted, setHasInteracted] = useState(false);
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
    
    // Mark as interacted to hide tips
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Start long press detection for card selection
    const timer = setTimeout(() => {
      touchFeedback.vibrate(50);
      onCardSelect(mapSortedToOriginal(cardIndex));
    }, 400); // Reduced to 400ms for better responsiveness
    
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
    
    // Mark as interacted
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    // Improved swipe detection with better thresholds
    const swipeThreshold = 40;
    const velocityThreshold = 200;
    
    // Swipe up to select/deselect
    if (offset.y < -swipeThreshold && Math.abs(velocity.y) > velocityThreshold) {
      onCardSelect(mapSortedToOriginal(cardIndex));
      touchFeedback.vibrate(25);
      return; // Prevent other actions
    }
    
    // Swipe down to discard (if allowed)
    if (offset.y > swipeThreshold && Math.abs(velocity.y) > velocityThreshold && isMyTurn && onDiscard) {
      const canDiscardCard = allowedActions.allowDiscardDrawnCards || 
                           !drawnCardIds.includes(sortedCards[cardIndex].id);
      
      if (canDiscardCard) {
        onDiscard(mapSortedToOriginal(cardIndex));
        touchFeedback.vibrate(50);
      } else {
        // Provide feedback for invalid discard
        touchFeedback.vibrate([50, 50, 50]); // Triple vibration for error
      }
      return;
    }
    
    // Horizontal swipe for reordering (if enabled in future)
    if (Math.abs(offset.x) > swipeThreshold * 2 && Math.abs(velocity.x) > velocityThreshold) {
      // Future: implement card reordering via swipe
      touchFeedback.vibrate(10);
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

      {/* Desktop Header - Minimal styling */}
      {!isMobile && isMyTurn && (selectedCards.length > 0 || canBaixar || canBater) && (
        <div className="hand-header flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100">
          {/* Selection indicator */}
          {selectedCards.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-blue-700">
                {selectedCards.length} selected
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Baixar Button */}
            {canBaixar && selectedCards.length >= 3 && (
              <ActionButton
                size="sm"
                variant="success"
                onClick={handleBaixarClick}
              >
                {t('game.hand.actions.baixar')} ({selectedCards.length})
              </ActionButton>
            )}
            
            {/* Discard Button */}
            {selectedCards.length > 0 && (
              <DiscardButton
                size="sm"
                onClick={handleDiscardClick}
              >
                {allowedActions.allowMultipleDiscard && selectedCards.length > 1 
                  ? `${t('game.hand.actions.discard')} (${selectedCards.length})`
                  : t('game.hand.actions.discard')
                }
              </DiscardButton>
            )}
            
            {/* Bater Button */}
            {canBater && (
              <BaterButton
                size="sm"
                onClick={() => onBater && onBater()}
              >
                {t('game.hand.actions.bater')}
              </BaterButton>
            )}
            
          </div>
        </div>
      )}
      
      {/* Hand Cards - Mobile-First Scrollable Container */}
      <div
        ref={containerRef}
        className={cn(
          'hand-cards flex-1 relative',
          // CRITICAL: Enable natural scrolling on mobile
          'overflow-y-auto overflow-x-hidden',
          // Mobile-first responsive padding
          'p-3 sm:p-4',
          // Compact mobile height to ensure deck visibility
          isMobile ? 'min-h-[120px] max-h-[30vh]' : 'min-h-[200px] max-h-[300px]'
        )}
      >
        {/* Sort Icon - Positioned for both mobile and desktop */}
        <button
          onClick={toggleSort}
          title={`Sort: ${sortType === 'suit' ? '♠♥' : sortType === 'blackred1' ? 'B1' : 'B2'}`}
          className={cn(
            "absolute top-1 right-1 z-10 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700 shadow-sm hover:bg-white active:scale-95 transition-all",
            isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
          )}
        >
          {sortType === 'suit' ? '♠♥' : sortType === 'blackred1' ? 'B1' : 'B2'}
        </button>
        {sortedCards.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No cards in hand</p>
          </div>
        ) : (
          <div className={cn(
            'card-grid',
            // Responsive grid optimized for vertical space - more columns = more rows
            'grid gap-1',
            isMobile 
              ? 'grid-cols-12 sm:grid-cols-15 md:grid-cols-18' // Mobile: 12-18 columns for ultra-dense layout and maximum vertical efficiency
              : 'grid-cols-10 lg:grid-cols-12' // Desktop: 10-12 columns
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
                    {...(!isMobile && {
                      drag: "x",
                      dragConstraints: { left: -100, right: 100 },
                      dragElastic: 0.3,
                      onDragStart: () => handleDragStart(index),
                      onDragEnd: handleDragEnd
                    })}
                    onPanEnd={(_, info) => handlePanEnd(index, info)}
                    className={cn(
                      'relative cursor-pointer',
                      isDragTarget && 'ring-2 ring-blue-400',
                      isDrawn && 'ring-2 ring-green-400'
                    )}
                    {...(!isMobile && {
                      onDragOver: (e) => handleDragOver(e, index),
                      onDrop: (e) => handleDrop(e, index)
                    })}
                    onTouchStart={(e) => handleTouchStart(index, e)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <CardComponent
                      card={card}
                      isSelected={isSelected}
                      isDraggable={true}
                      isDrawnThisTurn={drawnCardIds.includes(card.id)}
                      onClick={() => onCardSelect(mapSortedToOriginal(index))}
                      className={cn(
                        'w-full',
                        // Card size: ultra-compact mobile, standard desktop proportions
                        isMobile ? 'min-h-[45px] max-h-[55px]' : 'min-h-[90px] max-h-[100px]'
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
        

        {/* Floating Action Buttons - Mobile Only */}
        {isMobile && isMyTurn && (selectedCards.length > 0 || canBater) && (
          <motion.div 
            className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Selection indicator */}
            {selectedCards.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {selectedCards.length}
              </div>
            )}
            
            {/* Baixar Button */}
            {canBaixar && selectedCards.length >= 3 && (
              <ActionButton
                size="sm"
                variant="success"
                onClick={handleBaixarClick}
                className="shadow-lg"
              >
                {t('game.hand.actions.baixar')} ({selectedCards.length})
              </ActionButton>
            )}
            
            {/* Discard Button */}
            {selectedCards.length > 0 && (
              <DiscardButton
                size="sm"
                onClick={handleDiscardClick}
                className="shadow-lg"
              >
                {allowedActions.allowMultipleDiscard && selectedCards.length > 1 
                  ? `${t('game.hand.actions.discard')} (${selectedCards.length})`
                  : t('game.hand.actions.discard')
                }
              </DiscardButton>
            )}
            
            {/* Bater Button */}
            {canBater && (
              <BaterButton
                size="sm"
                onClick={() => onBater && onBater()}
                className="shadow-lg"
              >
                {t('game.hand.actions.bater')}
              </BaterButton>
            )}
            
          </motion.div>
        )}
      </div>
    </div>
  );
};