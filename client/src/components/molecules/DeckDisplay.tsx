import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBack } from '../Card';
import { ActionButton } from '../atoms/ActionButton';
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
      'deck-display flex items-center justify-center',
      isMobile ? 'gap-2 p-2' : 'gap-4 p-3',
      className
    )}>
      {/* Main Deck Section - Ultra Compact */}
      <div className="deck-section flex flex-col items-center gap-1">
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
              isMobile ? 'w-12 h-16' : 'w-16 h-24'
            )} />
          ) : (
            <div className={cn(
              'empty-deck border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
              isMobile ? 'w-12 h-16 text-xs' : 'w-16 h-24 text-sm'
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
        {!isMobile && (
          <ActionButton
            size="sm"
            variant="ghost"
            onClick={onDrawFromMainDeck}
            className="text-xs"
            disabled={!isMyTurnOrCheat() || mainDeckCount === 0}
          >
            {t('game.deck.draw')}
          </ActionButton>
        )}
      </div>

      {/* Discard Pile Section - Ultra Compact */}
      <div className="deck-section flex flex-col items-center gap-1">
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
              {getSortedDiscardPile().slice(-2).map((card, index) => (
                <Card 
                  key={`discard-${index}-${card.id || `${card.value}-${card.suit}`}`}
                  card={card}
                  className={cn(
                    'discard-card-small absolute shadow-sm',
                    isMobile ? 'w-12 h-16' : 'w-16 h-24',
                    index === 1 && 'translate-x-1 translate-y-1 z-10'
                  )}
                />
              ))}
              {discardPile.length > 2 && (
                <div className={cn(
                  'absolute -top-1 -right-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center justify-center',
                  isMobile ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'
                )}>
                  +{discardPile.length - 2}
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              'empty-discard border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
              isMobile ? 'w-12 h-16 text-xs' : 'w-16 h-24 text-sm'
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
        {!isMobile && (
          <ActionButton
            size="sm"
            variant="ghost"
            onClick={onDiscardPileClick}
            className="text-xs"
          >
            {t('game.deck.view')}
          </ActionButton>
        )}
      </div>

      {/* Compact Morto Icon System */}
      {mortos.length > 0 && (
        <motion.div 
          className={cn(
            'morto-compact-icon relative cursor-pointer',
            isMobile ? 'w-8 h-8' : 'w-10 h-10'
          )}
          onClick={() => setShowMortoDetails(!showMortoDetails)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Morto Icon */}
          <div className={cn(
            'morto-stack-icon bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-md flex items-center justify-center text-white font-bold',
            isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
          )}>
            📦
          </div>
          
          {/* Availability Indicator */}
          <div className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-lg',
            availableCount > 0 ? 'bg-green-500' : 'bg-red-500',
            isMobile ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'
          )}>
            {availableCount}
          </div>
        </motion.div>
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
                <h3 className="text-lg font-semibold">📦 Mortos Status</h3>
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
                      <div className="text-2xl">📦</div>
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