import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers.js";
import { BadgesCondition } from "@honeycomb-protocol/edge-client/client/generated.js";

const API_URL = "https://edge.test.honeycombprotocol.com/";

// Badge definitions from the client-side config
const GAME_BADGES = [
  {
    index: 0,
    name: "First Flight",
    description: "Play your first game",
    condition: BadgesCondition.Public,
    metadata: {
      id: "first_game",
      rarity: "common",
      reward: { duckCoins: 50, xp: 25 }
    }
  },
  {
    index: 1,
    name: "Hot Streak",
    description: "Win 5 games in a row", 
    condition: BadgesCondition.Public,
    metadata: {
      id: "win_streak",
      rarity: "rare",
      reward: { duckCoins: 150, powerUps: 1, xp: 75 }
    }
  },
  {
    index: 2,
    name: "High Flyer",
    description: "Achieve a high score of 10,000+",
    condition: BadgesCondition.Public,
    metadata: {
      id: "high_score", 
      rarity: "epic",
      reward: { duckCoins: 200, powerUps: 2, xp: 100 }
    }
  },
  {
    index: 3,
    name: "Daily Duck",
    description: "Play every day for a week",
    condition: BadgesCondition.Public,
    metadata: {
      id: "daily_player",
      rarity: "rare", 
      reward: { duckCoins: 300, powerUps: 3, xp: 150 }
    }
  },
  {
    index: 4,
    name: "Tournament Champion", 
    description: "Win a tournament",
    condition: BadgesCondition.Public,
    metadata: {
      id: "tournament_winner",
      rarity: "legendary",
      reward: { duckCoins: 500, powerUps: 5, xp: 250 }
    }
  }
];

async function createBadgeSystem() {
  try {
    // Load project configuration
    if (!fs.existsSync("./config.json")) {
      throw new Error("Project not set up. Please run the complete setup first.");
    }
    
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    console.log("Setting up badge system for project:", config.name);
    console.log("Project ID:", config.projectId);
    
    // Load the admin keypair
    const adminWalletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    
    const adminKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(adminWalletFile));
    console.log("Admin authority:", adminKeyPair.publicKey.toString());
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    // First, ensure badge resource exists
    const badgeResource = config.gameResources?.resources?.find(r => r.symbol === "BADGE");
    if (!badgeResource) {
      throw new Error("Badge resource must be created first. Run 'npm run create-game-resources'");
    }
    console.log("Badge resource found:", badgeResource.address);
    
    // Skip badge system initialization for now, try direct criteria update
    console.log("Proceeding with badge criteria creation...");
    
    const createdBadges = [];
    
    // Create each badge criteria
    for (const badge of GAME_BADGES) {
      try {
        console.log(`\nCreating badge: ${badge.name} (Index: ${badge.index})`);
        
        // Update badge criteria
        const {
          createUpdateBadgeCriteriaTransaction: txResponse
        } = await client.createUpdateBadgeCriteriaTransaction({
          project: config.projectId,
          authority: adminKeyPair.publicKey.toString(),
          payer: adminKeyPair.publicKey.toString(),
          criteriaIndex: badge.index,
          condition: badge.condition,
        });
        
        // Send the transaction
        const result = await sendTransactionForTests(client, txResponse, [adminKeyPair]);
        
        console.log(`✅ Badge criteria created successfully!`);
        console.log(`Transaction: ${result.signature}`);
        
        createdBadges.push({
          ...badge,
          transactionSignature: result.signature,
          createdAt: new Date().toISOString(),
          success: true
        });
        
        // Wait a bit between badge creations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to create badge ${badge.name}:`, error);
        
        createdBadges.push({
          ...badge,
          error: error?.message || String(error),
          createdAt: new Date().toISOString(),
          success: false
        });
      }
    }
    
    // Update config with badge system
    config.badgeSystem = {
      badges: createdBadges,
      projectId: config.projectId,
      authority: adminKeyPair.publicKey.toString(),
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    console.log("\n=== BADGE SYSTEM CREATION COMPLETE ===");
    console.log(`Created ${createdBadges.filter(b => b.success).length} out of ${GAME_BADGES.length} badge criteria`);
    
    // Display summary
    console.log("\nBadge System Summary:");
    createdBadges.forEach(badge => {
      if (badge.success) {
        console.log(`✅ ${badge.name} (Index ${badge.index}): Created`);
      } else {
        console.log(`❌ ${badge.name} (Index ${badge.index}): Failed - ${badge.error}`);
      }
    });
    
    console.log("\nBadge system is ready!");
    console.log("Players can now claim badges using the criteriaIndex values.");
    
  } catch (error) {
    console.error("Error creating badge system:", error?.message || error);
    console.error("Stack trace:", error?.stack);
    throw error;
  }
}

// Run the setup
createBadgeSystem()
  .then(() => {
    console.log("\nBadge system creation completed!");
  })
  .catch((error) => {
    console.error("Badge system creation failed:", error);
    process.exit(1);
  });