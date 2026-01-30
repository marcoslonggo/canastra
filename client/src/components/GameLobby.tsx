import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { gameService } from '../services/gameService';
import { User, ChatMessage, GameState } from '../types';
import { fetchAllUsers, promoteUser, demoteUser, resetUserPassword, fetchAllGames, terminateGame, restartServer } from '../api';
import './GameLobby.css';

interface GameInfo {
  id: string;
  playerCount: number;
  status: string;
  players: string[];
}

interface AdminGameInfo {
  id: string;
  playerCount: number;
  status: string;
  players: string[];
  createdAt: string;
}

interface GameLobbyProps {
  user: User;
  onGameStart: (gameId: string) => void;
  // Control props (passed from App.tsx)
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  showDebugPanel: boolean;
  setShowDebugPanel: (show: boolean) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  reconnectAttempts: number;
  setReconnectAttempts: (attempts: number) => void;
}

export function GameLobby({ 
  user, 
  onGameStart,
  showAdminPanel,
  setShowAdminPanel,
  showDebugPanel,
  setShowDebugPanel,
  connectionStatus,
  setConnectionStatus,
  reconnectAttempts,
  setReconnectAttempts 
}: GameLobbyProps) {
  const { t } = useTranslation();
  const [availableGames, setAvailableGames] = useState<GameInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [joinGameId, setJoinGameId] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Admin state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGames, setAllGames] = useState<AdminGameInfo[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{userId: number; newPassword: string} | null>(null);
  const [confirmTerminate, setConfirmTerminate] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  
  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameCreated?: Function;
    gameListUpdated?: Function;
    chatMessage?: Function;
    error?: Function;
    gameStateUpdate?: Function;
    connectionStatusChanged?: Function;
  }>({});

  useEffect(() => {
    connectToGameService();
    
    // Cleanup listeners on unmount
    return () => {
      cleanupEventListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const connectToGameService = async () => {
    try {
      // Connection is managed by App component, just ensure we're connected
      if (!gameService.isConnected()) {
        await gameService.connect(user);
      }
      setupEventListeners();
      gameService.joinLobby();
      gameService.getActiveGames();
    } catch (error) {
      console.error('Failed to connect to game service:', error);
    }
  };


  const cleanupEventListeners = () => {
    // Remove existing listeners
    if (listenersRef.current.gameCreated) {
      gameService.off('game-created', listenersRef.current.gameCreated);
    }
    if (listenersRef.current.gameListUpdated) {
      gameService.off('game-list-updated', listenersRef.current.gameListUpdated);
    }
    if (listenersRef.current.chatMessage) {
      gameService.off('chat-message', listenersRef.current.chatMessage);
    }
    if (listenersRef.current.error) {
      gameService.off('error', listenersRef.current.error);
    }
    if (listenersRef.current.gameStateUpdate) {
      gameService.off('game-state-update', listenersRef.current.gameStateUpdate);
    }
    if (listenersRef.current.connectionStatusChanged) {
      gameService.off('connection-status-changed', listenersRef.current.connectionStatusChanged);
    }
    
    // Clear references
    listenersRef.current = {};
  };

  const setupEventListeners = () => {
    // Clean up any existing listeners first
    cleanupEventListeners();
    
    // Create new listener functions and store references
    listenersRef.current.gameCreated = (data: { gameId: string }) => {
      console.log('Game created with ID:', data.gameId);
      // Don't immediately transition - wait for game-state-update
    };

    listenersRef.current.gameListUpdated = (games: GameInfo[]) => {
      setAvailableGames(games);
    };

    listenersRef.current.chatMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
      // Increment unread count if chat is closed and message is not from current user
      if (!chatOpen && message.username !== user.username) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const chatHistoryHandler = (data: { room: string; messages: ChatMessage[] }) => {
      console.log('📋 Received chat history:', data);
      if (data.room === 'lobby') {
        console.log('📥 Setting lobby chat messages:', data.messages.length, 'messages');
        setChatMessages(data.messages);
      }
    };

    listenersRef.current.error = (error: { message: string }) => {
      alert(`${t('common.error')}: ${error.message}`);
    };

    listenersRef.current.gameStateUpdate = (gameState: GameState) => {
      if (gameState && (gameState.phase === 'waiting' || gameState.phase === 'playing')) {
        onGameStart(gameState.id);
      }
    };

    listenersRef.current.connectionStatusChanged = (data: { status: 'disconnected' | 'connecting' | 'connected', attempts: number }) => {
      console.log('Connection status changed:', data);
      setConnectionStatus(data.status);
      setReconnectAttempts(data.attempts);
    };
    
    // Add the listeners
    gameService.on('game-created', listenersRef.current.gameCreated);
    gameService.on('game-list-updated', listenersRef.current.gameListUpdated);
    gameService.on('chat-message', listenersRef.current.chatMessage);
    gameService.on('chat-history', chatHistoryHandler);
    gameService.on('error', listenersRef.current.error);
    gameService.on('game-state-update', listenersRef.current.gameStateUpdate);
    gameService.on('connection-status-changed', listenersRef.current.connectionStatusChanged);

    // Initialize connection status from gameService
    setConnectionStatus(gameService.getConnectionStatus());
    setReconnectAttempts(gameService.getReconnectAttempts());
  };

  const handleCreateGame = async () => {
    if (connectionStatus !== 'connected') {
      await connectToGameService();
    }
    
    gameService.createGame();
  };

  const handleJoinGame = async (gameId?: string) => {
    const targetGameId = gameId || joinGameId.toUpperCase();
    
    if (!targetGameId) {
      alert(t('lobby.joinGame.enterCode'));
      return;
    }

    if (connectionStatus !== 'connected') {
      await connectToGameService();
    }

    gameService.joinGame(targetGameId);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && connectionStatus === 'connected') {
      gameService.sendChatMessage(chatInput.trim(), 'lobby');
      setChatInput('');
    }
  };

  const handleToggleChat = () => {
    const newChatOpen = !chatOpen;
    setChatOpen(newChatOpen);
    // Reset unread count when opening chat
    if (newChatOpen) {
      setUnreadCount(0);
    }
  };


  // Admin functions
  const loadAllUsers = useCallback(async () => {
    if (!user.isAdmin) return;
    
    setAdminLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const users = await fetchAllUsers(token);
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setAdminLoading(false);
    }
  }, [user.isAdmin]);

  const loadAllGames = useCallback(async () => {
    if (!user.isAdmin) return;
    
    setGamesLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const games = await fetchAllGames(token);
        setAllGames(games);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setGamesLoading(false);
    }
  }, [user.isAdmin]);

  const handlePromoteUser = async (userId: number) => {
    if (!user.isAdmin) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await promoteUser(token, userId);
        await loadAllUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to promote user:', error);
    }
  };

  const handleDemoteUser = async (userId: number) => {
    if (!user.isAdmin) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await demoteUser(token, userId);
        await loadAllUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to demote user:', error);
    }
  };

  const handleResetPassword = async (userId: number, newPassword: string) => {
    if (!user.isAdmin) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await resetUserPassword(token, userId, newPassword);
        setResetPasswordData(null);
        alert(t('admin.passwordResetSuccess'));
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert(t('admin.passwordResetFailed'));
    }
  };

  const handleTerminateGame = async (gameId: string) => {
    if (!user.isAdmin) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await terminateGame(token, gameId);
        setConfirmTerminate(null);
        await loadAllGames(); // Refresh games list
        alert(t('admin.gameTerminated'));
      }
    } catch (error) {
      console.error('Failed to terminate game:', error);
      alert(t('admin.gameTerminateFailed'));
    }
  };

  const handleRestartServer = async () => {
    if (!user.isAdmin) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await restartServer(token);
        setConfirmRestart(false);
        alert(t('admin.serverRestarting'));
      }
    } catch (error) {
      console.error('Failed to restart server:', error);
      alert(t('admin.serverRestartFailed'));
    }
  };

  // Load admin data when panel opens
  useEffect(() => {
    if (showAdminPanel && user.isAdmin) {
      loadAllUsers();
      loadAllGames();
    }
  }, [showAdminPanel, user.isAdmin, loadAllUsers, loadAllGames]);

  return (
    <div className="game-lobby">

      {/* Debug Panel - Show only when toggled */}
      {showDebugPanel && (
        <>
          {/* Backdrop to close on outside click */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowDebugPanel(false)}
          />
          <div className="debug-panel" style={{
            position: 'fixed',
            top: '70px',
            left: '10px',
            right: '10px',
            zIndex: 9999,
            backgroundColor: '#f0f0f0',
            padding: '10px',
            border: '2px solid #f44336',
            borderRadius: '5px',
            fontSize: '11px',
            fontFamily: 'monospace',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '5px' 
            }}>
              <strong>🔧 DEBUG:</strong>
              <button
                onClick={() => setShowDebugPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  backgroundColor: '#f44336',
                  color: 'white'
                }}
              >
                ✕
              </button>
            </div>
            📍 URL: {window.location.href}<br/>
            🏠 Host: {window.location.hostname}<br/>
            🔗 Protocol: {window.location.protocol}<br/>
            🌐 Generated WS: {`${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname}:3002`}<br/>
            📡 Status: {connectionStatus}<br/>
            🔄 Attempts: {reconnectAttempts}<br/>
            👤 User: {user.username}<br/>
            📱 Mobile: {/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'YES' : 'NO'}
          </div>
        </>
      )}

      {/* Lobby content header - simplified */}
      <div className="lobby-content-header">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('lobby.title')}</h2>
      </div>


      {user.isAdmin && showAdminPanel && (
        <div className="admin-panel">
          <h3>{t('admin.panelTitle')}</h3>
          <div className="admin-content">
            <div className="admin-section">
              <h4>{t('admin.userManagement')}</h4>
              {adminLoading ? (
                <p>{t('admin.loadingUsers')}</p>
              ) : (
                <div className="user-list">
                  {allUsers.map((adminUser) => (
                    <div key={adminUser.id} className="user-item">
                      <div className="user-info">
                        <span className="username">
                          {adminUser.username} 
                          {adminUser.isAdmin && ' 👑'}
                          {adminUser.id === user.id && ' (You)'}
                        </span>
                        <span className="user-stats">
                          {t('lobby.userStats', { played: adminUser.gamesPlayed, won: adminUser.gamesWon })}
                        </span>
                      </div>
                      <div className="user-actions">
                        {adminUser.id !== user.id && (
                          <>
                            {adminUser.isAdmin ? (
                              <button 
                                onClick={() => handleDemoteUser(adminUser.id)}
                                className="demote-button"
                              >
                                {t('admin.removeAdmin')}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handlePromoteUser(adminUser.id)}
                                className="promote-button"
                              >
                                {t('admin.makeAdmin')}
                              </button>
                            )}
                            <button 
                              onClick={() => setResetPasswordData({userId: adminUser.id, newPassword: ''})}
                              className="reset-password-button"
                            >
                              {t('admin.resetPassword')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-section">
              <h4>{t('admin.gameManagement')}</h4>
              {gamesLoading ? (
                <p>{t('admin.loadingGames')}</p>
              ) : (
                <div className="games-list">
                  {allGames.length === 0 ? (
                    <p className="no-games">{t('admin.noActiveGames')}</p>
                  ) : (
                    <div className="admin-games-table">
                      <div className="table-header">
                        <span>{t('admin.gameId')}</span>
                        <span>{t('admin.players')}</span>
                        <span>{t('admin.status')}</span>
                        <span>{t('admin.createdAt')}</span>
                        <span>{t('admin.actions')}</span>
                      </div>
                      {allGames.map((game) => (
                        <div key={game.id} className="table-row">
                          <span className="game-id">{game.id}</span>
                          <span className="game-players">
                            {game.playerCount}/4: {game.players.join(', ')}
                          </span>
                          <span className={`game-status status-${game.status}`}>
                            {game.status}
                          </span>
                          <span className="game-created">
                            {new Date(game.createdAt).toLocaleString()}
                          </span>
                          <span className="game-actions">
                            <button 
                              onClick={() => setConfirmTerminate(game.id)}
                              className="terminate-button"
                            >
                              {t('admin.terminateGame')}
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={loadAllGames}
                    className="refresh-button"
                    disabled={gamesLoading}
                  >
                    🔄 Refresh Games
                  </button>
                </div>
              )}
            </div>

            <div className="admin-section">
              <h4>{t('admin.serverManagement')}</h4>
              <div className="server-controls">
                <button 
                  onClick={() => setConfirmRestart(true)}
                  className="restart-server-button"
                >
                  {t('admin.restartServer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resetPasswordData && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t('admin.resetPasswordTitle')}</h3>
            <p>{t('admin.enterNewPassword')}</p>
            <input
              type="password"
              value={resetPasswordData.newPassword}
              onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
              placeholder={t('admin.newPasswordPlaceholder')}
              minLength={4}
            />
            <div className="modal-actions">
              <button 
                onClick={() => handleResetPassword(resetPasswordData.userId, resetPasswordData.newPassword)}
                disabled={resetPasswordData.newPassword.length < 4}
                className="confirm-button"
              >
                {t('admin.resetPassword')}
              </button>
              <button 
                onClick={() => setResetPasswordData(null)}
                className="cancel-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTerminate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t('admin.terminateGame')}</h3>
            <p>{t('admin.terminateGameConfirm', { gameId: confirmTerminate })}</p>
            <div className="modal-actions">
              <button 
                onClick={() => handleTerminateGame(confirmTerminate)}
                className="confirm-button danger"
              >
                {t('admin.terminateGame')}
              </button>
              <button 
                onClick={() => setConfirmTerminate(null)}
                className="cancel-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRestart && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t('admin.restartServer')}</h3>
            <p>{t('admin.restartServerConfirm')}</p>
            <div className="modal-actions">
              <button 
                onClick={handleRestartServer}
                className="confirm-button danger"
              >
                {t('admin.restartServer')}
              </button>
              <button 
                onClick={() => setConfirmRestart(false)}
                className="cancel-button"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lobby-content">
        <div className="lobby-main">
          <div className="game-actions">
            <div className="action-section">
              <h3>{t('lobby.createGame.title')}</h3>
              <p>{t('lobby.createGame.description')}</p>
              <button 
                onClick={handleCreateGame}
                disabled={connectionStatus !== 'connected'}
                className="primary-button"
              >
                {connectionStatus === 'connecting' ? t('lobby.creating') : t('lobby.createGame.button')}
              </button>
            </div>

            <div className="action-section">
              <h3>{t('lobby.joinGame.title')}</h3>
              <p>{t('lobby.joinGame.description')}</p>
              <div className="join-game-form">
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                  placeholder={t('lobby.joinGame.placeholder')}
                  maxLength={6}
                  className="game-code-input"
                />
                <button 
                  onClick={() => handleJoinGame()}
                  disabled={!joinGameId || connectionStatus !== 'connected'}
                  className="secondary-button"
                >
                  {(() => {
                    const gameInList = availableGames.find(g => g.id === joinGameId);
                    const isPlayerInGame = gameInList?.players.includes(user.username);
                    return connectionStatus === 'connecting' ? t('lobby.joining') : 
                           isPlayerInGame ? t('lobby.availableGames.rejoin') : t('lobby.joinGame.button');
                  })()}
                </button>
              </div>
            </div>

            <div className="action-section">
              <h3>{t('lobby.availableGames.title')}</h3>
              {availableGames.length === 0 ? (
                <p className="no-games">{t('lobby.availableGames.noGames')}</p>
              ) : (
                <div className="available-games">
                  {availableGames.map((game) => (
                    <div key={game.id} className="game-item">
                      <div className="game-info">
                        <span className="game-id">{t('lobby.availableGames.code', { code: game.id })}</span>
                        <span className="game-players">
                          {t('lobby.availableGames.players', { current: game.playerCount, max: 4 })}
                        </span>
                        <span className="player-names">
                          {game.players.join(', ')}
                        </span>
                        <span className={`game-status status-${game.status}`}>
                          {game.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleJoinGame(game.id)}
                        disabled={connectionStatus !== 'connected'}
                        className="join-button"
                      >
                        {game.players.includes(user.username) ? t('lobby.availableGames.rejoin') : t('lobby.availableGames.join')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat System - Toggle Button */}
        <div className={`fixed right-4 z-50 transition-all duration-200 bottom-4 ${
          chatOpen ? 'md:hidden' : ''
        }`}>
          <button
            onClick={handleToggleChat}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2 ${
              chatOpen ? 'bg-blue-600' : ''
            } ${unreadCount > 0 && !chatOpen ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
          >
            💬
            {unreadCount > 0 && !chatOpen && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Chat Overlay */}
        {chatOpen && (
          <div className="fixed inset-x-4 bottom-4 z-[1100] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col md:hidden" style={{top: '80px'}}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('lobby.chat.title')}
              </h3>
              <button
                onClick={handleToggleChat}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('lobby.chat.noMessages')}
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div key={`${message.id}-${index}`} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">
                        {message.username}:
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 ml-2 break-words">
                      {message.message}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form - Fixed at bottom */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('lobby.chat.placeholder')}
                  maxLength={200}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                  disabled={connectionStatus !== 'connected'}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || connectionStatus !== 'connected'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex-shrink-0"
                >
                  {t('lobby.chat.send')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Desktop Chat Sidebar */}
        {chatOpen && (
          <div className="hidden md:flex fixed right-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex-col z-[1100]" style={{top: '70px'}}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('lobby.chat.title')}
              </h3>
              <button
                onClick={handleToggleChat}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('lobby.chat.noMessages')}
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div key={`${message.id}-${index}`} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">
                        {message.username}:
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 ml-2 break-words">
                      {message.message}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form - Fixed at bottom */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('lobby.chat.placeholder')}
                  maxLength={200}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500"
                  disabled={connectionStatus !== 'connected'}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || connectionStatus !== 'connected'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex-shrink-0"
                >
                  {t('lobby.chat.send')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {connectionStatus !== 'connected' && (
        <div className="connection-overlay">
          <div className="connection-message">
            {connectionStatus === 'connecting' ? 
              t('lobby.connectingToServer') : 
              t('lobby.connectionLost')}
          </div>
        </div>
      )}
    </div>
  );
}