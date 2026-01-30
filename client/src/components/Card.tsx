import React from 'react';
import { Card as CardType } from '../types';
import { useUIStore } from '../stores/uiStore';
import { cn } from '../lib/utils';
import './Card.css';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isDraggable?: boolean;
  isDrawnThisTurn?: boolean;
  hideCenter?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ 
  card, 
  isSelected = false, 
  isDraggable = false,
  isDrawnThisTurn = false,
  hideCenter = false,
  onClick, 
  onDragStart, 
  onDragEnd,
  className = '',
  style
}: CardProps) {
  const getSuitSymbol = (suit: CardType['suit']) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      case 'joker': return '🃏';
      default: return '';
    }
  };

  const getSuitColor = (suit: CardType['suit']) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
  };

  const getCardDisplay = () => {
    if (card.suit === 'joker') {
      return {
        rank: 'JOKER',
        symbol: '🃏',
        color: 'purple'
      };
    }

    return {
      rank: card.rank,
      symbol: getSuitSymbol(card.suit),
      color: getSuitColor(card.suit)
    };
  };

  const cardDisplay = getCardDisplay();

  const cardClasses = [
    'card',
    `card-${cardDisplay.color}`,
    isSelected ? 'card-selected' : '',
    card.isWild ? 'card-wild' : '',
    isDraggable ? 'card-draggable' : '',
    isDrawnThisTurn ? 'card-drawn-this-turn' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={style}
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-card={`${card.rank}-${card.suit}`}
    >
      <div className="card-content">
        {/* Top-left rank only */}
        <div className="card-corner card-corner-top">
          <div className="card-rank-large">{cardDisplay.rank}</div>
        </div>
        
        {/* Large centered suit (always show, but size based on hideCenter) */}
        <div className="card-center">
          <div className={`card-suit-center ${hideCenter ? 'card-suit-center-small' : ''}`}>
            {cardDisplay.symbol}
          </div>
        </div>
      </div>

      {card.isWild && (
        <div className="wild-indicator">
          <span>WILD</span>
        </div>
      )}

      {isSelected && (
        <div className="selection-indicator" />
      )}
    </div>
  );
}

export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div className={`card card-back ${className}`}>
      <div className="card-back-pattern">
        <div className="card-back-logo">♠♥♣♦</div>
      </div>
    </div>
  );
}

interface CardGroupProps {
  cards: CardType[];
  title?: string;
  isSequence?: boolean;
  className?: string;
  drawnCardIds?: string[];
}

