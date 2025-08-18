import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { cn } from '../../lib/utils';

interface GameActionsListProps {
  className?: string;
  compact?: boolean;
}

const actionIcons = {
  draw: '🎴',
  discard: '🗑️',
  baixar: '📥',
  sequence: '🔗',
  turn: '🔄',
  bater: '🏆',
};

const actionColors = {
  draw: 'bg-blue-100 text-blue-700 border-blue-200',
  discard: 'bg-gray-100 text-gray-700 border-gray-200',
  baixar: 'bg-green-100 text-green-700 border-green-200',
  sequence: 'bg-purple-100 text-purple-700 border-purple-200',
  turn: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  bater: 'bg-red-100 text-red-700 border-red-200',
};

export const GameActionsList: React.FC<GameActionsListProps> = ({
  className,
  compact = false,
}) => {
  const { t } = useTranslation();
  // Placeholder for now - will be implemented when gameStore is migrated
  const recentActions: any[] = [];
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new action is added
  useEffect(() => {
    if (listRef.current && recentActions.length > 0) {
      listRef.current.scrollTop = 0;
    }
  }, [recentActions.length]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return t('game.actions.justNow');
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return t('game.actions.minutesAgo', { count: minutes });
    } else {
      const hours = Math.floor(diff / 3600000);
      return t('game.actions.hoursAgo', { count: hours });
    }
  };

  if (recentActions.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center py-8 text-gray-400',
        className
      )}>
        <p className="text-sm">{t('game.actions.noActions')}</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={cn(
        'relative overflow-hidden',
        compact ? 'max-h-32' : 'max-h-64',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {recentActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              height: 'auto',
              transition: {
                duration: 0.3,
                delay: index * 0.05,
                ease: 'easeOut'
              }
            }}
            exit={{ 
              opacity: 0, 
              x: 20, 
              height: 0,
              transition: { duration: 0.2 }
            }}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2 mb-1 rounded-lg border backdrop-blur-sm',
              actionColors[action.type],
              index === 0 && 'ring-2 ring-offset-1 ring-blue-400/50'
            )}
          >
            {/* Action Icon with pulse for latest */}
            <div className="relative">
              <span className="text-lg">{actionIcons[action.type]}</span>
              {index === 0 && (
                <motion.div
                  className="absolute -inset-1 bg-blue-400 rounded-full opacity-25"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>

            {/* Action Details */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium truncate',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {action.player}
              </p>
              <p className={cn(
                'text-gray-600 truncate',
                compact ? 'text-xs' : 'text-xs'
              )}>
                {t(`game.actions.${action.type}`)}
                {action.details && ` • ${action.details}`}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0">
              <span className={cn(
                'text-gray-500',
                compact ? 'text-xs' : 'text-xs'
              )}>
                {formatTimestamp(action.timestamp)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Gradient overlay for scroll indication */}
      {recentActions.length > 3 && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

// Mobile-optimized variant
export const GameActionsListMobile: React.FC<GameActionsListProps> = (props) => {
  return (
    <GameActionsList
      {...props}
      compact={true}
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200',
        props.className
      )}
    />
  );
};