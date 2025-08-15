import React from 'react';
import { Card as CardType } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isDraggable?: boolean;
  isDrawnThisTurn?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

export function Card({ 
  card, 
  isSelected = false, 
  isDraggable = false,
  isDrawnThisTurn = false,
  onClick, 
  onDragStart, 
  onDragEnd,
  className = '' 
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
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-card={`${card.rank}-${card.suit}`}
    >
      <div className="card-content">
        <div className="card-corner card-corner-top">
          <div className="card-rank-large">{cardDisplay.rank}</div>
          <div className="card-suit-large">{cardDisplay.symbol}</div>
        </div>
        
        <div className="card-center">
          <div className="card-suit-center">{cardDisplay.symbol}</div>
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
  return (
    <div className={`card-group ${isSequence ? 'card-sequence' : ''} ${className}`}>
      {title && <div className="card-group-title">{title}</div>}
      <div className="card-group-cards">
        {cards.map((card, index) => (
          <Card
            key={`${card.id || `${card.rank}-${card.suit}-${index}`}`}
            card={card}
            isDrawnThisTurn={drawnCardIds.includes(card.id || '')}
            className="card-in-group"
          />
        ))}
      </div>
    </div>
  );
}