import { resourceManager, ResourceTransaction } from './resourceManager';

// Badge types from server config
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: BadgeCondition;
  reward?: {
    duckCoins?: number;
    powerUps?: number;
    xp?: number;
  };
}

export interface BadgeCondition {
  type: 'first_time' | 'streak' | 'threshold' | 'daily' | 'special';
  requirement: any; // Specific requirement based on type
  description: string;
}

export interface PlayerBadge {
  badgeId: string;
  name: string;
  description: string;
  earnedAt: Date;
  transactionSignature?: string;
}

export interface BadgeProgress {
  badgeId: string;
  name: string;
  description: string;
  currentProgress: number;
  requiredProgress: number;
  progressPercentage: number;
  isEarned: boolean;
  canEarn: boolean; // If conditions are currently met
}

export const GAME_BADGES: BadgeDefinition[] = [
  {
    id: "first_game",
    name: "First Flight",
    description: "Play your first game",
    rarity: "common",
    condition: {
      type: "first_time",
      requirement: { action: "game_played" },
      description: "Complete your first game"
    },
    reward: {
      duckCoins: 50,
      xp: 25
    }
  },
  {
    id: "win_streak",
    name: "Hot Streak", 
    description: "Win 5 games in a row",
    rarity: "rare",
    condition: {
      type: "streak",
      requirement: { wins: 5, consecutive: true },
      description: "Win 5 consecutive games"
    },
    reward: {
      duckCoins: 150,
      powerUps: 1,
      xp: 75
    }
  },
  {
    id: "high_score",
    name: "High Flyer",
    description: "Achieve a high score",
    rarity: "epic", 
    condition: {
      type: "threshold",
      requirement: { score: 10000 },
      description: "Reach a score of 10,000 points"
    },
    reward: {
      duckCoins: 200,
      powerUps: 2,
      xp: 100
    }
  },
  {
    id: "daily_player",
    name: "Daily Duck",
    description: "Play every day for a week",
    rarity: "rare",
    condition: {
      type: "daily", 
      requirement: { consecutiveDays: 7 },
      description: "Play at least one game for 7 consecutive days"
    },
    reward: {
      duckCoins: 300,
      powerUps: 3,
      xp: 150
    }
  },
  {
    id: "tournament_winner", 
    name: "Tournament Champion",
    description: "Win a tournament",
    rarity: "legendary",
    condition: {
      type: "special",
      requirement: { event: "tournament_win" },
      description: "Win any tournament event"
    },
    reward: {
      duckCoins: 500,
      powerUps: 5, 
      xp: 250
    }
  }
];

export class BadgeSystem {
  private static instance: BadgeSystem;

  private constructor() {}

  public static getInstance(): BadgeSystem {
    if (!BadgeSystem.instance) {
      BadgeSystem.instance = new BadgeSystem();
    }
    return BadgeSystem.instance;
  }

  /**
   * Get all available badges
   */
  getAllBadges(): BadgeDefinition[] {
    return [...GAME_BADGES];
  }

  /**
   * Get badge by ID
   */
  getBadge(badgeId: string): BadgeDefinition | undefined {
    return GAME_BADGES.find(badge => badge.id === badgeId);
  }

  /**
   * Check if player has earned a badge
   */
  hasBadge(playerBadges: PlayerBadge[], badgeId: string): boolean {
    return playerBadges.some(badge => badge.badgeId === badgeId);
  }

