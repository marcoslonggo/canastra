import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { gameService } from '../../services/gameService';
import type { ChatMessage as GameChatMessage } from '../../types';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { cn } from '../../lib/utils';

interface ChatSystemProps {
  gameId: string;
  className?: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ gameId, className }) => {
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Store hooks
  const {
    gameMessages,
    overlayMessages,
    isOverlayOpen,
    isSidebarOpen,
    unreadCount,
    currentInput,
    showTimestamps,
    addGameMessage,
    openOverlay,
    closeOverlay,
    openSidebar,
    closeSidebar,
    setCurrentInput,
    clearInput,
    markAsRead,
    clearMessages,
  } = useChatStore();
  
  const { isMobile } = useUIStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if ((isOverlayOpen || isSidebarOpen) && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameMessages, isOverlayOpen, isSidebarOpen]);

  // Set up chat event listeners
  useEffect(() => {
    const handleChatMessage = (message: GameChatMessage) => {
      // Only show messages for this game
      if (message.room === 'game' && message.gameId === gameId) {
        addGameMessage({
          username: message.username,
          text: message.message,
          type: 'user',
        });
      }
    };

    const handleChatHistory = (data: { room: string; gameId?: string; messages: GameChatMessage[] }) => {
      if (data.room === 'game' && data.gameId === gameId) {
        // Clear existing messages and add history
        clearMessages('game');
        data.messages.forEach(message => {
          addGameMessage({
            username: message.username,
            text: message.message,
            type: 'user',
          });
        });
      }
    };

    // Set up event listeners
    gameService.on('chat-message', handleChatMessage);
    gameService.on('chat-history', handleChatHistory);

    // Cleanup
    return () => {
      gameService.off('chat-message', handleChatMessage);
      gameService.off('chat-history', handleChatHistory);
    };
  }, [gameId, addGameMessage, clearMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && gameId) {
      gameService.sendChatMessage(currentInput.trim(), 'game', gameId);
      clearInput();
    }
  };

  const handleToggleChat = () => {
    if (isMobile) {
      // Mobile: use overlay behavior
      if (isOverlayOpen) {
        closeOverlay();
      } else {
        openOverlay();
        markAsRead();
      }
    } else {
      // Desktop: use sidebar behavior
      if (isSidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
        markAsRead();
      }
    }
  };

  return (
    <div className={cn('chat-system', className)}>
      {/* Chat Toggle Button */}
      <Button
        variant="secondary"
        onClick={handleToggleChat}
        className={cn(
          'fixed right-4 z-50 transition-all duration-200',
          isMobile ? 'bottom-20' : 'bottom-4',
          (isOverlayOpen || isSidebarOpen) && 'bg-primary-500 text-white',
          unreadCount > 0 && !isOverlayOpen && !isSidebarOpen && 'ring-2 ring-red-500 animate-pulse'
        )}
        aria-label={isOverlayOpen ? t('game.chat.hideChat') : t('game.chat.showChat')}
      >
        <span className="flex items-center gap-2">
          💬
          {unreadCount > 0 && !isOverlayOpen && !isSidebarOpen && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </span>
      </Button>

      {/* Overlay Messages (Auto-fade when chat is closed) - Mobile only */}
      <AnimatePresence>
        {isMobile && !isOverlayOpen && overlayMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed right-4 z-50 space-y-2 max-w-sm',
              isMobile ? 'bottom-32' : 'bottom-16'
            )}
          >
            {overlayMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-primary-600">
                    {message.username}
                  </span>
                  <span className="text-sm text-gray-900">
                    {message.text}
                  </span>
                  {showTimestamps && (
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Chat Panel (Overlay) */}
      <AnimatePresence>
        {isMobile && isOverlayOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col inset-x-4 bottom-4 top-20"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 relative z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('game.chat.title')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeOverlay}
                className="p-1 h-auto text-gray-900 hover:bg-gray-200 hover:text-red-600 font-bold text-lg"
                aria-label={t('common.close')}
              >
                ✕
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {gameMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('game.chat.noMessages')}
                </div>
              ) : (
                gameMessages.map((message, index) => (
                  <motion.div
                    key={`${message.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary-600">
                        {message.username}:
                      </span>
                      {showTimestamps && (
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 ml-2 break-words">
                      {message.text}
                    </p>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form - Fixed at bottom */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={t('game.chat.placeholder')}
                  maxLength={200}
                  className="flex-1 text-gray-900 placeholder-gray-500"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!currentInput.trim()}
                  className="px-4 flex-shrink-0"
                >
                  {t('game.chat.send')}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Chat Sidebar */}
      <AnimatePresence>
        {!isMobile && isSidebarOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="fixed right-0 top-20 bottom-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 relative z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('game.chat.title')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="p-1 h-auto text-gray-900 hover:bg-gray-200 hover:text-red-600 font-bold text-lg"
                aria-label={t('common.close')}
              >
                ✕
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gameMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('game.chat.noMessages')}
                </div>
              ) : (
                gameMessages.map((message, index) => (
                  <motion.div
                    key={`${message.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary-600">
                        {message.username}:
                      </span>
                      {showTimestamps && (
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 ml-2 break-words">
                      {message.text}
                    </p>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form - Fixed at bottom */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={t('game.chat.placeholder')}
                  maxLength={200}
                  className="flex-1 text-gray-900 placeholder-gray-500"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!currentInput.trim()}
                  className="px-4 flex-shrink-0"
                >
                  {t('game.chat.send')}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};