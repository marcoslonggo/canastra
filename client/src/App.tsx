import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from './components/Auth';
import { GameLobby } from './components/GameLobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameTable } from './components/GameTable';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { User, GameState } from './types';
import { gameService } from './services/gameService';
import './App.css';

type AppScreen = 'auth' | 'lobby' | 'waiting' | 'game';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Controls state (moved from GameLobby)
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const handleGameReconnected = useCallback((data: { gameId: string; gameState: GameState }) => {
    console.log('Reconnected to game:', data.gameId);
    setCurrentGameId(data.gameId);
    setGameState(data.gameState);
    setCurrentScreen('game');
  }, []);

  const handleWaitingRoomReconnected = useCallback((data: { gameId: string; gameState?: GameState }) => {
    console.log('Reconnected to waiting room:', data.gameId);
    setCurrentGameId(data.gameId);
    if (data.gameState) {
      setGameState(data.gameState);
    }
    setCurrentScreen('waiting');
  }, []);

  const handleSessionTerminated = useCallback((data: { reason: string; message: string; timestamp: Date }) => {
    console.log('Session terminated:', data.reason);
    
    // Clear local state
    setUser(null);
    setToken(null);
    setCurrentGameId(null);
    setGameState(null);
    setCurrentScreen('auth');
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Show user notification
    alert(data.message || 'Your session has been terminated because you logged in from another device.');
  }, []);

  const setupReconnectionListeners = useCallback(() => {
    // Remove any existing listeners to prevent duplicates
    gameService.off('game-reconnected', handleGameReconnected);
    gameService.off('waiting-room-reconnected', handleWaitingRoomReconnected);
    gameService.off('session-terminated', handleSessionTerminated);
    
    // Add the listeners
    gameService.on('game-reconnected', handleGameReconnected);
    gameService.on('waiting-room-reconnected', handleWaitingRoomReconnected);
    gameService.on('session-terminated', handleSessionTerminated);
  }, [handleGameReconnected, handleWaitingRoomReconnected, handleSessionTerminated]);

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Establish WebSocket connection
        gameService.connect(parsedUser).then(() => {
          console.log('Reconnected to game service');
          setCurrentScreen('lobby');
          setupReconnectionListeners();
          setIsInitializing(false);
        }).catch((error) => {
          console.error('Failed to reconnect to game service:', error);
          setCurrentScreen('lobby'); // Still show lobby even if connection fails
          setupReconnectionListeners();
          setIsInitializing(false);
        });
      } catch (err) {
        // Clear invalid stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsInitializing(false);
      }
    } else {
      // No stored credentials, show auth screen
      setIsInitializing(false);
    }
  }, [setupReconnectionListeners]);

  // Set up reconnection listeners whenever we have a user
  useEffect(() => {
    if (user && token) {
      setupReconnectionListeners();
    }
  }, [user, token, setupReconnectionListeners]);

  const handleLogin = async (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Establish WebSocket connection
    try {
      await gameService.connect(user);
      console.log('Connected to game service');
    } catch (error) {
      console.error('Failed to connect to game service:', error);
    }
    
    setCurrentScreen('lobby');
    setupReconnectionListeners();
    setIsInitializing(false);
  };

  const handleLogout = () => {
    // Disconnect from game service
    gameService.disconnect();
    
    setUser(null);
    setToken(null);
    setCurrentScreen('auth');
    setCurrentGameId(null);
    setGameState(null);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Control handlers (moved from GameLobby)
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'disconnected': return '#f44336';
      default: return '#666';
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

  const handleGameStart = (gameId: string) => {
    console.log('Joining game with ID:', gameId);
    setCurrentGameId(gameId);
    setCurrentScreen('waiting');
    
    // The game state will be updated via WebSocket events
    const currentState = gameService.getCurrentGameState();
    if (currentState) {
      setGameState(currentState);
    }
  };

  const handleGameActuallyStart = () => {
    setCurrentScreen('game');
  };

  const handleLeaveGame = () => {
    gameService.leaveGame();
    setCurrentScreen('lobby');
    setCurrentGameId(null);
    setGameState(null);
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Family Canastra</h1>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication screen
  if (currentScreen === 'auth' || !user || !token) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show waiting room
  if (currentScreen === 'waiting' && currentGameId) {
    return (
      <WaitingRoom
        user={user}
        gameId={currentGameId}
        initialGameState={gameState || undefined}
        onGameStart={handleGameActuallyStart}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  // Show game table
  if (currentScreen === 'game' && currentGameId) {
    return (
      <GameTable 
        user={user}
        initialGameState={gameState || undefined}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  // Show lobby (default)
  return (
    <>
      <div className="app-header-consolidated">
        <div className="header-left">
          <span className="welcome-text">Welcome, {user.username}!</span>
          <span className="stats">Games: {user.gamesPlayed} | Wins: {user.gamesWon}</span>
        </div>
        
        <div className="header-right">
          <LanguageSwitcher compact={true} />
          
          {user.isAdmin && (
            <button 
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="control-button admin-button"
              title={showAdminPanel ? t('admin.hidePanel') : t('admin.showPanel')}
            >
              👑
            </button>
          )}
          
          <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="control-button debug-button"
            style={{
              backgroundColor: showDebugPanel ? '#f44336' : '#2196F3'
            }}
            title="Toggle Debug Panel"
          >
            🔧
          </button>
          
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
          
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <GameLobby 
        user={user}
        onGameStart={handleGameStart}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        showDebugPanel={showDebugPanel}
        setShowDebugPanel={setShowDebugPanel}
        connectionStatus={connectionStatus}
        setConnectionStatus={setConnectionStatus}
        reconnectAttempts={reconnectAttempts}
        setReconnectAttempts={setReconnectAttempts}
      />
    </>
  );
}

export default App;