  /**
   * Check badge conditions and award if met
   */
  async checkAndAwardBadges(
    wallet: any,
    profileAddress: string,
    playerStats: any,
    playerBadges: PlayerBadge[]
  ): Promise<{
    newBadges: PlayerBadge[];
    rewards: ResourceTransaction[];
  }> {
    const newBadges: PlayerBadge[] = [];
    const rewards: ResourceTransaction[] = [];

    for (const badgeDefinition of GAME_BADGES) {
      // Skip if player already has this badge
      if (this.hasBadge(playerBadges, badgeDefinition.id)) {
        continue;
      }

      // Check if conditions are met
      const conditionMet = this.checkBadgeCondition(badgeDefinition, playerStats);
      
      if (conditionMet) {
        try {
          // Award the badge
          const badgeTransaction = await resourceManager.awardBadge(
            wallet,
            profileAddress,
            badgeDefinition.id,
            badgeDefinition.name
          );

          if (badgeTransaction) {
            const newBadge: PlayerBadge = {
              badgeId: badgeDefinition.id,
              name: badgeDefinition.name,
              description: badgeDefinition.description,
              earnedAt: new Date(),
              transactionSignature: badgeTransaction.signature
            };

            newBadges.push(newBadge);

            // Award badge rewards
            if (badgeDefinition.reward) {
              if (badgeDefinition.reward.xp) {
                const xpReward = await resourceManager.awardXP(
                  wallet,
                  profileAddress,
                  badgeDefinition.reward.xp,
                  `Badge reward: ${badgeDefinition.name}`
                );
                if (xpReward) rewards.push(xpReward);
              }
            }

            console.log(`Badge earned: ${badgeDefinition.name}`);
          }
        } catch (error) {
          console.error(`Failed to award badge ${badgeDefinition.id}:`, error);
        }
      }
    }

    return { newBadges, rewards };
  }

  /**
   * Check if a specific badge condition is met
   */
  private checkBadgeCondition(badge: BadgeDefinition, playerStats: any): boolean {
    const { condition } = badge;

    switch (condition.type) {
      case 'first_time':
        if (condition.requirement.action === 'game_played') {
          return playerStats.gamesPlayed >= 1;
        }
        break;

      case 'streak':
        if (condition.requirement.wins) {
          return playerStats.currentWinStreak >= condition.requirement.wins;
        }
        break;

      case 'threshold':
        if (condition.requirement.score) {
          return playerStats.highScore >= condition.requirement.score;
        }
        break;

      case 'daily':
        if (condition.requirement.consecutiveDays) {
          return playerStats.consecutiveDaysPlayed >= condition.requirement.consecutiveDays;
        }
        break;

      case 'special':
        if (condition.requirement.event === 'tournament_win') {
          return playerStats.tournamentWins >= 1;
        }
        break;
    }

    return false;
  }

  /**
   * Get badge progress for UI display
   */
  getBadgeProgress(playerStats: any, playerBadges: PlayerBadge[]): BadgeProgress[] {
    return GAME_BADGES.map(badge => {
      const isEarned = this.hasBadge(playerBadges, badge.id);
      const { currentProgress, requiredProgress } = this.calculateProgress(badge, playerStats);
      
      return {
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        currentProgress,
        requiredProgress,
        progressPercentage: requiredProgress > 0 ? (currentProgress / requiredProgress) * 100 : 0,
        isEarned,
        canEarn: !isEarned && currentProgress >= requiredProgress
      };
    });
  }

  /**
   * Calculate current progress toward a badge
   */
  private calculateProgress(badge: BadgeDefinition, playerStats: any): {
    currentProgress: number;
    requiredProgress: number;
  } {
    const { condition } = badge;

    switch (condition.type) {
      case 'first_time':
        return {
          currentProgress: Math.min(playerStats.gamesPlayed || 0, 1),
          requiredProgress: 1
        };

      case 'streak':
        return {
          currentProgress: playerStats.currentWinStreak || 0,
          requiredProgress: condition.requirement.wins || 1
        };

      case 'threshold':
        return {
          currentProgress: playerStats.highScore || 0,
          requiredProgress: condition.requirement.score || 1
        };

      case 'daily':
        return {
          currentProgress: playerStats.consecutiveDaysPlayed || 0,
          requiredProgress: condition.requirement.consecutiveDays || 1
        };

      case 'special':
        return {
          currentProgress: playerStats.tournamentWins || 0,
          requiredProgress: 1
        };

      default:
        return { currentProgress: 0, requiredProgress: 1 };
    }
  }

  /**
   * Get badges by rarity for UI filtering
   */
  getBadgesByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): BadgeDefinition[] {
    return GAME_BADGES.filter(badge => badge.rarity === rarity);
  }

  /**
   * Get total badge count and earned count
   */
  getBadgeStats(playerBadges: PlayerBadge[]): {
    totalBadges: number;
    earnedBadges: number;
    completionPercentage: number;
  } {
    const totalBadges = GAME_BADGES.length;
    const earnedBadges = playerBadges.length;
    const completionPercentage = totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;

    return {
      totalBadges,
      earnedBadges,
      completionPercentage
    };
  }
}

// Export singleton instance
export const badgeSystem = BadgeSystem.getInstance();