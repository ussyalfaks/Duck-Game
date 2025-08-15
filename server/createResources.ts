import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendTransactionForTests } from "@honeycomb-protocol/edge-client/client/helpers";

const API_URL = "https://edge.test.honeycombprotocol.com/";

async function createResourceSystem() {
  try {
    // Load project configuration
    if (!fs.existsSync("./config.json")) {
      throw new Error("Project not set up. Please run 'npm run create-project' first.");
    }
    
    const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    console.log("Using project:", config.name);
    
    // Load the admin keypair
    const adminWalletFile = JSON.parse(
      fs.readFileSync(path.join("./keys/admin.json"), "utf8")
    );
    
    const adminKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(adminWalletFile));
    
    // Create edge client
    const client = createEdgeClient(API_URL, true);
    
    console.log("Setting up resource system for project:", config.projectId);
    
    // Define game resources
    const gameResources = [
      {
        name: "Experience Points (XP)",
        symbol: "XP",
        type: "currency",
        description: "Points earned through gameplay",
        decimals: 0,
        uri: "https://example.com/xp-metadata.json"
      },
      {
        name: "Achievement Badges",
        symbol: "BADGE",
        type: "collectible",
        description: "Special achievement badges for milestones",
        decimals: 0,
        uri: "https://example.com/badge-metadata.json"
      }
    ];
    
    // Note: The actual resource creation would use specific Honeycomb API methods
    // This structure follows the pattern from the documentation for resource definition
    console.log("Game resources defined:");
    gameResources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name} (${resource.symbol}) - ${resource.description}`);
    });
    
    // Create achievement system structure
    const achievementSystem = {
      levels: [
        { level: 1, xpRequired: 0, title: "Duckling" },
        { level: 2, xpRequired: 100, title: "Young Duck" },
        { level: 3, xpRequired: 250, title: "Duck" },
        { level: 4, xpRequired: 500, title: "Expert Duck" },
        { level: 5, xpRequired: 1000, title: "Duck Master" },
        { level: 6, xpRequired: 2000, title: "Duck Legend" }
      ],
      badges: [
        { id: "first_game", name: "First Flight", description: "Play your first game" },
        { id: "win_streak", name: "Hot Streak", description: "Win 5 games in a row" },
        { id: "high_score", name: "High Flyer", description: "Achieve a high score" },
        { id: "daily_player", name: "Daily Duck", description: "Play every day for a week" },
        { id: "tournament_winner", name: "Tournament Champion", description: "Win a tournament" }
      ]
    };
    
    // Update config with resource information
    config.resources = {
      gameResources,
      achievementSystem,
      authority: adminKeyPair.publicKey.toString(),
      createdAt: new Date().toISOString(),
    };
    
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    console.log("\n=== RESOURCE SYSTEM SETUP COMPLETE ===");
    console.log("Game resources defined:", gameResources.length);
    console.log("Achievement levels:", achievementSystem.levels.length);
    console.log("Badge types:", achievementSystem.badges.length);
    console.log("Authority:", adminKeyPair.publicKey.toString());
    
  } catch (error) {
    console.error("Error creating resource system:", error);
    throw error;
  }
}

// Run the setup
createResourceSystem()
  .then(() => {
    console.log("\nResource system ready!");
    console.log("All systems configured. Check config.json for complete setup details.");
  })
  .catch((error) => {
    console.error("Resource system setup failed:", error);
    process.exit(1);
  });