export function CardGroup({ cards, title, isSequence = false, className = '', drawnCardIds = [] }: CardGroupProps) {
  const { isMobile } = useUIStore();

  if (cards.length === 0) {
    return null;
  }

  // Apply space-saving overlap technique for sequences (showing only left portion with number + suit)
  const renderOptimizedCards = () => {
    const cardCount = cards.length;

    if (isMobile) {
      // Mobile: Heavy overlap with up to 8 cards visible
      const maxMobileCards = Math.min(cardCount, 8);
      const cardsToShow = cards.slice(-maxMobileCards);
      
      return (
        <div className="flex items-center relative overflow-visible" style={{ minWidth: `${16 + maxMobileCards * 8}px` }}>
          {cardsToShow.map((card, index) => (
            <Card
              key={`${card.id || `${card.rank}-${card.suit}-${index}`}`}
              card={card}
              isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
              className={cn(
                'sequence-card-mobile shadow-sm w-8 h-11',
                index > 0 && '-ml-5', // Heavy overlap showing only left portion
                index === cardsToShow.length - 1 && 'z-10'
              )}
            />
          ))}
          {cardCount > maxMobileCards && (
            <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full text-[10px] font-bold shadow-sm flex items-center justify-center w-4 h-4 z-20">
              +{cardCount - maxMobileCards}
            </div>
          )}
        </div>
      );
    } else {
      // Desktop: Adaptive layout based on card count
      if (cardCount <= 10) {
        // Single row with heavy overlap for sequences up to 10 cards
        const containerWidth = cardCount === 1 ? 56 : (56 + (cardCount - 1) * 20); // 56px first card + 20px per additional card
        return (
          <div className="flex items-center relative overflow-visible" style={{ minWidth: `${containerWidth}px`, paddingLeft: '4px', paddingRight: '4px' }}>
            {cards.map((card, index) => (
              <Card
                key={`${card.id || `${card.rank}-${card.suit}-${index}`}`}
                card={card}
                isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                className={cn(
                  'sequence-card-desktop shadow-sm w-14 h-20',
                  index > 0 && '-ml-10', // Heavy overlap - show only left portion with number + suit
                  index === cardCount - 1 && 'z-10'
                )}
              />
            ))}
          </div>
        );
      } else if (cardCount <= 20) {
        // Two rows for sequences with 11-20 cards
        const firstRow = cards.slice(0, 10);
        const secondRow = cards.slice(10);
        const maxRowLength = Math.max(firstRow.length, secondRow.length);
        const containerWidth = maxRowLength === 1 ? 48 : (48 + (maxRowLength - 1) * 16); // 48px first card + 16px per additional
        
        return (
          <div className="relative overflow-visible" style={{ minWidth: `${containerWidth}px`, paddingLeft: '4px', paddingRight: '4px' }}>
            {/* First row */}
            <div className="flex items-center relative justify-center mb-1">
              {firstRow.map((card, index) => (
                <Card
                  key={`${card.id || `${card.rank}-${card.suit}-${index}`}`}
                  card={card}
                  isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                  className={cn(
                    'sequence-card-compact shadow-sm w-12 h-16',
                    index > 0 && '-ml-8' // Heavy overlap
                  )}
                />
              ))}
            </div>
            {/* Second row */}
            <div className="flex items-center relative justify-center">
              {secondRow.map((card, index) => (
                <Card
                  key={`${card.id || `${card.rank}-${card.suit}-${10 + index}`}`}
                  card={card}
                  isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                  className={cn(
                    'sequence-card-compact shadow-sm w-12 h-16',
                    index > 0 && '-ml-8', // Heavy overlap
                    index === secondRow.length - 1 && 'z-10'
                  )}
                />
              ))}
            </div>
          </div>
        );
      } else {
        // Very large sequences: Show first 15 cards in three compact rows + overflow indicator
        const displayCards = cards.slice(0, 15);
        const overflowCount = cardCount - 15;
        
        return (
          <div className="relative overflow-visible" style={{ minWidth: '140px', paddingLeft: '4px', paddingRight: '4px' }}>
            {/* Three rows of overlapped cards */}
            <div className="flex flex-col gap-0.5">
              {/* Row 1: 5 cards */}
              <div className="flex items-center relative justify-center">
                {displayCards.slice(0, 5).map((card, index) => (
                  <Card
                    key={`${card.id || `${card.rank}-${card.suit}-r1-${index}`}`}
                    card={card}
                    isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                    className={cn(
                      'sequence-card-tiny shadow-sm w-10 h-14',
                      index > 0 && '-ml-7' // Heavy overlap
                    )}
                  />
                ))}
              </div>
              {/* Row 2: 5 cards */}
              <div className="flex items-center relative justify-center">
                {displayCards.slice(5, 10).map((card, index) => (
                  <Card
                    key={`${card.id || `${card.rank}-${card.suit}-r2-${index}`}`}
                    card={card}
                    isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                    className={cn(
                      'sequence-card-tiny shadow-sm w-10 h-14',
                      index > 0 && '-ml-7' // Heavy overlap
                    )}
                  />
                ))}
              </div>
              {/* Row 3: 5 cards */}
              <div className="flex items-center relative justify-center">
                {displayCards.slice(10, 15).map((card, index) => (
                  <Card
                    key={`${card.id || `${card.rank}-${card.suit}-r3-${index}`}`}
                    card={card}
                    isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
                    className={cn(
                      'sequence-card-tiny shadow-sm w-10 h-14',
                      index > 0 && '-ml-7', // Heavy overlap
                      index === displayCards.slice(10, 15).length - 1 && 'z-10'
                    )}
                  />
                ))}
              </div>
            </div>
            {/* Overflow indicator */}
            {overflowCount > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                <div className="bg-white rounded-full px-2 py-1 text-xs font-bold text-gray-800 shadow-lg">
                  +{overflowCount} more
                </div>
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className={cn(
      'card-group overflow-visible',
      isSequence ? 'card-sequence' : '',
      className
    )}>
      {title && <div className="card-group-title mb-2 text-sm font-medium text-gray-700">{title}</div>}
      <div className="card-group-cards overflow-visible">
        {renderOptimizedCards()}
      </div>
    </div>
  );
}