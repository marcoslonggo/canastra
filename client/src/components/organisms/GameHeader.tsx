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
      {/* Mobile/Tablet Compact Layout */}
      <div className="block lg:hidden">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-3 p-4">
          {/* Top Row: Title + Leave Button */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {t('game.title', { roomCode: gameState.id })}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSwitcher />
              <ActionButton
                onClick={onLeaveGame}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
✕
              </ActionButton>
            </div>
          </div>

          {/* Middle Row: Scores */}
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              myTeam === 1 
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                : 'bg-gray-100 text-gray-700'
            )}>
              {t('game.teamScore', { team: 1, score: gameState.scores[0] })}
            </div>
            <div className="text-gray-400 font-bold">VS</div>
            <div className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              myTeam === 2 
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                : 'bg-gray-100 text-gray-700'
            )}>
              {t('game.teamScore', { team: 2, score: gameState.scores[1] })}
            </div>
          </div>

          {/* Bottom Row: Turn Indicator + Cheat Menu */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isMyTurn ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">
                    {t('game.yourTurn')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600 truncate">
                    {t('game.opponentTurn', { player: currentPlayer.username })}
                  </span>
                </div>
              )}
            </div>
            
            {cheatMode && onToggleCheatMenu && (
              <ActionButton
                onClick={onToggleCheatMenu}
                variant="warning"
                size="sm"
                className="ml-2"
                title="Cheat Menu"
              >
⚡
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Game Info */}
          <div className="game-info flex flex-col gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {t('game.title', { roomCode: gameState.id })}
            </h2>
            <div className="flex items-center gap-6">
              <div className={cn(
                'px-4 py-2 rounded-lg font-medium',
                myTeam === 1 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                  : 'bg-gray-100 text-gray-700'
              )}>
                {t('game.teamScore', { team: 1, score: gameState.scores[0] })}
              </div>
              <div className="text-gray-400 font-bold text-lg">VS</div>
              <div className={cn(
                'px-4 py-2 rounded-lg font-medium',
                myTeam === 2 
                  ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500/20' 
                  : 'bg-gray-100 text-gray-700'
              )}>
                {t('game.teamScore', { team: 2, score: gameState.scores[1] })}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="game-controls flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* Turn Indicator */}
            <div className="turn-indicator">
              {isMyTurn ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium text-green-800">
                    {t('game.yourTurn')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-orange-800">
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