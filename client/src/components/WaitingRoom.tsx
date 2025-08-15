import React, { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';
import { User, GameState } from '../types';
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

  useEffect(() => {
    setupEventListeners();
    if (!initialGameState) {
      gameService.getGameState();
    }
  }, [initialGameState]);

  const setupEventListeners = () => {
    gameService.on('game-state-update', (newGameState: GameState) => {
      setGameState(newGameState);
      
      // Check if current user is the host (first player)
      if (newGameState.players.length > 0) {
        setIsHost(newGameState.players[0].id === user.id.toString());
      }
      
      // If game phase changed to playing, start the game
      if (newGameState.phase === 'playing') {
        onGameStart();
      }
    });

    gameService.on('player-left', (data: { playerId: string; username: string }) => {
      console.log('Player left:', data.username);
    });

    gameService.on('error', (error: { message: string }) => {
      alert(`Error: ${error.message}`);
    });
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
  const canStart = gameState.players.length >= 2 && gameState.players.length <= 4;
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
    </div>
  );
}