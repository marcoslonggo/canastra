import React, { useState, useEffect, useRef } from 'react';
import { gameService } from '../services/gameService';
import { User, GameState, ChatMessage } from '../types';
import './WaitingRoom.css';

interface WaitingRoomProps {
  user: User;
  gameId: string;
  initialGameState?: GameState;
  onGameStart: () => void;
  onLeaveGame: () => void;
}

export function WaitingRoom({ user, gameId, initialGameState, onGameStart, onLeaveGame }: WaitingRoomProps) {
  const [gameState, setGameState] = useState<GameState | null>(initialGameState || null);
  const [isHost, setIsHost] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Store listener references for cleanup
  const listenersRef = useRef<{
    gameStateUpdate?: Function;
    playerLeft?: Function;
    chatMessage?: Function;
    error?: Function;
  }>({});

  useEffect(() => {
    setupEventListeners();
    if (!initialGameState) {
      gameService.getGameState();
    } else {
      // Check host status on initial load if we have initial game state
      if (initialGameState.players.length > 0) {
        const hostPlayer = initialGameState.players[0];
        const isUserHost = hostPlayer && hostPlayer.id === user.id.toString();
        
        console.log('🎮 Initial host detection:', {
          hostPlayer,
          hostPlayerId: hostPlayer?.id,
          currentUserId: user.id.toString(),
          currentUsername: user.username,
          isUserHost,
          allPlayers: initialGameState.players.map(p => ({ id: p.id, username: p.username }))
        });
        
        setIsHost(isUserHost);
      }
    }
    
    // Cleanup listeners on unmount
    return () => {
      cleanupEventListeners();
    };
  }, [initialGameState]);

  useEffect(() => {
    // Auto scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const cleanupEventListeners = () => {
    // Remove existing listeners
    if (listenersRef.current.gameStateUpdate) {
      gameService.off('game-state-update', listenersRef.current.gameStateUpdate);
    }
    if (listenersRef.current.playerLeft) {
      gameService.off('player-left', listenersRef.current.playerLeft);
    }
    if (listenersRef.current.chatMessage) {
      gameService.off('chat-message', listenersRef.current.chatMessage);
    }
    if (listenersRef.current.error) {
      gameService.off('error', listenersRef.current.error);
    }
    
    // Clear references
    listenersRef.current = {};
  };

  const setupEventListeners = () => {
    // Clean up any existing listeners first
    cleanupEventListeners();
    
    // Create new listener functions and store references
    listenersRef.current.gameStateUpdate = (newGameState: GameState) => {
      setGameState(newGameState);
      
      // Check if current user is the host (first player)
      if (newGameState.players.length > 0) {
        // Host is the first player to join the game
        const hostPlayer = newGameState.players[0];
        const isUserHost = hostPlayer && hostPlayer.id === user.id.toString();
        
        // Debug logging
        console.log('🎮 Host detection debug:', {
          hostPlayer,
          hostPlayerId: hostPlayer?.id,
          currentUserId: user.id.toString(),
          currentUsername: user.username,
          isUserHost,
          allPlayers: newGameState.players.map(p => ({ id: p.id, username: p.username }))
        });
        
        setIsHost(isUserHost);
      }
      
      // If game phase changed to playing, start the game
      if (newGameState.phase === 'playing') {
        onGameStart();
      }
    };

    listenersRef.current.playerLeft = (data: { playerId: string; username: string }) => {
      console.log('Player left:', data.username);
    };

    listenersRef.current.chatMessage = (message: ChatMessage) => {
      // Only show messages for this game or lobby messages
      if (message.room === 'game' && message.gameId === gameId) {
        setChatMessages(prev => [...prev, message]);
      }
    };

    const chatHistoryHandler = (data: { room: string; gameId?: string; messages: ChatMessage[] }) => {
      console.log('🎮 WaitingRoom received chat history:', data);
      if (data.room === 'game' && data.gameId === gameId) {
        console.log('🎮 Setting waiting room chat messages:', data.messages.length, 'messages');
        setChatMessages(data.messages);
      }
    };

    listenersRef.current.error = (error: { message: string }) => {
      alert(`Error: ${error.message}`);
    };
    
    // Add the listeners
    gameService.on('game-state-update', listenersRef.current.gameStateUpdate);
    gameService.on('player-left', listenersRef.current.playerLeft);
    gameService.on('chat-message', listenersRef.current.chatMessage);
    gameService.on('chat-history', chatHistoryHandler);
    gameService.on('error', listenersRef.current.error);

    // Note: Already joined the game when entering waiting room
    console.log('🎮 WaitingRoom event listeners set up for game:', gameId);
  };

  const handleStartGame = () => {
    if (!isHost) {
      alert('Only the host can start the game');
      return;
    }

    if (!gameState || gameState.players.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }

    // Send start game event to server
    gameService.startGame();
  };

  const handleLeaveGame = () => {
    gameService.leaveGame();
    onLeaveGame();
  };

  const handleSwitchTeam = (teamNumber: number) => {
    gameService.switchTeam(teamNumber);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      gameService.sendChatMessage(chatInput.trim(), 'game', gameId);
      setChatInput('');
    }
  };

  if (!gameState) {
    return (
      <div className="waiting-room loading">
        <h2>Loading game...</h2>
        <p>Connecting to game room {gameId}...</p>
      </div>
    );
  }

  const getTeamPlayers = (team: number) => {
    return gameState.players.filter(p => p.team === team);
  };

  const team1Players = getTeamPlayers(1);
  const team2Players = getTeamPlayers(2);
  const canStart = true; // Temporary: always allow start for testing
  const currentPlayer = gameState.players.find(p => p.id === user.id.toString());
  const currentUserTeam = currentPlayer?.team;

  return (
    <div className="waiting-room">
      <div className="room-header">
        <h2>Game Room: {gameId}</h2>
        <div className="room-status">
          Waiting for players ({gameState.players.length}/4)
        </div>
      </div>

      <div className="teams-display">
        <div className="team-section">
          <h3>Team 1</h3>
          <div className="team-players">
            {team1Players.map(player => (
              <div key={player.id} className={`player-card ${player.id === user.id.toString() ? 'current-user' : ''}`}>
                <div className="player-name">{player.username}</div>
                {player.id === gameState.players[0]?.id && (
                  <div className="host-badge">Host</div>
                )}
                <div className="connection-status">
                  {player.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            ))}
            {team1Players.length < 2 && (
              <div className="empty-slot">
                {currentUserTeam !== 1 ? (
                  <button 
                    onClick={() => handleSwitchTeam(1)}
                    className="join-team-button"
                    disabled={team1Players.length >= 2}
                  >
                    Join Team 1
                  </button>
                ) : (
                  team1Players.length === 0 ? 'Waiting for player...' : 'Waiting for team partner...'
                )}
              </div>
            )}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="team-section">
          <h3>Team 2</h3>
          <div className="team-players">
            {team2Players.map(player => (
              <div key={player.id} className={`player-card ${player.id === user.id.toString() ? 'current-user' : ''}`}>
                <div className="player-name">{player.username}</div>
                <div className="connection-status">
                  {player.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            ))}
            {team2Players.length < 2 && (
              <div className="empty-slot">
                {currentUserTeam !== 2 ? (
                  <button 
                    onClick={() => handleSwitchTeam(2)}
                    className="join-team-button"
                    disabled={team2Players.length >= 2}
                  >
                    Join Team 2
                  </button>
                ) : (
                  team2Players.length === 0 ? 'Waiting for player...' : 'Waiting for team partner...'
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="room-info">
        <div className="game-mode">
          {gameState.players.length <= 2 ? '2-Player Game' : '4-Player Team Game'}
        </div>
        <div className="share-code">
          <strong>Room Code:</strong> {gameId}
          <button 
            onClick={() => navigator.clipboard.writeText(gameId)}
            className="copy-button"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="waiting-actions">
        {isHost ? (
          <button 
            onClick={handleStartGame}
            disabled={!canStart}
            className="start-game-button primary-button"
          >
            {canStart ? 'Start Game' : `Need ${2 - gameState.players.length} more player(s)`}
          </button>
        ) : (
          <div className="waiting-message">
            Waiting for host to start the game...
          </div>
        )}

        <button 
          onClick={handleLeaveGame}
          className="leave-room-button secondary-button"
        >
          Leave Room
        </button>
      </div>

      {gameState.players.length < 4 && (
        <div className="invite-section">
          <p>Invite friends to join:</p>
          <div className="invite-text">
            Go to the game lobby and enter code: <strong>{gameId}</strong>
          </div>
        </div>
      )}

      <div className="game-chat">
        <h3>Game Chat</h3>
        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
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
            placeholder="Type a message to your team..."
            maxLength={200}
            className="chat-input"
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="chat-send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}