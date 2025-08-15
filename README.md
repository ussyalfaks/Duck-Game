# <� Duck Adventure Game - Honeycomb Protocol Integration

A demonstration game showcasing **Honeycomb Protocol** as the core game mechanic for on-chain progression, player identity, and mission logic. This 2D platformer challenges players to complete Season 1 across 5 levels while their achievements, progress, and identity live permanently on the blockchain.

## 🏗️ Architecture Overview

**Important:** This game is **100% client-side** and does **NOT rely on any centralized server** for gameplay. The server folder contains setup scripts that are used **once** during project initialization to create the Honeycomb project and configure blockchain resources. After setup, the game operates entirely through:

- **Direct Blockchain Interaction**: The client connects directly to Solana/Honeycomb networks
- **Wallet-Based Authentication**: Players authenticate using their Solana wallets
- **Decentralized Storage**: All game data lives on the blockchain, not in databases
- **Peer-to-Peer Architecture**: No central server mediates gameplay or stores user data

### Server Folder Purpose

The `/server` directory contains **one-time setup scripts** that:

1. **Create Honeycomb Project**: Establishes your game's on-chain project
2. **Configure Resources**: Sets up XP, badges, and other game resources  
3. **Generate Configurations**: Outputs project IDs and addresses for the client
4. **Initialize Systems**: Creates the foundation for user profiles and achievements

