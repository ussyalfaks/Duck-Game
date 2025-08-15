import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { resourceManager, ResourceBalance, ResourceTransaction } from '../services/resourceManager';
import { achievementSystem, PlayerLevel, LevelUpReward } from '../services/achievementSystem';
import { badgeSystem, PlayerBadge, BadgeProgress } from '../services/badgeSystem';
import { useHoneycomb } from './useHoneycomb';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentWinStreak: number;
  bestWinStreak: number;
  highScore: number;
  totalPlayTime: number; // in minutes
  consecutiveDaysPlayed: number;
  tournamentWins: number;
  lastPlayedDate?: Date;
  totalXP: number;
}

export interface GameResourcesState {
  // Resources
  resourceBalances: ResourceBalance[];
  
  // Achievement system
  playerLevel: PlayerLevel;
  
  // Badge system
  playerBadges: PlayerBadge[];
  badgeProgress: BadgeProgress[];
  
  // Player stats
  playerStats: PlayerStats;
  
  // Loading states
  isLoading: boolean;
  isAwarding: boolean;
  
  // Error handling
  error: string | null;
}

export const useGameResources = () => {
  const wallet = useWallet();
  const { profile } = useHoneycomb();
  
  const [state, setState] = useState<GameResourcesState>({
    resourceBalances: [],
    playerLevel: {
      currentLevel: 1,
      currentTitle: "Duckling",
      currentXP: 0,
      xpToNextLevel: 100,
      totalXPNeeded: 100,
      progress: 0
    },
    playerBadges: [],
    badgeProgress: [],
    playerStats: {
      gamesPlayed: 0,
      gamesWon: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      highScore: 0,
      totalPlayTime: 0,
      consecutiveDaysPlayed: 0,
      tournamentWins: 0,
      totalXP: 0
    },
    isLoading: false,
    isAwarding: false,
    error: null
  });

  // Load player data when profile is available
  useEffect(() => {
    if (profile?.address && wallet.publicKey) {
      loadPlayerData();
    }
  }, [profile?.address, wallet.publicKey]);

  const loadPlayerData = async () => {
    if (!profile?.address) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load resource balances
      const balances = await resourceManager.getResourceBalances(profile.address);
      
      // Get XP from balances
      const xpBalance = balances.find(b => b.type === 'XP')?.amount || 0;
      
      // Calculate player level
      const playerLevel = achievementSystem.calculateLevel(xpBalance);
      
      // Load player stats (in a real app, this would come from your backend/blockchain)
      const playerStats = await loadPlayerStats();
      
      // Calculate badge progress
      const badgeProgress = badgeSystem.getBadgeProgress(playerStats, state.playerBadges);

      setState(prev => ({
        ...prev,
        resourceBalances: balances,
        playerLevel,
        playerStats: { ...playerStats, totalXP: xpBalance },
        badgeProgress,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to load player data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load player data',
        isLoading: false
      }));
    }
  };

  // Mock function - in real app, load from blockchain/backend
  const loadPlayerStats = async (): Promise<PlayerStats> => {
    // This would typically fetch from your game's database or blockchain
    return {
      gamesPlayed: 3,
      gamesWon: 2,
      currentWinStreak: 2,
      bestWinStreak: 2,
      highScore: 8500,
      totalPlayTime: 45,
      consecutiveDaysPlayed: 1,
      tournamentWins: 0,
      lastPlayedDate: new Date(),
      totalXP: state.playerStats.totalXP
    };
  };

  /**
   * Award XP to player and handle level ups
   */
  const awardXP = useCallback(async (
    amount: number,
    reason?: string
  ): Promise<LevelUpReward | null> => {
    if (!profile?.address || !wallet.publicKey) {
      setState(prev => ({ ...prev, error: 'Wallet or profile not available' }));
      return null;
    }

    setState(prev => ({ ...prev, isAwarding: true, error: null }));

    try {
      const result = await achievementSystem.awardXP(
        wallet,
        profile.address,
        state.playerStats.totalXP,
        amount,
        reason
      );

      if (result.transaction) {
        setState(prev => ({
          ...prev,
          playerLevel: result.newPlayerLevel,
          playerStats: {
            ...prev.playerStats,
            totalXP: result.newPlayerLevel.currentXP
          }
        }));

        // Refresh resource balances
        const newBalances = await resourceManager.getResourceBalances(profile.address);
        setState(prev => ({ ...prev, resourceBalances: newBalances }));

        if (result.levelUpReward) {
          console.log('Level up!', result.levelUpReward);
        }

        return result.levelUpReward;
      }

      return null;
    } catch (error) {
      console.error('Failed to award XP:', error);
      setState(prev => ({ ...prev, error: 'Failed to award XP' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isAwarding: false }));
    }
  }, [profile?.address, wallet.publicKey, state.playerStats.totalXP]);





  /**
   * Check and award badges based on player actions
   */
  const checkBadges = useCallback(async (): Promise<PlayerBadge[]> => {
    if (!profile?.address || !wallet.publicKey) return [];

    try {
      const result = await badgeSystem.checkAndAwardBadges(
        wallet,
        profile.address,
        state.playerStats,
        state.playerBadges
      );

      if (result.newBadges.length > 0) {
        setState(prev => ({
          ...prev,
          playerBadges: [...prev.playerBadges, ...result.newBadges]
        }));

        // Refresh balances after badge rewards
        const newBalances = await resourceManager.getResourceBalances(profile.address);
        setState(prev => ({ ...prev, resourceBalances: newBalances }));
      }

      return result.newBadges;
    } catch (error) {
      console.error('Failed to check badges:', error);
      return [];
    }
  }, [profile?.address, wallet.publicKey, state.playerStats, state.playerBadges]);

  /**
   * Update player stats (call this after game events)
   */
  const updatePlayerStats = useCallback((updates: Partial<PlayerStats>) => {
    setState(prev => ({
      ...prev,
      playerStats: { ...prev.playerStats, ...updates }
    }));
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  return {
    // State
    ...state,
    
    // Actions
    awardXP,
    checkBadges,
    updatePlayerStats,
    refresh,


    badgeStats: badgeSystem.getBadgeStats(state.playerBadges),
    
    xpRewards: achievementSystem.getXPRewards()
  };
};