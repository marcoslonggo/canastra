import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card } from '../Card';
import { ActionButton } from '../atoms/ActionButton';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import type { Sequence } from '../../types';

interface TeamSequencesProps {
  teamNumber: 1 | 2;
  teamLabel: string; // "Your Sequences" or "Opponent Sequences"
  teamName: string;  // "Ma&Mi" or "Marcos" etc.
  sequences: Sequence[];
  
  // Player interaction
  myTeam: number | null;
  isMyTurn: boolean;
  selectedCards: number[];
  draggedCardIndex: number | null;
  
  // Game state
  drawnCardIds?: string[];
  allowedActions?: {
    allowPlayAllCards: boolean;
    allowMultipleDiscard: boolean;
    allowDiscardDrawnCards: boolean;
  };
  
  // Event handlers
  onAddToSequence?: (sequenceId: string) => void;
  onReplaceWildcard?: (sequenceId: string, wildcardIndex: number) => void;
  onSequenceDrop?: (e: React.DragEvent, sequenceId: string) => void;
  onSequenceDragOver?: (e: React.DragEvent) => void;
  
  className?: string;
}

export const TeamSequences: React.FC<TeamSequencesProps> = ({
  teamNumber,
  teamLabel,
  teamName,
  sequences,
  myTeam,
  isMyTurn,
  selectedCards,
  draggedCardIndex,
  drawnCardIds = [],
  allowedActions = {
    allowPlayAllCards: false,
    allowMultipleDiscard: false,
    allowDiscardDrawnCards: false,
  },
  onAddToSequence,
  onReplaceWildcard,
  onSequenceDrop,
  onSequenceDragOver,
  className,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useUIStore();
  
  const isMyTurnOrCheat = () => {
    return isMyTurn || allowedActions.allowPlayAllCards;
  };

  const canInteractWithSequence = () => {
    return myTeam === teamNumber && isMyTurnOrCheat();
  };

  const getSequenceTypeDisplay = (sequence: Sequence): string => {
    if (sequence.type === 'aces') return t('game.sequences.threeAces');
    if (sequence.isCanastra) {
      switch (sequence.canastraType) {
        case 'as-a-as': return t('game.sequences.canastraAsAAs');
        case 'limpa': return t('game.sequences.canastraLimpa');
        case 'suja': return t('game.sequences.canastraSuja');
        default: return t('game.sequences.canastra');
      }
    }
    return t('game.sequences.sequence');
  };

  return (
    <motion.div 
      className={cn(
        'team-sequences-container',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: teamNumber * 0.1 }}
    >
      <div className="team-area">
        <motion.h3 
          className={cn(
            'team-header font-bold text-center mb-4',
            isMobile ? 'text-lg' : 'text-xl',
            teamNumber === 1 ? 'text-blue-700' : 'text-red-700'
          )}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-1">
            <span>{teamLabel}</span>
            <span className={cn(
              'team-name font-normal',
              isMobile ? 'text-sm' : 'text-base',
              'text-gray-600'
            )}>
              ({teamName})
            </span>
          </div>
          {sequences.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {sequences.length} sequences
            </span>
          )}
        </motion.h3>
        
        <div className={cn(
          'sequences-container',
          sequences.length === 0 ? 'min-h-[120px] flex items-center justify-center' : '',
          isMobile ? 'gap-3' : 'gap-4'
        )}>
          {sequences.length === 0 ? (
            <div className="no-sequences text-center text-gray-500">
              <div className={cn(
                'empty-sequences-placeholder border-2 border-dashed border-gray-300 rounded-lg p-4',
                isMobile ? 'p-3' : 'p-4'
              )}>
                <p className={cn(
                  'text-gray-400',
                  isMobile ? 'text-sm' : 'text-base'
                )}>
                  {t('game.sequences.noSequences')}
                </p>
                {canInteractWithSequence() && (
                  <p className={cn(
                    'text-gray-400 mt-1',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>
                    {t('game.sequences.firstSequenceHint')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className={cn(
              'sequences-grid',
              isMobile 
                ? 'grid grid-cols-1 gap-3' 
                : 'flex flex-wrap gap-4'
            )}>
              {sequences.map((sequence, index) => (
                <motion.div 
                  key={sequence.id}
                  className={cn(
                    'sequence-item relative',
                    'bg-white rounded-lg shadow-sm border-2',
                    canInteractWithSequence() 
                      ? 'sequence-droppable border-gray-200 hover:border-blue-300 transition-colors' 
                      : 'border-gray-100',
                    canInteractWithSequence() && draggedCardIndex !== null && 'ring-2 ring-blue-200',
                    isMobile ? 'p-3' : 'p-4'
                  )}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onDrop={onSequenceDrop ? (e) => onSequenceDrop(e, sequence.id) : undefined}
                  onDragOver={onSequenceDragOver}
                  whileHover={canInteractWithSequence() ? { scale: 1.02 } : {}}
                >
                  {/* Sequence Info Header */}
                  <div className={cn(
                    'sequence-info flex items-center justify-between mb-3',
                    isMobile && 'flex-col gap-2 text-center'
                  )}>
                    <div className="sequence-details">
                      <span className={cn(
                        'sequence-type font-medium',
                        isMobile ? 'text-sm' : 'text-base',
                        sequence.isCanastra ? 'text-green-700' : 'text-blue-700'
                      )}>
                        {getSequenceTypeDisplay(sequence)}
                      </span>
                      <span className={cn(
                        'sequence-points ml-2 px-2 py-1 bg-amber-100 rounded text-amber-900 font-semibold border border-amber-200',
                        isMobile ? 'text-xs' : 'text-sm'
                      )}>
                        {sequence.points} pts
                      </span>
                    </div>
                    
                    {/* Add Cards Button */}
                    {canInteractWithSequence() && selectedCards.length > 0 && onAddToSequence && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <ActionButton 
                          onClick={() => onAddToSequence(sequence.id)}
                          variant="success"
                          size="sm"
                          className={cn(
                            'add-to-sequence-button shadow-sm',
                            isMobile ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'
                          )}
                          title={t('game.sequences.addCardsToSequence')}
                        >
                          + {t('game.hand.actions.addCards')} ({selectedCards.length})
                        </ActionButton>
                      </motion.div>
                    )}
                  </div>

                  {/* Sequence Cards */}
                  <div className={cn(
                    'sequence-cards-container flex flex-wrap items-center justify-center',
                    'table-sequence',
                    isMobile ? 'gap-1' : 'gap-2'
                  )}>
                    {sequence.cards.map((card, cardIndex) => (
                      <div key={`${sequence.id}-card-${cardIndex}`} className="relative">
                        <Card 
                          card={card}
                          className={cn(
                            'sequence-card shadow-sm',
                            isMobile ? 'w-8 h-12' : 'w-12 h-16',
                            drawnCardIds.includes(card.id) && 'ring-2 ring-yellow-400',
                            // Make wildcards clickable for replacement (only for my team)
                            card.isWild && 
                            myTeam === teamNumber && 
                            canInteractWithSequence() && 
                            sequence.canastraType === 'suja' &&
                            onReplaceWildcard && 
                            'cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all'
                          )}
                          onClick={
                            card.isWild && 
                            myTeam === teamNumber && 
                            canInteractWithSequence() && 
                            sequence.canastraType === 'suja' &&
                            onReplaceWildcard
                              ? () => onReplaceWildcard(sequence.id, cardIndex)
                              : undefined
                          }
                        />
                        {/* Wildcard indicator */}
                        {card.isWild && 
                         myTeam === teamNumber && 
                         sequence.canastraType === 'suja' && 
                         canInteractWithSequence() && (
                          <div className={cn(
                            'absolute -top-1 -right-1 bg-purple-500 text-white rounded-full',
                            'flex items-center justify-center font-bold shadow-sm',
                            isMobile ? 'w-3 h-3 text-[8px]' : 'w-4 h-4 text-xs'
                          )}>
                            🔄
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Drop Indicator */}
                  {canInteractWithSequence() && draggedCardIndex !== null && (
                    <motion.div 
                      className={cn(
                        'drop-indicator absolute inset-0 flex items-center justify-center',
                        'bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg',
                        'pointer-events-none'
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className={cn(
                        'drop-text text-blue-700 font-medium',
                        isMobile ? 'text-sm' : 'text-base'
                      )}>
                        {t('game.hand.dropCardHere')}
                      </div>
                    </motion.div>
                  )}

                  {/* Sequence Status Indicators */}
                  <div className="sequence-status-indicators absolute -top-2 -right-2 flex gap-1">
                    {sequence.isCanastra && (
                      <div className={cn(
                        'canastra-badge bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm',
                        isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'
                      )}>
                        C
                      </div>
                    )}
                    {sequence.type === 'aces' && (
                      <div className={cn(
                        'aces-badge bg-purple-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm',
                        isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'
                      )}>
                        A
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};