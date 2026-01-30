import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ActionButton } from '../atoms/ActionButton';
import { useUIStore } from '../../stores/uiStore';
import { cn, touchFeedback } from '../../lib/utils';

interface BottomSheetMenuItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
  count?: number; // For badge display
}

interface BottomSheetMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: BottomSheetMenuItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const BottomSheetMenu: React.FC<BottomSheetMenuProps> = ({
  isOpen,
  onClose,
  items,
  title = 'Game Menu',
  subtitle,
  className
}) => {
  const { t } = useTranslation();
  const { isMobile } = useUIStore();
  const [dragY, setDragY] = useState(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.y > 0) {
      setDragY(info.offset.y);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const shouldClose = info.offset.y > 100 || info.velocity.y > 300;
    
    if (shouldClose) {
      onClose();
    }
    setDragY(0);
  };

  const handleItemClick = (item: BottomSheetMenuItem) => {
    if (!item.disabled) {
      touchFeedback.vibrate();
      item.onClick();
      onClose();
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sheetVariants = {
    hidden: { 
      y: '100%',
      opacity: 0
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300
      }
    },
    exit: { 
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-white rounded-t-xl shadow-2xl',
              'max-h-[80vh] overflow-hidden',
              className
            )}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ 
              y: dragY,
              scale: Math.max(0.95, 1 - (dragY / 1000))
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="relative"
                    whileHover={{ scale: item.disabled ? 1 : 1.02 }}
                    whileTap={{ scale: item.disabled ? 1 : 0.98 }}
                  >
                    <ActionButton
                      onClick={() => handleItemClick(item)}
                      variant={item.variant || 'ghost'}
                      className={cn(
                        'w-full justify-start text-left p-4 h-auto',
                        'border border-gray-200 hover:border-gray-300',
                        item.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={item.disabled}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0 text-2xl">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.label}
                          </div>
                        </div>
                        {item.count !== undefined && (
                          <div className="flex-shrink-0 bg-blue-500 text-white rounded-full text-xs font-bold px-2 py-1 min-w-6 text-center">
                            {item.count}
                          </div>
                        )}
                        <div className="flex-shrink-0 text-gray-400">
                          →
                        </div>
                      </div>
                    </ActionButton>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Safe Area for iOS */}
            <div className="h-safe-area-inset-bottom bg-white" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};