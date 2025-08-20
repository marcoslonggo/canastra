import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ActionButton } from '../atoms/ActionButton';
import { cn } from '../../lib/utils';
import type { GameState, User, Player } from '../../types';

interface GameHeaderProps {
  gameState: GameState;
  user: User;
  myPlayer: Player;
  isMyTurn: boolean;
  cheatMode?: boolean;
  onLeaveGame: () => void;
  onToggleCheatMenu?: () => void;
  showCheatMenu?: boolean;
  className?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  user,
  myPlayer,
  isMyTurn,
  cheatMode = false,
  onLeaveGame,
  onToggleCheatMenu,
  showCheatMenu = false,
  className,
}) => {
  const { t } = useTranslation();
  
  const currentPlayer = gameState.players[gameState.currentTurn];
  const myTeam = myPlayer.team;

  return (
    <div className={cn(
      'game-header bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm',
      className
    )}>
      {/* Mobile-First Streamlined Layout */}
      <div className="block lg:hidden">
        {/* Compact Mobile Header */}
        <div className="flex flex-col gap-2 p-3">
          {/* Single Row: Essential Info Only */}
          <div className="flex items-center justify-between">
            {/* Left: Quick Room Code */}
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                #{gameState.id.slice(-4)}
              </div>

              {/* Turn indicator */}
              <div className="flex items-center gap-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isMyTurn ? 'text-green-700' : 'text-gray-600'
                )}>
                  {isMyTurn ? t('game.yourTurn') : currentPlayer.username}
                </span>
              </div>
            </div>

            
            {/* Right: Scores + Controls */}
            <div className="flex items-center justify-between flex-1 ml-4">
              {/* Compact Scores + Language */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded font-medium',
                    myTeam === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  )}>
                    {gameState.matchScores?.[0] || 0}
                  </span>
                  <span className="text-gray-400 text-xs">:</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded font-medium',
                    myTeam === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  )}>
                    {gameState.matchScores?.[1] || 0}
                  </span>
                </div>
                <LanguageSwitcher compact />
                {cheatMode && onToggleCheatMenu && (
                  <ActionButton
                    onClick={onToggleCheatMenu}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-yellow-600"
                    title="Cheat Menu"
                  >
                    ⚡
                  </ActionButton>
                )}
              </div>

              {/* Disconnect Button - Anchored Far Right */}
              <ActionButton
                onClick={onLeaveGame}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-red-600 hover:text-red-700 flex-shrink-0"
                title="Leave Game"
              >
                ✕
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-8 py-6">
          {/* Left: Game Info */}
          <div className="game-info flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Room #{gameState.id.slice(-4)}
            </h2>
            <div className="flex items-center gap-8">
              <div className={cn(
                'px-4 py-2 rounded-lg font-medium',
                myTeam === 1 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                  : 'bg-gray-100 text-gray-700'
              )}>
                {t('game.teamScore', { team: 1, score: gameState.matchScores?.[0] || 0 })}
              </div>
              <div className="text-gray-400 font-bold text-lg">VS</div>
              <div className={cn(
                'px-4 py-2 rounded-lg font-medium',
                myTeam === 2 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                  : 'bg-gray-100 text-gray-700'
              )}>
                {t('game.teamScore', { team: 2, score: gameState.matchScores?.[1] || 0 })}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="game-controls flex items-center gap-6">
            <LanguageSwitcher />
            
            {/* Turn Indicator */}
            <div className="turn-indicator">
              {isMyTurn ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-green-100 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium text-green-800 text-lg">
                    {t('game.yourTurn')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-100 rounded-lg">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-orange-800 text-lg">
                    {t('game.opponentTurn', { player: currentPlayer.username })}
                  </span>
                </div>
              )}
            </div>

            {/* Cheat Menu Button */}
            {cheatMode && onToggleCheatMenu && (
              <ActionButton
                onClick={onToggleCheatMenu}
                variant="warning"
                size="sm"
                title="Cheat Menu"
              >
                {t('game.cheat.title')}
              </ActionButton>
            )}

            {/* Leave Game Button */}
            <ActionButton
              onClick={onLeaveGame}
              variant="ghost"
              className="text-red-600 hover:text-red-700"
            >
              {t('game.leaveGame')}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};