import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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

  return (
    <div className={cn(
      'deck-display flex flex-col items-center gap-4',
      isMobile ? 'p-3' : 'p-4',
      className
    )}>
      {/* Deck Area - Compact Mobile Layout */}
      <div className={cn(
        'deck-area flex items-center',
        isMobile ? 'justify-center gap-3' : 'gap-6 justify-center'
      )}>
        {/* Main Deck Section - Compact */}
        <div className="deck-section flex flex-col items-center gap-1">
          {!isMobile && (
            <div className="deck-label text-xs font-medium text-gray-600">
              {t('game.deck.mainDeck', { count: mainDeckCount })}
            </div>
          )}
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
              <div className="relative">
              <CardBack className={cn(
                'deck-card shadow-lg',
                isMobile ? 'w-12 h-16' : 'w-20 h-30'
              )} />
              {isMobile && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-1 rounded font-bold">
                  {mainDeckCount}
                </div>
              )}
            </div>
            ) : (
              <div className={cn(
                'empty-deck border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
                isMobile ? 'w-12 h-16 text-xs' : 'w-20 h-30 text-sm'
              )}>
                {t('game.deck.empty')}
              </div>
            )}
          </motion.div>
          {isMyTurnOrCheat() && mainDeckCount > 0 && (
            <ActionButton
              size="sm"
              variant="ghost"
              onClick={onDrawFromMainDeck}
              className="text-xs"
            >
              {t('game.deck.draw')}
            </ActionButton>
          )}
        </div>

        {/* Discard Pile Section - Compact */}
        <div className="deck-section flex flex-col items-center gap-1">
          {!isMobile && (
            <div className="deck-label text-xs font-medium text-gray-600">
              {t('game.deck.discardPile', { count: discardPile.length })}
            </div>
          )}
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
                {getSortedDiscardPile().slice(-3).map((card, index) => (
                  <Card 
                    key={`discard-${index}-${card.id || `${card.value}-${card.suit}`}`}
                    card={card}
                    className={cn(
                      'discard-card-small absolute shadow-md',
                      isMobile ? 'w-10 h-14' : 'w-16 h-24',
                      // Manual positioning without style prop
                      index === 0 && 'z-10',
                      index === 1 && 'z-20 translate-x-0.5 translate-y-0.5',
                      index === 2 && 'z-30 translate-x-1 translate-y-1'
                    )}
                  />
                ))}
                {discardPile.length > 3 && (
                  <div className={cn(
                    'absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center justify-center',
                    isMobile ? 'w-4 h-4 text-[8px]' : 'w-6 h-6 text-xs'
                  )}>
                    +{discardPile.length - 3}
                  </div>
                )}
                {isMobile && discardPile.length > 0 && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-1 rounded font-bold">
                    {discardPile.length}
                  </div>
                )}
              </div>
            ) : (
              <div className={cn(
                'empty-discard border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
                isMobile ? 'w-12 h-16 text-xs' : 'w-20 h-30 text-sm'
              )}>
                {t('game.deck.empty')}
              </div>
            )}
          </motion.div>
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
      </div>

      {/* Compact Morto Indicators */}
      {mortos.length > 0 && (
        <div className={cn(
          'morto-indicators flex items-center justify-center',
          isMobile ? 'gap-2 py-2' : 'gap-4 py-3'
        )}>
          {mortos.map((morto, index) => {
            const availableCount = mortos.filter((_, i) => !mortosUsed[i]).length;
            const totalCount = mortos.length;
            
            return (
              <div 
                key={`morto-indicator-${index}`}
                className={cn(
                  'morto-indicator relative flex items-center justify-center rounded-full transition-all duration-200',
                  isMobile ? 'w-6 h-6' : 'w-8 h-8',
                  mortosUsed[index] 
                    ? 'bg-red-100 border-2 border-red-300 opacity-60' 
                    : 'bg-green-100 border-2 border-green-400 shadow-sm hover:shadow-md'
                )}
                title={mortosUsed[index] 
                  ? t('game.morto.used') 
                  : `${t('game.morto.title', { number: index + 1 })} - ${t('game.morto.cardCount', { count: morto.length })}`
                }
              >
                {/* Morto Icon */}
                <div className={cn(
                  'morto-mini-stack relative',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}>
                  {[0, 1].map((stackIndex) => (
                    <div 
                      key={stackIndex}
                      className={cn(
                        'absolute rounded-sm',
                        isMobile ? 'w-2 h-3' : 'w-3 h-4',
                        mortosUsed[index] 
                          ? 'bg-gray-400 border border-gray-500' 
                          : 'bg-blue-600 border border-blue-700',
                        stackIndex === 1 && (isMobile ? 'translate-x-1' : 'translate-x-1')
                      )}
                      style={{
                        zIndex: stackIndex,
                      }}
                    />
                  ))}
                </div>
                
                {/* Status dot */}
                <div className={cn(
                  'absolute -top-1 -right-1 w-2 h-2 rounded-full',
                  mortosUsed[index] ? 'bg-red-500' : 'bg-green-500'
                )} />
              </div>
            );
          })}
          
          {/* Summary indicator */}
          {isMobile && (
            <div className="morto-summary ml-2 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <span className="text-xs font-medium text-gray-700">
                {mortos.filter((_, i) => !mortosUsed[i]).length}/{mortos.length}
              </span>
              <span className="text-xs text-gray-500">{t('game.morto.available')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};