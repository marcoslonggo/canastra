import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBack } from '../Card';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import type { Card as CardType } from '../../types';

interface DeckDisplayProps {
  // Main deck
  mainDeckCount: number;
  onDrawFromMainDeck?: () => void;
  
  // Discard pile
  discardPile: CardType[];
  onDiscardPileClick?: () => void;
  
  // Morto display
  mortosUsed: boolean[];
  mortos: CardType[][];
  
  // Game state
  isMyTurn?: boolean;
  allowedActions?: {
    allowPlayAllCards: boolean;
    allowMultipleDiscard: boolean;
    allowDiscardDrawnCards: boolean;
  };
  
  className?: string;
}

export const DeckDisplay: React.FC<DeckDisplayProps> = ({
  mainDeckCount,
  onDrawFromMainDeck,
  discardPile,
  onDiscardPileClick,
  mortosUsed = [],
  mortos = [],
  isMyTurn = false,
  allowedActions = {
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
  },
  className,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useUIStore();
  const [showMortoDetails, setShowMortoDetails] = React.useState(false);
  
  const isMyTurnOrCheat = () => {
    return isMyTurn || allowedActions.allowPlayAllCards;
  };

  const getSortedDiscardPile = (): CardType[] => {
    return [...discardPile].sort((a, b) => {
      // Sort by suit first, then by value
      if (a.suit !== b.suit) {
        const suitOrder = ['hearts', 'diamonds', 'clubs', 'spades', 'joker'];
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      }
      return a.value - b.value;
    });
  };

  // Calculate morto availability
  const availableCount = mortosUsed.filter(used => !used).length;

  return (
    <div className={cn(
      'deck-display flex items-center w-full',
      // Ensure enough space for overlapping cards - remove max-w constraint
      isMobile ? 'justify-center gap-2 px-4 py-2' : 'justify-center gap-6 p-4',
      className
    )}>
      {/* Main Deck Section - Ultra Compact */}
      <div className="deck-section flex flex-col items-center gap-1 flex-shrink-0">
        <motion.div 
          className={cn(
            'deck-pile relative cursor-pointer',
            isMyTurnOrCheat() && 'hover:scale-105 transition-transform',
            !isMyTurnOrCheat() && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => {
            if (isMyTurnOrCheat() && onDrawFromMainDeck) {
              onDrawFromMainDeck();
            }
          }}
          whileHover={isMyTurnOrCheat() ? { scale: 1.05 } : {}}
          whileTap={isMyTurnOrCheat() ? { scale: 0.98 } : {}}
        >
          {mainDeckCount > 0 ? (
            <CardBack className={cn(
              'deck-card shadow-sm',
              isMobile ? 'w-6 h-9' : 'w-16 h-24'
            )} />
          ) : (
            <div className={cn(
              'empty-deck border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
              isMobile ? 'w-6 h-9 text-xs' : 'w-16 h-24 text-sm'
            )}>
              📚
            </div>
          )}
        </motion.div>
        {isMobile && (
          <span className="text-xs text-gray-500 font-medium">
            {mainDeckCount}
          </span>
        )}
      </div>

      {/* Discard Pile Section - Ensure space for overlapping cards */}
      <div className="deck-section flex flex-col items-center gap-1 flex-shrink-0 min-w-0">
        <motion.div 
          className={cn(
            'discard-pile-container relative cursor-pointer',
            'hover:scale-105 transition-transform'
          )}
          onClick={onDiscardPileClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {discardPile.length > 0 ? (
            <div className="discard-pile-cards relative">
              {isMobile ? (
                // Mobile: Show only last 2 cards with counter for space efficiency
                <>
                  {getSortedDiscardPile().slice(-2).map((card, index) => (
                    <Card 
                      key={`discard-${index}-${card.id || `${card.value}-${card.suit}`}`}
                      card={card}
                      className={cn(
                        'discard-card-small absolute shadow-sm w-6 h-9',
                        index === 1 && 'translate-x-0.5 translate-y-0.5 z-10'
                      )}
                    />
                  ))}
                  {discardPile.length > 2 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-[10px] font-bold shadow-sm flex items-center justify-center w-4 h-4">
                      +{discardPile.length - 2}
                    </div>
                  )}
                </>
              ) : (
                // Desktop: Adaptive layout based on card count
                (() => {
                  const sortedCards = getSortedDiscardPile();
                  const cardCount = sortedCards.length;
                  
                  if (cardCount <= 6) {
                    // Small number: Single row with safe overlap - ensure container width accommodates all cards
                    const containerWidth = cardCount === 1 ? 48 : (48 + (cardCount - 1) * 24); // 48px first card + 24px per additional card
                    return (
                      <div className="flex items-center relative" style={{ minWidth: `${containerWidth}px` }}>
                        {sortedCards.map((card, index) => (
                          <Card 
                            key={`discard-${index}-${card.id || `${card.value}-${card.suit}`}`}
                            card={card}
                            className={cn(
                              'discard-card-reduced shadow-sm w-12 h-16',
                              index > 0 && '-ml-6', // Controlled overlap
                              index === cardCount - 1 && 'z-10'
                            )}
                          />
                        ))}
                        {cardCount > 1 && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center justify-center w-5 h-5 z-20">
                            {cardCount}
                          </div>
                        )}
                      </div>
                    );
                  } else if (cardCount <= 12) {
                    // Medium number: Two rows with proper container sizing
                    const firstRow = sortedCards.slice(0, 6);
                    const secondRow = sortedCards.slice(6);
                    const maxRowLength = Math.max(firstRow.length, secondRow.length);
                    const containerWidth = maxRowLength === 1 ? 40 : (40 + (maxRowLength - 1) * 20); // 40px first card + 20px per additional
                    
                    return (
                      <div className="relative" style={{ minWidth: `${containerWidth}px` }}>
                        {/* First row */}
                        <div className="flex items-center relative justify-center mb-1">
                          {firstRow.map((card, index) => (
                            <Card 
                              key={`discard-r1-${index}-${card.id || `${card.value}-${card.suit}`}`}
                              card={card}
                              className={cn(
                                'discard-card-small shadow-sm w-10 h-14',
                                index > 0 && '-ml-4' // Reduced overlap for better visibility
                              )}
                            />
                          ))}
                        </div>
                        {/* Second row */}
                        <div className="flex items-center relative justify-center">
                          {secondRow.map((card, index) => (
                            <Card 
                              key={`discard-r2-${index}-${card.id || `${card.value}-${card.suit}`}`}
                              card={card}
                              className={cn(
                                'discard-card-small shadow-sm w-10 h-14',
                                index > 0 && '-ml-4', // Reduced overlap for better visibility
                                index === secondRow.length - 1 && 'z-10'
                              )}
                            />
                          ))}
                        </div>
                        {/* Card count badge */}
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center justify-center w-5 h-5 z-20">
                          {cardCount}
                        </div>
                      </div>
                    );
                  } else {
                    // Large number: Show sample + overflow indicator with proper container sizing
                    const displayCards = sortedCards.slice(0, 8); // Show first 8 cards
                    const overflowCount = cardCount - 8;
                    
                    return (
                      <div className="relative" style={{ minWidth: '140px' }}>
                        {/* Two rows of 4 cards each - Fixed grid size */}
                        <div className="grid grid-cols-4 gap-1 relative w-fit mx-auto">
                          {displayCards.map((card, index) => (
                            <Card 
                              key={`discard-grid-${index}-${card.id || `${card.value}-${card.suit}`}`}
                              card={card}
                              className="discard-card-tiny shadow-sm w-8 h-11"
                            />
                          ))}
                        </div>
                        {/* Overflow indicator */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                          <div className="bg-white rounded-full px-2 py-1 text-xs font-bold text-gray-800 shadow-lg">
                            +{overflowCount} more
                          </div>
                        </div>
                        {/* Card count badge */}
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center justify-center w-5 h-5 z-20">
                          {cardCount}
                        </div>
                      </div>
                    );
                  }
                })()
              )}
            </div>
          ) : (
            <div className={cn(
              'empty-discard border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
              isMobile ? 'w-6 h-9 text-xs' : 'w-16 h-24 text-sm'
            )}>
              🗑️
            </div>
          )}
        </motion.div>
        {isMobile && (
          <span className="text-xs text-gray-500 font-medium">
            {discardPile.length}
          </span>
        )}
      </div>

      {/* Morto Display - Compact Icon (Mobile) vs Individual Piles (Desktop) */}
      {mortos.length > 0 && (
        <>
          {/* Mobile: Compact Icon System */}
          {isMobile ? (
            <motion.div 
              className="morto-compact-icon relative cursor-pointer flex-shrink-0 w-6 h-6"
              onClick={() => setShowMortoDetails(!showMortoDetails)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Morto Icon - Card Back Design */}
              <div className="morto-stack-icon bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-md flex items-center justify-center text-white font-bold w-6 h-6 text-xs relative overflow-hidden">
                {/* Card back pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-lg">
                  <div className="absolute inset-0.5 bg-gradient-to-br from-red-400 to-red-600 rounded">
                    <div className="absolute inset-1 bg-red-500 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full opacity-20"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Availability Indicator */}
              <div className={cn(
                'absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold shadow-lg w-4 h-4 text-[10px]',
                availableCount > 0 ? 'bg-green-500' : 'bg-red-500'
              )}>
                {availableCount}
              </div>
            </motion.div>
          ) : (
            /* Desktop: Individual Morto Piles */
            <div className="morto-individual-piles flex gap-3 flex-shrink-0">
              {mortos.map((morto, index) => (
                <motion.div 
                  key={`morto-pile-${index}`}
                  className="morto-pile relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  title={`${t('game.morto.title', { number: index + 1 })} - ${morto.length} ${t('game.morto.cards')} (${mortosUsed[index] ? t('game.morto.used') : t('game.morto.available')})`}
                >
                  {/* Morto Pile Icon - Card Back Design */}
                  <div className={cn(
                    'morto-pile-icon rounded-lg shadow-md flex flex-col items-center justify-center text-white font-bold w-16 h-20 text-sm transition-colors relative overflow-hidden',
                    mortosUsed[index] 
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600' 
                      : index % 2 === 0 
                        ? 'bg-gradient-to-br from-red-500 to-red-700' // Red back for even indices
                        : 'bg-gradient-to-br from-gray-800 to-gray-900' // Black back for odd indices
                  )}>
                    {/* Card back pattern */}
                    <div className={cn(
                      'absolute inset-0 rounded-lg',
                      mortosUsed[index]
                        ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                        : index % 2 === 0
                          ? 'bg-gradient-to-br from-red-600 to-red-800'
                          : 'bg-gradient-to-br from-gray-900 to-black'
                    )}>
                      <div className={cn(
                        'absolute inset-1 rounded',
                        mortosUsed[index]
                          ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                          : index % 2 === 0
                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                            : 'bg-gradient-to-br from-gray-700 to-gray-900'
                      )}>
                        <div className={cn(
                          'absolute inset-2 rounded flex flex-col items-center justify-center',
                          mortosUsed[index]
                            ? 'bg-gray-500'
                            : index % 2 === 0
                              ? 'bg-red-500'
                              : 'bg-gray-800'
                        )}>
                          <div className={cn(
                            'w-3 h-3 rounded-full opacity-20 mb-1',
                            mortosUsed[index] ? 'bg-white' : 'bg-white'
                          )}></div>
                          <div className="text-xs font-bold">{index + 1}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Count Indicator */}
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg w-5 h-5 flex items-center justify-center">
                    {morto.length}
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={cn(
                    'absolute -bottom-1 -left-1 rounded-full w-3 h-3 shadow-sm',
                    mortosUsed[index] ? 'bg-red-500' : 'bg-green-500'
                  )} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Morto Details Modal/Overlay */}
      <AnimatePresence>
        {showMortoDetails && mortos.length > 0 && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMortoDetails(false)}
          >
            <motion.div 
              className={cn(
                'bg-white rounded-lg p-4 max-w-sm mx-4 shadow-xl',
                isMobile ? 'w-full' : 'w-96'
              )}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🃏 Mortos Status</h3>
                <button 
                  onClick={() => setShowMortoDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {mortos.map((morto, index) => (
                  <div 
                    key={`morto-detail-${index}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      mortosUsed[index] 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-10 rounded shadow-sm relative overflow-hidden flex items-center justify-center',
                        mortosUsed[index] 
                          ? 'bg-gradient-to-br from-gray-400 to-gray-600' 
                          : index % 2 === 0 
                            ? 'bg-gradient-to-br from-red-500 to-red-700' 
                            : 'bg-gradient-to-br from-gray-800 to-gray-900'
                      )}>
                        <div className={cn(
                          'absolute inset-0.5 rounded',
                          mortosUsed[index]
                            ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                            : index % 2 === 0
                              ? 'bg-gradient-to-br from-red-600 to-red-800'
                              : 'bg-gradient-to-br from-gray-900 to-black'
                        )}>
                          <div className={cn(
                            'absolute inset-0.5 rounded flex items-center justify-center',
                            mortosUsed[index]
                              ? 'bg-gray-500'
                              : index % 2 === 0
                                ? 'bg-red-500'
                                : 'bg-gray-800'
                          )}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-20"></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {t('game.morto.title', { number: index + 1 })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('game.morto.cardCount', { count: morto.length })}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      mortosUsed[index] 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-green-200 text-green-800'
                    )}>
                      {mortosUsed[index] ? t('game.morto.used') : t('game.morto.available')}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};