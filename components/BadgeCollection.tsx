import React, { useState } from 'react';
import { useGameResources } from '../hooks/useGameResources';
import { badgeSystem } from '../services/badgeSystem';

interface BadgeCollectionProps {
  className?: string;
}

const BadgeCard: React.FC<{
  badge: any;
  isEarned: boolean;
  progress?: number;
  currentProgress?: number;
  requiredProgress?: number;
}> = ({ badge, isEarned, progress = 0, currentProgress = 0, requiredProgress = 1 }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`relative border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      isEarned ? getRarityColor(badge.rarity) : 'border-gray-300 bg-gray-100'
    } ${!isEarned ? 'opacity-60' : ''}`}>
      
      {/* Badge Icon/Emoji */}
      <div className="text-center mb-3">
        <div className={`text-4xl mb-2 ${!isEarned ? 'grayscale' : ''}`}>
          {getBadgeEmoji(badge.id)}
        </div>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className={`font-semibold text-sm mb-1 ${
          isEarned ? getRarityTextColor(badge.rarity) : 'text-gray-500'
        }`}>
          {badge.name}
        </h3>
        <p className="text-xs text-gray-600 mb-2 min-h-[2.5rem]">
          {badge.description}
        </p>
        
        {/* Rarity Badge */}
        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
          isEarned ? getRarityColor(badge.rarity) : 'bg-gray-200 text-gray-500'
        }`}>
          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
        </div>

        {/* Progress Bar (for unearned badges) */}
        {!isEarned && requiredProgress > 1 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentProgress} / {requiredProgress}
            </div>
          </div>
        )}

        {/* Earned Status */}
        {isEarned && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        )}
      </div>
    </div>
  );
};

const getBadgeEmoji = (badgeId: string): string => {
  const emojiMap: { [key: string]: string } = {
    'first_game': '🐣',
    'win_streak': '🔥',
    'high_score': '🚀',
    'daily_player': '📅',
    'tournament_winner': '🏆'
  };
  return emojiMap[badgeId] || '🏅';
};

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ className }) => {
  const { badgeProgress, playerBadges, badgeStats, isLoading } = useGameResources();
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allBadges = badgeSystem.getAllBadges();
  const filteredBadges = selectedRarity === 'all' 
    ? allBadges 
    : allBadges.filter(badge => badge.rarity === selectedRarity);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Badge Collection</h2>
          <p className="text-sm text-gray-600">
            {badgeStats.earnedBadges} of {badgeStats.totalBadges} badges earned ({Math.round(badgeStats.completionPercentage)}%)
          </p>
        </div>
        
        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          <option value="all">All Badges</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Collection Progress</span>
          <span>{badgeStats.earnedBadges}/{badgeStats.totalBadges}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${badgeStats.completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredBadges.map((badge) => {
          const progress = badgeProgress.find(p => p.badgeId === badge.id);
          const isEarned = playerBadges.some(pb => pb.badgeId === badge.id);

          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isEarned={isEarned}
              progress={progress?.progressPercentage || 0}
              currentProgress={progress?.currentProgress || 0}
              requiredProgress={progress?.requiredProgress || 1}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🏅</div>
          <p className="text-gray-600">No badges found for this rarity level.</p>
        </div>
      )}

      {/* Recently Earned */}
      {playerBadges.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recently Earned</h3>
          <div className="flex flex-wrap gap-2">
            {playerBadges
              .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
              .slice(0, 3)
              .map((badge) => (
                <div key={badge.badgeId} className="flex items-center bg-green-100 rounded-full px-3 py-1 text-sm">
                  <span className="mr-2">{getBadgeEmoji(badge.badgeId)}</span>
                  <span className="font-medium">{badge.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};