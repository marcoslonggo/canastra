import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';

interface ActionMessageProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onDismiss?: () => void;
  className?: string;
}

export const ActionMessage: React.FC<ActionMessageProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  className,
}) => {
  const { isMobile, shouldReduceAnimations } = useUIStore();

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!message) return null;

  const baseStyles = 'fixed z-50 px-4 py-3 rounded-lg font-medium text-center shadow-lg backdrop-blur-sm';
  
  const typeStyles = {
    info: 'bg-blue-500/90 text-white border border-blue-400/30',
    success: 'bg-green-500/90 text-white border border-green-400/30',
    warning: 'bg-yellow-500/90 text-white border border-yellow-400/30',
    error: 'bg-red-500/90 text-white border border-red-400/30',
  };

  const positionStyles = isMobile
    ? 'left-4 right-4 top-20' // Mobile: full width near top
    : 'left-1/2 top-24 -translate-x-1/2 min-w-[300px] max-w-lg'; // Desktop: centered

  const animationProps = shouldReduceAnimations()
    ? {}
    : {
        initial: isMobile
          ? { opacity: 0, y: -20, scale: 0.95 }
          : { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: isMobile
          ? { opacity: 0, y: -20, scale: 0.95 }
          : { opacity: 0, y: -10, scale: 0.95 },
        transition: {
          type: 'spring' as const,
          stiffness: 400,
          damping: 30,
        },
      };

  return (
    <AnimatePresence>
      <motion.div
        {...animationProps}
        className={cn(
          baseStyles,
          typeStyles[type],
          positionStyles,
          'touch-none select-none', // Prevent accidental selection
          className
        )}
        role="alert"
        aria-live="polite"
        onClick={onDismiss} // Allow tap to dismiss
      >
        <div className="flex items-center justify-center gap-2">
          {type === 'success' && <span className="text-lg">✅</span>}
          {type === 'warning' && <span className="text-lg">⚠️</span>}
          {type === 'error' && <span className="text-lg">❌</span>}
          {type === 'info' && <span className="text-lg">ℹ️</span>}
          <span className={cn(
            'break-words',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            {message}
          </span>
        </div>
        
        {/* Dismissal hint for mobile */}
        {isMobile && duration > 0 && (
          <div className="text-xs opacity-70 mt-1">
            Tap to dismiss
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Store-connected ActionMessage component
export const ConnectedActionMessage: React.FC = () => {
  const { actionMessage, actionMessageType, setActionMessage } = useUIStore();

  const handleDismiss = () => setActionMessage(null);

  if (!actionMessage) return null;

  return (
    <ActionMessage
      message={actionMessage}
      type={actionMessageType}
      onDismiss={handleDismiss}
    />
  );
};

// Hook for managing action messages
export const useActionMessage = () => {
  const { setActionMessage } = useUIStore();

  const showSuccess = (message: string, duration = 3000) => {
    setActionMessage(message, 'success');
    if (duration > 0) {
      setTimeout(() => setActionMessage(null), duration);
    }
  };

  const showWarning = (message: string, duration = 3000) => {
    setActionMessage(message, 'warning');
    if (duration > 0) {
      setTimeout(() => setActionMessage(null), duration);
    }
  };

  const showError = (message: string, duration = 3000) => {
    setActionMessage(message, 'error');
    if (duration > 0) {
      setTimeout(() => setActionMessage(null), duration);
    }
  };

  const showInfo = (message: string, duration = 4000) => {
    setActionMessage(message, 'info');
    if (duration > 0) {
      setTimeout(() => setActionMessage(null), duration);
    }
  };

  return {
    showSuccess,
    showWarning,
    showError,
    showInfo,
  };
};