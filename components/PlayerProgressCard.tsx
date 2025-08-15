import React from 'react';
import { useGameResources } from '../hooks/useGameResources';

interface PlayerProgressCardProps {
  className?: string;
}

export const PlayerProgressCard: React.FC<PlayerProgressCardProps> = ({ className }) => {
  const { playerLevel, resourceBalances, playerStats, badgeStats, isLoading } = useGameResources();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const xpBalance = resourceBalances.find(r => r.type === 'XP')?.amount || 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Player Level */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Level {playerLevel.currentLevel} - {playerLevel.currentTitle}
          </h3>
          <span className="text-sm text-gray-600">
            {xpBalance} XP
          </span>
        </div>
        
        {/* XP Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(playerLevel.progress * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{playerLevel.currentXP - (playerLevel.totalXPNeeded - playerLevel.xpToNextLevel)} XP</span>
          {playerLevel.xpToNextLevel > 0 ? (
            <span>{playerLevel.xpToNextLevel} XP to next level</span>
          ) : (
            <span>Max Level!</span>
          )}
        </div>
      </div>

      {/* Resource Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{xpBalance}</div>
          <div className="text-xs text-gray-600">Experience Points</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{badgeStats.earnedBadges}</div>
          <div className="text-xs text-gray-600">Badges</div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Game Statistics</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Games Played:</span>
            <span className="font-medium">{playerStats.gamesPlayed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Games Won:</span>
            <span className="font-medium">{playerStats.gamesWon}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Win Streak:</span>
            <span className="font-medium">{playerStats.currentWinStreak}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">High Score:</span>
            <span className="font-medium">{playerStats.highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Badge Progress */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gray-700">Badge Collection</h4>
          <span className="text-xs text-gray-600">
            {Math.round(badgeStats.completionPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${badgeStats.completionPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};