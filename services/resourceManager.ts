import { signAndSendTransaction } from './honeycomb';
import { authenticateUser } from './auth';
import { createEdgeClient, BadgesCondition } from '@honeycomb-protocol/edge-client';

// Resource types from server config
export enum ResourceType {
  XP = 'XP',
  BADGE = 'BADGE'
}

// Resource addresses from server config
export const RESOURCE_ADDRESSES = {
  XP: "7HJjE8TvvvRjPqb4TvaaRZWmxvgfeW6bedEc8iLzQF6d",
  BADGE: "5AfG7DK7yQAWszqK9kiRJkSbWBzRt8XPUyGuDsHtSu4K"
};

// Game resources configuration
export const GAME_RESOURCES = {
  XP: {
    name: "Experience Points (XP)",
    symbol: "XP",
    type: "currency",
    description: "Points earned through gameplay",
    decimals: 0,
    address: RESOURCE_ADDRESSES.XP
  },
  BADGE: {
    name: "Achievement Badges",
    symbol: "BADGE",
    type: "collectible",
    description: "Special achievement badges for milestones", 
    decimals: 0,
    address: RESOURCE_ADDRESSES.BADGE
  }
};

// Badge ID to criteria index mapping (from server createBadgeSystem.ts)
export const BADGE_INDEX_MAP: Record<string, number> = {
  "first_game": 0,
  "win_streak": 1,
  "high_score": 2,
  "daily_player": 3,
  "tournament_winner": 4
};

export interface ResourceBalance {
  type: ResourceType;
  amount: number;
  symbol: string;
  name: string;
}

export interface ResourceTransaction {
  signature: string;
  type: 'mint' | 'burn' | 'transfer' | 'badge';
  resourceType: ResourceType;
  amount: number;
  timestamp: Date;
}

export class ResourceManager {
  private static instance: ResourceManager;
  private projectId: string;
  private apiUrl: string;
  private client: any;

