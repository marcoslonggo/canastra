import React, { useState, useEffect, useRef } from 'react';
import { gameService } from '../services/gameService';
import { User, ChatMessage, GameState } from '../types';
import './GameLobby.css';

interface GameInfo {
  id: string;
  playerCount: number;
  status: string;
  players: string[];
}

interface GameLobbyProps {
  user: User;
  onGameStart: (gameId: string) => void;
}

export function GameLobby({ user, onGameStart }: GameLobbyProps) {
  const [availableGames, setAvailableGames] = useState<GameInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectToGameService();
    
    // Don't disconnect on unmount - let App component manage connection lifecycle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const connectToGameService = async () => {
    setConnectionStatus('connecting');
    try {
      // Connection is managed by App component, just ensure we're connected
      if (!gameService.isConnected()) {
        await gameService.connect(user);
      }
      setConnectionStatus('connected');
      setupEventListeners();
      gameService.joinLobby();
      gameService.getActiveGames();
    } catch (error) {
      console.error('Failed to connect to game service:', error);
      setConnectionStatus('disconnected');
    }
  };

  const setupEventListeners = () => {
    gameService.on('game-created', (data: { gameId: string }) => {
      console.log('Game created with ID:', data.gameId);
      // Don't immediately transition - wait for game-state-update
    });

    gameService.on('game-list-updated', (games: GameInfo[]) => {
      setAvailableGames(games);
    });

    gameService.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    gameService.on('error', (error: { message: string }) => {
      alert(`Error: ${error.message}`);
    });

    gameService.on('game-state-update', (gameState: GameState) => {
      if (gameState && (gameState.phase === 'waiting' || gameState.phase === 'playing')) {
        onGameStart(gameState.id);
      }
    });
  };

  const handleCreateGame = async () => {
    if (connectionStatus !== 'connected') {
      await connectToGameService();
    }
    
    setIsConnecting(true);
    gameService.createGame();
    
    // Reset after a few seconds in case of no response
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const handleJoinGame = async (gameId?: string) => {
    const targetGameId = gameId || joinGameId.toUpperCase();
    
    if (!targetGameId) {
      alert('Please enter a game code');
      return;
    }

    if (connectionStatus !== 'connected') {
      await connectToGameService();
    }

    setIsConnecting(true);
    gameService.joinGame(targetGameId);
    
    // Reset after a few seconds in case of no response
    setTimeout(() => setIsConnecting(false), 3000);
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

  return (
    <div className="game-lobby">
      <div className="lobby-header">
        <h2>Family Canastra - Game Lobby</h2>
        <div className="connection-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getConnectionStatusColor() }}
          />
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             'Disconnected'}
          </span>
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={connectToGameService}
              className="reconnect-button"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="lobby-content">
        <div className="lobby-main">
          <div className="game-actions">
            <div className="action-section">
              <h3>Create New Game</h3>
              <p>Start a new Buraco game for your family</p>
              <button 
                onClick={handleCreateGame}
                disabled={isConnecting || connectionStatus !== 'connected'}
                className="primary-button"
              >
                {isConnecting ? 'Creating...' : 'Create Game'}
              </button>
            </div>

            <div className="action-section">
              <h3>Join Game with Code</h3>
              <p>Enter the 6-letter game code to join</p>
              <div className="join-game-form">
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                  placeholder="Enter game code (e.g., ABC123)"
                  maxLength={6}
                  className="game-code-input"
                />
                <button 
                  onClick={() => handleJoinGame()}
                  disabled={!joinGameId || isConnecting || connectionStatus !== 'connected'}
                  className="secondary-button"
                >
                  {isConnecting ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </div>

            <div className="action-section">
              <h3>Available Games</h3>
              {availableGames.length === 0 ? (
                <p className="no-games">No games available. Create one!</p>
              ) : (
                <div className="available-games">
                  {availableGames.map((game) => (
                    <div key={game.id} className="game-item">
                      <div className="game-info">
                        <span className="game-id">Code: {game.id}</span>
                        <span className="game-players">
                          Players: {game.playerCount}/4
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
                        disabled={isConnecting || game.status === 'playing' || connectionStatus !== 'connected'}
                        className="join-button"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lobby-chat">
          <h3>Lobby Chat</h3>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">No messages yet. Say hello!</div>
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
              placeholder="Type a message..."
              maxLength={200}
              className="chat-input"
              disabled={connectionStatus !== 'connected'}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || connectionStatus !== 'connected'}
              className="chat-send-button"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {connectionStatus !== 'connected' && (
        <div className="connection-overlay">
          <div className="connection-message">
            {connectionStatus === 'connecting' ? 
              'Connecting to game server...' : 
              'Connection lost. Click Reconnect to try again.'}
          </div>
        </div>
      )}
    </div>
  );
}