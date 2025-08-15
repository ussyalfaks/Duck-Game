import { resourceManager, ResourceTransaction } from './resourceManager';

// Achievement levels from server config
export interface AchievementLevel {
  level: number;
  xpRequired: number;
  title: string;
}

export const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  { level: 1, xpRequired: 0, title: "Duckling" },
  { level: 2, xpRequired: 100, title: "Young Duck" },
  { level: 3, xpRequired: 250, title: "Duck" },
  { level: 4, xpRequired: 500, title: "Expert Duck" },
  { level: 5, xpRequired: 1000, title: "Duck Master" },
  { level: 6, xpRequired: 2000, title: "Duck Legend" }
];

export interface PlayerLevel {
  currentLevel: number;
  currentTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  totalXPNeeded: number;
  progress: number; // 0-1 percentage to next level
}

export interface LevelUpReward {
  level: number;
  title: string;
  specialReward?: string;
}

export class AchievementSystem {
  private static instance: AchievementSystem;

  private constructor() {}

  public static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  /**
   * Calculate player's current level based on XP
   */
  calculateLevel(totalXP: number): PlayerLevel {
    let currentLevel = 1;
    let currentTitle = "Duckling";
    
    // Find the highest level the player has reached
    for (const levelInfo of ACHIEVEMENT_LEVELS) {
      if (totalXP >= levelInfo.xpRequired) {
        currentLevel = levelInfo.level;
        currentTitle = levelInfo.title;
      } else {
        break;
      }
    }

    // Calculate progress to next level
    const nextLevelInfo = ACHIEVEMENT_LEVELS.find(l => l.level === currentLevel + 1);
    
    let xpToNextLevel = 0;
    let totalXPNeeded = 0;
    let progress = 1; // Default to 100% if max level
    
    if (nextLevelInfo) {
      const currentLevelInfo = ACHIEVEMENT_LEVELS.find(l => l.level === currentLevel);
      const currentLevelXP = currentLevelInfo?.xpRequired || 0;
      
      xpToNextLevel = nextLevelInfo.xpRequired - totalXP;
      totalXPNeeded = nextLevelInfo.xpRequired - currentLevelXP;
      const xpGainedInLevel = totalXP - currentLevelXP;
      progress = xpGainedInLevel / totalXPNeeded;
    }

    return {
      currentLevel,
      currentTitle,
      currentXP: totalXP,
      xpToNextLevel,
      totalXPNeeded,
      progress: Math.max(0, Math.min(1, progress))
    };
  }

  /**
   * Check if player leveled up after gaining XP
   */
  checkLevelUp(previousXP: number, newXP: number): LevelUpReward | null {
    const previousLevel = this.calculateLevel(previousXP);
    const newLevel = this.calculateLevel(newXP);

    if (newLevel.currentLevel > previousLevel.currentLevel) {
      // Player leveled up!      
      return {
        level: newLevel.currentLevel,
        title: newLevel.currentTitle,
        specialReward: this.getSpecialReward(newLevel.currentLevel)
      };
    }

    return null;
  }

  /**
   * Get special rewards for certain levels
   */
  private getSpecialReward(level: number): string | undefined {
    const specialRewards: { [key: number]: string } = {
      2: "Bonus XP Multiplier",
      3: "Achievement Hunter", 
      4: "Elite Player Status",
      5: "Golden Badge Collection",
      6: "Legendary Champion Status"
    };

    return specialRewards[level];
  }

  /**
   * Award XP and handle level up logic
   */
  async awardXP(
    wallet: any,
    profileAddress: string,
    currentXP: number,
    xpToAward: number,
    reason?: string
  ): Promise<{
    transaction: ResourceTransaction | null;
    levelUpReward: LevelUpReward | null;
    newPlayerLevel: PlayerLevel;
  }> {
    try {
      // Award the XP
      const transaction = await resourceManager.awardXP(
        wallet, 
        profileAddress, 
        xpToAward, 
        reason
      );

      const newTotalXP = currentXP + xpToAward;
      
      // Check for level up
      const levelUpReward = this.checkLevelUp(currentXP, newTotalXP);
      
      // Level up rewards are now purely cosmetic titles and achievements
      if (levelUpReward) {
        console.log(`🎉 Player leveled up to ${levelUpReward.title}! Special reward: ${levelUpReward.specialReward}`);
      }

      const newPlayerLevel = this.calculateLevel(newTotalXP);

      return {
        transaction,
        levelUpReward,
        newPlayerLevel
      };
      
    } catch (error) {
      console.error('Failed to award XP:', error);
      return {
        transaction: null,
        levelUpReward: null,
        newPlayerLevel: this.calculateLevel(currentXP)
      };
    }
  }

  /**
   * Get XP rewards for different game actions
   */
  getXPRewards() {
    return {
      LEVEL_COMPLETE: 50,
      ENEMY_DEFEATED: 10,
      COLLECTIBLE_FOUND: 5,
      PERFECT_SCORE: 25,
      SPEED_BONUS: 15,
      NO_DAMAGE: 20,
      DAILY_LOGIN: 30,
      FIRST_GAME: 100,
      WIN_STREAK_5: 75,
      HIGH_SCORE: 60
    };
  }

  /**
   * Get all level information for UI display
   */
  getAllLevels(): AchievementLevel[] {
    return [...ACHIEVEMENT_LEVELS];
  }

  /**
   * Check if player is at max level
   */
  isMaxLevel(playerLevel: PlayerLevel): boolean {
    return playerLevel.currentLevel >= ACHIEVEMENT_LEVELS[ACHIEVEMENT_LEVELS.length - 1].level;
  }

  /**
   * Get estimated time to next level based on average XP per day
   */
  getEstimatedTimeToNextLevel(
    currentXP: number, 
    averageXPPerDay: number
  ): string {
    const playerLevel = this.calculateLevel(currentXP);
    
    if (this.isMaxLevel(playerLevel)) {
      return "Max level reached!";
    }

    if (averageXPPerDay <= 0) {
      return "Play more to estimate";
    }

    const daysNeeded = Math.ceil(playerLevel.xpToNextLevel / averageXPPerDay);
    
    if (daysNeeded === 1) {
      return "Less than 1 day";
    } else if (daysNeeded < 7) {
      return `About ${daysNeeded} days`;
    } else {
      const weeksNeeded = Math.ceil(daysNeeded / 7);
      return `About ${weeksNeeded} week${weeksNeeded > 1 ? 's' : ''}`;
    }
  }
}

// Export singleton instance
export const achievementSystem = AchievementSystem.getInstance();