  private constructor() {
    // Use your project ID from server config
    this.projectId = "Hq63HojpwE3pK91i5kU2B7a4a3xfLrcGwTqDc8H1ftR";
    this.apiUrl = "https://edge.test.honeycombprotocol.com/";
    this.client = createEdgeClient(this.apiUrl, true);
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Helper method to mint resources to a profile
   */
  private async mintResource(
    wallet: any,
    profileAddress: string,
    resourceAddress: string,
    amount: number,
    resourceType: ResourceType
  ): Promise<ResourceTransaction | null> {
    try {
      const { createMintResourceTransaction } = await this.client.createMintResourceTransaction({
        project: this.projectId,
        resource: resourceAddress,
        authority: wallet.publicKey.toString(),
        payer: wallet.publicKey.toString(),
        owner: profileAddress,
        amount: BigInt(amount)
      });

      // Sign and send the transaction
      const result = await signAndSendTransaction(wallet, createMintResourceTransaction);
      
      // Extract signature from bundle response
      const signature = result[0]?.responses[0]?.signature || 'unknown';
      
      return {
        signature,
        type: 'mint',
        resourceType,
        amount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to mint ${resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to burn resources from a profile
   */
  private async burnResource(
    wallet: any,
    profileAddress: string,
    resourceAddress: string,
    amount: number,
    resourceType: ResourceType
  ): Promise<ResourceTransaction | null> {
    try {
      const { createBurnResourceTransaction } = await this.client.createBurnResourceTransaction({
        project: this.projectId,
        resource: resourceAddress,
        authority: wallet.publicKey.toString(),
        payer: wallet.publicKey.toString(),
        owner: profileAddress,
        amount: BigInt(amount)
      });

      // Sign and send the transaction
      const result = await signAndSendTransaction(wallet, createBurnResourceTransaction);
      
      // Extract signature from bundle response
      const signature = result[0]?.responses[0]?.signature || 'unknown';
      
      return {
        signature,
        type: 'burn',
        resourceType,
        amount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to burn ${resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Award XP to a player
   */
  async awardXP(
    wallet: any, 
    profileAddress: string, 
    amount: number,
    reason?: string
  ): Promise<ResourceTransaction | null> {
    try {
      console.log(`Awarding ${amount} XP to player for: ${reason}`);
      
      const authResult = await authenticateUser(wallet);
      
      // Mint XP resource to the player's profile
      const transaction = await this.mintResource(
        wallet,
        profileAddress,
        RESOURCE_ADDRESSES.XP,
        amount,
        ResourceType.XP
      );

      console.log('XP awarded successfully:', transaction);
      return transaction;
      
    } catch (error) {
      console.error('Failed to award XP:', error);
      return null;
    }
  }



  /**
   * Award an achievement badge using Honeycomb's badge system
   */
  async awardBadge(
    wallet: any,
    profileAddress: string,
    badgeType: string,
    badgeName: string
  ): Promise<ResourceTransaction | null> {
    try {
      console.log(`Awarding badge "${badgeName}" (${badgeType}) to player`);
      
      const authResult = await authenticateUser(wallet);
      
      // Get the badge criteria index from our mapping
      const criteriaIndex = BADGE_INDEX_MAP[badgeType];
      if (criteriaIndex === undefined) {
        throw new Error(`Badge type "${badgeType}" not found in badge index mapping`);
      }

      // Use Honeycomb's createClaimBadgeCriteriaTransaction method
      const response = await this.client.createClaimBadgeCriteriaTransaction({
        args: {
          profileAddress: profileAddress, // User profile public key
          projectAddress: this.projectId, // Project public key
          proof: BadgesCondition.Public, // Proof of the badge, only Public is available for now
          payer: wallet.publicKey.toString(), // Transaction payer public key
          criteriaIndex: criteriaIndex, // Badge index as an integer
        },
      });

      console.log('Badge transaction response:', response);

      // Check if response is valid
      if (!response || !response.createClaimBadgeCriteriaTransaction) {
        throw new Error('Invalid response from createClaimBadgeCriteriaTransaction');
      }

      const {
        blockhash,
        lastValidBlockHeight,
        transaction,
      } = response.createClaimBadgeCriteriaTransaction;

      // Sign and send the transaction using our helper
      const result = await signAndSendTransaction(wallet, { 
        blockhash, 
        lastValidBlockHeight, 
        transaction 
      });

      // Extract signature from bundle response
      const signature = result[0]?.responses[0]?.signature || 'unknown';

      console.log('Badge awarded successfully:', result);
      return {
        signature,
        type: 'badge',
        resourceType: ResourceType.BADGE,
        amount: 1,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Failed to award badge:', error);
      return null;
    }
  }

  /**
   * Get player's resource balances
   */
  async getResourceBalances(profileAddress: string): Promise<ResourceBalance[]> {
    try {
      const balances: ResourceBalance[] = [];
      
      // Fetch balance for each resource type
      for (const [resourceType, resourceConfig] of Object.entries(GAME_RESOURCES)) {
        try {
          // Try to query resource balance using findProfiles method
          const profilesResult = await this.client.findProfiles({
            addresses: [profileAddress]
          });
          
          // Extract resource balance from profile data
          let amount = 0;
          if (profilesResult && profilesResult.length > 0) {
            const profile = profilesResult[0];
            // Look for resource balance in profile's customData or resourceStates
            const resourceData = profile.customData?.resources || profile.resourceStates || {};
            amount = resourceData[resourceConfig.address] || 0;
          }
          
          balances.push({
            type: resourceType as ResourceType,
            amount,
            symbol: resourceConfig.symbol,
            name: resourceConfig.name
          });
        } catch (error) {
          console.warn(`Failed to fetch ${resourceType} balance:`, error);
          // Add with 0 balance if query fails
          balances.push({
            type: resourceType as ResourceType,
            amount: 0,
            symbol: resourceConfig.symbol,
            name: resourceConfig.name
          });
        }
      }

      return balances;
      
    } catch (error) {
      console.error('Failed to get resource balances:', error);
      return [];
    }
  }

  /**
   * Get resource transaction history
   */
  async getTransactionHistory(profileAddress: string): Promise<ResourceTransaction[]> {
    try {
      // TODO: Implement actual transaction history fetching
      // For now, return empty array
      return [];
      
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const resourceManager = ResourceManager.getInstance();