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
      {/* Deck Area */}
      <div className={cn(
        'deck-area flex items-center gap-6',
        isMobile ? 'flex-col gap-4' : 'flex-row gap-6'
      )}>
        {/* Main Deck Section */}
        <div className="deck-section flex flex-col items-center gap-2">
          <div className="deck-label text-sm font-medium text-gray-600">
            {t('game.deck.mainDeck', { count: mainDeckCount })}
          </div>
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
                'deck-card shadow-lg',
                isMobile ? 'w-16 h-24' : 'w-20 h-30'
              )} />
            ) : (
              <div className={cn(
                'empty-deck border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
                isMobile ? 'w-16 h-24 text-xs' : 'w-20 h-30 text-sm'
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

        {/* Discard Pile Section */}
        <div className="deck-section flex flex-col items-center gap-2">
          <div className="deck-label text-sm font-medium text-gray-600">
            {t('game.deck.discardPile', { count: discardPile.length })}
          </div>
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
                      isMobile ? 'w-14 h-20' : 'w-16 h-24',
                      // Manual positioning without style prop
                      index === 0 && 'z-10',
                      index === 1 && 'z-20 translate-x-0.5 translate-y-0.5',
                      index === 2 && 'z-30 translate-x-1 translate-y-1'
                    )}
                  />
                ))}
                {discardPile.length > 3 && (
                  <div className={cn(
                    'absolute -top-2 -right-2 bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center justify-center',
                    isMobile ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
                  )}>
                    +{discardPile.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className={cn(
                'empty-discard border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
                isMobile ? 'w-16 h-24 text-xs' : 'w-20 h-30 text-sm'
              )}>
                {t('game.deck.empty')}
              </div>
            )}
          </motion.div>
          <ActionButton
            size="sm"
            variant="ghost"
            onClick={onDiscardPileClick}
            className="text-xs"
          >
            {t('game.deck.view')}
          </ActionButton>
        </div>
      </div>

      {/* Morto Status Area */}
      {mortos.length > 0 && (
        <div className={cn(
          'morto-area flex items-center gap-4',
          isMobile && 'flex-col gap-3'
        )}>
          {mortos.map((morto, index) => (
            <div 
              key={`morto-${index}`}
              className={cn(
                'morto-item flex items-center gap-2 p-2 rounded-lg',
                mortosUsed[index] 
                  ? 'bg-gray-100 opacity-50' 
                  : 'bg-green-50 border border-green-200',
                isMobile && 'flex-col text-center gap-1'
              )}
            >
              <div className="morto-icon relative">
                <div className="morto-deck flex">
                  {[0, 1, 2].map((cardIndex) => (
                    <div 
                      key={cardIndex}
                      className={cn(
                        'morto-card bg-blue-600 rounded shadow-sm border border-blue-700',
                        isMobile ? 'w-3 h-4' : 'w-4 h-5',
                        cardIndex > 0 && '-ml-1'
                      )}
                      style={{
                        zIndex: cardIndex,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className={cn(
                'morto-label flex flex-col',
                isMobile ? 'items-center text-center' : 'items-start'
              )}>
                <span className={cn(
                  'morto-title font-medium',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  {t('game.morto.title', { number: index + 1 })}
                </span>
                <span className={cn(
                  'morto-count text-gray-600',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  {t('game.morto.cardCount', { count: morto.length })}
                </span>
                <span className={cn(
                  'morto-status-text font-medium',
                  isMobile ? 'text-xs' : 'text-sm',
                  mortosUsed[index] ? 'text-red-600' : 'text-green-600'
                )}>
                  {mortosUsed[index] ? t('game.morto.used') : t('game.morto.available')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};