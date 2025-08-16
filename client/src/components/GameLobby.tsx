import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gameService } from '../services/gameService';
import { User, ChatMessage, GameState } from '../types';
import { fetchAllUsers, promoteUser, demoteUser, resetUserPassword, fetchAllGames, terminateGame, restartServer } from '../api';
import { LanguageSwitcher } from './LanguageSwitcher';
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
}

export function GameLobby({ user, onGameStart }: GameLobbyProps) {
  const { t } = useTranslation();
  const [availableGames, setAvailableGames] = useState<GameInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Admin state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

  const handleManualReconnect = async () => {
    try {
      await gameService.manualReconnect();
      gameService.joinLobby();
      gameService.getActiveGames();
    } catch (error) {
      console.error('Manual reconnection failed:', error);
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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'disconnected': return '#f44336';
      default: return '#666';
    }
  };

  // Admin functions
  const loadAllUsers = async () => {
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
  };

  const loadAllGames = async () => {
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
  };

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

  const toggleAdminPanel = () => {
    if (!showAdminPanel && user.isAdmin) {
      loadAllUsers();
      loadAllGames();
    }
    setShowAdminPanel(!showAdminPanel);
  };

  return (
    <div className="game-lobby">
      <div className="lobby-header">
        <div className="header-left">
          <h2>{t('lobby.title')}</h2>
          <span className="user-info">{t('lobby.welcome', { username: user.username })} {user.isAdmin && '👑 Admin'}</span>
        </div>
        <div className="header-right">
          <LanguageSwitcher />
          {user.isAdmin && (
            <button 
              onClick={toggleAdminPanel}
              className="admin-toggle-button"
            >
              {showAdminPanel ? t('admin.hidePanel') : t('admin.showPanel')}
            </button>
          )}
          <div className="connection-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getConnectionStatusColor() }}
            />
            <span className="status-text">
              {connectionStatus === 'connected' ? t('lobby.connected') : 
               connectionStatus === 'connecting' ? t('lobby.connecting') : 
               t('lobby.disconnected')}
            </span>
            {connectionStatus === 'disconnected' && (
              <button 
                onClick={handleManualReconnect}
                className="reconnect-button"
              >
                {t('lobby.reconnect')} {reconnectAttempts > 0 && `(${reconnectAttempts}/5)`}
              </button>
            )}
          </div>
        </div>
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

        <div className="lobby-chat">
          <h3>{t('lobby.chat.title')}</h3>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">{t('lobby.chat.noMessages')}</div>
            ) : (
              chatMessages.map((message, index) => (
                <div key={`${message.id}-${index}`} className="chat-message">
                  <span className="message-author">{message.username}:</span>
                  <span className="message-text">{message.message}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          
          <form onSubmit={handleSendChat} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('lobby.chat.placeholder')}
              maxLength={200}
              className="chat-input"
              disabled={connectionStatus !== 'connected'}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || connectionStatus !== 'connected'}
              className="chat-send-button"
            >
              {t('lobby.chat.send')}
            </button>
          </form>
        </div>
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