**After running setup once, the server is no longer needed.** The game client uses the generated configuration to interact directly with the blockchain.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Client   │ ──▶│  Honeycomb API   │ ──▶│ Solana Blockchain│
│   (React App)   │    │   (Edge Client)  │    │   (Devnet/Main) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Player's Wallet │
│ (Phantom, etc.) │
└─────────────────┘
```

**No Traditional Backend** = True decentralization, permanent data, and player ownership.

## <� Game Overview

**Duck Adventure** is a time-based platformer where players navigate through challenging levels, collect keys, avoid spikes, and race against the clock. What makes this game special is that **every aspect of player progression is powered by Honeycomb Protocol** - making achievements verifiable, permanent, and portable across any dApp.

### Key Features
- **= On-Chain Player Identity**: Profiles stored permanently on Solana via Honeycomb
- **� Real-Time Progression**: XP, levels, and achievements tracked on blockchain
- **<� Verifiable Badges**: Achievement badges minted as blockchain assets
- **<� Mission-Based Rewards**: Honeycomb missions power the entire reward system
- **=� Permanent Records**: All game data persists across sessions and platforms

## >� How Honeycomb Powers the Game

### 1. **Player Identity & Profiles**

```typescript
// Player profiles are created on-chain via Honeycomb
const { createNewProfileTransaction } = await honeycombClient.createNewProfileTransaction({
  project: project.address,
  payer: wallet.publicKey.toBase58(),
  identity: "main",
  info: {
    name: `DuckPlayer#${Math.floor(Math.random() * 1000)}`,
    bio: "An intrepid duck adventurer.",
    pfp: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey.toBase58()}`,
  },
});
```

**Location**: `hooks/useHoneycomb.ts:547`

Each player gets a unique on-chain profile that persists forever. The profile stores player information, tracks XP, and maintains badge collections. This isn't just a database entry - it's a blockchain asset the player truly owns.

### 2. **Resource Management & XP System**

```typescript
// XP is minted as a real blockchain resource
async awardXP(wallet: any, profileAddress: string, amount: number, reason?: string) {
  const { createMintResourceTransaction } = await this.client.createMintResourceTransaction({
    project: this.projectId,
    resource: RESOURCE_ADDRESSES.XP,
    authority: wallet.publicKey.toString(),
    payer: wallet.publicKey.toString(),
    owner: profileAddress,
    amount: BigInt(amount)
  });
  
  return await signAndSendTransaction(wallet, createMintResourceTransaction);
}
```

**Location**: `services/resourceManager.ts:162`

XP isn't just a number in a database - it's a **mintable blockchain resource**. When players complete levels, defeat enemies, or achieve perfect scores, actual XP tokens are minted to their profile on Solana.

### 3. **Achievement Badge System**

```typescript
// Badges are claimed through Honeycomb's badge criteria system
async awardBadge(wallet: any, profileAddress: string, badgeType: string) {
  const criteriaIndex = BADGE_INDEX_MAP[badgeType];
  
  const response = await this.client.createClaimBadgeCriteriaTransaction({
    args: {
      profileAddress: profileAddress,
      projectAddress: this.projectId,
      proof: BadgesCondition.Public,
      payer: wallet.publicKey.toString(),
      criteriaIndex: criteriaIndex,
    },
  });
  
  return await signAndSendTransaction(wallet, response.createClaimBadgeCriteriaTransaction);
}
```

**Location**: `services/resourceManager.ts:196`

Achievements become **verifiable badge NFTs** on the blockchain. The badge system includes:
- **First Game Badge**: Awarded on first game completion
- **Win Streak Badge**: For consecutive victories
- **High Score Badge**: For achieving score milestones
- **Daily Player Badge**: For consistent daily play
- **Tournament Winner Badge**: For special competitions

### 4. **Mission-Driven Game Flow**

```typescript
// Game completion triggers comprehensive reward calculation
async handleLevelComplete(wallet: any, profileAddress: string, session: GameSession, currentPlayerStats: any) {
  // Calculate XP rewards based on game performance
  const xpRewards = achievementSystem.getXPRewards();
  let baseXP = xpRewards.LEVEL_COMPLETE;
  let bonusXP = 0;

  // Award bonus XP for specific achievements
  if (session.perfectScore) bonusXP += xpRewards.PERFECT_SCORE;
  if (session.noDamage) bonusXP += xpRewards.NO_DAMAGE;
  if (session.speedBonus) bonusXP += xpRewards.SPEED_BONUS;

  // Award the XP on-chain
  const xpResult = await achievementSystem.awardXP(wallet, profileAddress, currentPlayerStats.totalXP, totalXP, `Level ${session.level} completion`);
  
  // Check for badge eligibility
  const badgeResult = await badgeSystem.checkAndAwardBadges(wallet, profileAddress, newPlayerStats, currentPlayerStats.badges || []);
  
  return { session, rewards: gameRewards, newPlayerStats, success: true };
}
```

**Location**: `services/gameFlow.ts:53`

Every game session is processed as a "mission" that:
1. **Calculates Performance**: Analyzes player actions and achievements
2. **Awards XP**: Mints appropriate XP resources on-chain
3. **Checks Badges**: Evaluates if new achievement badges should be unlocked
4. **Updates Stats**: Persists all progress to the player's profile
5. **Triggers Level-Ups**: Handles tier progression and special rewards

### 5. **Permanent Player Progression**

```typescript
// Level calculation based on on-chain XP
calculateLevel(totalXP: number): PlayerLevel {
  let currentLevel = 1;
  let currentTitle = "Duckling";
  
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
  // ... progress calculation
}
```

**Location**: `services/achievementSystem.ts:49`

Player levels and titles are calculated from on-chain XP, creating a **verifiable progression system**:

- **Level 1**: Duckling (0 XP)
- **Level 2**: Young Duck (100 XP)
- **Level 3**: Duck (250 XP)
- **Level 4**: Expert Duck (500 XP)
- **Level 5**: Duck Master (1000 XP)
- **Level 6**: Duck Legend (2000 XP)

## <� Game Mechanics Powered by Honeycomb

### **Time-Based Missions**
- Players have 30 seconds to complete all 5 levels
- Each completion triggers on-chain XP minting
- Perfect runs award bonus XP resources

### **Heart System with Consequences**
- 3 hearts per season, lost to spike damage
- Heart loss resets current level but preserves XP
- Full heart loss requires season restart

### **Key Collection Achievements**
- Each level requires key collection to progress
- Keys collected trigger achievement checks
- Badge eligibility evaluated after each level

### **Performance-Based Rewards**
- **Base XP**: 50 XP for level completion
- **Perfect Score**: +25 XP bonus
- **No Damage**: +20 XP bonus
- **Speed Bonus**: +15 XP bonus
- **Enemy Defeated**: +10 XP each
- **Collectible Found**: +5 XP each

## =� Getting Started

### Prerequisites
- Node.js 18+
- Solana wallet (Phantom, Solflare, etc.)
- **Testnet SOL for transaction fees** (see faucet instructions below)

### 💰 Getting Testnet SOL (Required)

**Important:** This game runs on Honeycomb's testnet, which requires testnet SOL for all blockchain transactions (creating profiles, earning XP, claiming badges, etc.). You'll need to fund your wallet before playing.

#### Option 1: Solana CLI Faucet (Recommended)
```bash
# Install Solana CLI if you haven't already
# Then request 3 SOL for your wallet
solana airdrop 3 <YOUR_WALLET_ADDRESS> -u https://rpc.test.honeycombprotocol.com
```

**Example:**
```bash
solana airdrop 3 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM -u https://rpc.test.honeycombprotocol.com
```

#### Option 2: Web Faucets
- [Official Solana Faucet](https://faucet.solana.com/) - Select "Devnet" and paste your wallet address
- [QuickNode Faucet](https://faucet.quicknode.com/solana/devnet) - Alternative faucet option

#### How to Get Your Wallet Address:
1. **Phantom**: Click your wallet → Copy address
2. **Solflare**: Click your wallet name → Copy public key  
3. **Other wallets**: Look for "Copy address" or "Copy public key" option

#### Verification:
After receiving SOL, you should see ~3 SOL in your wallet. This is enough for hundreds of game transactions.

**⚠️ Without testnet SOL, you cannot:**
- Create your player profile
- Earn XP or badges
- Complete game missions
- Interact with any blockchain features

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd honeycomb-duck-game

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Connect & Play

1. **Connect Wallet**: Use any Solana wallet
2. **Create Profile**: Your on-chain identity via Honeycomb
3. **Start Season 1**: Complete 5 levels in 30 seconds
4. **Earn Rewards**: XP and badges minted to your profile
5. **Track Progress**: View your permanent blockchain achievements

## =� Technical Architecture

### Core Dependencies
```json
{
  "@honeycomb-protocol/edge-client": "^0.0.7-beta.15",
  "@solana/wallet-adapter-react": "^0.15.39",
  "@solana/web3.js": "^1.98.2",
  "matter-js": "^0.20.0"
}
```

### Key Components

| Component | Purpose | Honeycomb Integration |
|-----------|---------|---------------------|
| `useHoneycomb.ts` | Core Honeycomb hook | Profile management, project setup |
| `resourceManager.ts` | Blockchain resources | XP minting, badge awarding |
| `achievementSystem.ts` | Level progression | XP calculation, level-up logic |
| `badgeSystem.ts` | Achievement badges | Badge criteria evaluation |
| `gameFlow.ts` | Mission orchestration | Reward calculation & distribution |

### Project Structure
```
honeycomb-duck-game/
   hooks/                    # React hooks for Honeycomb integration
      useHoneycomb.ts      # Main Honeycomb Protocol hook
      useGameResources.ts  # Resource management hook
   services/                # Business logic services
      honeycomb.ts        # Honeycomb client configuration
      resourceManager.ts  # XP and resource management
      achievementSystem.ts # Level and progression logic
      badgeSystem.ts      # Badge criteria and awarding
      gameFlow.ts         # Mission completion flow
   components/              # React components
      Game.tsx            # Core game engine with Matter.js
      Dashboard.tsx       # Player stats and controls
      GameView.tsx        # Main game orchestration
   server/                 # Honeycomb setup scripts
       setup.ts            # Project initialization
       createBadgeSystem.ts # Badge criteria setup
       createGameResources.ts # Resource configuration
```

## =� Honeycomb Integration Benefits

### **For Players**
- **True Ownership**: Your profile and achievements are blockchain assets you own
- **Portability**: Take your progress to any game that integrates with your profile
- **Verifiability**: Anyone can verify your achievements on-chain
- **Permanence**: Progress never disappears, even if the game goes offline

### **For Developers**
- **Rapid Development**: Pre-built identity, progression, and achievement systems
- **Reduced Infrastructure**: No need to build custom user/achievement backends
- **Interoperability**: Players can bring achievements from other Honeycomb games
- **Monetization**: Resource systems enable token-based game economies

### **For the Ecosystem**
- **Cross-Game Identity**: Players have consistent identity across all Honeycomb games
- **Composable Achievements**: Badges and XP can be used by other applications
- **Network Effects**: Larger player network benefits all integrated games

## <� Using Honeycomb for Your Game

### 1. **Project Setup**

```typescript
// Create your game project
const { createCreateProjectTransaction } = await honeycombClient.createCreateProjectTransaction({
  name: "Your Game Name",
  authority: wallet.publicKey.toBase58(),
  payer: wallet.publicKey.toBase58(),
  profileDataConfig: {
    achievements: ["Level 1 Cleared"],
    customDataFields: [],
  },
});
```

### 2. **Resource Configuration**

```typescript
// Define your game resources (XP, coins, power-ups, etc.)
const GAME_RESOURCES = {
  XP: {
    name: "Experience Points",
    symbol: "XP",
    decimals: 0,
    address: "your-xp-resource-address"
  },
  COINS: {
    name: "Game Coins", 
    symbol: "COIN",
    decimals: 2,
    address: "your-coin-resource-address"
  }
};
```

### 3. **Badge System Setup**

```typescript
// Create achievement badges for your game
const BADGE_CRITERIA = {
  "first_win": 0,
  "speedrun": 1,
  "perfectionist": 2,
  "daily_player": 3
};

// Award badges based on game events
await resourceManager.awardBadge(wallet, profileAddress, "first_win", "First Victory");
```

### 4. **Mission-Based Rewards**

```typescript
// Process game completion as a mission
async handleGameComplete(wallet, profileAddress, gameSession, playerStats) {
  // Calculate rewards based on performance
  const baseReward = 100;
  const bonusReward = gameSession.perfectScore ? 50 : 0;
  const totalXP = baseReward + bonusReward;
  
  // Mint XP on-chain
  await resourceManager.awardXP(wallet, profileAddress, totalXP, 'Game completion');
  
  // Check for badge eligibility
  await badgeSystem.checkAndAwardBadges(wallet, profileAddress, newStats, currentBadges);
  
  return { xpAwarded: totalXP, newBadges, levelUpReward };
}
```

## =' Advanced Honeycomb Features

### **Trait Assignment**
```typescript
// Assign evolving traits to player profiles
await honeycombClient.updateProfileTransaction({
  traits: {
    playstyle: "aggressive",
    preferredLevel: "hard",
    favoriteCharacter: "duck"
  }
});
```

### **Mission Systems**
```typescript
// Create complex mission chains
const missionChain = [
  { id: "tutorial", xpReward: 50, prerequisite: null },
  { id: "first_boss", xpReward: 200, prerequisite: "tutorial" },
  { id: "speedrun", xpReward: 300, prerequisite: "first_boss" }
];
```

### **Contribution Tracking**
```typescript
// Track player contributions to the game ecosystem
await honeycombClient.recordContribution({
  contributionType: "level_creation",
  value: levelDifficulty,
  rewardXP: 150
});
```

## =� Verxio Integration (Optional)

This game also integrates with [Verxio Protocol](https://docs.verxio.xyz/) for enhanced loyalty mechanics:

```typescript
// Create loyalty programs with Verxio
const loyaltyProgram = await verxio.createLoyaltyProgram({
  name: "Duck Adventure Loyalty",
  tiers: ["Bronze Duck", "Silver Duck", "Gold Duck"],
  pointsPerLevel: 100
});

// Award loyalty points alongside Honeycomb XP
await verxio.awardPoints(profileAddress, gameScore);
```

## < What Makes This Special

Unlike traditional games where progression is stored in private databases, **Duck Adventure** demonstrates how Honeycomb Protocol enables:

1. **Verifiable Achievements**: Anyone can verify your game accomplishments on-chain
2. **Portable Progress**: Your XP and badges work across any Honeycomb-integrated game
3. **True Ownership**: You own your profile, achievements, and resources as blockchain assets
4. **Permanent Records**: Your gaming history is preserved forever on Solana
5. **Composable Identity**: Other games and dApps can build on your achievement history

## <� Technical Innovation

This game showcases several innovative uses of Honeycomb:

- **Real-time Resource Minting**: XP tokens are minted immediately upon achievement
- **Conditional Badge Logic**: Complex achievement criteria evaluated on-chain  
- **Mission Orchestration**: Game sessions processed as verifiable missions
- **Progressive Unlocks**: Content unlocked based on verifiable on-chain criteria
- **Cross-Session Persistence**: All progress maintained across wallet disconnections

## =� Future Possibilities

With Honeycomb as the foundation, this game could expand to include:

- **Multiplayer Tournaments**: Verifiable leaderboards and rankings
- **NFT Integration**: Special badge NFTs for rare achievements
- **Cross-Game Rewards**: Use Duck Adventure XP in other Honeycomb games
- **Community Contributions**: Player-created levels with on-chain attribution
- **Economic Systems**: Trade resources and achievements with other players

## =� Contributing

This project demonstrates the potential of on-chain gaming with Honeycomb Protocol. Contributions welcome:

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your changes**
4. **Test with Honeycomb integration**
5. **Submit a pull request**

## =� License

MIT License - see LICENSE file for details.

---

**Built with =� for the Honeycomb Protocol Game Jam**

*This game demonstrates how Honeycomb Protocol can power the next generation of on-chain gaming experiences where player identity, progression, and achievements are verifiable, permanent, and truly owned by the players.*