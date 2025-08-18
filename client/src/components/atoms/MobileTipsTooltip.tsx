import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';

interface MobileTipsTooltipProps {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}

export const MobileTipsTooltip: React.FC<MobileTipsTooltipProps> = ({ 
  show, 
  onDismiss, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const { isMobile } = useUIStore();

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          
          {/* Floating Tooltip */}
          <motion.div 
            className={`fixed top-1/2 left-4 right-4 transform -translate-y-1/2 z-50 ${className}`}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💡</span>
                  </div>
                  <span className="text-base font-semibold text-gray-900">
                    {t('game.hand.mobileTips.title', 'Touch Controls')}
                  </span>
                </div>
                <button 
                  onClick={onDismiss}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Dismiss tips"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">👆</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('game.hand.mobileTips.tapToSelect', 'Tap cards to select them')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 text-sm">↩️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('game.hand.mobileTips.multipleTaps', 'Tap again to deselect')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-sm">🎮</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('game.hand.mobileTips.useButtons', 'Use floating action buttons to play cards')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={onDismiss}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('game.hand.mobileTips.dismiss', 'Got it!')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};