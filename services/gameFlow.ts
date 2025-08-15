import { achievementSystem, LevelUpReward } from './achievementSystem';
import { badgeSystem, PlayerBadge } from './badgeSystem';

export interface GameSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  level: number;
  score: number;
  completed: boolean;
  perfectScore: boolean;
  noDamage: boolean;
  speedBonus: boolean;
  collectiblesFound: number;
  enemiesDefeated: number;
  timePlayed: number; // in seconds
}

export interface GameRewards {
  xpAwarded: number;
  badgesEarned: PlayerBadge[];
  levelUpReward?: LevelUpReward;
  breakdown: {
    baseXP: number;
    bonusXP: number;
    reasonsForBonus: string[];
  };
}

export interface GameFlowResult {
  session: GameSession;
  rewards: GameRewards;
  newPlayerStats: any;
  success: boolean;
  error?: string;
}

export class GameFlow {
  private static instance: GameFlow;

  private constructor() {}

  public static getInstance(): GameFlow {
    if (!GameFlow.instance) {
      GameFlow.instance = new GameFlow();
    }
    return GameFlow.instance;
  }

  /**
   * Handle level completion with full reward system
   */
  async handleLevelComplete(
    wallet: any,
    profileAddress: string,
    session: GameSession,
    currentPlayerStats: any
  ): Promise<GameFlowResult> {
    try {
      console.log('🎮 Processing level completion...', session);

      // Calculate XP rewards
      const xpRewards = achievementSystem.getXPRewards();
      let baseXP = xpRewards.LEVEL_COMPLETE;
      let bonusXP = 0;
      const bonusReasons: string[] = [];

      // Add bonus XP for achievements
      if (session.perfectScore) {
        bonusXP += xpRewards.PERFECT_SCORE;
        bonusReasons.push('Perfect Score');
      }

      if (session.noDamage) {
        bonusXP += xpRewards.NO_DAMAGE;
        bonusReasons.push('No Damage Taken');
      }

      if (session.speedBonus) {
        bonusXP += xpRewards.SPEED_BONUS;
        bonusReasons.push('Speed Bonus');
      }

      // Enemy defeat bonus
      if (session.enemiesDefeated > 0) {
        const enemyBonus = session.enemiesDefeated * xpRewards.ENEMY_DEFEATED;
        bonusXP += enemyBonus;
        bonusReasons.push(`${session.enemiesDefeated} Enemies Defeated`);
      }

      // Collectibles bonus
      if (session.collectiblesFound > 0) {
        const collectibleBonus = session.collectiblesFound * xpRewards.COLLECTIBLE_FOUND;
        bonusXP += collectibleBonus;
        bonusReasons.push(`${session.collectiblesFound} Collectibles Found`);
      }

      const totalXP = baseXP + bonusXP;

      // Award XP and handle level up
      const xpResult = await achievementSystem.awardXP(
        wallet,
        profileAddress,
        currentPlayerStats.totalXP,
        totalXP,
        `Level ${session.level} completion`
      );

      // Update player stats
      const newPlayerStats = {
        ...currentPlayerStats,
        gamesPlayed: currentPlayerStats.gamesPlayed + 1,
        gamesWon: session.completed ? currentPlayerStats.gamesWon + 1 : currentPlayerStats.gamesWon,
        currentWinStreak: session.completed ? currentPlayerStats.currentWinStreak + 1 : 0,
        bestWinStreak: session.completed ? 
          Math.max(currentPlayerStats.bestWinStreak, currentPlayerStats.currentWinStreak + 1) : 
          currentPlayerStats.bestWinStreak,
        highScore: Math.max(currentPlayerStats.highScore, session.score),
        totalPlayTime: currentPlayerStats.totalPlayTime + Math.floor(session.timePlayed / 60),
        totalXP: currentPlayerStats.totalXP + totalXP,
        lastPlayedDate: new Date()
      };

      // Check for new badges
      const badgeResult = await badgeSystem.checkAndAwardBadges(
        wallet,
        profileAddress,
        newPlayerStats,
        currentPlayerStats.badges || []
      );


      // Badge rewards are already handled in the badge system

      const gameRewards: GameRewards = {
        xpAwarded: totalXP,
        badgesEarned: badgeResult.newBadges,
        levelUpReward: xpResult.levelUpReward,
        breakdown: {
          baseXP,
          bonusXP,
          reasonsForBonus: bonusReasons
        }
      };

      console.log('🎉 Level completion processed successfully:', gameRewards);

      return {
        session,
        rewards: gameRewards,
        newPlayerStats,
        success: true
      };

    } catch (error) {
      console.error('❌ Failed to process level completion:', error);
      return {
        session,
        rewards: {
          xpAwarded: 0,
          badgesEarned: [],
          breakdown: { baseXP: 0, bonusXP: 0, reasonsForBonus: [] }
        },
        newPlayerStats: currentPlayerStats,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle daily login rewards
   */
  async handleDailyLogin(
    wallet: any,
    profileAddress: string,
    currentPlayerStats: any,
    lastLoginDate?: Date
  ): Promise<{ rewards: GameRewards; newStats: any }> {
    const today = new Date();
    const isNewDay = !lastLoginDate || 
      lastLoginDate.toDateString() !== today.toDateString();

    if (!isNewDay) {
      return {
        rewards: {
          xpAwarded: 0,
          badgesEarned: [],
          breakdown: { baseXP: 0, bonusXP: 0, reasonsForBonus: [] }
        },
        newStats: currentPlayerStats
      };
    }

    // Calculate consecutive days
    let consecutiveDays = 1;
    if (lastLoginDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLoginDate.toDateString() === yesterday.toDateString()) {
        consecutiveDays = currentPlayerStats.consecutiveDaysPlayed + 1;
      }
    }

    // Daily login XP reward
    const xpRewards = achievementSystem.getXPRewards();
    const dailyXP = xpRewards.DAILY_LOGIN;

    await achievementSystem.awardXP(
      wallet,
      profileAddress,
      currentPlayerStats.totalXP,
      dailyXP,
      'Daily login reward'
    );


    const newStats = {
      ...currentPlayerStats,
      consecutiveDaysPlayed: consecutiveDays,
      totalXP: currentPlayerStats.totalXP + dailyXP,
      lastPlayedDate: today
    };

    // Check for daily player badge
    const badgeResult = await badgeSystem.checkAndAwardBadges(
      wallet,
      profileAddress,
      newStats,
      currentPlayerStats.badges || []
    );

    return {
      rewards: {
        xpAwarded: dailyXP,
        badgesEarned: badgeResult.newBadges,
        breakdown: {
          baseXP: dailyXP,
          bonusXP: 0,
          reasonsForBonus: [`Daily login (Day ${consecutiveDays})`]
        }
      },
      newStats
    };
  }


  /**
   * Handle tournament completion
   */
  async handleTournamentWin(
    wallet: any,
    profileAddress: string,
    currentPlayerStats: any,
    tournamentName: string
  ): Promise<GameRewards> {
    const tournamentXP = 200; // Special tournament XP

    // Award XP
    const xpResult = await achievementSystem.awardXP(
      wallet,
      profileAddress,
      currentPlayerStats.totalXP,
      tournamentXP,
      `Tournament victory: ${tournamentName}`
    );


    // Update stats for badge checking
    const newStats = {
      ...currentPlayerStats,
      tournamentWins: currentPlayerStats.tournamentWins + 1,
      totalXP: currentPlayerStats.totalXP + tournamentXP
    };

    // Check for tournament badge
    const badgeResult = await badgeSystem.checkAndAwardBadges(
      wallet,
      profileAddress,
      newStats,
      currentPlayerStats.badges || []
    );

    return {
      xpAwarded: tournamentXP,
      badgesEarned: badgeResult.newBadges,
      levelUpReward: xpResult.levelUpReward,
      breakdown: {
        baseXP: tournamentXP,
        bonusXP: 0,
        reasonsForBonus: [`Tournament Victory: ${tournamentName}`]
      }
    };
  }

  /**
   * Create a new game session
   */
  createGameSession(level: number): GameSession {
    return {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      startTime: new Date(),
      level,
      score: 0,
      completed: false,
      perfectScore: false,
      noDamage: false,
      speedBonus: false,
      collectiblesFound: 0,
      enemiesDefeated: 0,
      timePlayed: 0
    };
  }

  /**
   * Calculate potential rewards for a session (preview)
   */
  calculatePotentialRewards(session: GameSession): {
    minXP: number;
    maxXP: number;
    breakdown: string[];
  } {
    const xpRewards = achievementSystem.getXPRewards();
    let minXP = xpRewards.LEVEL_COMPLETE;
    let maxXP = minXP;
    const breakdown = ['Base completion: ' + minXP + ' XP'];

    // Potential bonuses
    if (session.perfectScore) {
      maxXP += xpRewards.PERFECT_SCORE;
      breakdown.push('Perfect score bonus: ' + xpRewards.PERFECT_SCORE + ' XP');
    }

    if (session.noDamage) {
      maxXP += xpRewards.NO_DAMAGE;
      breakdown.push('No damage bonus: ' + xpRewards.NO_DAMAGE + ' XP');
    }

    if (session.speedBonus) {
      maxXP += xpRewards.SPEED_BONUS;
      breakdown.push('Speed bonus: ' + xpRewards.SPEED_BONUS + ' XP');
    }

    return { minXP, maxXP, breakdown };
  }
}

// Export singleton instance
export const gameFlow = GameFlow.getInstance();