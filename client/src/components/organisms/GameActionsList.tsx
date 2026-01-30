import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface GameActionsListProps {
  className?: string;
  compact?: boolean;
}

export const GameActionsList: React.FC<GameActionsListProps> = ({
  className,
  compact = false,
}) => {
  const { t } = useTranslation();
  
  // Placeholder component - will be implemented when gameStore is migrated
  return (
    <div className={cn(
      'flex items-center justify-center py-8 text-gray-400',
      className
    )}>
      <p className="text-sm">No recent actions</p>
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